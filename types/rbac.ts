export const APP_ROLES = ['user', 'trusted_user', 'moderator', 'lead_moderator', 'admin'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ACCOUNT_STATUSES = ['active', 'warned', 'banned'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const REPORT_STATUSES = ['open', 'in_review', 'resolved', 'dismissed', 'escalated'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const MODERATION_ACTIONS = ['delete_listing', 'restore_listing', 'warn_user', 'ban_user', 'unban_user', 'resolve_report', 'dismiss_report', 'assign_role'] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];
export type ModerationTargetType = 'listing' | 'user';

export const ROLE_RANK: Record<AppRole, number> = {
  user: 1,
  trusted_user: 2,
  moderator: 3,
  lead_moderator: 4,
  admin: 5
};

export const ROLE_LABEL: Record<AppRole, string> = {
  user: 'Utente',
  trusted_user: 'Utente fidato',
  moderator: 'Moderatore',
  lead_moderator: 'Lead Moderator',
  admin: 'Amministratore'
};

export interface ManagedProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  account_status: AccountStatus;
  warning_count: number;
  featured_badge: boolean;
  created_at: string;
}

export interface ModerationReport {
  id: string;
  reporter_id: string;
  product_id: string | null;
  reported_user_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  assigned_to: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Pick<ManagedProfile, 'id' | 'username' | 'role'> | null;
  reported_user?: Pick<ManagedProfile, 'id' | 'username' | 'role' | 'account_status'> | null;
  product?: { id: string; title: string; seller_id: string } | null;
}

export interface ModerationLog {
  id: string;
  actor_id: string;
  target_user_id: string | null;
  target_product_id: string | null;
  report_id: string | null;
  action: ModerationAction;
  reason: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Pick<ManagedProfile, 'id' | 'username' | 'role'> | null;
  target_user?: Pick<ManagedProfile, 'id' | 'username' | 'role' | 'account_status'> | null;
  target_product?: { id: string; title: string } | null;
}

export interface PlatformStat {
  label: string;
  value: number;
  description: string;
}

export function hasMinimumRole(role: AppRole, requiredRole: AppRole) {
  return ROLE_RANK[role] >= ROLE_RANK[requiredRole];
}
