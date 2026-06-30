import express from 'express';
import { protect } from '../controllers/authController';
import {
  createPin,
  getAllPins,
  getPin,
  deletePin,
  updatePin,
  unlikePin,
  likePin,
  savePin,
  unsavePin,
  searchPins,
} from '../controllers/pinController';
import { validateRequest } from '../middlewares/validateRequest';
import { createPinZodSchema } from '../schemas/pinSchema';
const router = express.Router();

// Public Feed & Discovery
router.get('/', getAllPins); // The main home feed
router.get('/search', searchPins); // Search by keywords/tags
router.get('/:id', getPin); // View single pin details

// Protected Pin Actions
router.use(protect);
router.post('/', validateRequest(createPinZodSchema), createPin); // This replaces your generic /upload route
router.patch('/:id', updatePin);
router.delete('/:id', deletePin);

// Interactions on Pins
router.post('/:id/save', savePin); // Quick save/unsave to default profile
router.delete('/:id/save', unsavePin);
router.post('/:id/like', likePin);
router.delete('/:id/like', unlikePin);
