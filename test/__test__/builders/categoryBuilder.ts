import BaseBuilder from './baseBuilder';
import Category, { ICategoryDocument } from '../../../src/app/model/category';

export default class CategoryBuilder extends BaseBuilder<ICategoryDocument> {
  constructor(defaultValues: boolean = true) {
    super(defaultValues);
    this.properties = {
      name: 'Test Category',
      slug: 'test-category',
      icon: '🧪',
      isActive: true,
    };
  }

  withName(name: string): CategoryBuilder {
    this.properties.name = name;
    // Auto-generate slug from name if not explicitly set
    if (!this.properties.slug || this.properties.slug === 'test-category') {
      this.properties.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
    }
    return this;
  }

  withSlug(slug: string): CategoryBuilder {
    this.properties.slug = slug;
    return this;
  }

  withIcon(icon: string): CategoryBuilder {
    this.properties.icon = icon;
    return this;
  }

  withActive(isActive: boolean = true): CategoryBuilder {
    this.properties.isActive = isActive;
    return this;
  }

  withInactive(): CategoryBuilder {
    this.properties.isActive = false;
    return this;
  }

  async save(): Promise<ICategoryDocument> {
    return super.save(Category);
  }
}

