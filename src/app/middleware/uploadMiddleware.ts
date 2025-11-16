import multer from 'multer';

// Multer instance saving temp files to ./uploads
export const uploadMulter = multer({ dest: 'uploads/' });

export default { uploadMulter };


