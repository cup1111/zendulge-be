import mongoose from 'mongoose';

/**
 * Validates category filter and returns category name
 * Returns undefined if category is not provided or not found
 */
export const validateCategoryFilter = async (category?: string): Promise<string | undefined> => {
  if (!category) {
    return undefined;
  }

  const Category = mongoose.model('categories');
  const categoryDoc = await Category.findOne({ slug: category, isActive: true }).lean();

  if (!categoryDoc || typeof categoryDoc !== 'object' || !('name' in categoryDoc)) {
    // If category slug not found or inactive, return undefined to signal empty results
    return undefined;
  }

  // service.category stores the category NAME, not the slug
  return categoryDoc.name as string;
};

