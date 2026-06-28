import express from 'express';
import { signup, login, refresh, protect } from './../controllers/authController';
import { validateRequest } from './../middlewares/validateRequest';
import { signupZodSchema, loginZodSchema } from './../schemas/userSchema';
import multer from 'multer';
import path from 'path';
import { AuthRequest } from '../types/express';
import AppError from '../utils/appError';

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return callback(new AppError('User not authenticated', 401), '');
    callback(null, `./../../uploads/users/${authReq.user.id}`);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.png', '.jpeg', '.webp'];
    if (!allowed.includes(ext)) return cb(new AppError('Unallowed file format', 415), '');
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage: storage });
const router = express.Router();

router.post('/login', validateRequest(loginZodSchema), login);
router.post('/signup', validateRequest(signupZodSchema), signup);
router.get('/refresh', refresh);
router.use(protect);

router.get('/me', getMe);
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);

// Social / Followers
router.post('/:id/follow', followUser);
router.delete('/:id/unfollow', unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

router.post('/upload', upload.single('image'));

// router.get(,'/:id');
export default router;
