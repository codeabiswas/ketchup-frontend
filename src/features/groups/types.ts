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
  votes_in?: number;
}

export interface GroupEvent {
  id: string;
  event_date: string;
  plan_title: string;
  location?: string | null;
  feedback_count?: number;
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
  total_members?: number;
  current_plans: GroupPlanRound[];
  events?: GroupEvent[];
  preferences?: GroupPreferences;
}

export interface CommonSlot {
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
}

export interface CommonSlotsResponse {
  common_slots: CommonSlot[];
}

export interface GroupPreferencesForm {
  budget_preference: string;
  activity_likes: string;
  activity_dislikes: string;
}

export interface RefinePlansRequest {
  descriptors?: string[];
  lead_note?: string;
}
