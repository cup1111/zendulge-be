import type { Request, Response } from 'express';
import bookmarkDealService from '../../services/bookmarkDealService';

/**
 * Persist a deal to the current user's bookmark list.
 * - Validates auth, deal existence, deal status, and business status.
 * - Returns existing record if already bookmarked to keep the operation idempotent.
 */
export const saveUserBookmarkDeal = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { dealId } = req.body as { dealId?: string };

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  if (!dealId) {
    return res
      .status(400)
      .json({ success: false, message: 'dealId is required' });
  }

  const saved = await bookmarkDealService.saveUserBookmarkDeal(userId, dealId);
  return res.status(201).json({ success: true, data: saved });
};

/**
 * Return the current user's bookmark deals (excluding removed records).
 */
export const listUserBookmarkDeals = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const { items, pagination } = await bookmarkDealService.listUserBookmarkDeals(
    userId,
    { page, limit },
  );

  return res.json({ success: true, data: items, pagination });
};


/**
 * Hard-delete a bookmark deal for the current user by dealId.
 */
export const deleteBookmarkDeal = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { dealId } = req.params as { dealId?: string };

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  if (!dealId) {
    return res
      .status(400)
      .json({ success: false, message: 'dealId is required' });
  }

  await bookmarkDealService.deleteBookmarkDeal(userId, dealId);

  return res.json({ success: true, message: 'Bookmark deal removed' });
};

export default {
  saveUserBookmarkDeal,
  listUserBookmarkDeals,
  deleteBookmarkDeal,
};
