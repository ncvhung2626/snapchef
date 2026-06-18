import { queryClient } from '../queries/queryClient';

export function invalidateFeedQueries() {
  void queryClient.invalidateQueries({ queryKey: ['feed'] });
  void queryClient.invalidateQueries({ queryKey: ['posts'] });
}
