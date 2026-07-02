import multer from 'multer';
import path from 'path';
import { AuthRequest } from '../types/express';
import AppError from '../utils/appError';
import fs from 'fs';
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return callback(new AppError('User not authenticated', 401), '');

    const resourcePath = req.originalUrl.includes('pins') ? 'pins' : 'users';

    fs.mkdirSync(path.resolve('uploads', resourcePath, `${authReq.user.id}`), {
      recursive: true,
    });

    callback(null, path.resolve('uploads', resourcePath, `${authReq.user.id}`));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.png', '.jpeg', '.webp'];
    if (!allowed.includes(ext)) return cb(new AppError('Unallowed file format', 415), '');
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Limit file size to 10MB
export default upload;
