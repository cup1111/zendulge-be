import BaseBuilder from './baseBuilder';
import Deal, { IDealDocument } from '../../../src/app/model/deal';

export default class DealBuilder extends BaseBuilder<IDealDocument> {
  constructor(defaultValues: boolean = true) {
    super(defaultValues);
    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    this.properties = {
      title: 'Test Deal',
      description: 'Test deal description',
      price: 90,
      originalPrice: 100,
      discount: 10,
      duration: 60,
      operatingSite: [], // Should be set with .withOperatingSite()
      startDate: now,
      endDate: future,
      maxBookings: 100,
      currentBookings: 0,
      status: 'active',
      images: [],
      tags: [],
      business: '', // Should be set with .withBusiness()
      service: '', // Should be set with .withService()
      createdBy: '', // Should be set with .withCreatedBy()
    };
  }

  withTitle(title: string): DealBuilder {
    this.properties.title = title;
    return this;
  }

  withDescription(description: string): DealBuilder {
    this.properties.description = description;
    return this;
  }

  withPrice(price: number): DealBuilder {
    this.properties.price = price;
    return this;
  }

  withOriginalPrice(originalPrice: number): DealBuilder {
    this.properties.originalPrice = originalPrice;
    return this;
  }

  withDiscount(discount: number): DealBuilder {
    this.properties.discount = discount;
    return this;
  }

  withDuration(duration: number): DealBuilder {
    this.properties.duration = duration;
    return this;
  }

  withOperatingSite(siteId: string | any): DealBuilder {
    if (!Array.isArray(this.properties.operatingSite)) {
      this.properties.operatingSite = [];
    }
    const id = typeof siteId === 'string' ? siteId : siteId.toString();
    if (!this.properties.operatingSite.includes(id)) {
      this.properties.operatingSite.push(id);
    }
    return this;
  }

  withOperatingSites(siteIds: (string | any)[]): DealBuilder {
    this.properties.operatingSite = siteIds.map(id => typeof id === 'string' ? id : id.toString());
    return this;
  }

  withStartDate(startDate: Date): DealBuilder {
    this.properties.startDate = startDate;
    return this;
  }

  withEndDate(endDate: Date): DealBuilder {
    this.properties.endDate = endDate;
    return this;
  }

  withMaxBookings(maxBookings: number): DealBuilder {
    this.properties.maxBookings = maxBookings;
    return this;
  }

  withCurrentBookings(currentBookings: number): DealBuilder {
    this.properties.currentBookings = currentBookings;
    return this;
  }

  withStatus(status: 'active' | 'inactive' | 'expired' | 'sold_out'): DealBuilder {
    this.properties.status = status;
    return this;
  }

  withActive(): DealBuilder {
    this.properties.status = 'active';
    return this;
  }

  withInactive(): DealBuilder {
    this.properties.status = 'inactive';
    return this;
  }

  withExpired(): DealBuilder {
    this.properties.status = 'expired';
    return this;
  }

  withSoldOut(): DealBuilder {
    this.properties.status = 'sold_out';
    return this;
  }

  withImages(images: string[]): DealBuilder {
    this.properties.images = images;
    return this;
  }

  withTags(tags: string[]): DealBuilder {
    this.properties.tags = tags;
    return this;
  }

  withBusiness(businessId: string | any): DealBuilder {
    this.properties.business = typeof businessId === 'string' ? businessId : businessId.toString();
    return this;
  }

  withService(serviceId: string | any): DealBuilder {
    this.properties.service = typeof serviceId === 'string' ? serviceId : serviceId.toString();
    return this;
  }

  withCreatedBy(userId: string | any): DealBuilder {
    this.properties.createdBy = typeof userId === 'string' ? userId : userId.toString();
    return this;
  }

  async save(): Promise<IDealDocument> {
    return super.save(Deal);
  }
}

