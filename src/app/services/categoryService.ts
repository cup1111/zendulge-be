import Category from '../model/category';
import { NotFoundException, ConflictException } from '../exceptions';

const getAllCategories = async (includeInactive = false) => {
  const query = includeInactive ? {} : { isActive: true };
  const categories = await Category.find(query).sort({ name: 1 }).lean();
  return categories;
};

const getCategoryById = async (categoryId: string) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundException('Category not found');
  }
  return category;
};

const getCategoryBySlug = async (slug: string) => {
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) {
    throw new NotFoundException('Category not found');
  }
  return category;
};

const createCategory = async (categoryData: {
  name: string;
  slug?: string;
  icon: string;
  isActive?: boolean;
}) => {
  // Generate slug from name if not provided
  const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-');

  // Check if slug already exists
  const existingCategory = await Category.findOne({
    $or: [{ slug }, { name: new RegExp(`^${categoryData.name}$`, 'i') }],
  });

  if (existingCategory) {
    throw new ConflictException('Category with this name or slug already exists');
  }

  const category = new Category({
    name: categoryData.name,
    slug,
    icon: categoryData.icon,
    isActive: categoryData.isActive ?? true,
  });

  await category.save();
  return category;
};

const updateCategory = async (categoryId: string, updateData: {
  name?: string;
  slug?: string;
  icon?: string;
  isActive?: boolean;
}) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundException('Category not found');
  }

  // If slug or name is being updated, check for conflicts
  if (updateData.slug || updateData.name) {
    const newSlug = updateData.slug || (updateData.name ? updateData.name.toLowerCase().replace(/\s+/g, '-') : category.slug);
    const existingCategory = await Category.findOne({
      _id: { $ne: categoryId },
      $or: [
        { slug: newSlug },
        { name: updateData.name ? new RegExp(`^${updateData.name}$`, 'i') : null },
      ].filter(Boolean),
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name or slug already exists');
    }

    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name.toLowerCase().replace(/\s+/g, '-');
    }
  }

  const allowedFields = {
    name: updateData.name,
    slug: updateData.slug,
    icon: updateData.icon,
    isActive: updateData.isActive,
  };

  // Remove undefined values
  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([, value]) => value !== undefined),
  );

  category.set(filteredData);
  await category.save();
  return category;
};

const deleteCategory = async (categoryId: string) => {
  const category = await Category.findByIdAndDelete(categoryId);
  if (!category) {
    throw new NotFoundException('Category not found');
  }
  return category;
};

const deactivateCategory = async (categoryId: string) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundException('Category not found');
  }

  category.isActive = false;
  await category.save();
  return category;
};

const activateCategory = async (categoryId: string) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundException('Category not found');
  }

  category.isActive = true;
  await category.save();
  return category;
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

