import BookmarkDeal from '../model/bookmarkDeal';
import Deal from '../model/deal';
import Business from '../model/business';
import { BusinessStatus } from '../enum/businessStatus';
import { NotFoundException, BadRequestException } from '../exceptions';

/**
 * Persist a deal to the current user's bookmark list after validating deal and business status.
 */
export const saveUserBookmarkDeal = async (userId: string, dealId: string) => {
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

  return BookmarkDeal.create({
    user: userId,
    deal: dealId,
  });
};

/**
 * List bookmark deals for the user (excluding removed) with optional pagination.
 */
export const listUserBookmarkDeals = async (
  userId: string,
  options?: { page?: number; limit?: number },
) => {
  const page = Math.max(1, Number(options?.page) || 1);
  const limit = Math.max(1, Number(options?.limit) || 10);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    BookmarkDeal.find({
      user: userId,
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BookmarkDeal.countDocuments({ user: userId }),
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
 * Hard-delete bookmark deals for a user by dealId.
 */
export const deleteBookmarkDeal = async (
  userId: string,
  dealId: string,
) => {
  const result = await BookmarkDeal.deleteMany({
    user: userId,
    deal: dealId,
  });

  if (!result || result.deletedCount === 0) {
    throw new NotFoundException('Bookmark deal not found');
  }

  return result;
};

export default {
  saveUserBookmarkDeal,
  listUserBookmarkDeals,
  deleteBookmarkDeal,
};
