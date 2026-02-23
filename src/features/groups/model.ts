import type {
  GroupData,
  GroupInvite,
  GroupPreferences,
  GroupPreferencesForm,
} from "./types";

export function toDisplayError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function normalizeGroupPreferences(
  preferences?: GroupPreferences,
): GroupPreferencesForm {
  return {
    default_location: preferences?.default_location ?? "",
    budget_preference: preferences?.budget_preference ?? "",
  };
}

export function parseInviteEmails(rawEmails: string): string[] {
  return rawEmails
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((email) => email.trim().toLowerCase());
}

export function validateInviteRequest(
  emails: string[],
  group: GroupData | null,
): string | null {
  if (emails.length === 0) {
    return "Enter at least one email address.";
  }

  const slotsAvailable = group?.slots_remaining ?? 0;
  if (slotsAvailable <= 0) {
    return "No slots remaining. The group is full (max 4).";
  }
  if (emails.length > slotsAvailable) {
    return `Only ${slotsAvailable} slot${slotsAvailable === 1 ? "" : "s"} remaining. Please enter fewer emails.`;
  }

  const memberEmails = new Set(group?.members.map((member) => member.email.toLowerCase()));
  const pendingEmails = new Set(
    group?.invites
      .filter((invite) => invite.status === "pending")
      .map((invite) => invite.email.toLowerCase()),
  );

  const duplicates: string[] = [];
  for (const email of emails) {
    if (memberEmails.has(email)) {
      duplicates.push(`${email} is already a member`);
    } else if (pendingEmails.has(email)) {
      duplicates.push(`${email} already has a pending invite`);
    }
  }

  if (duplicates.length > 0) {
    return `${duplicates.join(". ")}.`;
  }

  return null;
}

export function pendingInvites(invites: GroupInvite[]): GroupInvite[] {
  return invites.filter((invite) => invite.status === "pending");
}

export function unresolvedDeclineOrExpiryInvites(
  invites: GroupInvite[],
  dismissedInviteIds: Set<string>,
): GroupInvite[] {
  return invites.filter(
    (invite) =>
      (invite.status === "rejected" || invite.status === "expired") &&
      !dismissedInviteIds.has(invite.id),
  );
}

