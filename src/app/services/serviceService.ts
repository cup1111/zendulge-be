import Service from '../model/service';
import Business from '../model/business';
import Deal from '../model/deal';
import { ConflictException } from '../exceptions';

const getServicesByBusiness = async (businessId: string, userId: string) => {
  // Verify user has access to the business
  const business = await Business.findOne({
    _id: businessId,
    $or: [
      { owner: userId },
      { 'members.user': userId },
    ],
  });

  if (!business) {
    throw new Error('Business not found or access denied');
  }

  // Get all services for the business
  const services = await Service.find({ business: businessId });
  return services;
};

const getServiceById = async (businessId: string, serviceId: string, userId: string) => {
  // Verify user has access to the business
  const business = await Business.findOne({
    _id: businessId,
    $or: [
      { owner: userId },
      { 'members.user': userId },
    ],
  });

  if (!business) {
    throw new Error('Business not found or access denied');
  }

  const service = await Service.findOne({
    _id: serviceId,
    business: businessId,
  });

  if (!service) {
    throw new Error('Service not found');
  }

  return service;
};

const createService = async (businessId: string, userId: string, serviceData: any) => {
  // Verify user is owner of the business
  const business = await Business.findOne({
    _id: businessId,
    owner: userId,
  });

  if (!business) {
    throw new Error('Business not found or you do not have permission to create services');
  }

  // Only allow updating specific fields for security
  const allowedFields = {
    name: serviceData.name,
    category: serviceData.category,
    duration: serviceData.duration,
    basePrice: serviceData.basePrice,
    description: serviceData.description,
    status: serviceData.status || 'active',
    business: businessId,
  };

  // Remove undefined values
  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([, value]) => value !== undefined),
  );

  const service = new Service(filteredData);
  await service.save();

  return service;
};

const updateService = async (businessId: string, serviceId: string, userId: string, updateData: any) => {
  // Verify user is owner of the business
  const business = await Business.findOne({
    _id: businessId,
    owner: userId,
  });

  if (!business) {
    throw new Error('Business not found or you do not have permission to update services');
  }

  const service = await Service.findOne({
    _id: serviceId,
    business: businessId,
  });

  if (!service) {
    throw new Error('Service not found');
  }

  const isDeactivating =
    updateData.status === 'inactive' && service.status !== 'inactive';

  if (isDeactivating) {
    const hasActiveDeals = await Deal.exists({
      business: businessId,
      service: serviceId,
      status: 'active',
    });

    if (hasActiveDeals) {
      throw new ConflictException(
        'This service cannot be deactivated while active deals reference it. Please deactivate or update those deals first.',
      );
    }
  }

  // Only allow updating specific fields for security
  const allowedFields = {
    name: updateData.name,
    category: updateData.category,
    duration: updateData.duration,
    basePrice: updateData.basePrice,
    description: updateData.description,
    status: updateData.status,
  };

  // Remove undefined values
  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([, value]) => value !== undefined),
  );

  service.set(filteredData);
  await service.save();
  return service;
};

const deleteService = async (businessId: string, serviceId: string, userId: string) => {
  // Verify user is owner of the business
  const business = await Business.findOne({
    _id: businessId,
    owner: userId,
  });

  if (!business) {
    throw new Error('Business not found or you do not have permission to delete services');
  }

  const hasRelatedDeals = await Deal.exists({
    business: businessId,
    service: serviceId,
  });

  if (hasRelatedDeals) {
    throw new ConflictException(
      'This service is in use by existing deals. Please update or remove those deals before deleting it.',
    );
  }

  const service = await Service.findOneAndDelete({
    _id: serviceId,
    business: businessId,
  });

  if (!service) {
    throw new Error('Service not found');
  }

  return service;
};

export default {
  getServicesByBusiness,
  getServiceById,
  createService,
  updateService,
  deleteService,
};