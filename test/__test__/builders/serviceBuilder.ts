import BaseBuilder from './baseBuilder';
import Service, { IServiceDocument } from '../../../src/app/model/service';

export default class ServiceBuilder extends BaseBuilder<IServiceDocument> {
  constructor(defaultValues: boolean = true) {
    super(defaultValues);
    this.properties = {
      name: 'Test Service',
      category: 'Wellness',
      duration: 60,
      basePrice: 100,
      description: 'Test service description',
      business: '', // Should be set with .withBusiness()
      status: 'active',
    };
  }

  withName(name: string): ServiceBuilder {
    this.properties.name = name;
    return this;
  }

  withCategory(category: string): ServiceBuilder {
    this.properties.category = category;
    return this;
  }

  withDuration(duration: number): ServiceBuilder {
    this.properties.duration = duration;
    return this;
  }

  withBasePrice(basePrice: number): ServiceBuilder {
    this.properties.basePrice = basePrice;
    return this;
  }

  withDescription(description: string): ServiceBuilder {
    this.properties.description = description;
    return this;
  }

  withBusiness(businessId: string | any): ServiceBuilder {
    this.properties.business = typeof businessId === 'string' ? businessId : businessId.toString();
    return this;
  }

  withStatus(status: 'active' | 'inactive'): ServiceBuilder {
    this.properties.status = status;
    return this;
  }

  withActive(): ServiceBuilder {
    this.properties.status = 'active';
    return this;
  }

  withInactive(): ServiceBuilder {
    this.properties.status = 'inactive';
    return this;
  }

  async save(): Promise<IServiceDocument> {
    return super.save(Service);
  }
}

