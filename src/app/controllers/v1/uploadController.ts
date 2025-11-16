import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { uploadImageFromTempFile } from '../../services/uploadService';
import { uploadMulter } from '../../middleware/uploadMiddleware';

function sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export { uploadMulter };

export async function uploadImage(req: Request, res: Response) {
    try {
        const file = (req as any).file as Express.Multer.File | undefined;
        const folder = (req.query?.folder as string | undefined) ?? 'uploads';
        if (!file) {
            return res
                .status(httpStatus.BAD_REQUEST)
                .json({ success: false, message: 'file is required (multipart field name: file)' });
        }

        const result = await uploadImageFromTempFile({
            tempFilePath: file.path,
            originalFileName: file.originalname,
            contentType: file.mimetype,
            folder,
            makePublic: false,
        });
        return res.status(httpStatus.OK).json({ success: true, data: result });
    } catch (err: any) {
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: err?.message ?? 'Failed to upload file' });
    }
}

