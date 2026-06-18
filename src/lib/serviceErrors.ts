export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_CONFIGURED' | 'NETWORK' | 'UNKNOWN' = 'UNKNOWN'
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function requireSupabase(): void {
  const { assertSupabaseConfigured } = require('./supabase');
  assertSupabaseConfigured();
}

export function wrapServiceError(err: unknown, fallback: string): never {
  if (err instanceof Error) throw err;
  throw new ServiceError(fallback);
}
