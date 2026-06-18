import express from 'express';
import { signup, login } from './../controllers/authController';
import { validateRequest } from './../middlewares/validateRequest';
import { signupZodSchema, loginZodSchema } from './../schemas/userSchema';
const router = express.Router();

router.post('/login', validateRequest(loginZodSchema), login);
router.post('/signup', validateRequest(signupZodSchema), signup);
// router.get(,'/:id');
export default router;
