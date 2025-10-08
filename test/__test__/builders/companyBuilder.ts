import BaseBuilder from './baseBuilder';
import Company, { ICompanyDocument } from '../../../src/app/model/company';

export default class CompanyBuilder extends BaseBuilder<ICompanyDocument> {
  constructor(defaultValues: boolean = true) {
    super(defaultValues);
    this.properties = {
      name: 'Test Company',
      description: 'A test company for testing purposes',
      website: 'https://testcompany.com',
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

  withWebsite(website: string): CompanyBuilder {
    this.properties.website = website;
    return this;
  }

  withOwner(ownerId: any): CompanyBuilder {
    this.properties.owner = ownerId;
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
