import Deal, { IDealDocument } from '../model/deal';
import Business from '../model/business';
import Service from '../model/service';
import { BadRequestException } from '../exceptions';
import { BusinessStatus } from '../enum/businessStatus';
import { DealAggregationBuilder } from './deals/DealAggregationBuilder';
import { PublicDealQuery } from './deals/PublicDealQuery';
import { BusinessLookupStage } from './deals/stages/BusinessLookupStage';
import { CategoryFilterStage } from './deals/stages/CategoryFilterStage';
import { CategoryLookupStage } from './deals/stages/CategoryLookupStage';
import { DateFilterStage } from './deals/stages/DateFilterStage';
import { DealStatusStage } from './deals/stages/DealStatusStage';
import { LocationMatchStage } from './deals/stages/LocationMatchStage';
import { ObjectIdFieldsStage } from './deals/stages/ObjectIdFieldsStage';
import { OperatingSitesLookupStage } from './deals/stages/OperatingSitesLookupStage';
import { ProjectStage } from './deals/stages/ProjectStage';
import { ServiceLookupStage } from './deals/stages/ServiceLookupStage';
import { SiteFilterStage } from './deals/stages/SiteFilterStage';
import { SortStage } from './deals/stages/SortStage';
import { TitleFilterStage } from './deals/stages/TitleFilterStage';
import { CategoryStage } from './deals/stages/CategoryStage';
import { DateStage } from './deals/stages/DateStage';
import { LocationStage } from './deals/stages/LocationStage';
import { LocationTextSearchStage } from './deals/stages/LocationTextSearchStage';
import OperateSite from '../model/operateSite';
import { toUtcMidnight, normalizeDate } from '../utils/timeUtils';

const startOfToday = (): Date => toUtcMidnight(new Date());

