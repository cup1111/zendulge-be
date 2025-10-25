import { Request, Response } from 'express';
import { winstonLogger } from '../../../loaders/logger';
import { AuthenticationException, AuthorizationException } from '../../exceptions';
import dealService from '../../services/dealService';
import { AuthenticatedRequest } from './authController';

export const getDeals = async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params;
    const user = req.user;

    if (!user) {
        throw new AuthenticationException('User not found');
    }

    try {
        const deals = await dealService.getDealsByCompany(companyId, user._id.toString());
        winstonLogger.info(`Deals retrieved for company: ${companyId} by user: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Deals retrieved successfully',
            data: deals,
        });
    } catch (error) {
        winstonLogger.error(`Error retrieving deals: ${error}`);
        throw error;
    }
};

export const getDealById = async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, dealId } = req.params;
    const user = req.user;

    if (!user) {
        throw new AuthenticationException('User not found');
    }

    try {
        const deal = await dealService.getDealById(companyId, dealId, user._id.toString());
        winstonLogger.info(`Deal ${dealId} retrieved for company: ${companyId} by user: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Deal retrieved successfully',
            data: deal,
        });
    } catch (error) {
        winstonLogger.error(`Error retrieving deal: ${error}`);
        throw error;
    }
};

export const createDeal = async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params;
    const user = req.user;

    if (!user) {
        throw new AuthenticationException('User not found');
    }

    try {
        const newDeal = await dealService.createDeal(companyId, user._id.toString(), req.body);
        winstonLogger.info(`Deal created for company: ${companyId} by user: ${user.email}`);
        res.status(201).json({
            success: true,
            message: 'Deal created successfully',
            data: newDeal,
        });
    } catch (error) {
        winstonLogger.error(`Error creating deal: ${error}`);
        throw error;
    }
};

export const updateDeal = async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, dealId } = req.params;
    const user = req.user;

    if (!user) {
        throw new AuthenticationException('User not found');
    }

    try {
        const updatedDeal = await dealService.updateDeal(companyId, dealId, user._id.toString(), req.body);
        winstonLogger.info(`Deal ${dealId} updated for company: ${companyId} by user: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Deal updated successfully',
            data: updatedDeal,
        });
    } catch (error) {
        winstonLogger.error(`Error updating deal: ${error}`);
        throw error;
    }
};

export const deleteDeal = async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, dealId } = req.params;
    const user = req.user;

    if (!user) {
        throw new AuthenticationException('User not found');
    }

    try {
        await dealService.deleteDeal(companyId, dealId, user._id.toString());
        winstonLogger.info(`Deal ${dealId} deleted for company: ${companyId} by user: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Deal deleted successfully',
        });
    } catch (error) {
        winstonLogger.error(`Error deleting deal: ${error}`);
        throw error;
    }
};

export const updateDealStatus = async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, dealId } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!user) {
        throw new AuthenticationException('User not found');
    }

    try {
        const updatedDeal = await dealService.updateDealStatus(companyId, dealId, user._id.toString(), status);
        winstonLogger.info(`Deal ${dealId} status updated to ${status} for company: ${companyId} by user: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Deal status updated successfully',
            data: updatedDeal,
        });
    } catch (error) {
        winstonLogger.error(`Error updating deal status: ${error}`);
        throw error;
    }
};
