import z from 'zod';

export const createPinZodSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'title is required')
      .max(50, 'A title cant exceed 50 characters'),
    description: z
      .string()
      .max(500, 'A description cant exceed 500 characters')
      .optional(),
    // imageURL: z
    //   .string()
    //   .min(1, 'imageURL is required')
    //   .max(100, 'A url cant exceed 100 characters'),
    // we dont need url anymore since we are uploading the image and storing it in the server
  }),
});

export const updatePinZodSchema = z.object({
  body: z.object({
    description: z
      .string()
      .max(500, 'A description cant exceed 500 characters')
      .optional(),
  }),
});

export type CreatePinInput = z.infer<typeof createPinZodSchema>['body'];
export type UpdatePinInput = z.infer<typeof updatePinZodSchema>['body'];
