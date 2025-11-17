import request from 'supertest';
import app from '../setup/app';
import BusinessBuilder from './builders/businessBuilder';
import OperateSiteBuilder from './builders/operateSiteBuilder';
import UserBuilder from './builders/userBuilder';
import Role from '../../src/app/model/role';
import Service from '../../src/app/model/service';
import Category from '../../src/app/model/category';
import { RoleName } from '../../src/app/enum/roles';
import { BusinessStatus } from '../../src/app/enum/businessStatus';

describe('Deal CRUD operations', () => {
    let ownerUser: any;
    let business: any;
    let operateSite: any;
    let service: any;
    let category: any;
    let ownerToken: string;
    let ownerRole: any;

    async function loginAndGetToken(email: string, password: string) {
        const res = await request(app.getApp())
            .post('/api/v1/login')
            .send({ email, password });
        return res.body.data.accessToken;
    }

    beforeEach(async () => {
        ownerRole = await Role.findOne({ name: RoleName.OWNER });
        expect(ownerRole).toBeTruthy();

        ownerUser = await new UserBuilder()
            .withEmail('deal-crud-owner@example.com')
            .withPassword('OwnerCRUD123!')
            .withActive(true)
            .save();

        business = await new BusinessBuilder()
            .withOwner(ownerUser._id)
            .withContact(ownerUser._id)
            .withMember(ownerUser._id, ownerRole._id)
            .withActive()
            .save();

        operateSite = await new OperateSiteBuilder()
            .withBusiness(business._id)
            .withName('CRUD Test Site')
            .save();
        operateSite.members = [ownerUser._id];
        await operateSite.save();

        // Create a category
        category = await Category.create({
            name: 'Test Category',
            slug: 'test-category',
            icon: '🧪',
            isActive: true,
        });

        service = await Service.create({
            name: 'Test Service',
            category: 'Wellness',
            duration: 60,
            basePrice: 120,
            business: business._id.toString(),
            status: BusinessStatus.ACTIVE,
        });

        ownerToken = await loginAndGetToken('deal-crud-owner@example.com', 'OwnerCRUD123!');
    });

    describe('createDeal', () => {
        it('should create a deal and return all populated fields (category, service, operatingSite, createdBy)', async () => {
            const startDate = new Date();
            const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const response = await request(app.getApp())
                .post(`/api/v1/business/${business._id}/deals`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Test Deal',
                    description: 'Test Deal Description',
                    category: category.slug, // Use slug
                    price: 90,
                    originalPrice: 120,
                    duration: 60,
                    operatingSite: [operateSite._id.toString()],
                    service: service._id.toString(),
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    status: 'active',
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            const createdDeal = response.body.data;

            // Verify basic fields
            expect(createdDeal.title).toBe('Test Deal');
            expect(createdDeal.description).toBe('Test Deal Description');
            expect(createdDeal.price).toBe(90);
            expect(createdDeal.originalPrice).toBe(120);

            // Verify category is populated (should be an object, not just an ObjectId)
            expect(createdDeal.category).toBeDefined();
            expect(typeof createdDeal.category).toBe('object');
            expect(createdDeal.category).not.toBeNull();
            expect(createdDeal.category._id).toBeDefined();
            expect(createdDeal.category.name).toBe(category.name);
            expect(createdDeal.category.slug).toBe(category.slug);
            expect(createdDeal.category.icon).toBe(category.icon);

            // Verify service is populated
            expect(createdDeal.service).toBeDefined();
            expect(typeof createdDeal.service).toBe('object');
            expect(createdDeal.service).not.toBeNull();
            expect(createdDeal.service._id).toBeDefined();
            expect(createdDeal.service.name).toBe(service.name);
            expect(createdDeal.service.basePrice).toBe(service.basePrice);
            expect(createdDeal.service.duration).toBe(service.duration);

            // Verify operatingSite is populated (should be an array of objects)
            expect(createdDeal.operatingSite).toBeDefined();
            expect(Array.isArray(createdDeal.operatingSite)).toBe(true);
            expect(createdDeal.operatingSite.length).toBe(1);
            expect(typeof createdDeal.operatingSite[0]).toBe('object');
            expect(createdDeal.operatingSite[0]._id).toBeDefined();
            expect(createdDeal.operatingSite[0].name).toBe(operateSite.name);

            // Verify createdBy is populated
            expect(createdDeal.createdBy).toBeDefined();
            expect(typeof createdDeal.createdBy).toBe('object');
            expect(createdDeal.createdBy).not.toBeNull();
            expect(createdDeal.createdBy._id).toBeDefined();
            expect(createdDeal.createdBy.email).toBe(ownerUser.email);
        });

        it('should not throw an error when populating multiple fields', async () => {
            const startDate = new Date();
            const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const response = await request(app.getApp())
                .post(`/api/v1/business/${business._id}/deals`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Multi-Populate Deal',
                    description: 'Testing multiple populate calls',
                    category: category.slug,
                    price: 100,
                    duration: 60,
                    operatingSite: [operateSite._id.toString()],
                    service: service._id.toString(),
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    status: 'active',
                });

            // Should not throw "populate is not a function" error
            expect(response.status).not.toBe(500);
            expect(response.body.success).toBe(true);
            expect(response.body.error).toBeUndefined();
        });
    });

    describe('getDeals', () => {
        it('should return deals with all populated fields', async () => {
            // Create a deal first
            const startDate = new Date();
            const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const createResponse = await request(app.getApp())
                .post(`/api/v1/business/${business._id}/deals`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Listed Deal',
                    description: 'Deal to be listed',
                    category: category.slug,
                    price: 80,
                    duration: 60,
                    operatingSite: [operateSite._id.toString()],
                    service: service._id.toString(),
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    status: 'active',
                })
                .expect(201);

            const dealId = createResponse.body.data._id;

            // Now fetch all deals
            const listResponse = await request(app.getApp())
                .get(`/api/v1/business/${business._id}/deals`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(listResponse.body.success).toBe(true);
            expect(Array.isArray(listResponse.body.data)).toBe(true);
            expect(listResponse.body.data.length).toBeGreaterThan(0);

            const foundDeal = listResponse.body.data.find((d: any) => d._id === dealId);
            expect(foundDeal).toBeDefined();

            // Verify all fields are populated
            expect(foundDeal.category).toBeDefined();
            expect(typeof foundDeal.category).toBe('object');
            expect(foundDeal.category.name).toBe(category.name);

            expect(foundDeal.service).toBeDefined();
            expect(typeof foundDeal.service).toBe('object');
            expect(foundDeal.service.name).toBe(service.name);

            expect(foundDeal.operatingSite).toBeDefined();
            expect(Array.isArray(foundDeal.operatingSite)).toBe(true);
            expect(foundDeal.operatingSite[0].name).toBe(operateSite.name);

            expect(foundDeal.createdBy).toBeDefined();
            expect(typeof foundDeal.createdBy).toBe('object');
            expect(foundDeal.createdBy.email).toBe(ownerUser.email);
        });
    });
});

