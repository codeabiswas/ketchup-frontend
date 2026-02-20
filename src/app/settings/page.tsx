"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Stack,
  TextInput,
  Select,
  Group,
  Loader,
  Alert,
} from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGet, apiPut, apiPost } from "@/lib/api";

const DAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

interface Block {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  label: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarAvailable, setCalendarAvailable] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [newBlock, setNewBlock] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    label: "Work",
  });

  useEffect(() => {
    const userId = sessionStorage.getItem("ketchup_dev_user_id");
    if (!userId) {
      router.push("/");
      return;
    }
    Promise.all([
      apiGet<{ blocks: Block[] }>("users/me/availability").then((d) => setBlocks(d.blocks)).catch(() => {}),
      apiGet<{ connected: boolean; available: boolean; email?: string | null }>("calendar/status").then((d) => {
        setCalendarConnected(d.connected);
        setCalendarAvailable(d.available);
        setCalendarEmail(d.email ?? null);
        setCalendarError(null);
      }).catch((e) => {
        setCalendarError("Could not load calendar status");
      }),
    ]).finally(() => setLoading(false));
  }, [router]);

  const calendarParam = searchParams.get("calendar");
  useEffect(() => {
    if (calendarParam === "connected") {
      setCalendarConnected(true);
      setCalendarError(null);
      apiGet<{ connected: boolean; available: boolean; email?: string | null }>("calendar/status")
        .then((d) => {
          setCalendarEmail(d.email ?? null);
        })
        .catch(() => {});
      router.replace("/settings");
    } else if (calendarParam === "denied" || calendarParam === "error") {
      setCalendarError(calendarParam === "denied" ? "Access was denied" : "Connection failed");
      router.replace("/settings");
    }
  }, [calendarParam, router]);

  const handleAdd = () => {
    setBlocks([
      ...blocks,
      {
        id: `new-${Date.now()}`,
        day_of_week: newBlock.day_of_week,
        start_time: newBlock.start_time,
        end_time: newBlock.end_time,
        label: newBlock.label,
      } as Block,
    ]);
  };

  const handleRemove = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPut("users/me/availability", {
        blocks: blocks.map((b) => ({
          day_of_week: b.day_of_week,
          start_time: b.start_time,
          end_time: b.end_time,
          label: b.label,
        })),
      });
      apiGet<{ blocks: Block[] }>("users/me/availability").then((d) =>
        setBlocks(d.blocks)
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container py={60}>
        <Loader />
      </Container>
    );
  }

  const handleCalendarConnect = async () => {
    setCalendarLoading(true);
    try {
      const res = await apiGet<{ auth_url: string }>("calendar/connect");
      window.location.href = res.auth_url;
    } catch (e) {
      setCalendarLoading(false);
    }
  };

  const handleCalendarDisconnect = async () => {
    setCalendarLoading(true);
    try {
      await apiPost("calendar/disconnect", {});
      setCalendarConnected(false);
    } finally {
      setCalendarLoading(false);
    }
  };

  return (
    <Container size="sm" py={40}>
      <Title order={2} mb="xl">
        Settings
      </Title>

      <Paper p="md" mb="xl" withBorder>
        <Title order={4} mb="sm">
          Google Calendar
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Connect your calendar to add Ketchup events automatically.
        </Text>
        {calendarError && (
          <Alert color="red" mb="md">
            {calendarError}
          </Alert>
        )}
        {!calendarAvailable ? (
          <Alert color="gray">
            Calendar integration requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the backend.
          </Alert>
        ) : calendarConnected ? (
          <Stack gap="xs">
            <Group>
              <Text size="sm" c="green" fw={500}>Connected</Text>
              <Button size="xs" variant="subtle" color="red" onClick={handleCalendarDisconnect} loading={calendarLoading}>
                Disconnect
              </Button>
            </Group>
            {calendarEmail && (
              <Text size="sm" c="dimmed">
                Account: {calendarEmail}
              </Text>
            )}
            <Button
              size="xs"
              variant="light"
              onClick={async () => {
                setCalendarLoading(true);
                setCalendarError(null);
                try {
                  const result = await apiPost<{ imported: number; message?: string }>("calendar/import-blocks", {});
                  const d = await apiGet<{ blocks: Block[] }>("users/me/availability");
                  setBlocks(d.blocks);
                  setCalendarError(null);
                  if (result.imported === 0) {
                    setCalendarError("No timed events found in the next 30 days. Add events with specific times (not all-day) to your Google Calendar.");
                  }
                } catch (e) {
                  setCalendarError(e instanceof Error ? e.message : String(e));
                } finally {
                  setCalendarLoading(false);
                }
              }}
              loading={calendarLoading}
            >
              Import busy times from Calendar
            </Button>
          </Stack>
        ) : (
          <Button onClick={handleCalendarConnect} loading={calendarLoading} color="red" variant="light">
            Connect Google Calendar
          </Button>
        )}
      </Paper>

      <Title order={3} mb="md">
        Availability
      </Title>
      <Text c="dimmed" mb={calendarConnected ? "xs" : "xl"} size="sm">
        Set when you're typically unavailable (e.g. work hours). This helps find
        common free slots for your group.
      </Text>
      {calendarConnected && (
        <Text size="sm" c="dimmed" mb="xl">
          Tip: Use &quot;Import busy times from Calendar&quot; above to add your Google Calendar events as blocks.
        </Text>
      )}

      <Paper p="md" mb="md" withBorder>
        <Title order={4} mb="sm">
          Add block
        </Title>
        <Stack gap="sm">
          <Select
            label="Day"
            data={DAYS}
            value={String(newBlock.day_of_week)}
            onChange={(v) =>
              setNewBlock({ ...newBlock, day_of_week: parseInt(v || "1") })
            }
          />
          <Group grow>
            <TextInput
              label="Start"
              type="time"
              value={newBlock.start_time}
              onChange={(e) =>
                setNewBlock({ ...newBlock, start_time: e.target.value })
              }
            />
            <TextInput
              label="End"
              type="time"
              value={newBlock.end_time}
              onChange={(e) =>
                setNewBlock({ ...newBlock, end_time: e.target.value })
              }
            />
          </Group>
          <TextInput
            label="Label"
            placeholder="e.g. Work"
            value={newBlock.label}
            onChange={(e) =>
              setNewBlock({ ...newBlock, label: e.target.value })
            }
          />
          <Button onClick={handleAdd} variant="light">
            Add block
          </Button>
        </Stack>
      </Paper>

      <Paper p="md" mb="xl" withBorder>
        <Title order={4} mb="sm">
          Your blocks
        </Title>
        {blocks.length === 0 ? (
          <Text c="dimmed" size="sm">
            No blocks. Add when you're usually busy.
          </Text>
        ) : (
          <Stack gap="xs">
            {blocks.map((b) => (
              <Group key={b.id} justify="space-between">
                <Text size="sm">
                  {DAYS.find((d) => d.value === String(b.day_of_week))?.label} {b.start_time}–{b.end_time}
                  {b.label && ` (${b.label})`}
                </Text>
                <Button size="xs" color="red" variant="subtle" onClick={() => handleRemove(b.id)}>
                  Remove
                </Button>
              </Group>
            ))}
          </Stack>
        )}
      </Paper>

      <Button onClick={handleSave} loading={saving} color="red">
        Save availability
      </Button>
    </Container>
  );
}
