"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Stack,
  Group,
  Loader,
  Badge,
  Modal,
  TextInput,
  Textarea,
  Select,
  Tooltip,
  Alert,
  Checkbox,
} from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchGroup,
  fetchGroupCommonSlots,
  generateGroupPlans,
  inviteGroupMembers,
  refineGroupPlans,
  updateGroupPreferences,
} from "@/features/groups/api";
import {
  BUDGET_OPTIONS,
  friendlyRoundStatus,
  normalizeGroupPreferences,
  parseInviteEmails,
  pendingInvites,
  REFINE_DESCRIPTOR_OPTIONS,
  toDisplayError,
  unresolvedDeclineOrExpiryInvites,
  validateInviteRequest,
} from "@/features/groups/model";
import type {
  CommonSlotsResponse,
  GroupData,
  GroupPreferencesForm,
} from "@/features/groups/types";

export default function GroupPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineDescriptors, setRefineDescriptors] = useState<string[]>([]);
  const [refineLeadNote, setRefineLeadNote] = useState("");
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState<GroupPreferencesForm>({
    budget_preference: "",
    activity_likes: "",
    activity_dislikes: "",
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [slotsOpen, setSlotsOpen] = useState(false);
  const [slots, setSlots] = useState<CommonSlotsResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [dismissedDeclines, setDismissedDeclines] = useState<Set<string>>(
    new Set(),
  );

  const refreshGroup = useCallback(async () => {
    const group = await fetchGroup(id);
    // Normalise likes/dislikes — backend should return arrays, but guard
    // against JSON strings or other unexpected types.
    if (group.preferences) {
      const safeParse = (v: unknown): string[] => {
        if (Array.isArray(v)) return v;
        if (typeof v === "string") {
          try {
            const parsed = JSON.parse(v);
            if (Array.isArray(parsed)) return parsed;
          } catch {
            /* not JSON */
          }
        }
        return [];
      };
      group.preferences.activity_likes = safeParse(
        group.preferences.activity_likes,
      );
      group.preferences.activity_dislikes = safeParse(
        group.preferences.activity_dislikes,
      );
    }
    setData(group);
    setPrefs(normalizeGroupPreferences(group.preferences));
  }, [id]);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const response = await fetchGroupCommonSlots(id);
      setSlots(response);
    } catch (err) {
      setError(toDisplayError(err));
    } finally {
      setLoadingSlots(false);
    }
  }, [id]);

  useEffect(() => {
    refreshGroup()
      .catch((err) => setError(toDisplayError(err)))
      .finally(() => setLoading(false));
  }, [refreshGroup]);

  const handleGeneratePlans = async () => {
    setGenerating(true);
    setError("");
    try {
      const response = await generateGroupPlans(id);
      router.push(`/groups/${id}/vote/${response.plan_round_id}`);
    } catch (err) {
      setError(toDisplayError(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async () => {
    const activeRound = data?.current_plans[0];
    if (!activeRound) {
      return;
    }

    setRefining(true);
    setError("");
    try {
      const response = await refineGroupPlans(id, activeRound.round_id, {
        descriptors: refineDescriptors,
        lead_note: refineLeadNote || undefined,
      });
      setRefineOpen(false);
      router.push(`/groups/${id}/vote/${response.plan_round_id}`);
    } catch (err) {
      setError(toDisplayError(err));
    } finally {
      setRefining(false);
    }
  };

  const handleInvite = async () => {
    const emails = parseInviteEmails(inviteEmails);
    const validationError = validateInviteRequest(emails, data);
    if (validationError) {
      setInviteError(validationError);
      return;
    }

    setInviting(true);
    setInviteError("");
    try {
      await inviteGroupMembers(id, emails);
      setInviteOpen(false);
      setInviteEmails("");
      await refreshGroup();
    } catch (err) {
      setInviteError(toDisplayError(err));
    } finally {
      setInviting(false);
    }
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      const likesArray = prefs.activity_likes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const dislikesArray = prefs.activity_dislikes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await updateGroupPreferences(id, {
        budget_preference: prefs.budget_preference || undefined,
        activity_likes: likesArray.length > 0 ? likesArray : undefined,
        activity_dislikes: dislikesArray.length > 0 ? dislikesArray : undefined,
      });
      setPrefsOpen(false);
      await refreshGroup();
    } catch (err) {
      setError(toDisplayError(err));
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return (
      <Container py={60}>
        <Loader />
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container py={60}>
        <Text c="red">{error || "Failed to load"}</Text>
        <Button mt="md" component={Link} href="/dashboard">
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const isLead = data.is_lead;
  const pendingGroupInvites = pendingInvites(data.invites);
  const declinedOrExpired = unresolvedDeclineOrExpiryInvites(
    data.invites,
    dismissedDeclines,
  );

  // Issue 7: Split events into upcoming vs past.
  const now = new Date();
  const upcomingEvents = (data.events ?? []).filter(
    (e) => new Date(e.event_date) >= now && (e.feedback_count ?? 0) === 0,
  );
  const pastEvents = (data.events ?? []).filter(
    (e) => new Date(e.event_date) < now || (e.feedback_count ?? 0) > 0,
  );

  return (
    <Container size="md" py={40}>
      <Group justify="space-between" mb="xl">
        <div>
          <Button
            component={Link}
            href="/dashboard"
            variant="subtle"
            size="xs"
            mb="xs"
          >
            ← Dashboard
          </Button>
          <Title order={2}>{data.name}</Title>
        </div>
      </Group>

      {isLead &&
        declinedOrExpired.map((invite) => (
          <Alert
            key={invite.id}
            color="orange"
            title={
              invite.status === "rejected" ? "Invite declined" : "Invite expired"
            }
            mb="sm"
            withCloseButton
            onClose={() =>
              setDismissedDeclines((prev) => new Set(prev).add(invite.id))
            }
          >
            <Text size="sm">
              <strong>{invite.email}</strong>{" "}
              {invite.status === "rejected"
                ? "declined the invitation."
                : "did not respond and the invite expired."}{" "}
              You can invite someone else and use the freed slot.
            </Text>
          </Alert>
        ))}

      <Paper p="md" mb="xl" withBorder>
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <Title order={4}>Members</Title>
            <Badge
              size="sm"
              variant="light"
              color={data.slots_remaining === 0 ? "red" : "gray"}
            >
              {data.members.length}/{data.max_members}
              {data.slots_remaining > 0
                ? ` · ${data.slots_remaining} slot${data.slots_remaining === 1 ? "" : "s"} left`
                : " · Full"}
            </Badge>
          </Group>
          {isLead && (
            <Tooltip
              label="Group is full (4/4 including pending invites)"
              disabled={data.slots_remaining > 0}
              withArrow
            >
              <span>
                <Button
                  size="xs"
                  variant="light"
                  disabled={data.slots_remaining <= 0}
                  onClick={() => {
                    setInviteError("");
                    setInviteEmails("");
                    setInviteOpen(true);
                  }}
                >
                  Invite
                </Button>
              </span>
            </Tooltip>
          )}
        </Group>

        <Stack gap="xs">
          {data.members.map((member) => (
            <Group key={member.id}>
              <Text>{member.name || member.email}</Text>
              <Badge size="sm" variant="light">
                {member.role}
              </Badge>
            </Group>
          ))}

          {pendingGroupInvites.map((invite) => (
            <Group key={invite.id}>
              <Text c="dimmed">{invite.email}</Text>
              <Badge size="sm" variant="dot" color="yellow">
                Invited
              </Badge>
            </Group>
          ))}
        </Stack>
      </Paper>

      {/* Issue 8: Enhanced preferences with budget dropdown + likes/dislikes */}
      <Paper p="md" mb="xl" withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={4}>My preferences</Title>
          <Button
            size="xs"
            variant="subtle"
            onClick={() => {
              setPrefs(normalizeGroupPreferences(data.preferences));
              setPrefsOpen(true);
            }}
          >
            Edit
          </Button>
        </Group>
        <Text size="sm" c="dimmed" mb="xs">
          Budget and activity preferences for this group.
          Only you and the AI can see your likes and dislikes.
        </Text>
        {data.preferences?.budget_preference ||
        (Array.isArray(data.preferences?.activity_likes) && data.preferences.activity_likes.length > 0) ||
        (Array.isArray(data.preferences?.activity_dislikes) && data.preferences.activity_dislikes.length > 0) ? (
          <Stack gap={4} mt="xs">
            {data.preferences?.budget_preference && (
              <Text size="sm">
                <strong>Budget:</strong> {data.preferences.budget_preference}
              </Text>
            )}
            {Array.isArray(data.preferences?.activity_likes) && data.preferences.activity_likes.length > 0 && (
              <Text size="sm">
                <strong>Likes:</strong> {data.preferences.activity_likes.join(", ")}
              </Text>
            )}
            {Array.isArray(data.preferences?.activity_dislikes) && data.preferences.activity_dislikes.length > 0 && (
              <Text size="sm">
                <strong>Dislikes:</strong> {data.preferences.activity_dislikes.join(", ")}
              </Text>
            )}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed" mt="xs">
            No preferences set. Click Edit to add.
          </Text>
        )}
      </Paper>

      {/* Issues 9 & 10: Weekday-based common free slots */}
      <Paper p="md" mb="xl" withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={4}>Common free slots</Title>
          <Button
            size="xs"
            variant="light"
            onClick={async () => {
              setSlotsOpen(true);
              await loadSlots();
            }}
          >
            View slots
          </Button>
        </Group>
        <Text size="sm" c="dimmed">
          When everyone is free based on availability blocks
        </Text>
      </Paper>

      <Modal
        opened={slotsOpen}
        onClose={() => setSlotsOpen(false)}
        title="Common free slots"
      >
        {loadingSlots ? (
          <Loader size="sm" />
        ) : slots?.common_slots && slots.common_slots.length > 0 ? (
          <Stack gap="xs">
            {slots.common_slots.map((slot, index) => (
              <Text key={index} size="sm">
                <strong>{slot.day_name}</strong> {slot.start_time} – {slot.end_time}
              </Text>
            ))}
            <Button size="xs" variant="subtle" mt="sm" onClick={loadSlots}>
              Refresh
            </Button>
          </Stack>
        ) : (
          <Stack gap="xs">
            <Text c="dimmed" size="sm">
              No common free slots found.
            </Text>
            <Text size="sm" c="dimmed">
              Make sure each member added availability in Settings, then refresh.
            </Text>
            <Button size="xs" variant="light" onClick={loadSlots}>
              Refresh
            </Button>
          </Stack>
        )}
      </Modal>

      {/* Issue 7: Upcoming events */}
      {upcomingEvents.length > 0 && (
        <Paper p="md" mb="xl" withBorder>
          <Title order={4} mb="sm">
            Upcoming events
          </Title>
          <Stack gap="xs">
            {upcomingEvents.map((event) => (
              <Group key={event.id} justify="space-between">
                <div>
                  <Text size="sm" fw={500}>{event.plan_title}</Text>
                  <Text size="xs" c="dimmed">
                    {new Date(event.event_date).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {event.location && ` · ${event.location}`}
                  </Text>
                </div>
                <Button
                  component={Link}
                  href={`/groups/${id}/events/${event.id}/feedback`}
                  size="xs"
                  variant="light"
                >
                  Feedback
                </Button>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Issue 7: Past events */}
      {pastEvents.length > 0 && (
        <Paper p="md" mb="xl" withBorder>
          <Title order={4} mb="sm">
            Past events
          </Title>
          <Stack gap="xs">
            {pastEvents.map((event) => (
              <Group key={event.id} justify="space-between">
                <div>
                  <Text size="sm" fw={500}>{event.plan_title}</Text>
                  <Text size="xs" c="dimmed">
                    {new Date(event.event_date).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {event.feedback_count
                      ? ` · ${event.feedback_count} feedback${event.feedback_count > 1 ? "s" : ""}`
                      : ""}
                  </Text>
                </div>
                <Button
                  component={Link}
                  href={`/groups/${id}/events/${event.id}/feedback`}
                  size="xs"
                  variant="subtle"
                >
                  {(event.feedback_count ?? 0) > 0 ? "View feedback" : "Leave feedback"}
                </Button>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Issue 5 + Rec B: Plan rounds with friendly status and vote count */}
      <Paper p="md" mb="xl" withBorder>
        <Title order={4} mb="sm">
          Plans
        </Title>
        {data.current_plans.length > 0 ? (
          <Stack gap="xs">
            {data.current_plans.map((round) => (
              <Group key={round.round_id} justify="space-between">
                <div>
                  <Text size="sm">
                    Round {round.iteration} – {friendlyRoundStatus(round.status)}
                  </Text>
                  {round.votes_in !== undefined && (
                    <Text size="xs" c="dimmed">
                      {round.votes_in}/{data.total_members ?? data.members.length} members voted
                    </Text>
                  )}
                </div>
                <Button
                  component={Link}
                  href={
                    round.status === "votes_complete"
                      ? `/groups/${id}/vote/${round.round_id}/results`
                      : `/groups/${id}/vote/${round.round_id}`
                  }
                  size="sm"
                  variant="light"
                >
                  {round.status === "votes_complete" ? "Results" : "Vote"}
                </Button>
              </Group>
            ))}
          </Stack>
        ) : (
          <Text c="dimmed">No plans yet. Generate some.</Text>
        )}
      </Paper>

      {/* Plan generation button — hidden when there are upcoming (unfinished) events */}
      {upcomingEvents.length === 0 && (
        <Group>
          <Tooltip
            label={
              !isLead
                ? "Only the group lead can generate plans"
                : data.members.length < 2
                  ? "Add at least one more member to generate plans."
                  : ""
            }
            disabled={isLead && data.members.length >= 2}
            withArrow
            multiline
            w={260}
          >
            <span>
              <Button
                onClick={
                  data.current_plans.length > 0
                    ? () => setRefineOpen(true)
                    : handleGeneratePlans
                }
                loading={generating || refining}
                color="red"
                disabled={!isLead || data.members.length < 2}
              >
                {generating
                  ? "Generating plans... this may take a minute"
                  : data.current_plans.length > 0
                    ? "Regenerate 5 Plans"
                    : "Generate 5 Plans"}
              </Button>
            </span>
          </Tooltip>
        </Group>
      )}

      <Modal
        opened={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteError("");
        }}
        title="Invite members"
      >
        <Text size="sm" c="dimmed" mb="md">
          {data.slots_remaining} invite slot
          {data.slots_remaining === 1 ? "" : "s"} remaining (max 4 per group)
        </Text>
        <TextInput
          label={`Emails (comma-separated, max ${data.slots_remaining})`}
          placeholder="friend1@email.com, friend2@email.com"
          value={inviteEmails}
          onChange={(event) => {
            setInviteEmails(event.target.value);
            setInviteError("");
          }}
        />
        {inviteError && (
          <Text c="red" size="sm" mt="xs">
            {inviteError}
          </Text>
        )}
        <Group mt="md">
          <Button onClick={handleInvite} loading={inviting} color="red">
            Send invites
          </Button>
          <Button
            variant="subtle"
            onClick={() => {
              setInviteOpen(false);
              setInviteError("");
            }}
          >
            Cancel
          </Button>
        </Group>
      </Modal>

      {/* Issue 8: Enhanced preferences modal */}
      <Modal
        opened={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        title="Group preferences"
      >
        <Stack gap="sm">
          <Select
            label="Budget preference"
            placeholder="Select budget range"
            data={BUDGET_OPTIONS}
            value={prefs.budget_preference}
            onChange={(value) =>
              setPrefs((prev) => ({
                ...prev,
                budget_preference: value ?? "",
              }))
            }
            clearable
          />
          <Textarea
            label="Activity likes"
            description="Comma-separated list of activities you enjoy"
            placeholder="e.g. hiking, board games, trying new restaurants"
            value={prefs.activity_likes}
            onChange={(event) =>
              setPrefs((prev) => ({
                ...prev,
                activity_likes: event.target.value,
              }))
            }
            minRows={2}
          />
          <Textarea
            label="Activity dislikes"
            description="Comma-separated list of activities you'd rather avoid"
            placeholder="e.g. loud bars, extreme sports"
            value={prefs.activity_dislikes}
            onChange={(event) =>
              setPrefs((prev) => ({
                ...prev,
                activity_dislikes: event.target.value,
              }))
            }
            minRows={2}
          />
          <Group>
            <Button onClick={handleSavePrefs} loading={savingPrefs} color="red">
              Save
            </Button>
            <Button variant="subtle" onClick={() => setPrefsOpen(false)}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={refineOpen}
        onClose={() => setRefineOpen(false)}
        title="Regenerate plans"
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Optionally guide the next round of plans. You can skip this and let
            the AI decide what to try next.
          </Text>
          <Stack gap={8}>
            {REFINE_DESCRIPTOR_OPTIONS.map((option) => (
              <Checkbox
                key={option.id}
                checked={refineDescriptors.includes(option.id)}
                onChange={(event) => {
                  const checked = event.currentTarget.checked;
                  setRefineDescriptors((prev) => {
                    if (checked) return [...prev, option.id];
                    return prev.filter((descriptor) => descriptor !== option.id);
                  });
                }}
                label={
                  <div>
                    <Text size="sm">{option.label}</Text>
                    <Text size="xs" c="dimmed">
                      {option.description}
                    </Text>
                  </div>
                }
              />
            ))}
          </Stack>
          <TextInput
            label="Lead note (optional)"
            placeholder="Any specific direction for this round"
            value={refineLeadNote}
            onChange={(event) => setRefineLeadNote(event.target.value)}
          />
          <Group>
            <Button onClick={handleRefine} loading={refining} color="red">
              Regenerate with guidance
            </Button>
            <Button
              variant="subtle"
              onClick={() => {
                setRefineOpen(false);
                handleGeneratePlans();
              }}
            >
              Skip — just regenerate
            </Button>
            <Button
              variant="subtle"
              onClick={() => {
                setRefineOpen(false);
              }}
            >
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
