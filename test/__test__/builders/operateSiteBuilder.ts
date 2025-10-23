import BaseBuilder from './baseBuilder';
import OperateSite, { IOperateSiteDocument } from '../../../src/app/model/operateSite';
import mongoose from 'mongoose';

export default class OperateSiteBuilder extends BaseBuilder<IOperateSiteDocument> {
  constructor(defaultValues: boolean = true) {
    super(defaultValues);
    this.properties = {
      name: 'Test Operate Site',
      address: '123 Test Lane',
      phoneNumber: '+1234567890',
      emailAddress: 'site@example.com',
      operatingHours: {
        monday: { open: '09:00', close: '17:00', isClosed: false },
        tuesday: { open: '09:00', close: '17:00', isClosed: false },
        wednesday: { open: '09:00', close: '17:00', isClosed: false },
        thursday: { open: '09:00', close: '17:00', isClosed: false },
        friday: { open: '09:00', close: '17:00', isClosed: false },
        saturday: { open: '09:00', close: '17:00', isClosed: false },
        sunday: { open: '09:00', close: '17:00', isClosed: false },
      },
      specialInstruction: '',
      company: new mongoose.Types.ObjectId(), // Should be set with .withCompany()
      latitude: 0,
      longitude: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  withCompany(companyId: any): OperateSiteBuilder {
    this.properties.company = companyId;
    return this;
  }

  withName(name: string): OperateSiteBuilder {
    this.properties.name = name;
    return this;
  }

  build(): any {
    return this.properties;
  }

  async buildDefault(): Promise<any> {
    return {};
  }

  async save(): Promise<IOperateSiteDocument> {
    return super.save(OperateSite);
  }
}
