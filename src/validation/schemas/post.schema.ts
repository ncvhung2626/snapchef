import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().max(2000).optional(),
  title: z.string().min(1, 'Tiêu đề bắt buộc').max(120).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  groupId: z.string().uuid().optional(),
});

export const createRecipeSchema = z.object({
  title: z.string().min(2, 'Tiêu đề công thức').max(120),
  category: z.string().min(1),
  ingredients: z.array(z.string().min(1)).min(1, 'Thêm ít nhất 1 nguyên liệu'),
  steps: z.array(z.string().min(1)).min(1, 'Thêm ít nhất 1 bước'),
  cookTimeMinutes: z.number().int().positive().optional(),
  content: z.string().max(2000).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
