import SavedDeal from '../model/savedDeal';
import Deal from '../model/deal';
import Business from '../model/business';
import { BusinessStatus } from '../enum/businessStatus';
import { NotFoundException, BadRequestException } from '../exceptions';

/**
 * Persist a deal to the current user's saved list after validating deal and business status.
 */
export const saveUserDeal = async (userId: string, dealId: string) => {
  const deal = await Deal.findById(dealId)
    .select('_id business status')
    .lean();
  if (!deal) {
    throw new NotFoundException('Deal not found');
  }
  if (deal.status !== 'active') {
    throw new BadRequestException('Deal unavailable or removed');
  }

  const business = await Business.findById(deal.business)
    .select('_id status')
    .lean();
  if (!business || business.status !== BusinessStatus.ACTIVE) {
    throw new BadRequestException('Business not found or unavailable');
  }

  return SavedDeal.create({
    user: userId,
    deal: dealId,
    status: 'active',
  });
};

/**
 * List saved deals for the user (excluding removed) with optional pagination.
 */
export const listUserDeals = async (
  userId: string,
  options?: { page?: number; limit?: number },
) => {
  const page = Math.max(1, Number(options?.page) || 1);
  const limit = Math.max(1, Number(options?.limit) || 10);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    SavedDeal.find({
      user: userId,
      status: { $ne: 'removed' },
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SavedDeal.countDocuments({ user: userId, status: { $ne: 'removed' } }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Soft-delete saved deals for a user by dealId.
 */
export const deleteSavedDeal = async (
  userId: string,
  dealId: string,
) => {
  const result = await SavedDeal.updateMany(
    { user: userId, deal: dealId, status: { $ne: 'removed' } },
    { status: 'removed' },
  );

  if (!result || result.matchedCount === 0) {
    throw new NotFoundException('Saved deal not found');
  }

  return result;
};

export default {
  saveUserDeal,
  listUserDeals,
  deleteSavedDeal,
};
