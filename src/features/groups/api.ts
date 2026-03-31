import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { CommonSlotsResponse, GroupData, RefinePlansRequest } from "./types";

export async function fetchGroup(groupId: string): Promise<GroupData> {
  return apiGet<GroupData>(`groups/${groupId}`);
}

export async function generateGroupPlans(
  groupId: string,
): Promise<{ plan_round_id: string }> {
  return apiPost<{ plan_round_id: string }>(`groups/${groupId}/generate-plans`, {});
}

export async function refineGroupPlans(
  groupId: string,
  roundId: string,
  body?: RefinePlansRequest,
): Promise<{ plan_round_id: string }> {
  return apiPost<{ plan_round_id: string }>(
    `groups/${groupId}/plans/${roundId}/refine`,
    body ?? {},
  );
}

export async function inviteGroupMembers(
  groupId: string,
  emails: string[],
): Promise<void> {
  await apiPost(`groups/${groupId}/invite`, { emails });
}

export async function updateGroupPreferences(
  groupId: string,
  updates: {
    budget_preference?: string;
    activity_likes?: string[];
    activity_dislikes?: string[];
  },
): Promise<void> {
  await apiPut(`groups/${groupId}/preferences`, updates);
}

export async function fetchGroupCommonSlots(
  groupId: string,
): Promise<CommonSlotsResponse> {
  return apiPost<CommonSlotsResponse>(`groups/${groupId}/availability`, {});
}
