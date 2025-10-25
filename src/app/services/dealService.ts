import Deal, { IDealDocument } from '../model/deal';
import Company from '../model/company';
import Service from '../model/service';
import OperateSite from '../model/operateSite';

const getDealsByCompany = async (companyId: string, userId: string): Promise<IDealDocument[]> => {
    const company = await Company.findById(companyId);
    if (!company || !company.hasAccess(userId as any)) {
        throw new Error('Company not found or access denied');
    }
    return Deal.find({ company: companyId })
        .populate('service', 'name category basePrice duration')
        .populate('operatingSite', 'name address');
};

const getDealById = async (companyId: string, dealId: string, userId: string): Promise<IDealDocument> => {
    const company = await Company.findById(companyId);
    if (!company || !company.hasAccess(userId as any)) {
        throw new Error('Company not found or access denied');
    }
    const deal = await Deal.findOne({ _id: dealId, company: companyId })
        .populate('service', 'name category basePrice duration')
        .populate('operatingSite', 'name address');
    if (!deal) {
        throw new Error('Deal not found');
    }
    return deal;
};

const createDeal = async (companyId: string, userId: string, dealData: any): Promise<IDealDocument> => {
    const company = await Company.findById(companyId);
    if (!company) {
        throw new Error('Company not found');
    }

    // Check if the user is the owner of the company
    const isOwner = company.owner.equals(userId);
    if (!isOwner) {
        throw new Error('Only the company owner can create deals');
    }

    // Validate service - it's now required
    if (!dealData.service) {
        throw new Error('Service is required');
    }
    const service = await Service.findOne({ _id: dealData.service, company: companyId });
    if (!service) {
        throw new Error('Service not found or does not belong to this company');
    }

    // Validate operating site
    if (!dealData.operatingSite) {
        throw new Error('Operating site is required');
    }
    const operatingSite = await OperateSite.findOne({ _id: dealData.operatingSite, company: companyId });
    if (!operatingSite) {
        throw new Error('Operating site not found or does not belong to this company');
    }

    // Set original price from service if not provided
    if (!dealData.originalPrice) {
        dealData.originalPrice = service.basePrice;
    }

    // Calculate discount if originalPrice and price are provided
    if (dealData.originalPrice && dealData.price) {
        dealData.discount = Math.round(((dealData.originalPrice - dealData.price) / dealData.originalPrice) * 100);
    }

    // Set default availability if not provided
    if (!dealData.availability) {
        dealData.availability = {
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            currentBookings: 0,
        };
    }

    const newDeal = new Deal({ ...dealData, company: companyId });
    return newDeal.save();
};

const updateDeal = async (companyId: string, dealId: string, userId: string, updateData: any): Promise<IDealDocument> => {
    const company = await Company.findById(companyId);
    if (!company) {
        throw new Error('Company not found');
    }

    // Check if the user is the owner of the company
    const isOwner = company.owner.equals(userId);
    if (!isOwner) {
        throw new Error('Only the company owner can update deals');
    }

    // Validate service if provided
    if (updateData.service) {
        const service = await Service.findOne({ _id: updateData.service, company: companyId });
        if (!service) {
            throw new Error('Service not found or does not belong to this company');
        }
    }

    // Calculate discount if originalPrice and price are provided
    if (updateData.originalPrice && updateData.price) {
        updateData.discount = Math.round(((updateData.originalPrice - updateData.price) / updateData.originalPrice) * 100);
    }

    const deal = await Deal.findOneAndUpdate(
        { _id: dealId, company: companyId },
        updateData,
        { new: true, runValidators: true }
    ).populate('service', 'name category');

    if (!deal) {
        throw new Error('Deal not found');
    }
    return deal;
};

const deleteDeal = async (companyId: string, dealId: string, userId: string): Promise<void> => {
    const company = await Company.findById(companyId);
    if (!company) {
        throw new Error('Company not found');
    }

    // Check if the user is the owner of the company
    const isOwner = company.owner.equals(userId);
    if (!isOwner) {
        throw new Error('Only the company owner can delete deals');
    }

    const result = await Deal.deleteOne({ _id: dealId, company: companyId });
    if (result.deletedCount === 0) {
        throw new Error('Deal not found');
    }
};

const updateDealStatus = async (companyId: string, dealId: string, userId: string, status: string): Promise<IDealDocument> => {
    const company = await Company.findById(companyId);
    if (!company) {
        throw new Error('Company not found');
    }

    // Check if the user is the owner of the company
    const isOwner = company.owner.equals(userId);
    if (!isOwner) {
        throw new Error('Only the company owner can update deal status');
    }

    const deal = await Deal.findOneAndUpdate(
        { _id: dealId, company: companyId },
        { status },
        { new: true, runValidators: true }
    ).populate('service', 'name category');

    if (!deal) {
        throw new Error('Deal not found');
    }
    return deal;
};

export default {
    getDealsByCompany,
    getDealById,
    createDeal,
    updateDeal,
    deleteDeal,
    updateDealStatus,
};
