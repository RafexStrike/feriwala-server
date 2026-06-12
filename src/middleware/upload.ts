import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { ENV } from '../config/environment';

const ensureDirectory = (directory: string): void => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const createStorage = (folder: string) => {
  const destination = path.join(process.cwd(), ENV.UPLOAD_DIR, folder);
  ensureDirectory(destination);

  return multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, destination),
    filename: (_req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = path.extname(file.originalname);
      callback(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
  });
};

const imageFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
    return;
  }
  callback(new Error('Only image uploads are allowed'));
};

const createUploader = (folder: string) =>
  multer({
    storage: createStorage(folder),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  });

export const uploadVerificationImage = createUploader('verifications');
export const uploadProductImages = createUploader('products');
