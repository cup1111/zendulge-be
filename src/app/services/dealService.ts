import Deal, { IDealDocument } from '../model/deal';
import Business from '../model/business';
import Service from '../model/service';
import OperateSite from '../model/operateSite';
import { BadRequestException } from '../exceptions';
import { BusinessStatus } from '../enum/businessStatus';
import mongoose from 'mongoose';

const toUtcMidnight = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const normalizeDate = (value: any, fieldName: string): Date => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid date`);
  }

  return toUtcMidnight(date);
};

const startOfToday = (): Date => toUtcMidnight(new Date());

const ensureFutureDate = (date: Date, fieldName: string) => {
  const normalized = toUtcMidnight(date);
  const today = startOfToday();
  if (normalized.getTime() < today.getTime()) {
    throw new BadRequestException(`${fieldName} cannot be before today`);
  }
};

const ensureEndAfterStart = (start: Date, end: Date) => {
  const normalizedStart = toUtcMidnight(start);
  const normalizedEnd = toUtcMidnight(end);
  if (normalizedEnd.getTime() <= normalizedStart.getTime()) {
    throw new BadRequestException('End date must be after start date');
  }
};

const normalizeDiscount = (
  originalPrice?: number | null,
  price?: number | null,
): number | undefined => {
  if (
    originalPrice === undefined ||
    originalPrice === null ||
    price === undefined ||
    price === null ||
    originalPrice === 0
  ) {
    return undefined;
  }

  const rawDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
  if (Number.isNaN(rawDiscount)) {
    return undefined;
  }

  if (rawDiscount <= 0) {
    return 0;
  }

  if (rawDiscount >= 100) {
    return 100;
  }

  return rawDiscount;
};

const getDealsByBusiness = async (businessId: string, userId: string): Promise<IDealDocument[]> => {
  const business = await Business.findById(businessId);
  if (!business || !business.hasAccess(userId as any)) {
    throw new Error('Business not found or access denied');
  }

  // Get user's role in the business
  const userRole = business.getMemberRole(userId as any);
  const isOwner = business.isBusinessOwner(userId as any);

  let dealsQuery: any = { business: businessId };

  // If not owner, filter by operating sites the user has access to
  if (!isOwner && userRole) {
    // Get operating sites the user has access to
    const userOperatingSites = await OperateSite.find({
      business: businessId,
      members: userId,
      isActive: true,
    }).select('_id');

    const operatingSiteIds = userOperatingSites.map(site => site._id.toString());

    if (operatingSiteIds.length === 0) {
      // User has no access to any operating sites, return empty array
      return [];
    }

    // Find deals where at least one operating site matches user's accessible sites
    dealsQuery.operatingSite = { $in: operatingSiteIds };
  }

  return Deal.find(dealsQuery)
    .populate('service', 'name category basePrice duration')
    .populate('operatingSite', 'name address')
    .populate('createdBy', 'firstName lastName email');
};

const getDealById = async (businessId: string, dealId: string, userId: string): Promise<IDealDocument> => {
  const business = await Business.findById(businessId);
  if (!business || !business.hasAccess(userId as any)) {
    throw new Error('Business not found or access denied');
  }
  const deal = await Deal.findOne({ _id: dealId, business: businessId })
    .populate('service', 'name category basePrice duration')
    .populate('operatingSite', 'name address');
  if (!deal) {
    throw new Error('Deal not found');
  }
  return deal;
};

const createDeal = async (businessId: string, userId: string, dealData: any): Promise<IDealDocument> => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new Error('Business not found');
  }

  // Check if the user has access to the business
  if (!business.hasAccess(userId as any)) {
    throw new Error('Access denied');
  }

  // Validate service - it's now required
  if (!dealData.service) {
    throw new Error('Service is required');
  }
  const service = await Service.findOne({ _id: dealData.service, business: businessId });
  if (!service) {
    throw new Error('Service not found or does not belong to this business');
  }

  // Validate operating sites - should be an array
  if (!dealData.operatingSite || !Array.isArray(dealData.operatingSite) || dealData.operatingSite.length === 0) {
    throw new Error('At least one operating site is required');
  }

  // Ensure operatingSite is an array (support backward compatibility)
  const operatingSiteIds = Array.isArray(dealData.operatingSite)
    ? dealData.operatingSite
    : [dealData.operatingSite];

  // Validate all operating sites exist and belong to the business
  const operatingSites = await OperateSite.find({
    _id: { $in: operatingSiteIds },
    business: businessId,
  });

  if (operatingSites.length !== operatingSiteIds.length) {
    throw new Error('One or more operating sites not found or do not belong to this business');
  }

  // Check if user has access to all operating sites (for non-owners)
  const isOwner = business.isBusinessOwner(userId as any);
  if (!isOwner) {
    const accessibleSites = await OperateSite.find({
      _id: { $in: operatingSiteIds },
      business: businessId,
      members: userId,
      isActive: true,
    });

    if (accessibleSites.length !== operatingSiteIds.length) {
      throw new Error('You do not have access to one or more of the selected operating sites');
    }
  }

  // Update dealData to use array, ensuring IDs are strings (schema expects [String])
  dealData.operatingSite = operatingSiteIds.map((id: any) => String(id));

  // Set original price from service if not provided
  if (!dealData.originalPrice) {
    dealData.originalPrice = service.basePrice;
  }
  // Set duration from service if not provided
  if (!dealData.duration) {
    dealData.duration = service.duration;
  }

  // Validate that deal price is less than base price
  const dealPrice = dealData.price ?? service.basePrice;
  if (dealPrice >= service.basePrice) {
    throw new BadRequestException('Deal price must be less than the service base price');
  }

  // Calculate discount if originalPrice and price are provided
  if (dealData.originalPrice !== undefined || dealData.price !== undefined) {
    const normalizedDiscount = normalizeDiscount(
      dealData.originalPrice ?? service.basePrice,
      dealData.price ?? service.basePrice,
    );
    dealData.discount = normalizedDiscount;
  }

  if (dealData.availability) {
    const legacyAvailability = dealData.availability;
    if (Object.prototype.hasOwnProperty.call(legacyAvailability, 'startDate')) {
      dealData.startDate = legacyAvailability.startDate;
    }
    if (Object.prototype.hasOwnProperty.call(legacyAvailability, 'endDate')) {
      dealData.endDate = legacyAvailability.endDate;
    }
    if (
      Object.prototype.hasOwnProperty.call(legacyAvailability, 'maxBookings')
    ) {
      dealData.maxBookings = legacyAvailability.maxBookings;
    }
    if (
      Object.prototype.hasOwnProperty.call(legacyAvailability, 'currentBookings')
    ) {
      dealData.currentBookings = legacyAvailability.currentBookings;
    }
  }

  const defaultStartDate = dealData.startDate
    ? normalizeDate(dealData.startDate, 'Start date')
    : startOfToday();
  const defaultEndDate = dealData.endDate
    ? normalizeDate(dealData.endDate, 'End date')
    : normalizeDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      'End date',
    );

  ensureFutureDate(defaultStartDate, 'Start date');
  ensureFutureDate(defaultEndDate, 'End date');
  ensureEndAfterStart(defaultStartDate, defaultEndDate);

  const rawMaxBookings =
    dealData.maxBookings !== undefined && dealData.maxBookings !== null
      ? Number(dealData.maxBookings)
      : undefined;
  const maxBookings =
    rawMaxBookings !== undefined && !Number.isNaN(rawMaxBookings)
      ? rawMaxBookings
      : undefined;
  const rawCurrentBookings =
    dealData.currentBookings !== undefined && dealData.currentBookings !== null
      ? Number(dealData.currentBookings)
      : 0;
  const currentBookings = Number.isNaN(rawCurrentBookings)
    ? 0
    : rawCurrentBookings;

  delete dealData.availability;

  if (dealData.category) {
    delete dealData.category;
  }

  const newDeal = new Deal({
    ...dealData,
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    maxBookings,
    currentBookings,
    business: businessId,
    createdBy: userId, // Track who created the deal
  });
  const savedDeal = await newDeal.save();
  await savedDeal.populate('service', 'name category basePrice duration');
  await savedDeal.populate('operatingSite', 'name address');
  await savedDeal.populate('createdBy', 'firstName lastName email');
  return savedDeal;
};

const updateDeal = async (businessId: string, dealId: string, userId: string, updateData: any): Promise<IDealDocument> => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new Error('Business not found');
  }

  // Check if the user has access to the business
  if (!business.hasAccess(userId as any)) {
    throw new Error('Access denied');
  }

  // Get the existing deal
  const existingDeal = await Deal.findOne({ _id: dealId, business: businessId });
  if (!existingDeal) {
    throw new Error('Deal not found');
  }

  // Check permissions based on role
  const isOwner = business.isBusinessOwner(userId as any);
  const userRole = business.getMemberRole(userId as any);

  if (!isOwner) {
    // For non-owners, check if they can edit this deal
    if (userRole) {
      // Check if user has access to at least one of the deal's operating sites
      const operatingSiteIds = Array.isArray(existingDeal.operatingSite)
        ? existingDeal.operatingSite
        : [existingDeal.operatingSite];

      const hasSiteAccess = await OperateSite.findOne({
        _id: { $in: operatingSiteIds },
        business: businessId,
        members: userId,
        isActive: true,
      });

      if (!hasSiteAccess) {
        throw new Error('You do not have access to this deal');
      }

      // For employees, they can only edit deals they created
      const roleName = await business.populate('members.role').then(() => {
        const member = business.members?.find(m => (m.user as any).equals(userId));
        return member?.role && typeof member.role === 'object' ? (member.role as any).name : null;
      });

      if (roleName === 'employee' && existingDeal.createdBy?.toString() !== userId) {
        throw new Error('You can only edit deals you created');
      }
    }
  }

  // Get the service (either from update or existing deal) for validation
  let serviceForValidation: { basePrice: number } | null = null;
  if (updateData.service) {
    const updatedService = await Service.findOne({ _id: updateData.service, business: businessId });
    if (!updatedService) {
      throw new Error('Service not found or does not belong to this business');
    }
    serviceForValidation = updatedService;
    if (!updateData.originalPrice) {
      updateData.originalPrice = updatedService.basePrice;
    }
    if (!updateData.duration) {
      updateData.duration = updatedService.duration;
    }
  } else {
    // Populate service if not already populated
    if (!existingDeal.service || typeof existingDeal.service === 'string') {
      await existingDeal.populate('service', 'basePrice');
    }
    // Use existing deal's service for validation
    const populatedService = existingDeal.service;
    if (populatedService && typeof populatedService === 'object' && 'basePrice' in populatedService) {
      serviceForValidation = populatedService as { basePrice: number };
    }
  }

  // Validate that deal price is less than base price
  if (updateData.price !== undefined && serviceForValidation && serviceForValidation.basePrice) {
    if (updateData.price >= serviceForValidation.basePrice) {
      throw new BadRequestException('Deal price must be less than the service base price');
    }
  }

  // Validate operating sites if updated
  if (updateData.operatingSite) {
    // Ensure operatingSite is an array
    const operatingSiteIds = Array.isArray(updateData.operatingSite)
      ? updateData.operatingSite
      : [updateData.operatingSite];

    if (operatingSiteIds.length === 0) {
      throw new Error('At least one operating site is required');
    }

    // Validate all operating sites exist and belong to the business
    const operatingSites = await OperateSite.find({
      _id: { $in: operatingSiteIds },
      business: businessId,
    });

    if (operatingSites.length !== operatingSiteIds.length) {
      throw new Error('One or more operating sites not found or do not belong to this business');
    }

    // Check if user has access to all operating sites (for non-owners)
    if (!isOwner) {
      const accessibleSites = await OperateSite.find({
        _id: { $in: operatingSiteIds },
        business: businessId,
        members: userId,
        isActive: true,
      });

      if (accessibleSites.length !== operatingSiteIds.length) {
        throw new Error('You do not have access to one or more of the selected operating sites');
      }
    }

    // Update to use array, ensuring IDs are strings (schema expects [String])
    updateData.operatingSite = operatingSiteIds.map((id: any) => String(id));
  }

  if (updateData.availability) {
    const availabilityUpdates = updateData.availability;
    if (Object.prototype.hasOwnProperty.call(availabilityUpdates, 'startDate')) {
      updateData.startDate = availabilityUpdates.startDate;
    }
    if (Object.prototype.hasOwnProperty.call(availabilityUpdates, 'endDate')) {
      updateData.endDate = availabilityUpdates.endDate;
    }
    if (
      Object.prototype.hasOwnProperty.call(availabilityUpdates, 'maxBookings')
    ) {
      updateData.maxBookings = availabilityUpdates.maxBookings;
    }
    if (
      Object.prototype.hasOwnProperty.call(
        availabilityUpdates,
        'currentBookings',
      )
    ) {
      updateData.currentBookings = availabilityUpdates.currentBookings;
    }
    delete updateData.availability;
  }

  const hasStartDateUpdate = Object.prototype.hasOwnProperty.call(
    updateData,
    'startDate',
  );
  const hasEndDateUpdate = Object.prototype.hasOwnProperty.call(
    updateData,
    'endDate',
  );

  if (hasStartDateUpdate || hasEndDateUpdate) {
    const effectiveStart = hasStartDateUpdate
      ? normalizeDate(updateData.startDate, 'Start date')
      : new Date(existingDeal.startDate);
    const effectiveEnd = hasEndDateUpdate
      ? normalizeDate(updateData.endDate, 'End date')
      : new Date(existingDeal.endDate);

    ensureFutureDate(effectiveEnd, 'End date');
    ensureEndAfterStart(effectiveStart, effectiveEnd);

    if (hasStartDateUpdate) {
      updateData.startDate = effectiveStart;
    }
    if (hasEndDateUpdate) {
      updateData.endDate = effectiveEnd;
    }
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'maxBookings')) {
    const rawMaxBookings =
      updateData.maxBookings !== undefined && updateData.maxBookings !== null
        ? Number(updateData.maxBookings)
        : undefined;
    updateData.maxBookings =
      rawMaxBookings !== undefined && !Number.isNaN(rawMaxBookings)
        ? rawMaxBookings
        : undefined;
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'currentBookings')) {
    const rawCurrentBookings = Number(updateData.currentBookings);
    updateData.currentBookings = Number.isNaN(rawCurrentBookings)
      ? existingDeal.currentBookings
      : rawCurrentBookings;
  }

  // Recalculate discount if price or originalPrice are updated
  if (updateData.originalPrice !== undefined || updateData.price !== undefined) {
    const currentOriginalPrice =
      updateData.originalPrice !== undefined
        ? updateData.originalPrice
        : existingDeal.originalPrice;
    const currentPrice =
      updateData.price !== undefined ? updateData.price : existingDeal.price;

    const normalizedDiscount = normalizeDiscount(
      currentOriginalPrice ?? undefined,
      currentPrice ?? undefined,
    );

    updateData.discount = normalizedDiscount;
  }

  if (updateData.category) {
    delete updateData.category;
  }

  const deal = await Deal.findOneAndUpdate(
    { _id: dealId, business: businessId },
    updateData,
    { new: true, runValidators: true },
  )
    .populate('service', 'name category basePrice duration')
    .populate('operatingSite', 'name address')
    .populate('createdBy', 'firstName lastName email');

  if (!deal) {
    throw new Error('Deal not found');
  }
  return deal;
};

const deleteDeal = async (businessId: string, dealId: string, userId: string): Promise<void> => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new Error('Business not found');
  }

  // Check if the user has access to the business
  if (!business.hasAccess(userId as any)) {
    throw new Error('Access denied');
  }

  // Get the existing deal
  const existingDeal = await Deal.findOne({ _id: dealId, business: businessId });
  if (!existingDeal) {
    throw new Error('Deal not found');
  }

  // Check permissions based on role
  const isOwner = business.isBusinessOwner(userId as any);

  if (!isOwner) {
    // Check if user has access to at least one of the deal's operating sites
    const operatingSiteIds = Array.isArray(existingDeal.operatingSite)
      ? existingDeal.operatingSite
      : [existingDeal.operatingSite];

    const hasSiteAccess = await OperateSite.findOne({
      _id: { $in: operatingSiteIds },
      business: businessId,
      members: userId,
      isActive: true,
    });

    if (!hasSiteAccess) {
      throw new Error('You do not have access to this deal');
    }

    // For employees, they can only delete deals they created
    const roleName = await business.populate('members.role').then(() => {
      const member = business.members?.find((m: any) => (m.user as any).equals(userId));
      return member?.role && typeof member.role === 'object' ? (member.role as any).name : null;
    });

    if (roleName === 'employee' && existingDeal.createdBy?.toString() !== userId) {
      throw new Error('You can only delete deals you created');
    }
  }

  const result = await Deal.deleteOne({ _id: dealId, business: businessId });
  if (result.deletedCount === 0) {
    throw new Error('Deal not found');
  }
};

const updateDealStatus = async (businessId: string, dealId: string, userId: string, status: string): Promise<IDealDocument> => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new Error('Business not found');
  }

  if (!['active', 'inactive'].includes(status)) {
    throw new Error('Status can only be set to active or inactive');
  }

  // Check if the user has access to the business
  if (!business.hasAccess(userId as any)) {
    throw new Error('Access denied');
  }

  // Get the existing deal
  const existingDeal = await Deal.findOne({ _id: dealId, business: businessId });
  if (!existingDeal) {
    throw new Error('Deal not found');
  }

  // Check permissions based on role
  const isOwner = business.isBusinessOwner(userId as any);

  if (!isOwner) {
    // Check if user has access to at least one of the deal's operating sites
    const operatingSiteIds = Array.isArray(existingDeal.operatingSite)
      ? existingDeal.operatingSite
      : [existingDeal.operatingSite];

    const hasSiteAccess = await OperateSite.findOne({
      _id: { $in: operatingSiteIds },
      business: businessId,
      members: userId,
      isActive: true,
    });

    if (!hasSiteAccess) {
      throw new Error('You do not have access to this deal');
    }

    // For employees, they can only update status of deals they created
    const roleName = await business.populate('members.role').then(() => {
      const member = business.members?.find((m: any) => (m.user as any).equals(userId));
      return member?.role && typeof member.role === 'object' ? (member.role as any).name : null;
    });

    if (roleName === 'employee' && existingDeal.createdBy?.toString() !== userId) {
      throw new Error('You can only update status of deals you created');
    }
  }

  const deal = await Deal.findOneAndUpdate(
    { _id: dealId, business: businessId },
    { status },
    { new: true, runValidators: true },
  )
    .populate('service', 'name category basePrice duration')
    .populate('operatingSite', 'name address')
    .populate('createdBy', 'firstName lastName email');

  if (!deal) {
    throw new Error('Deal not found');
  }
  return deal;
};

// Public listing: only deals from ACTIVE businesses and active/current deals
const listPublicDeals = async (filters: {
  category?: string;
  limit?: number;
  skip?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  title?: string;
} = {}) => {
  const { category, title, limit = 20, skip = 0, latitude, longitude, radiusKm } = filters;

  // If location filtering is needed, first find operating sites within radius
  let nearbySiteIds: mongoose.Types.ObjectId[] | undefined;
  if (latitude != null && longitude != null && radiusKm != null) {
    const radiusInMeters = Math.max(1, radiusKm) * 1000;
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedRadiusKm = Number(radiusKm);

    try {
      // $geoNear must be the first stage
      // The location field is now stored in the database (via pre-save hook) for geospatial indexing
      const nearbySites = await OperateSite.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parsedLongitude, parsedLatitude] },
            distanceField: 'distance',
            maxDistance: radiusInMeters,
            spherical: true,
            query: { isActive: true },
          },
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]);

      nearbySiteIds = nearbySites.map((site: any) => site._id);

      // If $geoNear returns no results, try fallback method
      if (nearbySiteIds.length === 0) {
        // Fallback: Find active sites and calculate distance manually
        // This handles cases where location field might not be properly indexed
        const allActiveSites = await OperateSite.find({ isActive: true }).lean();
        const sitesWithinRadius: mongoose.Types.ObjectId[] = [];

        for (const site of allActiveSites) {
          if (site.latitude == null || site.longitude == null) {
            continue; // Skip sites without coordinates
          }

          // Calculate haversine distance
          const siteLat = Number(site.latitude);
          const siteLon = Number(site.longitude);

          const R = 6371; // Earth radius in km
          const dLat = (siteLat - parsedLatitude) * Math.PI / 180;
          const dLon = (siteLon - parsedLongitude) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(parsedLatitude * Math.PI / 180) * Math.cos(siteLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          if (distance <= parsedRadiusKm) {
            sitesWithinRadius.push(site._id);
          }
        }

        nearbySiteIds = sitesWithinRadius;
      }
    } catch (error: any) {
      // If $geoNear fails (e.g., no 2dsphere index), use fallback method

      const allActiveSites = await OperateSite.find({ isActive: true }).lean();
      const sitesWithinRadius: mongoose.Types.ObjectId[] = [];

      for (const site of allActiveSites) {
        if (site.latitude == null || site.longitude == null) {
          continue; // Skip sites without coordinates
        }

        const siteLat = Number(site.latitude);
        const siteLon = Number(site.longitude);

        const R = 6371;
        const dLat = (siteLat - parsedLatitude) * Math.PI / 180;
        const dLon = (siteLon - parsedLongitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(parsedLatitude * Math.PI / 180) * Math.cos(siteLat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance <= parsedRadiusKm) {
          sitesWithinRadius.push(site._id);
        }
      }

      nearbySiteIds = sitesWithinRadius;
    }

    // Initialize as empty array if still undefined
    if (nearbySiteIds === undefined) {
      nearbySiteIds = [];
    }
  }

  const match: any = {
    status: 'active',
  };

  // If location filtering is enabled, always apply the filter
  // If nearbySiteIds is empty array, it will result in no matches (correct behavior)
  // Convert ObjectIds to strings since operatingSite field stores strings
  if (nearbySiteIds !== undefined) {
    if (nearbySiteIds.length === 0) {
      // No sites within radius, so return no deals
      // Set match to an impossible condition to return empty results
      match.operatingSite = { $in: [] };
    } else {
      const nearbySiteIdsAsStrings = nearbySiteIds.map((id) => id.toString());
      // Use $in to match if ANY element in the operatingSite array matches
      // MongoDB $in works on arrays - it checks if any element matches
      match.operatingSite = { $in: nearbySiteIdsAsStrings };
    }
  }
  // If location filtering is not enabled (nearbySiteIds is undefined), show all deals

  if (title) {
    match.title = { $regex: title, $options: 'i' };
  }

  let categoryName: string | undefined;
  if (category) {
    const Category = mongoose.model('categories');
    const categoryDoc = await Category.findOne({ slug: category, isActive: true }).lean();
    if (categoryDoc && typeof categoryDoc === 'object' && 'name' in categoryDoc) {
      categoryName = categoryDoc.name as string;
    } else {
      // If category slug not found, return empty results
      return [];
    }
  }

  const pipeline: any[] = [
    { $match: match },
    // Convert string ids to ObjectId for lookups
    {
      $addFields: {
        businessObjId: { $toObjectId: '$business' },
        serviceObjId: { $toObjectId: '$service' },
      },
    },
    {
      $lookup: {
        from: 'businesses',
        localField: 'businessObjId',
        foreignField: '_id',
        as: 'business',
      },
    },
    { $unwind: '$business' },
    {
      $match: {
        'business.status': BusinessStatus.ACTIVE,
      },
    },
    {
      $lookup: {
        from: 'services',
        localField: 'serviceObjId',
        foreignField: '_id',
        as: 'service',
      },
    },
    { $unwind: '$service' },
    ...(categoryName
      ? [
        {
          $match: {
            'service.category': categoryName,
          },
        },
      ]
      : []),
    {
      $lookup: {
        from: 'categories',
        let: { serviceCategoryName: '$service.category' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$name', '$$serviceCategoryName'] },
                  { $eq: ['$isActive', true] },
                ],
              },
            },
          },
        ],
        as: 'categoryData',
      },
    },
    { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
    // Optional title-like search on service name too (applied after lookup)
    ...(title
      ? [
        {
          $match: {
            $or: [
              { title: { $regex: title, $options: 'i' } },
              { 'service.name': { $regex: title, $options: 'i' } },
            ],
          },
        },
      ]
      : []),
    // Lookup operating sites for display (and distance if location filtering is enabled)
    // operatingSite is an array of strings, _id is ObjectId, so we need to convert for lookup
    {
      $lookup: {
        from: 'operateSites',
        let: { operatingSiteIds: '$operatingSite' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: [{ $toString: '$_id' }, '$$operatingSiteIds'],
              },
            },
          },
        ],
        as: 'sites',
      },
    },
    // Filter to only active sites if location filtering is enabled, we already filtered by nearbySiteIds
    ...(nearbySiteIds && nearbySiteIds.length > 0
      ? [
        {
          $addFields: {
            sites: {
              $filter: {
                input: '$sites',
                as: 'site',
                cond: {
                  $and: [
                    { $eq: ['$$site.isActive', true] },
                    { $in: ['$$site._id', nearbySiteIds] },
                  ],
                },
              },
            },
          },
        },
        // Only keep deals that have at least one site within radius
        {
          $match: {
            'sites.0': { $exists: true },
          },
        },
      ]
      : [
        {
          $addFields: {
            sites: {
              $filter: {
                input: '$sites',
                as: 'site',
                cond: { $eq: ['$$site.isActive', true] },
              },
            },
          },
        },
      ]),
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        category: '$categoryData.slug',
        categoryData: {
          _id: '$categoryData._id',
          name: '$categoryData.name',
          slug: '$categoryData.slug',
          icon: '$categoryData.icon',
        },
        price: 1,
        originalPrice: 1,
        duration: 1,
        startDate: 1,
        endDate: 1,
        discount: 1,
        business: { _id: '$business._id', name: '$business.name', status: '$business.status' },
        service: {
          _id: '$service._id',
          name: '$service.name',
          category: '$service.category',
          basePrice: '$service.basePrice',
          duration: '$service.duration',
        },
        distance: 1,
      },
    },
    { $sort: { startDate: 1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  return Deal.aggregate(pipeline);
};

export default {
  getDealsByBusiness,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  updateDealStatus,
  listPublicDeals,
  async getPublicDealById(dealId: string) {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const pipeline: any[] = [
      { $match: { _id: new (require('mongoose').Types.ObjectId)(dealId) } },
      {
        $addFields: {
          businessObjId: { $toObjectId: '$business' },
          serviceObjId: { $toObjectId: '$service' },
          operatingSiteObjIds: {
            $map: {
              input: { $ifNull: ['$operatingSite', []] },
              as: 'sid',
              in: { $toObjectId: '$$sid' },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'businessObjId',
          foreignField: '_id',
          as: 'business',
        },
      },
      { $unwind: '$business' },
      {
        $match: {
          'business.status': BusinessStatus.ACTIVE,
          status: 'active',
          startDate: { $lte: oneDayFromNow },
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceObjId',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: '$service' },
      {
        $lookup: {
          from: 'categories',
          let: { serviceCategoryName: '$service.category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$name', '$$serviceCategoryName'] },
                    { $eq: ['$isActive', true] },
                  ],
                },
              },
            },
          ],
          as: 'categoryData',
        },
      },
      { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'operateSites',
          localField: 'operatingSiteObjIds',
          foreignField: '_id',
          as: 'sites',
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          category: '$categoryData.slug',
          categoryData: {
            _id: '$categoryData._id',
            name: '$categoryData.name',
            slug: '$categoryData.slug',
            icon: '$categoryData.icon',
          },
          price: 1,
          originalPrice: 1,
          duration: 1,
          startDate: 1,
          endDate: 1,
          discount: 1,
          business: { _id: '$business._id', name: '$business.name', status: '$business.status' },
          service: {
            _id: '$service._id',
            name: '$service.name',
            category: '$service.category',
            basePrice: '$service.basePrice',
            duration: '$service.duration',
          },
          sites: {
            $map: {
              input: '$sites',
              as: 's',
              in: { _id: '$$s._id', name: '$$s.name', address: '$$s.address' },
            },
          },
        },
      },
      { $limit: 1 },
    ];
    const result = await Deal.aggregate(pipeline);
    return result[0] || null;
  },
};
