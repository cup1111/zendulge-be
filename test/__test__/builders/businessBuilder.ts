import BaseBuilder from './baseBuilder';
import Business, { IBusinessDocument } from '../../../src/app/model/business';
import { BusinessStatus } from '../../../src/app/enum/businessStatus';

export default class BusinessBuilder extends BaseBuilder<IBusinessDocument> {
    constructor(defaultValues: boolean = true) {
        super(defaultValues);
        this.properties = {
            name: 'Test Business',
            email: 'test@business.com',
            description: 'A test business for testing purposes',
            categories: ['Beauty & Wellness'],
            businessAddress: {
                street: '123 Test Street',
                city: 'Melbourne',
                state: 'VIC',
                postcode: '3000',
                country: 'Australia',
            },
            contact: null,
            website: 'https://testbusiness.com',
            facebookUrl: 'https://facebook.com/testbusiness',
            twitterUrl: 'https://twitter.com/testbusiness',
            logo: 'https://testbusiness.com/logo.png',
            owner: null,
            status: BusinessStatus.ACTIVE,
        };
    }

    withName(name: string): BusinessBuilder {
        this.properties.name = name;
        return this;
    }

    withDescription(description: string): BusinessBuilder {
        this.properties.description = description;
        return this;
    }

    withEmail(email: string): BusinessBuilder {
        this.properties.email = email;
        return this;
    }

    withCategories(categories: string[]): BusinessBuilder {
        this.properties.categories = categories;
        return this;
    }

    withBusinessAddress(address: any): BusinessBuilder {
        this.properties.businessAddress = { ...this.properties.businessAddress, ...address };
        return this;
    }

    withContact(contactId: any): BusinessBuilder {
        this.properties.contact = contactId;
        return this;
    }

    withAbn(abn: string): BusinessBuilder {
        this.properties.abn = abn;
        return this;
    }

    withWebsite(website: string): BusinessBuilder {
        this.properties.website = website;
        return this;
    }

    withFacebookUrl(facebookUrl: string): BusinessBuilder {
        this.properties.facebookUrl = facebookUrl;
        return this;
    }

    withTwitterUrl(twitterUrl: string): BusinessBuilder {
        this.properties.twitterUrl = twitterUrl;
        return this;
    }

    withLogo(logo: string): BusinessBuilder {
        this.properties.logo = logo;
        return this;
    }

    withOwner(ownerId: any): BusinessBuilder {
        this.properties.owner = ownerId;
        this.properties.contact = ownerId; // Default contact to owner
        return this;
    }

    withMember(userId: any, roleId: any): BusinessBuilder {
        if (!this.properties.members) {
            this.properties.members = [];
        }
        this.properties.members.push({ user: userId, role: roleId, joinedAt: new Date() });
        return this;
    }

    withCustomers(customerIds: any[]): BusinessBuilder {
        this.properties.customers = customerIds;
        return this;
    }

    withStatus(status: BusinessStatus): BusinessBuilder {
        this.properties.status = status;
        return this;
    }

    withPending(): BusinessBuilder {
        this.properties.status = BusinessStatus.PENDING;
        return this;
    }

    withDisabled(): BusinessBuilder {
        this.properties.status = BusinessStatus.DISABLED;
        return this;
    }

    withActive(): BusinessBuilder {
        this.properties.status = BusinessStatus.ACTIVE;
        return this;
    }

    // Deprecated: use withStatus(BusinessStatus.PENDING) or withDisabled() instead
    withInactive(): BusinessBuilder {
        this.properties.status = BusinessStatus.DISABLED;
        return this;
    }

    withOperatingHours(operatingHours: any): BusinessBuilder {
        this.properties.operatingHours = operatingHours;
        return this;
    }

    async save(): Promise<IBusinessDocument> {
        return super.save(Business);
    }
}

