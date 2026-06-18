import { PostgrestError } from '@supabase/supabase-js';

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export function assertNoError(error: PostgrestError | null, fallback = 'Database error'): void {
  if (error) {
    throw new RepositoryError(error.message || fallback, error.code, error.details);
  }
}
