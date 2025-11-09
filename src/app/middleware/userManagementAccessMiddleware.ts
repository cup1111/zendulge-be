import { Request, Response, NextFunction } from 'express';
import { RoleName } from '../enum/roles';
import {
    AuthorizationException,
    InsufficientPermissionsException,
} from '../exceptions';
import { getUserRoleName, normalizeId } from '../services/userManagementUtils';

interface UserManagementRequest extends Request {
    company?: any;
    user?: any;
}

export const authorizeUserManagementAction = (allowedRoles: RoleName[]) => {
    return async (
        req: UserManagementRequest,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            if (!req.company) {
                throw new AuthorizationException(
                    'Company context is required for user management',
                );
            }

            const actor = req.user;
            if (!actor) {
                throw new AuthorizationException('User not authenticated');
            }

            const actorId = normalizeId(actor._id ?? (actor as any)?.id ?? null);
            if (!actorId) {
                throw new AuthorizationException('Unable to determine acting user');
            }

            const actorRole =
                (await getUserRoleName(req.company, actorId)) ?? null;

            if (!actorRole || !allowedRoles.includes(actorRole)) {
                throw new InsufficientPermissionsException(
                    'You are not authorized to perform this action',
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

