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
    default_location: "",
    budget_preference: "",
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
      await updateGroupPreferences(id, {
        default_location: prefs.default_location || undefined,
        budget_preference: prefs.budget_preference || undefined,
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
          Location and budget preferences for this group
        </Text>
        {data.preferences?.default_location || data.preferences?.budget_preference ? (
          <Stack gap={4} mt="xs">
            {data.preferences.default_location && (
              <Text size="sm">
                <strong>Location:</strong> {data.preferences.default_location}
              </Text>
            )}
            {data.preferences.budget_preference && (
              <Text size="sm">
                <strong>Budget:</strong> {data.preferences.budget_preference}
              </Text>
            )}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed" mt="xs">
            No preferences set. Click Edit to add.
          </Text>
        )}
      </Paper>

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
                {new Date(slot.start).toLocaleString()} –{" "}
                {new Date(slot.end).toLocaleString()}
              </Text>
            ))}
            <Button size="xs" variant="subtle" mt="sm" onClick={loadSlots}>
              Refresh
            </Button>
          </Stack>
        ) : (
          <Stack gap="xs">
            <Text c="dimmed" size="sm">
              No common free slots in the next 7 days.
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

      {data.events && data.events.length > 0 && (
        <Paper p="md" mb="xl" withBorder>
          <Title order={4} mb="sm">
            Upcoming events
          </Title>
          <Stack gap="xs">
            {data.events.map((event) => (
              <Group key={event.id} justify="space-between">
                <Text size="sm">{event.plan_title}</Text>
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

      <Paper p="md" mb="xl" withBorder>
        <Title order={4} mb="sm">
          Plans
        </Title>
        {data.current_plans.length > 0 ? (
          <Stack gap="xs">
            {data.current_plans.map((round) => (
              <Group key={round.round_id} justify="space-between">
                <Text>
                  Round {round.iteration} - {round.status}
                </Text>
                <Button
                  component={Link}
                  href={`/groups/${id}/vote/${round.round_id}`}
                  size="sm"
                  variant="light"
                >
                  Vote
                </Button>
              </Group>
            ))}
          </Stack>
        ) : (
          <Text c="dimmed">No plans yet. Generate some.</Text>
        )}
      </Paper>

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
              onClick={handleGeneratePlans}
              loading={generating}
              color="red"
              disabled={!isLead || data.members.length < 2}
            >
              Generate 5 Plans
            </Button>
          </span>
        </Tooltip>
        {isLead && data.current_plans.length > 0 && (
          <Button
            onClick={() => setRefineOpen(true)}
            loading={refining}
            variant="light"
            color="orange"
          >
            Refine (new 5 plans)
          </Button>
        )}
      </Group>

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

      <Modal
        opened={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        title="Group preferences"
      >
        <Stack gap="sm">
          <TextInput
            label="Default location"
            placeholder="e.g. Boston, MA"
            value={prefs.default_location}
            onChange={(event) =>
              setPrefs((prev) => ({
                ...prev,
                default_location: event.target.value,
              }))
            }
          />
          <TextInput
            label="Budget preference"
            placeholder="e.g. $20-40 per person"
            value={prefs.budget_preference}
            onChange={(event) =>
              setPrefs((prev) => ({
                ...prev,
                budget_preference: event.target.value,
              }))
            }
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
        title="Refine next round"
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Select what to optimize for in the next 5 options. Refine uses lower
            novelty than Generate, so it keeps more continuity with the current round.
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
            placeholder="Any specific direction for this refine round"
            value={refineLeadNote}
            onChange={(event) => setRefineLeadNote(event.target.value)}
          />
          <Group>
            <Button onClick={handleRefine} loading={refining} color="orange">
              Run refine
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
