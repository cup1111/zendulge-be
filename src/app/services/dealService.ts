import Deal, { IDealDocument } from '../model/deal';
import Company from '../model/company';
import Service from '../model/service';
import OperateSite from '../model/operateSite';

const normalizeDate = (value: any, fieldName: string): Date => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const ensureFutureDate = (date: Date, fieldName: string) => {
  const today = startOfToday();
  if (date.getTime() < today.getTime()) {
    throw new Error(`${fieldName} cannot be before today`);
  }
};

const ensureEndAfterStart = (start: Date, end: Date) => {
  if (end.getTime() <= start.getTime()) {
    throw new Error('End date must be after start date');
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

const getDealsByCompany = async (companyId: string, userId: string): Promise<IDealDocument[]> => {
  const company = await Company.findById(companyId);
  if (!company || !company.hasAccess(userId as any)) {
    throw new Error('Company not found or access denied');
  }

  // Get user's role in the company
  const userRole = company.getMemberRole(userId as any);
  const isOwner = company.isCompanyOwner(userId as any);

  let dealsQuery: any = { company: companyId };

  // If not owner, filter by operating sites the user has access to
  if (!isOwner && userRole) {
    // Get operating sites the user has access to
    const userOperatingSites = await OperateSite.find({
      company: companyId,
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

const getDealById = async (companyId: string, dealId: string, userId: string): Promise<IDealDocument> => {
  const company = await Company.findById(companyId);
  if (!company || !company.hasAccess(userId as any)) {
    throw new Error('Company not found or access denied');
  }
  const deal = await Deal.findOne({ _id: dealId, company: companyId })
    .populate('service', 'name category basePrice duration')
    .populate('operatingSite', 'name address');
  if (!deal) {
    throw new Error('Deal not found');
  }
  return deal;
};

const createDeal = async (companyId: string, userId: string, dealData: any): Promise<IDealDocument> => {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Company not found');
  }

  // Check if the user has access to the company
  if (!company.hasAccess(userId as any)) {
    throw new Error('Access denied');
  }

  // Validate service - it's now required
  if (!dealData.service) {
    throw new Error('Service is required');
  }
  const service = await Service.findOne({ _id: dealData.service, company: companyId });
  if (!service) {
    throw new Error('Service not found or does not belong to this company');
  }

  // Validate operating sites - should be an array
  if (!dealData.operatingSite || !Array.isArray(dealData.operatingSite) || dealData.operatingSite.length === 0) {
    throw new Error('At least one operating site is required');
  }

  // Ensure operatingSite is an array (support backward compatibility)
  const operatingSiteIds = Array.isArray(dealData.operatingSite)
    ? dealData.operatingSite
    : [dealData.operatingSite];

  // Validate all operating sites exist and belong to the company
  const operatingSites = await OperateSite.find({
    _id: { $in: operatingSiteIds },
    company: companyId,
  });

  if (operatingSites.length !== operatingSiteIds.length) {
    throw new Error('One or more operating sites not found or do not belong to this company');
  }

  // Check if user has access to all operating sites (for non-owners)
  const isOwner = company.isCompanyOwner(userId as any);
  if (!isOwner) {
    const accessibleSites = await OperateSite.find({
      _id: { $in: operatingSiteIds },
      company: companyId,
      members: userId,
      isActive: true,
    });

    if (accessibleSites.length !== operatingSiteIds.length) {
      throw new Error('You do not have access to one or more of the selected operating sites');
    }
  }

  // Update dealData to use array
  dealData.operatingSite = operatingSiteIds;

  // Set original price from service if not provided
  if (!dealData.originalPrice) {
    dealData.originalPrice = service.basePrice;
  }
  // Set duration from service if not provided
  if (!dealData.duration) {
    dealData.duration = service.duration;
  }

  // Calculate discount if originalPrice and price are provided
  if (dealData.originalPrice !== undefined || dealData.price !== undefined) {
    const normalizedDiscount = normalizeDiscount(
      dealData.originalPrice ?? service.basePrice,
      dealData.price ?? service.basePrice,
    );
    dealData.discount = normalizedDiscount;
  }

  // Set default availability if not provided
  if (!dealData.availability) {
    dealData.availability = {
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      currentBookings: 0,
    };
  }

  const availabilityStartDate = normalizeDate(dealData.availability.startDate ?? new Date(), 'Start date');
  const availabilityEndDate = normalizeDate(dealData.availability.endDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'End date');

  ensureFutureDate(availabilityStartDate, 'Start date');
  ensureFutureDate(availabilityEndDate, 'End date');
  ensureEndAfterStart(availabilityStartDate, availabilityEndDate);

  dealData.availability = {
    ...dealData.availability,
    startDate: availabilityStartDate,
    endDate: availabilityEndDate,
    currentBookings: dealData.availability.currentBookings ?? 0,
  };

  const newDeal = new Deal({
    ...dealData,
    company: companyId,
    createdBy: userId, // Track who created the deal
  });
  return newDeal.save();
};

const updateDeal = async (companyId: string, dealId: string, userId: string, updateData: any): Promise<IDealDocument> => {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Company not found');
  }

  // Check if the user has access to the company
  if (!company.hasAccess(userId as any)) {
    throw new Error('Access denied');
  }

  // Get the existing deal
  const existingDeal = await Deal.findOne({ _id: dealId, company: companyId });
  if (!existingDeal) {
    throw new Error('Deal not found');
  }

  // Check permissions based on role
  const isOwner = company.isCompanyOwner(userId as any);
  const userRole = company.getMemberRole(userId as any);

  if (!isOwner) {
    // For non-owners, check if they can edit this deal
    if (userRole) {
      // Check if user has access to at least one of the deal's operating sites
      const operatingSiteIds = Array.isArray(existingDeal.operatingSite)
        ? existingDeal.operatingSite
        : [existingDeal.operatingSite];

      const hasSiteAccess = await OperateSite.findOne({
        _id: { $in: operatingSiteIds },
        company: companyId,
        members: userId,
        isActive: true,
      });

      if (!hasSiteAccess) {
        throw new Error('You do not have access to this deal');
      }

      // For employees, they can only edit deals they created
      const roleName = await company.populate('members.role').then(() => {
        const member = company.members?.find(m => (m.user as any).equals(userId));
        return member?.role && typeof member.role === 'object' ? (member.role as any).name : null;
      });

      if (roleName === 'employee' && existingDeal.createdBy?.toString() !== userId) {
        throw new Error('You can only edit deals you created');
      }
    }
  }

  // If service is updated, re-validate and potentially update originalPrice/duration
  if (updateData.service) {
    const service = await Service.findOne({ _id: updateData.service, company: companyId });
    if (!service) {
      throw new Error('Service not found or does not belong to this company');
    }
    if (!updateData.originalPrice) {
      updateData.originalPrice = service.basePrice;
    }
    if (!updateData.duration) {
      updateData.duration = service.duration;
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

    // Validate all operating sites exist and belong to the company
    const operatingSites = await OperateSite.find({
      _id: { $in: operatingSiteIds },
      company: companyId,
    });

    if (operatingSites.length !== operatingSiteIds.length) {
      throw new Error('One or more operating sites not found or do not belong to this company');
    }

    // Check if user has access to all operating sites (for non-owners)
    if (!isOwner) {
      const accessibleSites = await OperateSite.find({
        _id: { $in: operatingSiteIds },
        company: companyId,
        members: userId,
        isActive: true,
      });

      if (accessibleSites.length !== operatingSiteIds.length) {
        throw new Error('You do not have access to one or more of the selected operating sites');
      }
    }

    // Update to use array
    updateData.operatingSite = operatingSiteIds;
  }

  // Determine effective status and end date for validation
  const availabilityUpdates = updateData.availability;
  const updatingStartDate = availabilityUpdates?.startDate !== undefined;
  const updatingEndDate = availabilityUpdates?.endDate !== undefined;

  if (updatingStartDate || updatingEndDate) {
    if (!existingDeal.availability) {
      throw new Error('Existing deal does not have availability information');
    }

    const effectiveStart = updatingStartDate
      ? normalizeDate(availabilityUpdates?.startDate, 'Start date')
      : normalizeDate(existingDeal.availability.startDate, 'Start date');
    const effectiveEnd = updatingEndDate
      ? normalizeDate(availabilityUpdates?.endDate, 'End date')
      : normalizeDate(existingDeal.availability.endDate, 'End date');

    if (updatingEndDate) {
      ensureFutureDate(effectiveEnd, 'End date');
    }

    ensureEndAfterStart(effectiveStart, effectiveEnd);

    updateData.availability = {
      ...updateData.availability,
      ...(updatingStartDate ? { startDate: effectiveStart } : {}),
      ...(updatingEndDate ? { endDate: effectiveEnd } : {}),
    };
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

  const deal = await Deal.findOneAndUpdate(
    { _id: dealId, company: companyId },
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

const deleteDeal = async (companyId: string, dealId: string, userId: string): Promise<void> => {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Company not found');
  }

  // Check if the user has access to the company
  if (!company.hasAccess(userId as any)) {
    throw new Error('Access denied');
  }

  // Get the existing deal
  const existingDeal = await Deal.findOne({ _id: dealId, company: companyId });
  if (!existingDeal) {
    throw new Error('Deal not found');
  }

  // Check permissions based on role
  const isOwner = company.isCompanyOwner(userId as any);

  if (!isOwner) {
    // Check if user has access to at least one of the deal's operating sites
    const operatingSiteIds = Array.isArray(existingDeal.operatingSite)
      ? existingDeal.operatingSite
      : [existingDeal.operatingSite];

    const hasSiteAccess = await OperateSite.findOne({
      _id: { $in: operatingSiteIds },
      company: companyId,
      members: userId,
      isActive: true,
    });

    if (!hasSiteAccess) {
      throw new Error('You do not have access to this deal');
    }

    // For employees, they can only delete deals they created
    const roleName = await company.populate('members.role').then(() => {
      const member = company.members?.find(m => (m.user as any).equals(userId));
      return member?.role && typeof member.role === 'object' ? (member.role as any).name : null;
    });

    if (roleName === 'employee' && existingDeal.createdBy?.toString() !== userId) {
      throw new Error('You can only delete deals you created');
    }
  }

  const result = await Deal.deleteOne({ _id: dealId, company: companyId });
  if (result.deletedCount === 0) {
    throw new Error('Deal not found');
  }
};

const updateDealStatus = async (companyId: string, dealId: string, userId: string, status: string): Promise<IDealDocument> => {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Company not found');
  }

  if (!['active', 'inactive'].includes(status)) {
    throw new Error('Status can only be set to active or inactive');
  }

  // Check if the user has access to the company
  if (!company.hasAccess(userId as any)) {
    throw new Error('Access denied');
  }

  // Get the existing deal
  const existingDeal = await Deal.findOne({ _id: dealId, company: companyId });
  if (!existingDeal) {
    throw new Error('Deal not found');
  }

  // Check permissions based on role
  const isOwner = company.isCompanyOwner(userId as any);

  if (!isOwner) {
    // Check if user has access to at least one of the deal's operating sites
    const operatingSiteIds = Array.isArray(existingDeal.operatingSite)
      ? existingDeal.operatingSite
      : [existingDeal.operatingSite];

    const hasSiteAccess = await OperateSite.findOne({
      _id: { $in: operatingSiteIds },
      company: companyId,
      members: userId,
      isActive: true,
    });

    if (!hasSiteAccess) {
      throw new Error('You do not have access to this deal');
    }

    // For employees, they can only update status of deals they created
    const roleName = await company.populate('members.role').then(() => {
      const member = company.members?.find(m => (m.user as any).equals(userId));
      return member?.role && typeof member.role === 'object' ? (member.role as any).name : null;
    });

    if (roleName === 'employee' && existingDeal.createdBy?.toString() !== userId) {
      throw new Error('You can only update status of deals you created');
    }
  }

  const deal = await Deal.findOneAndUpdate(
    { _id: dealId, company: companyId },
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

export default {
  getDealsByCompany,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  updateDealStatus,
};
