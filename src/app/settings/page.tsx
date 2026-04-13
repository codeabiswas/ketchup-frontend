"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  TextInput,
  Group,
  Loader,
  Accordion,
  ActionIcon,
  Alert,
} from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGet, apiPut } from "@/lib/api";

/** Monday-first ordering for a natural weekly view. */
const DAYS_ORDERED = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

interface Block {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  label: string | null;
  location: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ blocks: Block[] }>("users/me/availability")
      .then((d) => setBlocks(d.blocks))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  /* ---- per-block helpers ---- */

  const addBlockForDay = (dayOfWeek: number) => {
    setBlocks((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${dayOfWeek}`,
        day_of_week: dayOfWeek,
        start_time: "09:00",
        end_time: "17:00",
        label: null,
        location: null,
      },
    ]);
  };

  const updateBlock = (id: string, field: keyof Block, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value || null } : b)),
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  /* ---- save ---- */

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPut("users/me/availability", {
        blocks: blocks.map((b) => ({
          day_of_week: b.day_of_week,
          start_time: b.start_time,
          end_time: b.end_time,
          label: b.label || undefined,
          location: b.location || undefined,
        })),
      });
      const d = await apiGet<{ blocks: Block[] }>("users/me/availability");
      setBlocks(d.blocks);
      if (isOnboarding) {
        router.push("/dashboard");
      }
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

  /* ---- group blocks by day ---- */

  const blocksByDay = new Map<number, Block[]>();
  for (const day of DAYS_ORDERED) {
    blocksByDay.set(day.value, []);
  }
  for (const b of blocks) {
    const arr = blocksByDay.get(b.day_of_week);
    if (arr) arr.push(b);
    else blocksByDay.set(b.day_of_week, [b]);
  }

  // Default-open weekdays (Mon-Fri)
  const defaultOpen = DAYS_ORDERED.filter((d) => d.value >= 1 && d.value <= 5).map(
    (d) => String(d.value),
  );

  return (
    <Container size="sm" py={40}>
      <Title order={2} mb="xl">
        Settings
      </Title>

      {isOnboarding && (
        <Alert color="blue" mb="xl" title="Welcome to Ketchup!">
          Please set up your busy times before continuing. This helps us find
          the best time for your group to hang out.
        </Alert>
      )}

      <Title order={3} mb="md">
        Busy times
      </Title>
      <Text c="dimmed" mb="xl" size="sm">
        Set when you&apos;re typically busy (e.g., work, classes). This helps
        find common free slots for your groups.
      </Text>

      <Accordion multiple defaultValue={defaultOpen} variant="separated" mb="xl">
        {DAYS_ORDERED.map((day) => {
          const dayBlocks = blocksByDay.get(day.value) ?? [];
          return (
            <Accordion.Item key={day.value} value={String(day.value)}>
              <Accordion.Control>
                <Group gap="xs">
                  <Text fw={500}>{day.label}</Text>
                  <Text size="xs" c="dimmed">
                    {dayBlocks.length === 0
                      ? "no blocks"
                      : `${dayBlocks.length} block${dayBlocks.length > 1 ? "s" : ""}`}
                  </Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  {dayBlocks.map((block) => (
                    <Group key={block.id} gap="xs" align="flex-end" wrap="wrap">
                      <TextInput
                        label="Start"
                        type="time"
                        value={block.start_time}
                        onChange={(e) =>
                          updateBlock(block.id, "start_time", e.target.value)
                        }
                        style={{ width: 110 }}
                        size="sm"
                      />
                      <Text size="sm" pb={6}>
                        –
                      </Text>
                      <TextInput
                        label="End"
                        type="time"
                        value={block.end_time}
                        onChange={(e) =>
                          updateBlock(block.id, "end_time", e.target.value)
                        }
                        style={{ width: 110 }}
                        size="sm"
                      />
                      <TextInput
                        label="Event"
                        placeholder="e.g. Work"
                        value={block.label ?? ""}
                        onChange={(e) =>
                          updateBlock(block.id, "label", e.target.value)
                        }
                        style={{ flex: 1, minWidth: 100 }}
                        size="sm"
                      />
                      <TextInput
                        label="Location"
                        placeholder="e.g. Snell Library"
                        value={block.location ?? ""}
                        onChange={(e) =>
                          updateBlock(block.id, "location", e.target.value)
                        }
                        style={{ flex: 1, minWidth: 120 }}
                        size="sm"
                      />
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => removeBlock(block.id)}
                        mb={1}
                      >
                        ✕
                      </ActionIcon>
                    </Group>
                  ))}
                  <Button
                    variant="light"
                    size="xs"
                    onClick={() => addBlockForDay(day.value)}
                  >
                    + Add block
                  </Button>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>

      <Group>
        <Button onClick={handleSave} loading={saving} color="red">
          Save busy times
        </Button>
        {isOnboarding && (
          <Button variant="subtle" onClick={handleSave} loading={saving}>
            Skip
          </Button>
        )}
      </Group>
    </Container>
  );
}
