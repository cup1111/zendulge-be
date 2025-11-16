import { Request, Response } from 'express';
import dealService from '../../services/dealService';

export const listPublicDeals = async (req: Request, res: Response) => {
    const { category, limit, skip } = req.query;
    const parsedLimit = Number(limit ?? 20);
    const parsedSkip = Number(skip ?? 0);

    const deals = await dealService.listPublicDeals({
        category: typeof category === 'string' ? category : undefined,
        limit: Number.isNaN(parsedLimit) ? 20 : parsedLimit,
        skip: Number.isNaN(parsedSkip) ? 0 : parsedSkip,
    });

    res.status(200).json({
        success: true,
        message: 'Deals retrieved successfully',
        data: deals,
    });
};

export default {
    listPublicDeals,
};


