import express from 'express';
import { signup, login, refresh, protect } from './../controllers/authController';
import {
  getMe,
  getFollowers,
  getFollowing,
  deleteMe,
  followUser,
  unfollowUser,
  updateMe,
} from './../controllers/userController';
import { validateRequest } from './../middlewares/validateRequest';
import {
  signupZodSchema,
  loginZodSchema,
  updateMeZodSchema,
} from './../schemas/userSchema';
import upload from '../utils/upload';
const router = express.Router();

router.post('/login', validateRequest(loginZodSchema), login);
router.post('/signup', validateRequest(signupZodSchema), signup);
router.get('/refresh', refresh);

router.use(protect);

router.get('/me', getMe);
router.patch(
  '/updateMe',
  upload.single('image'),
  validateRequest(updateMeZodSchema),
  updateMe
);

router.delete('/deleteMe', deleteMe);

// Social / Followers
router.post('/:id/follow', followUser);
router.delete('/:id/unfollow', unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

export default router;
