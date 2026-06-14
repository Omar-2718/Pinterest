import z from 'zod';

export const userZodSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email('Invalid email'),
    avatar: z.string().optional(),
    role: z.enum(['user', 'admin']).optional(),
    password: z
      .string()
      .min(8, 'password must be at least 8 characters')
      .optional(),
  }),
});
