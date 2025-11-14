import request from 'supertest';

import app from '../setup/app';
import BusinessBuilder from './builders/businessBuilder';
import OperateSiteBuilder from './builders/operateSiteBuilder';
import UserBuilder from './builders/userBuilder';
import Deal from '../../src/app/model/deal';
import Role from '../../src/app/model/role';
import Service from '../../src/app/model/service';
import { RoleName } from '../../src/app/enum/roles';

let ownerUser: any;
let business: any;
let operateSite: any;
let ownerRole: any;
let ownerToken: string;

async function loginAndGetToken(email: string, password: string) {
    const res = await request(app.getApp())
        .post('/api/v1/login')
        .send({ email, password });
    return res.body.data.accessToken;
}

describe('Service safeguards', () => {
    beforeEach(async () => {
        ownerRole = await Role.findOne({ name: RoleName.OWNER });

        ownerUser = await new UserBuilder()
            .withEmail('owner-service@example.com')
            .withPassword('OwnerServicePass123')
            .withActive(true)
            .save();

        business = await new BusinessBuilder()
            .withOwner(ownerUser._id)
            .withContact(ownerUser._id)
            .withMember(ownerUser._id, ownerRole?._id)
            .withName('Service Safeguard Co.')
            .save();

        operateSite = await new OperateSiteBuilder()
            .withCompany(business._id)
            .withName('Service Safeguard Site')
            .save();

        operateSite.members = [ownerUser._id];
        await operateSite.save();

        ownerToken = await loginAndGetToken(
            'owner-service@example.com',
            'OwnerServicePass123',
        );
    });

    it('allows the owner to delete a service without related deals', async () => {
        const service = await Service.create({
            name: 'Standalone Cleaning',
            category: 'Cleaning',
            duration: 60,
            basePrice: 150,
            description: 'General cleaning service',
            company: business._id.toString(),
            status: 'active',
        });

        const response = await request(app.getApp())
            .delete(`/api/v1/business/${business._id}/services/${service._id}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Service deleted successfully');
        const deletedService = await Service.findById(service._id);
        expect(deletedService).toBeNull();
    });

    it('prevents deleting a service when deals reference it', async () => {
        const service = await Service.create({
            name: 'Linked Post-Construction',
            category: 'Specialized',
            duration: 120,
            basePrice: 400,
            description: 'Post-construction cleanup',
            company: business._id.toString(),
            status: 'active',
        });

        await Deal.create({
            title: 'Construction Cleanup Promo',
            description:
                'Limited-time post-construction cleaning offer for new developments.',
            category: 'Specialized',
            price: 350,
            originalPrice: 450,
            duration: 120,
            operatingSite: [operateSite._id.toString()],
            startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            currentBookings: 0,
            status: 'active',
            company: business._id.toString(),
            service: service._id.toString(),
            createdBy: ownerUser._id.toString(),
        });

        const response = await request(app.getApp())
            .delete(`/api/v1/business/${business._id}/services/${service._id}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain(
            'This service is in use by existing deals. Please update or remove those deals before deleting it.',
        );
        const persistedService = await Service.findById(service._id);
        expect(persistedService).not.toBeNull();
    });

    it('prevents deactivating a service when active deals reference it', async () => {
        const service = await Service.create({
            name: 'High Demand Cleaning',
            category: 'Cleaning',
            duration: 90,
            basePrice: 220,
            description: 'Premium cleaning package',
            company: business._id.toString(),
            status: 'active',
        });

        await Deal.create({
            title: 'High Demand Cleaning Promo',
            description: 'Seasonal promotion for the premium package.',
            category: 'Cleaning',
            price: 200,
            originalPrice: 260,
            duration: 90,
            operatingSite: [operateSite._id.toString()],
            startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            currentBookings: 0,
            status: 'active',
            company: business._id.toString(),
            service: service._id.toString(),
            createdBy: ownerUser._id.toString(),
        });

        const response = await request(app.getApp())
            .patch(`/api/v1/business/${business._id}/services/${service._id}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                status: 'inactive',
            })
            .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain(
            'This service cannot be deactivated while active deals reference it. Please deactivate or update those deals first.',
        );

        const persistedService = await Service.findById(service._id);
        expect(persistedService?.status).toBe('active');
    });

    it('allows deactivating a service when no active deals reference it', async () => {
        const service = await Service.create({
            name: 'Seasonal Landscaping',
            category: 'Maintenance',
            duration: 180,
            basePrice: 500,
            description: 'Landscaping service for commercial sites',
            company: business._id.toString(),
            status: 'active',
        });

        const response = await request(app.getApp())
            .patch(`/api/v1/business/${business._id}/services/${service._id}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                status: 'inactive',
            })
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('inactive');

        const persistedService = await Service.findById(service._id);
        expect(persistedService?.status).toBe('inactive');
    });
});

