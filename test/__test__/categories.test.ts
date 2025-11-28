import request from 'supertest';
import app from '../setup/app';
import Category from '../../src/app/model/category';
import UserBuilder from './builders/userBuilder';
import CategoryBuilder from './builders/categoryBuilder';
import Role from '../../src/app/model/role';
import { RoleName } from '../../src/app/enum/roles';

describe('Categories API', () => {
  let authToken: string;
  let user: any;

  beforeEach(async () => {
    // Create a user for authentication
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    expect(ownerRole).toBeTruthy();

    user = await new UserBuilder()
      .withEmail('category-test@example.com')
      .withPassword('TestPass123!')
      .withActive(true)
      .save();

    // Login to get auth token
    const loginResponse = await request(app.getApp())
      .post('/api/v1/login')
      .send({
        email: 'category-test@example.com',
        password: 'TestPass123!',
      });

    expect(loginResponse.status).toBe(200);
    // Auth controller returns accessToken under data.accessToken
    authToken = loginResponse.body.data.accessToken;
  });

  afterEach(async () => {
    // Clean up categories after each test
    await Category.deleteMany({});
  });

  describe('GET /api/v1/public/categories', () => {
    it('should return all active categories', async () => {
      // Seed some categories
      await new CategoryBuilder()
        .withName('Massage')
        .withSlug('massage')
        .withIcon('💆')
        .withActive(true)
        .save();

      await new CategoryBuilder()
        .withName('Beauty')
        .withSlug('beauty')
        .withIcon('💅')
        .withActive(true)
        .save();

      await new CategoryBuilder()
        .withName('Spa')
        .withSlug('spa')
        .withIcon('🛁')
        .withActive(true)
        .save();

      const response = await request(app.getApp())
        .get('/api/v1/public/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('slug');
      expect(response.body.data[0]).toHaveProperty('icon');
      expect(response.body.data[0].isActive).toBe(true);
    });

    it('should not return inactive categories by default', async () => {
      await new CategoryBuilder()
        .withName('Active Category')
        .withSlug('active')
        .withIcon('✅')
        .withActive(true)
        .save();

      await new CategoryBuilder()
        .withName('Inactive Category')
        .withSlug('inactive')
        .withIcon('❌')
        .withInactive()
        .save();

      const response = await request(app.getApp())
        .get('/api/v1/public/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].slug).toBe('active');
    });

    it('should return all categories including inactive when includeInactive=true', async () => {
      await new CategoryBuilder()
        .withName('Active Category')
        .withSlug('active')
        .withIcon('✅')
        .withActive(true)
        .save();

      await new CategoryBuilder()
        .withName('Inactive Category')
        .withSlug('inactive')
        .withIcon('❌')
        .withInactive()
        .save();

      const response = await request(app.getApp())
        .get('/api/v1/public/categories?includeInactive=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array if no categories exist', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/public/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/v1/categories', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: 'Fitness',
        slug: 'fitness',
        icon: '🏃',
        isActive: true,
      };

      const response = await request(app.getApp())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(categoryData.name);
      expect(response.body.data.slug).toBe(categoryData.slug);
      expect(response.body.data.icon).toBe(categoryData.icon);

      // Verify it was saved to the database
      const savedCategory = await Category.findOne({ slug: 'fitness' });
      expect(savedCategory).toBeTruthy();
      expect(savedCategory?.name).toBe(categoryData.name);
    });

    it('should auto-generate slug from name if not provided', async () => {
      const categoryData = {
        name: 'Hair Salon',
        icon: '💇',
      };

      const response = await request(app.getApp())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('hair-salon');
    });

    it('should return 400 if name is missing', async () => {
      const categoryData = {
        icon: '💇',
      };

      const response = await request(app.getApp())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if icon is missing', async () => {
      const categoryData = {
        name: 'Test Category',
      };

      const response = await request(app.getApp())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(422);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 if category with same slug already exists', async () => {
      await Category.create({
        name: 'Existing Category',
        slug: 'existing',
        icon: '✅',
        isActive: true,
      });

      const categoryData = {
        name: 'New Category',
        slug: 'existing', // Same slug
        icon: '💇',
      };

      const response = await request(app.getApp())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 if not authenticated', async () => {
      const categoryData = {
        name: 'Test Category',
        slug: 'test',
        icon: '💇',
      };

      const response = await request(app.getApp())
        .post('/api/v1/categories')
        .send(categoryData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/categories/:categoryId', () => {
    it('should return a category by ID', async () => {
      const category = await new CategoryBuilder()
        .withName('Test Category')
        .withSlug('test')
        .withIcon('💇')
        .withActive(true)
        .save();

      const response = await request(app.getApp())
        .get(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(category._id.toString());
      expect(response.body.data.name).toBe('Test Category');
    });

    it('should return 404 if category not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app.getApp())
        .get(`/api/v1/categories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/categories/slug/:slug', () => {
    it('should return a category by slug', async () => {
      await new CategoryBuilder()
        .withName('Test Category')
        .withSlug('test-category')
        .withIcon('💇')
        .withActive(true)
        .save();

      const response = await request(app.getApp())
        .get('/api/v1/categories/slug/test-category')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('test-category');
      expect(response.body.data.name).toBe('Test Category');
    });

    it('should return 404 if category slug not found', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/categories/slug/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not return inactive categories', async () => {
      await new CategoryBuilder()
        .withName('Inactive Category')
        .withSlug('inactive')
        .withIcon('❌')
        .withInactive()
        .save();

      const response = await request(app.getApp())
        .get('/api/v1/categories/slug/inactive')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/categories/:categoryId', () => {
    it('should update a category', async () => {
      const category = await new CategoryBuilder()
        .withName('Original Name')
        .withSlug('original')
        .withIcon('💇')
        .withActive(true)
        .save();

      const updateData = {
        name: 'Updated Name',
        icon: '✅',
      };

      const response = await request(app.getApp())
        .patch(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.icon).toBe('✅');
      expect(response.body.data.slug).toBe('updated-name'); // Slug auto-updates from name when slug not provided

      // Verify it was updated in the database
      const updatedCategory = await Category.findById(category._id);
      expect(updatedCategory?.name).toBe('Updated Name');
    });

    it('should auto-update slug if name is updated without slug', async () => {
      const category = await new CategoryBuilder()
        .withName('Original Name')
        .withSlug('original')
        .withIcon('💇')
        .withActive(true)
        .save();

      const updateData = {
        name: 'New Category Name',
      };

      const response = await request(app.getApp())
        .patch(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('new-category-name');
    });

    it('should return 409 if updated slug conflicts with existing category', async () => {
      await new CategoryBuilder()
        .withName('Existing Category')
        .withSlug('existing')
        .withIcon('✅')
        .withActive(true)
        .save();

      const category = await new CategoryBuilder()
        .withName('Another Category')
        .withSlug('another')
        .withIcon('💇')
        .withActive(true)
        .save();

      const updateData = {
        slug: 'existing', // Conflict with existing category
      };

      const response = await request(app.getApp())
        .patch(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if category not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app.getApp())
        .patch(`/api/v1/categories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/categories/:categoryId/deactivate', () => {
    it('should deactivate a category', async () => {
      const category = await new CategoryBuilder()
        .withName('Active Category')
        .withSlug('active')
        .withIcon('✅')
        .withActive(true)
        .save();

      const response = await request(app.getApp())
        .patch(`/api/v1/categories/${category._id}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);

      // Verify it was deactivated in the database
      const updatedCategory = await Category.findById(category._id);
      expect(updatedCategory?.isActive).toBe(false);
    });

    it('should return 404 if category not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app.getApp())
        .patch(`/api/v1/categories/${fakeId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/categories/:categoryId/activate', () => {
    it('should activate a category', async () => {
      const category = await new CategoryBuilder()
        .withName('Inactive Category')
        .withSlug('inactive')
        .withIcon('❌')
        .withInactive()
        .save();

      const response = await request(app.getApp())
        .patch(`/api/v1/categories/${category._id}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);

      // Verify it was activated in the database
      const updatedCategory = await Category.findById(category._id);
      expect(updatedCategory?.isActive).toBe(true);
    });

    it('should return 404 if category not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app.getApp())
        .patch(`/api/v1/categories/${fakeId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/categories/:categoryId', () => {
    it('should delete a category', async () => {
      const category = await new CategoryBuilder()
        .withName('To Delete')
        .withSlug('to-delete')
        .withIcon('🗑️')
        .withActive(true)
        .save();

      const response = await request(app.getApp())
        .delete(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify it was deleted from the database
      const deletedCategory = await Category.findById(category._id);
      expect(deletedCategory).toBeNull();
    });

    it('should return 404 if category not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app.getApp())
        .delete(`/api/v1/categories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