const ensureFutureDate = (date: Date, fieldName: string) => {
  const normalized = toUtcMidnight(date);
  const today = startOfToday();
  if (normalized.getTime() < today.getTime()) {
    throw new BadRequestException(`${fieldName} cannot be before today`);
  }
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
  // Set sections to 1 if not provided
  if (!dealData.sections) {
    dealData.sections = 1;
  }

  // Validate that deal price is less than base price
  const dealPrice = dealData.price ?? service.basePrice;
  if (dealPrice >= service.basePrice) {
    throw new BadRequestException('Deal price must be less than the service base price');
  }

  // Remove discount from dealData if it exists (we calculate it on-the-fly, not stored)
  if (dealData.discount !== undefined) {
    delete dealData.discount;
  }

  if (dealData.availability) {
    const legacyAvailability = dealData.availability;
    if (
      Object.prototype.hasOwnProperty.call(legacyAvailability, 'currentBookings')
    ) {
      dealData.currentBookings = legacyAvailability.currentBookings;
    }
    delete dealData.availability;
  }

  // Handle recurring pattern fields
  const allDay = dealData.allDay !== undefined ? Boolean(dealData.allDay) : false;
  const recurrenceType = dealData.recurrenceType || 'none';
  const validRecurrenceTypes = ['none', 'daily', 'weekly', 'weekdays', 'monthly', 'annually'];
  if (!validRecurrenceTypes.includes(recurrenceType)) {
    throw new BadRequestException(`Recurrence type must be one of: ${validRecurrenceTypes.join(', ')}`);
  }

  const startDate = dealData.startDate
    ? normalizeDate(dealData.startDate, 'Start date')
    : startOfToday();

  ensureFutureDate(startDate, 'Start date');

  const rawCurrentBookings =
    dealData.currentBookings !== undefined && dealData.currentBookings !== null
      ? Number(dealData.currentBookings)
      : 0;
  const currentBookings = Number.isNaN(rawCurrentBookings)
    ? 0
    : rawCurrentBookings;

  if (dealData.category) {
    delete dealData.category;
  }

  const newDeal = new Deal({
    ...dealData,
    allDay,
    startDate,
    recurrenceType,
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

  // Handle recurring pattern fields
  if (Object.prototype.hasOwnProperty.call(updateData, 'allDay')) {
    updateData.allDay = Boolean(updateData.allDay);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'recurrenceType')) {
    const validRecurrenceTypes = ['none', 'daily', 'weekly', 'weekdays', 'monthly', 'annually'];
    if (!validRecurrenceTypes.includes(updateData.recurrenceType)) {
      throw new BadRequestException(`Recurrence type must be one of: ${validRecurrenceTypes.join(', ')}`);
    }
  }

  const hasStartDateUpdate = Object.prototype.hasOwnProperty.call(
    updateData,
    'startDate',
  );
  const hasRecurrenceTypeUpdate = Object.prototype.hasOwnProperty.call(
    updateData,
    'recurrenceType',
  );

  if (hasStartDateUpdate || hasRecurrenceTypeUpdate) {
    const effectiveStart = hasStartDateUpdate
      ? normalizeDate(updateData.startDate, 'Start date')
      : new Date(existingDeal.startDate);

    if (hasStartDateUpdate) {
      // No validation - allow any date when editing
      updateData.startDate = effectiveStart;
    }
  }

  // Remove endDate if it exists in updateData
  if (Object.prototype.hasOwnProperty.call(updateData, 'endDate')) {
    delete updateData.endDate;
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'currentBookings')) {
    const rawCurrentBookings = Number(updateData.currentBookings);
    updateData.currentBookings = Number.isNaN(rawCurrentBookings)
      ? existingDeal.currentBookings
      : rawCurrentBookings;
  }

  // Remove discount from updateData if it exists (we calculate it on-the-fly, not stored)
  if (updateData.discount !== undefined) {
    delete updateData.discount;
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

/**
 * Main function using Builder Pattern with Fluent Interface
 */
const listPublicDeals = async (filters: {
  category?: string;
  limit?: number;
  skip?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  title?: string;
  locationQuery?: string;
} = {}) => {
  const query = new PublicDealQuery(filters);

  const dealAggregationBuilder = new DealAggregationBuilder()
    .add(new LocationStage())
    .add(new CategoryStage())
    .add(new DateStage())
    .add(new DealStatusStage())
    .add(new LocationMatchStage())
    .add(new ObjectIdFieldsStage())
    .add(new DateFilterStage())
    .add(new BusinessLookupStage())
    .add(new ServiceLookupStage())
    .add(new CategoryFilterStage())
    .add(new CategoryLookupStage())
    .add(new TitleFilterStage())
    .add(new OperatingSitesLookupStage())
    .add(new SiteFilterStage())
    .add(new LocationTextSearchStage())
    .add(new ProjectStage())
    .add(new SortStage());

  return dealAggregationBuilder.execute(query);
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
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const todayUtc = toUtcMidnight(now);
    const twoWeeksFromTodayUtc = toUtcMidnight(twoWeeksFromNow);

    // Get date strings for MongoDB comparison (YYYY-MM-DD format)
    const todayStr = todayUtc.toISOString().split('T')[0];
    const twoWeeksFromTodayStr = twoWeeksFromTodayUtc.toISOString().split('T')[0];

    const pipeline: any[] = [
      { $match: { _id: new (require('mongoose').Types.ObjectId)(dealId) } },
      {
        $addFields: {
          businessObjId: { $toObjectId: '$business' },
          serviceObjId: { $toObjectId: '$service' },
          // Calculate end time in milliseconds: startDate + (duration * sections) minutes
          endDateTimeMs: {
            $add: [
              { $toLong: '$startDate' }, // Convert startDate to milliseconds
              { $multiply: [{ $multiply: ['$duration', '$sections'] }, 60 * 1000] }, // Convert minutes to milliseconds
            ],
          },
          // Check if startDate is today (date part only)
          startDateOnly: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$startDate',
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
          $expr: {
            $and: [
              { $eq: ['$status', 'active'] },
              {
                $or: [
                  // Non-recurring: start date within 2 weeks from today onwards, AND not already ended if it's today
                  {
                    $and: [
                      { $eq: ['$recurrenceType', 'none'] },
                      {
                        $and: [
                          {
                            $gte: ['$startDateOnly', todayStr],
                          },
                          {
                            $lte: ['$startDateOnly', twoWeeksFromTodayStr],
                          },
                          // If startDate is today, check that current time hasn't passed the end time
                          {
                            $or: [
                              // StartDate is in the future (not today) - always include
                              { $gt: ['$startDateOnly', todayStr] },
                              // StartDate is today - only include if deal hasn't ended yet ($$NOW < end time)
                              {
                                $and: [
                                  { $eq: ['$startDateOnly', todayStr] },
                                  { $lt: [{ $toLong: '$$NOW' }, '$endDateTimeMs'] }, // current time < end time means deal hasn't ended
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  // Recurring: started in past or today, no end date (ongoing - always available)
                  {
                    $and: [
                      { $ne: ['$recurrenceType', 'none'] },
                      {
                        $lte: [
                          {
                            $dateToString: {
                              format: '%Y-%m-%d',
                              date: '$startDate',
                            },
                          },
                          twoWeeksFromTodayStr,
                        ],
                      },
                    ],
                  },
                  // Recurring: starts in future within 2 weeks
                  {
                    $and: [
                      { $ne: ['$recurrenceType', 'none'] },
                      {
                        $gte: [
                          {
                            $dateToString: {
                              format: '%Y-%m-%d',
                              date: '$startDate',
                            },
                          },
                          todayStr,
                        ],
                      },
                      {
                        $lte: [
                          {
                            $dateToString: {
                              format: '%Y-%m-%d',
                              date: '$startDate',
                            },
                          },
                          twoWeeksFromTodayStr,
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
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
          sections: 1,
          allDay: 1,
          startDate: 1,
          recurrenceType: 1,
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
              as: 'site',
              in: {
                _id: '$$site._id',
                name: '$$site.name',
                address: '$$site.address',
                operatingHours: '$$site.operatingHours',
              },
            },
          },
          distance: 1,
        },
      },
      { $limit: 1 },
    ];
    const result = await Deal.aggregate(pipeline);
    const deal = result[0] || null;

    if (!deal) {
      return null;
    }

    // Calculate available time slots
    const { calculateAvailableTimeSlots } = require('../utils/timeSlotUtils');
    const availableTimeSlots = calculateAvailableTimeSlots({
      startDate: new Date(deal.startDate),
      allDay: deal.allDay,
      recurrenceType: deal.recurrenceType,
      duration: deal.duration,
      sections: deal.sections,
      operatingSites: deal.sites || [],
    });

    return {
      ...deal,
      availableTimeSlots,
    };
  },
};
