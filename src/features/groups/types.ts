export interface GroupPreferences {
  default_location?: string | null;
  activity_likes?: string[];
  activity_dislikes?: string[];
  meetup_frequency?: string | null;
  budget_preference?: string | null;
  notes?: string | null;
}

export interface GroupInvite {
  id: string;
  email: string;
  status: string;
  created_at: string | null;
}

export interface GroupMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
}

export interface GroupPlanRound {
  round_id: string;
  iteration: number;
  status: string;
}

export interface GroupEvent {
  id: string;
  event_date: string;
  plan_title: string;
}

export interface GroupData {
  group_id: string;
  name: string;
  lead_id: string;
  is_lead: boolean;
  members: GroupMember[];
  invites: GroupInvite[];
  max_members: number;
  slots_remaining: number;
  current_plans: GroupPlanRound[];
  events?: GroupEvent[];
  preferences?: GroupPreferences;
}

export interface CommonSlotsResponse {
  common_slots: { start: string; end: string }[];
}

export interface GroupPreferencesForm {
  default_location: string;
  budget_preference: string;
}

export interface RefinePlansRequest {
  descriptors?: string[];
  lead_note?: string;
}
