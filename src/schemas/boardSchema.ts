import z from 'zod';

export const createBoardZodSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'name is required')
      .max(50, 'A name cant exceed 50 characters'),
    description: z
      .string()
      .max(500, 'A description cant exceed 500 characters')
      .optional(),
    secret: z.boolean().optional(),
  }),
});

export const updateBoardZodSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'name is required')
      .max(50, 'A name cant exceed 50 characters')
      .optional(),
    description: z
      .string()
      .max(500, 'A description cant exceed 500 characters')
      .optional(),
    secret: z.boolean().optional(),
  }),
});

export type createBoardInput = z.infer<typeof createBoardZodSchema>['body'];
export type updateBoardInput = z.infer<typeof updateBoardZodSchema>['body'];
