import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { GroupWithMembership } from '../services/groupService';
import * as groupService from '../services/groupService';

export function useGroups() {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState<GroupWithMembership[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<GroupWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [mine, discover] = await Promise.all([
      user ? groupService.getMyGroups(user._id) : Promise.resolve([]),
      groupService.getDiscoverGroups(user?._id),
    ]);
    setMyGroups(mine);
    setDiscoverGroups(discover.filter((g) => !mine.some((m) => m._id === g._id)));
  }, [user?._id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const joinGroup = useCallback(
    async (groupId: string) => {
      if (!user) return;
      const updated = await groupService.joinGroup(groupId, user._id);
      setMyGroups((prev) => (prev.some((g) => g._id === groupId) ? prev : [...prev, updated]));
      setDiscoverGroups((prev) =>
        prev.map((g) => (g._id === groupId ? { ...g, isMember: true, myRole: 'member' } : g))
      );
    },
    [user]
  );

  return { myGroups, discoverGroups, loading, refreshing, refresh, joinGroup };
}
