import Service, { IServiceDocument } from '../model/service';
import { Types } from 'mongoose';

export class ServiceService {
  // Create a new service
  async createService(data: {
    name: string;
    category: string;
    duration: number;
    basePrice: number;
    description?: string;
  }): Promise<IServiceDocument> {
    const service = new Service(data);
    return service.save();
  }

  // Get all services
  async getAllServices(): Promise<IServiceDocument[]> {
    return Service.find().sort({ createdAt: -1 });
  }

  // Get a service by ID
  async getServiceById(id: string): Promise<IServiceDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Service.findById(id);
  }

  // Update a service by ID
  async updateService(id: string, data: Partial<IServiceDocument>): Promise<IServiceDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Service.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  // Delete a service by ID
  async deleteService(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await Service.findByIdAndDelete(id);
    return !!result;
  }
}

export const serviceService = new ServiceService();