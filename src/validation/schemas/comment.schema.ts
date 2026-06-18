import { z } from 'zod';

export const commentSchema = z.object({
  content: z.string().min(1, 'Nhập nội dung bình luận').max(1000),
  parentId: z.string().uuid().optional(),
});

export type CommentInput = z.infer<typeof commentSchema>;
