import { Request, Response, NextFunction } from 'express';

export const permission = (slug: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // This is a placeholder middleware for permission checking
    // In a real application, this would check user permissions based on the slug
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const permissionSlug = slug; // Use slug to avoid unused parameter warning
    next();
  };
};
