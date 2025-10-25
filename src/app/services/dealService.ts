import Deal, { IDealDocument } from '../model/deal';
import Company from '../model/company';
import Service from '../model/service';
import OperateSite from '../model/operateSite';

const getDealsByCompany = async (companyId: string, userId: string): Promise<IDealDocument[]> => {
    const company = await Company.findById(companyId);
    if (!company || !company.hasAccess(userId as any)) {
        throw new Error('Company not found or access denied');
    }

    // Get user's role in the company
    const userRole = company.getMemberRole(userId as any);
    const isOwner = company.isCompanyOwner(userId as any);

    let dealsQuery: any = { company: companyId };

    // If not owner, filter by operating sites the user has access to
    if (!isOwner && userRole) {
        // Get operating sites the user has access to
        const userOperatingSites = await OperateSite.find({
            company: companyId,
            members: userId,
            isActive: true,
        }).select('_id');

        const operatingSiteIds = userOperatingSites.map(site => site._id);

        if (operatingSiteIds.length === 0) {
            // User has no access to any operating sites, return empty array
            return [];
        }

        dealsQuery.operatingSite = { $in: operatingSiteIds };
    }

    return Deal.find(dealsQuery)
        .populate('service', 'name category basePrice duration')
        .populate('operatingSite', 'name address')
        .populate('createdBy', 'firstName lastName email');
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

    // Check if the user has access to the company
    if (!company.hasAccess(userId as any)) {
        throw new Error('Access denied');
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

    // Check if user has access to the operating site (for non-owners)
    const isOwner = company.isCompanyOwner(userId as any);
    if (!isOwner) {
        const hasSiteAccess = await OperateSite.findOne({
            _id: dealData.operatingSite,
            company: companyId,
            members: userId,
            isActive: true,
        });

        if (!hasSiteAccess) {
            throw new Error('You do not have access to this operating site');
        }
    }

    // Set original price from service if not provided
    if (!dealData.originalPrice) {
        dealData.originalPrice = service.basePrice;
    }
    // Set duration from service if not provided
    if (!dealData.duration) {
        dealData.duration = service.duration;
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

    const newDeal = new Deal({
        ...dealData,
        company: companyId,
        createdBy: userId, // Track who created the deal
    });
    return newDeal.save();
};

const updateDeal = async (companyId: string, dealId: string, userId: string, updateData: any): Promise<IDealDocument> => {
    const company = await Company.findById(companyId);
    if (!company) {
        throw new Error('Company not found');
    }

    // Check if the user has access to the company
    if (!company.hasAccess(userId as any)) {
        throw new Error('Access denied');
    }

    // Get the existing deal
    const existingDeal = await Deal.findOne({ _id: dealId, company: companyId });
    if (!existingDeal) {
        throw new Error('Deal not found');
    }

    // Check permissions based on role
    const isOwner = company.isCompanyOwner(userId as any);
    const userRole = company.getMemberRole(userId as any);

    if (!isOwner) {
        // For non-owners, check if they can edit this deal
        if (userRole) {
            // Check if user has access to the deal's operating site
            const hasSiteAccess = await OperateSite.findOne({
                _id: existingDeal.operatingSite,
                company: companyId,
                members: userId,
                isActive: true,
            });

            if (!hasSiteAccess) {
                throw new Error('You do not have access to this deal');
            }

            // For employees, they can only edit deals they created
            const roleName = await company.populate('members.role').then(() => {
                const member = company.members?.find(m => (m.user as any).equals(userId));
                return member?.role && typeof member.role === 'object' ? (member.role as any).name : null;
            });

            if (roleName === 'employee' && existingDeal.createdBy?.toString() !== userId) {
                throw new Error('You can only edit deals you created');
            }
        }
    }

    // If service is updated, re-validate and potentially update originalPrice/duration
    if (updateData.service) {
        const service = await Service.findOne({ _id: updateData.service, company: companyId });
        if (!service) {
            throw new Error('Service not found or does not belong to this company');
        }
        if (!updateData.originalPrice) {
            updateData.originalPrice = service.basePrice;
        }
        if (!updateData.duration) {
            updateData.duration = service.duration;
        }
    }

    // Validate operating site if updated
    if (updateData.operatingSite) {
        const operatingSite = await OperateSite.findOne({ _id: updateData.operatingSite, company: companyId });
        if (!operatingSite) {
            throw new Error('Operating site not found or does not belong to this company');
        }

        // Check if user has access to the new operating site (for non-owners)
        if (!isOwner) {
            const hasSiteAccess = await OperateSite.findOne({
                _id: updateData.operatingSite,
                company: companyId,
                members: userId,
                isActive: true,
            });

            if (!hasSiteAccess) {
                throw new Error('You do not have access to this operating site');
            }
        }
    }

    // Recalculate discount if price or originalPrice are updated
    if (updateData.originalPrice !== undefined || updateData.price !== undefined) {
        const currentOriginalPrice = updateData.originalPrice !== undefined ? updateData.originalPrice : existingDeal.originalPrice;
        const currentPrice = updateData.price !== undefined ? updateData.price : existingDeal.price;

        if (currentOriginalPrice && currentPrice) {
            updateData.discount = Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100);
        } else {
            updateData.discount = undefined; // Clear discount if prices are incomplete
        }
    }

    const deal = await Deal.findOneAndUpdate(
        { _id: dealId, company: companyId },
        updateData,
        { new: true, runValidators: true },
    )
        .populate('service', 'name category basePrice duration')
        .populate('operatingSite', 'name address')
        .populate('createdBy', 'firstName lastName email');

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

    // Check if the user has access to the company
    if (!company.hasAccess(userId as any)) {
        throw new Error('Access denied');
    }

    // Get the existing deal
    const existingDeal = await Deal.findOne({ _id: dealId, company: companyId });
    if (!existingDeal) {
        throw new Error('Deal not found');
    }

    // Check permissions based on role
    const isOwner = company.isCompanyOwner(userId as any);

    if (!isOwner) {
        // Check if user has access to the deal's operating site
        const hasSiteAccess = await OperateSite.findOne({
            _id: existingDeal.operatingSite,
            company: companyId,
            members: userId,
            isActive: true,
        });

        if (!hasSiteAccess) {
            throw new Error('You do not have access to this deal');
        }

        // For employees, they can only delete deals they created
        const roleName = await company.populate('members.role').then(() => {
            const member = company.members?.find(m => (m.user as any).equals(userId));
            return member?.role && typeof member.role === 'object' ? (member.role as any).name : null;
        });

        if (roleName === 'employee' && existingDeal.createdBy?.toString() !== userId) {
            throw new Error('You can only delete deals you created');
        }
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

    // Check if the user has access to the company
    if (!company.hasAccess(userId as any)) {
        throw new Error('Access denied');
    }

    // Get the existing deal
    const existingDeal = await Deal.findOne({ _id: dealId, company: companyId });
    if (!existingDeal) {
        throw new Error('Deal not found');
    }

    // Check permissions based on role
    const isOwner = company.isCompanyOwner(userId as any);

    if (!isOwner) {
        // Check if user has access to the deal's operating site
        const hasSiteAccess = await OperateSite.findOne({
            _id: existingDeal.operatingSite,
            company: companyId,
            members: userId,
            isActive: true,
        });

        if (!hasSiteAccess) {
            throw new Error('You do not have access to this deal');
        }

        // For employees, they can only update status of deals they created
        const roleName = await company.populate('members.role').then(() => {
            const member = company.members?.find(m => (m.user as any).equals(userId));
            return member?.role && typeof member.role === 'object' ? (member.role as any).name : null;
        });

        if (roleName === 'employee' && existingDeal.createdBy?.toString() !== userId) {
            throw new Error('You can only update status of deals you created');
        }
    }

    const deal = await Deal.findOneAndUpdate(
        { _id: dealId, company: companyId },
        { status },
        { new: true, runValidators: true },
    )
        .populate('service', 'name category basePrice duration')
        .populate('operatingSite', 'name address')
        .populate('createdBy', 'firstName lastName email');

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
