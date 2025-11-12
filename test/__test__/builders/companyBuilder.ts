import BaseBuilder from './baseBuilder';
import Company, { ICompanyDocument } from '../../../src/app/model/company';

export default class CompanyBuilder extends BaseBuilder<ICompanyDocument> {
  constructor(defaultValues: boolean = true) {
    super(defaultValues);
    this.properties = {
      name: 'Test Company',
      email: 'test@company.com',
      description: 'A test company for testing purposes',
      categories: ['Beauty & Wellness'],
      businessAddress: {
        street: '123 Test Street',
        city: 'Melbourne',
        state: 'VIC',
        postcode: '3000',
        country: 'Australia',
      },
      contact: null, // Will be set when needed
      abn: '51824753556', // Valid ABN for testing
      website: 'https://testcompany.com',
      facebookUrl: 'https://facebook.com/testcompany',
      twitterUrl: 'https://twitter.com/testcompany',
      logo: 'https://example.com/logo.png',
      isActive: true,
    };
  }

  withName(name: string): CompanyBuilder {
    this.properties.name = name;
    return this;
  }

  withDescription(description: string): CompanyBuilder {
    this.properties.description = description;
    return this;
  }

  withEmail(email: string): CompanyBuilder {
    this.properties.email = email;
    return this;
  }

  withCategories(categories: string[]): CompanyBuilder {
    this.properties.categories = categories;
    return this;
  }

  withBusinessAddress(address: any): CompanyBuilder {
    this.properties.businessAddress = address;
    return this;
  }

  withContact(contactId: any): CompanyBuilder {
    this.properties.contact = contactId;
    return this;
  }

  withAbn(abn: string): CompanyBuilder {
    this.properties.abn = abn;
    return this;
  }

  withWebsite(website: string): CompanyBuilder {
    this.properties.website = website;
    return this;
  }

  withFacebookUrl(facebookUrl: string): CompanyBuilder {
    this.properties.facebookUrl = facebookUrl;
    return this;
  }

  withTwitterUrl(twitterUrl: string): CompanyBuilder {
    this.properties.twitterUrl = twitterUrl;
    return this;
  }

  withLogo(logo: string): CompanyBuilder {
    this.properties.logo = logo;
    return this;
  }

  withOwner(ownerId: any): CompanyBuilder {
    this.properties.owner = ownerId;
    return this;
  }

  withMember(userId: any, roleId: any): CompanyBuilder {
    if (!this.properties.members) {
      this.properties.members = [];
    }
    this.properties.members.push({ user: userId, role: roleId });
    return this;
  }

  withInactive(): CompanyBuilder {
    this.properties.isActive = false;
    return this;
  }

  withActive(): CompanyBuilder {
    this.properties.isActive = true;
    return this;
  }

  build(): any {
    return this.properties;
  }

  async buildDefault(): Promise<any> {
    return {};
  }

  async save(): Promise<ICompanyDocument> {
    return super.save(Company);
  }
}
