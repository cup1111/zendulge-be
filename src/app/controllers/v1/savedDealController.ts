import type { Request, Response } from 'express';
import savedDealService from '../../services/savedDealService';
import { BaseException } from '../../exceptions';

/**
 * Persist a deal to the current user's saved list.
 * - Validates auth, deal existence, deal status, and business status.
 * - Returns existing record if already saved to keep the operation idempotent.
 */
export const saveDealForLater = async (req: Request, res: Response) => {
  try {
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

    const saved = await savedDealService.saveDealForLater(userId, dealId);
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    if (err instanceof BaseException) {
      return res.status(err.statusCode).json(err.toResponse());
    }
    throw err;
  }
};

/**
 * Return the current user's saved deals (excluding removed records).
 */
export const listSavedDeals = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { items, pagination } = await savedDealService.listSavedDeals(
      userId,
      { page, limit },
    );

    return res.json({ success: true, data: items, pagination });
  } catch (err) {
    if (err instanceof BaseException) {
      return res.status(err.statusCode).json(err.toResponse());
    }
    throw err;
  }
};


/**
 * Soft-delete a saved deal for the current user by dealId.
 */
export const deleteSavedDeal = async (req: Request, res: Response) => {
  try {
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

    await savedDealService.deleteSavedDeal(userId, dealId);

    return res.json({ success: true, message: 'Saved deal removed' });
  } catch (err) {
    if (err instanceof BaseException) {
      return res.status(err.statusCode).json(err.toResponse());
    }
    throw err;
  }
};

export default {
  saveDealForLater,
  listSavedDeals,
  deleteSavedDeal,
};
