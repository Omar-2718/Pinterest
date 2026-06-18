import z from 'zod';

export const signupZodSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email('Invalid email'),
    avatar: z.string().optional(),
    role: z.enum(['user', 'admin']).optional(),
    password: z.string().min(8, 'password must be at least 8 characters').optional(),
  }),
});

export const loginZodSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'password must be at least 8 characters'),
  }),
});

export type SignupInput = z.infer<typeof signupZodSchema>['body'];
export type LoginInput = z.infer<typeof loginZodSchema>['body'];
