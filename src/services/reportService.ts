import { getSupabase, assertSupabaseConfigured, isSupabaseConfigured } from '../lib/supabase';
import { assertNoError } from '../repositories/base.repository';

export type ReportTargetType = 'post' | 'comment' | 'user' | 'group' | 'reel' | 'message';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  evidenceUrl?: string;
  status: ReportStatus;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  evidence_url: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { fullname: string } | { fullname: string }[];
}

function mapReport(row: ReportRow): Report {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reporterName: profile?.fullname,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    evidenceUrl: row.evidence_url ?? undefined,
    status: row.status,
    reviewedBy: row.reviewed_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function submitReport(params: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  evidenceUrl?: string;
}): Promise<Report> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase()
    .from('reports')
    .insert({
      reporter_id: params.reporterId,
      target_type: params.targetType,
      target_id: params.targetId,
      reason: params.reason.trim(),
      evidence_url: params.evidenceUrl ?? null,
    })
    .select('*, profiles!reporter_id (fullname)')
    .single();
  assertNoError(error);
  return mapReport(data as ReportRow);
}

export async function listPendingReports(): Promise<Report[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await getSupabase()
    .from('reports')
    .select('*, profiles!reporter_id (fullname)')
    .in('status', ['pending', 'reviewing'])
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return [];
  return (data as ReportRow[]).map(mapReport);
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  reviewerId: string
): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await getSupabase()
    .from('reports')
    .update({
      status,
      reviewed_by: reviewerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);
  assertNoError(error);

  await getSupabase().from('admin_logs').insert({
    actor_id: reviewerId,
    action: `report_${status}`,
    entity_type: 'report',
    entity_id: reportId,
  });
}

export async function logAdminAction(
  actorId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  if (!isSupabaseConfigured) return;
  await getSupabase().from('admin_logs').insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? {},
  });
}
