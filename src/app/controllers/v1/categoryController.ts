import { Request, Response } from 'express';
import { winstonLogger } from '../../../loaders/logger';
import categoryService from '../../services/categoryService';

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Get all categories (public endpoint for home page)
 */
export const getAllCategories = async (req: Request, res: Response) => {
  const { includeInactive } = req.query;
  const include = includeInactive === 'true';

  try {
    const categories = await categoryService.getAllCategories(include);

    winstonLogger.info(`Categories retrieved successfully (includeInactive: ${include})`);

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
    });
  } catch (error) {
    winstonLogger.error(`Error retrieving categories: ${error}`);
    throw error;
  }
};

/**
 * Get a single category by ID
 */
export const getCategoryById = async (req: AuthenticatedRequest, res: Response) => {
  const { categoryId } = req.params;

  try {
    const category = await categoryService.getCategoryById(categoryId);

    winstonLogger.info(`Category retrieved successfully: ${categoryId}`);

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category,
    });
  } catch (error) {
    winstonLogger.error(`Error retrieving category: ${error}`);
    throw error;
  }
};

/**
 * Get a single category by slug
 */
export const getCategoryBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const category = await categoryService.getCategoryBySlug(slug);

    winstonLogger.info(`Category retrieved successfully by slug: ${slug}`);

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category,
    });
  } catch (error) {
    winstonLogger.error(`Error retrieving category by slug: ${error}`);
    throw error;
  }
};

/**
 * Create a new category (admin only - authenticated)
 */
export const createCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = await categoryService.createCategory(req.body);

    winstonLogger.info(`Category created successfully: ${category._id}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    winstonLogger.error(`Error creating category: ${error}`);
    throw error;
  }
};

/**
 * Update a category (admin only - authenticated)
 */
export const updateCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { categoryId } = req.params;

  try {
    const category = await categoryService.updateCategory(categoryId, req.body);

    winstonLogger.info(`Category updated successfully: ${categoryId}`);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    winstonLogger.error(`Error updating category: ${error}`);
    throw error;
  }
};

/**
 * Delete a category (admin only - authenticated)
 */
export const deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { categoryId } = req.params;

  try {
    await categoryService.deleteCategory(categoryId);

    winstonLogger.info(`Category deleted successfully: ${categoryId}`);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: null,
    });
  } catch (error) {
    winstonLogger.error(`Error deleting category: ${error}`);
    throw error;
  }
};

/**
 * Deactivate a category (admin only - authenticated)
 */
export const deactivateCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { categoryId } = req.params;

  try {
    const category = await categoryService.deactivateCategory(categoryId);

    winstonLogger.info(`Category deactivated successfully: ${categoryId}`);

    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully',
      data: category,
    });
  } catch (error) {
    winstonLogger.error(`Error deactivating category: ${error}`);
    throw error;
  }
};

/**
 * Activate a category (admin only - authenticated)
 */
export const activateCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { categoryId } = req.params;

  try {
    const category = await categoryService.activateCategory(categoryId);

    winstonLogger.info(`Category activated successfully: ${categoryId}`);

    res.status(200).json({
      success: true,
      message: 'Category activated successfully',
      data: category,
    });
  } catch (error) {
    winstonLogger.error(`Error activating category: ${error}`);
    throw error;
  }
};

export default {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  deactivateCategory,
  activateCategory,
};

