import { Response } from 'express';
import { winstonLogger } from '../../../loaders/logger';
import { AuthenticationException } from '../../exceptions';
import dealService from '../../services/dealService';
import { AuthenticatedRequest } from './authController';

export const getDeals = async (req: AuthenticatedRequest, res: Response) => {
  const { businessId } = req.params;
  const user = req.user;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const deals = await dealService.getDealsByBusiness(businessId, user._id.toString());
    winstonLogger.info(`Deals retrieved for business: ${businessId} by user: ${user.email}`);
    
    // Remove endDate from all deals in response
    const dealsWithoutEndDate = deals.map(deal => {
      const dealObj = deal.toObject ? deal.toObject() : deal;
      delete dealObj.endDate;
      return dealObj;
    });
    
    res.status(200).json({
      success: true,
      message: 'Deals retrieved successfully',
      data: dealsWithoutEndDate,
    });
  } catch (error) {
    winstonLogger.error(`Error retrieving deals: ${error}`);
    throw error;
  }
};

export const getDealById = async (req: AuthenticatedRequest, res: Response) => {
  const { businessId, dealId } = req.params;
  const user = req.user;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const deal = await dealService.getDealById(businessId, dealId, user._id.toString());
    winstonLogger.info(`Deal ${dealId} retrieved for business: ${businessId} by user: ${user.email}`);
    
    // Remove endDate from response - convert to plain object and delete endDate
    const dealObj = deal.toObject ? deal.toObject() : deal;
    delete dealObj.endDate;
    
    res.status(200).json({
      success: true,
      message: 'Deal retrieved successfully',
      data: dealObj,
    });
  } catch (error) {
    winstonLogger.error(`Error retrieving deal: ${error}`);
    throw error;
  }
};

export const createDeal = async (req: AuthenticatedRequest, res: Response) => {
  const { businessId } = req.params;
  const user = req.user;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const newDeal = await dealService.createDeal(businessId, user._id.toString(), req.body);
    winstonLogger.info(`Deal created for business: ${businessId} by user: ${user.email}`);
    
    // Remove endDate from response
    const dealObj = newDeal.toObject ? newDeal.toObject() : newDeal;
    delete dealObj.endDate;
    
    res.status(201).json({
      success: true,
      message: 'Deal created successfully',
      data: dealObj,
    });
  } catch (error) {
    winstonLogger.error(`Error creating deal: ${error}`);
    throw error;
  }
};

export const updateDeal = async (req: AuthenticatedRequest, res: Response) => {
  const { businessId, dealId } = req.params;
  const user = req.user;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const updatedDeal = await dealService.updateDeal(businessId, dealId, user._id.toString(), req.body);
    winstonLogger.info(`Deal ${dealId} updated for business: ${businessId} by user: ${user.email}`);
    
    // Remove endDate from response
    const dealObj = updatedDeal.toObject ? updatedDeal.toObject() : updatedDeal;
    delete dealObj.endDate;
    
    res.status(200).json({
      success: true,
      message: 'Deal updated successfully',
      data: dealObj,
    });
  } catch (error) {
    winstonLogger.error(`Error updating deal: ${error}`);
    throw error;
  }
};

export const deleteDeal = async (req: AuthenticatedRequest, res: Response) => {
  const { businessId, dealId } = req.params;
  const user = req.user;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    await dealService.deleteDeal(businessId, dealId, user._id.toString());
    winstonLogger.info(`Deal ${dealId} deleted for business: ${businessId} by user: ${user.email}`);
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
  const { businessId, dealId } = req.params;
  const { status } = req.body;
  const user = req.user;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const updatedDeal = await dealService.updateDealStatus(businessId, dealId, user._id.toString(), status);
    winstonLogger.info(`Deal ${dealId} status updated to ${status} for business: ${businessId} by user: ${user.email}`);
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
