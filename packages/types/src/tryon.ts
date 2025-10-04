import { z } from 'zod';

export const CreateTryOnSessionRequestSchema = z.object({
  itemId: z.string(),
});

export const CreateTryOnSessionResponseSchema = z.object({
  sessionId: z.string(),
});

export const GetTryOnSessionResponseSchema = z.object({
  status: z.enum(['pending', 'available', 'unavailable']),
  message: z.string().optional(),
});

export type CreateTryOnSessionRequest = z.infer<typeof CreateTryOnSessionRequestSchema>;
export type CreateTryOnSessionResponse = z.infer<typeof CreateTryOnSessionResponseSchema>;
export type GetTryOnSessionResponse = z.infer<typeof GetTryOnSessionResponseSchema>;
