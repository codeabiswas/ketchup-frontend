// src/app/groups/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
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
} from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost, apiPut } from "@/lib/api";

// ── Types ───────────────────────────────────────────────────────────
interface GroupPreferences {
  default_location?: string | null;
  activity_likes?: string[];
  activity_dislikes?: string[];
  meetup_frequency?: string | null;
  budget_preference?: string | null;
  notes?: string | null;
}

interface GroupInvite {
  id: string;
  email: string;
  status: string; // "pending" | "accepted" | "rejected" | "expired"
  created_at: string | null;
}

interface GroupData {
  group_id: string;
  name: string;
  lead_id: string;
  is_lead: boolean;
  members: {
    id: string;
    user_id: string;
    name: string;
    email: string;
    role: string;
  }[];
  invites: GroupInvite[];
  max_members: number;
  slots_remaining: number;
  current_plans: { round_id: string; iteration: number; status: string }[];
  events?: { id: string; event_date: string; plan_title: string }[];
  preferences?: GroupPreferences;
}

export default function GroupPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState({
    default_location: "",
    budget_preference: "",
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [slotsOpen, setSlotsOpen] = useState(false);
  const [slots, setSlots] = useState<{
    common_slots: { start: string; end: string }[];
  } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // ── Track which decline alerts the user has dismissed this session ──
  const [dismissedDeclines, setDismissedDeclines] = useState<Set<string>>(
    new Set(),
  );

  // ── Data fetching ─────────────────────────────────────────────────
  const refreshGroup = () =>
    apiGet<GroupData>(`groups/${id}`).then((d) => {
      setData(d);
      if (d.preferences) {
        setPrefs({
          default_location: d.preferences.default_location ?? "",
          budget_preference: d.preferences.budget_preference ?? "",
        });
      }
    });

  useEffect(() => {
    refreshGroup()
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleGeneratePlans = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await apiPost<{ plan_round_id: string }>(
        `groups/${id}/generate-plans`,
        {},
      );
      router.push(`/groups/${id}/vote/${res.plan_round_id}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!data?.current_plans[0]) return;
    setRefining(true);
    setError("");
    try {
      const res = await apiPost<{ plan_round_id: string }>(
        `groups/${id}/plans/${data.current_plans[0].round_id}/refine`,
        {},
      );
      router.push(`/groups/${id}/vote/${res.plan_round_id}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setRefining(false);
    }
  };

  const handleInvite = async () => {
    const emails = inviteEmails
      .split(/[,\s]+/)
      .filter(Boolean)
      .map((e) => e.trim().toLowerCase());

    if (emails.length === 0) return;

    // ── Client-side capacity check ──────────────────────────────────
    const slotsAvailable = data?.slots_remaining ?? 0;
    if (slotsAvailable <= 0) {
      setInviteError("No slots remaining. The group is full (max 4).");
      return;
    }
    if (emails.length > slotsAvailable) {
      setInviteError(
        `Only ${slotsAvailable} slot${slotsAvailable === 1 ? "" : "s"} remaining. Please enter fewer emails.`,
      );
      return;
    }

    // ── Client-side duplicate check ─────────────────────────────────
    const memberEmails = new Set(
      data?.members.map((m) => m.email.toLowerCase()) ?? [],
    );
    const pendingEmails = new Set(
      data?.invites
        .filter((i) => i.status === "pending")
        .map((i) => i.email.toLowerCase()) ?? [],
    );

    const dupes: string[] = [];
    for (const email of emails) {
      if (memberEmails.has(email)) {
        dupes.push(`${email} is already a member`);
      } else if (pendingEmails.has(email)) {
        dupes.push(`${email} already has a pending invite`);
      }
    }
    if (dupes.length > 0) {
      setInviteError(dupes.join(". ") + ".");
      return;
    }

    setInviting(true);
    setInviteError("");
    try {
      await apiPost(`groups/${id}/invite`, { emails });
      setInviteOpen(false);
      setInviteEmails("");
      refreshGroup();
    } catch (e) {
      setInviteError(String(e));
    } finally {
      setInviting(false);
    }
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      await apiPut(`groups/${id}/preferences`, {
        default_location: prefs.default_location || undefined,
        budget_preference: prefs.budget_preference || undefined,
      });
      setPrefsOpen(false);
      refreshGroup();
    } finally {
      setSavingPrefs(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────
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

  // ── Derived state ─────────────────────────────────────────────────
  const isLead = data.is_lead;
  const pendingInvites = data.invites.filter((i) => i.status === "pending");
  const declinedOrExpired = data.invites.filter(
    (i) =>
      (i.status === "rejected" || i.status === "expired") &&
      !dismissedDeclines.has(i.id),
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

      {/* ── Declined / Expired invite alerts ─────────────────────── */}
      {isLead &&
        declinedOrExpired.map((inv) => (
          <Alert
            key={inv.id}
            color="orange"
            title={
              inv.status === "rejected" ? "Invite declined" : "Invite expired"
            }
            mb="sm"
            withCloseButton
            onClose={() =>
              setDismissedDeclines((prev) => new Set(prev).add(inv.id))
            }
          >
            <Text size="sm">
              <strong>{inv.email}</strong>{" "}
              {inv.status === "rejected"
                ? "declined the invitation."
                : "did not respond and the invite expired."}{" "}
              You can invite someone else — the slot is now free.
            </Text>
          </Alert>
        ))}

      {/* ── Members + Invites section ────────────────────────────── */}
      <Paper p="md" mb="xl" withBorder>
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <Title order={4}>Members</Title>
            {/* Slot countdown badge */}
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

        {/* Active members */}
        <Stack gap="xs">
          {data.members.map((m) => (
            <Group key={m.id}>
              <Text>{m.name || m.email}</Text>
              <Badge size="sm" variant="light">
                {m.role}
              </Badge>
            </Group>
          ))}

          {/* Pending invites shown inline so the lead sees who's been invited */}
          {pendingInvites.map((inv) => (
            <Group key={inv.id}>
              <Text c="dimmed">{inv.email}</Text>
              <Badge size="sm" variant="dot" color="yellow">
                Invited
              </Badge>
            </Group>
          ))}
        </Stack>
      </Paper>

      {/* ── My preferences ───────────────────────────────────────── */}
      <Paper p="md" mb="xl" withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={4}>My preferences</Title>
          <Button
            size="xs"
            variant="subtle"
            onClick={() => {
              if (data.preferences) {
                setPrefs({
                  default_location: data.preferences.default_location ?? "",
                  budget_preference: data.preferences.budget_preference ?? "",
                });
              }
              setPrefsOpen(true);
            }}
          >
            Edit
          </Button>
        </Group>
        <Text size="sm" c="dimmed" mb="xs">
          Location & budget preferences for this group
        </Text>
        {data.preferences?.default_location ||
        data.preferences?.budget_preference ? (
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

      {/* ── Common free slots ────────────────────────────────────── */}
      <Paper p="md" mb="xl" withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={4}>Common free slots</Title>
          <Button
            size="xs"
            variant="light"
            onClick={async () => {
              setSlotsOpen(true);
              setLoadingSlots(true);
              try {
                const res = await apiPost<{
                  common_slots: { start: string; end: string }[];
                }>(`groups/${id}/availability`, {});
                setSlots(res);
              } catch (e) {
                setError(String(e));
              } finally {
                setLoadingSlots(false);
              }
            }}
          >
            View slots
          </Button>
        </Group>
        <Text size="sm" c="dimmed">
          When everyone is free (based on availability blocks)
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
            {slots.common_slots.map((s, i) => (
              <Text key={i} size="sm">
                {new Date(s.start).toLocaleString()} –{" "}
                {new Date(s.end).toLocaleString()}
              </Text>
            ))}
            <Button
              size="xs"
              variant="subtle"
              mt="sm"
              onClick={async () => {
                setLoadingSlots(true);
                try {
                  const res = await apiPost<{
                    common_slots: { start: string; end: string }[];
                  }>(`groups/${id}/availability`, {});
                  setSlots(res);
                } catch (e) {
                  setError(String(e));
                } finally {
                  setLoadingSlots(false);
                }
              }}
            >
              Refresh
            </Button>
          </Stack>
        ) : (
          <Stack gap="xs">
            <Text c="dimmed" size="sm">
              No common free slots in the next 7 days.
            </Text>
            <Text size="sm" c="dimmed">
              Make sure each member has added availability blocks in Settings
              and clicked &quot;Save availability&quot;. Then click &quot;View
              slots&quot; again to refresh.
            </Text>
            <Button
              size="xs"
              variant="light"
              onClick={async () => {
                setLoadingSlots(true);
                try {
                  const res = await apiPost<{
                    common_slots: { start: string; end: string }[];
                  }>(`groups/${id}/availability`, {});
                  setSlots(res);
                } catch (e) {
                  setError(String(e));
                } finally {
                  setLoadingSlots(false);
                }
              }}
            >
              Refresh
            </Button>
          </Stack>
        )}
      </Modal>

      {/* ── Upcoming events ──────────────────────────────────────── */}
      {data.events && data.events.length > 0 && (
        <Paper p="md" mb="xl" withBorder>
          <Title order={4} mb="sm">
            Upcoming events
          </Title>
          <Stack gap="xs">
            {data.events.map((e) => (
              <Group key={e.id} justify="space-between">
                <Text size="sm">{e.plan_title}</Text>
                <Group gap="xs">
                  <Button
                    component={Link}
                    href={`/groups/${id}/events/${e.id}/feedback`}
                    size="xs"
                    variant="light"
                  >
                    Feedback
                  </Button>
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      {/* ── Plans ────────────────────────────────────────────────── */}
      <Paper p="md" mb="xl" withBorder>
        <Title order={4} mb="sm">
          Plans
        </Title>
        {data.current_plans.length > 0 ? (
          <Stack gap="xs">
            {data.current_plans.map((p) => (
              <Group key={p.round_id} justify="space-between">
                <Text>
                  Round {p.iteration} - {p.status}
                </Text>
                <Button
                  component={Link}
                  href={`/groups/${id}/vote/${p.round_id}`}
                  size="sm"
                  variant="light"
                >
                  Vote
                </Button>
              </Group>
            ))}
          </Stack>
        ) : (
          <Text c="dimmed">No plans yet. Generate some!</Text>
        )}
      </Paper>

      {/* ── Action buttons ───────────────────────────────────────── */}
      <Group>
        <Tooltip
          label={
            !isLead
              ? "Only the group lead can generate plans"
              : data.members.length < 2
                ? "You must have at least 1 more person in the group to start making plans."
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
            onClick={handleRefine}
            loading={refining}
            variant="light"
            color="orange"
          >
            Refine (new 5 plans)
          </Button>
        )}
      </Group>

      {/* ── Invite modal ─────────────────────────────────────────── */}
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
          onChange={(e) => {
            setInviteEmails(e.target.value);
            setInviteError(""); // clear error as they type
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

      {/* ── Preferences modal ────────────────────────────────────── */}
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
            onChange={(e) =>
              setPrefs({ ...prefs, default_location: e.target.value })
            }
          />
          <TextInput
            label="Budget preference"
            placeholder="e.g. $20-40 per person"
            value={prefs.budget_preference}
            onChange={(e) =>
              setPrefs({ ...prefs, budget_preference: e.target.value })
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
    </Container>
  );
}
