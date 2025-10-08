import BaseBuilder from './baseBuilder';
import Company from '../../../src/app/model/company';

export default class CompanyBuilder extends BaseBuilder {
  constructor(defaultValues = true) {
    super(defaultValues, false); // Companies typically don't have tenant
    this.properties = {
      name: 'Test Company',
      description: 'A test company for testing purposes',
      website: 'https://testcompany.com',
      isActive: true,
    };
  }

  withName(name) {
    this.properties.name = name;
    return this;
  }

  withDescription(description) {
    this.properties.description = description;
    return this;
  }

  withWebsite(website) {
    this.properties.website = website;
    return this;
  }

  withOwner(ownerId) {
    this.properties.owner = ownerId;
    return this;
  }

  withInactive() {
    this.properties.isActive = false;
    return this;
  }

  withActive() {
    this.properties.isActive = true;
    return this;
  }

  build() {
    return this.properties;
  }

  async buildDefault() {
    return {};
  }

  async save() {
    return super.save(Company);
  }
}
