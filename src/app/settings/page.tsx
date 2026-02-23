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
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { apiGet, apiPut } from "@/lib/api";

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
  location: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newBlock, setNewBlock] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    label: "",
    location: "",
  });

  useEffect(() => {
    apiGet<{ blocks: Block[] }>("users/me/availability")
      .then((d) => setBlocks(d.blocks))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleAdd = () => {
    setBlocks([
      ...blocks,
      {
        id: `new-${Date.now()}`,
        day_of_week: newBlock.day_of_week,
        start_time: newBlock.start_time,
        end_time: newBlock.end_time,
        label: newBlock.label || null,
        location: newBlock.location || null,
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
          label: b.label || undefined,
          location: b.location || undefined,
        })),
      });
      apiGet<{ blocks: Block[] }>("users/me/availability").then((d) =>
        setBlocks(d.blocks),
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

  return (
    <Container size="sm" py={40}>
      <Title order={2} mb="xl">
        Settings
      </Title>

      <Title order={3} mb="md">
        Availability
      </Title>
      <Text c="dimmed" mb="xl" size="sm">
        Set when you&apos;re typically unavailable (e.g. work hours). This helps
        find common free slots for your group.
      </Text>

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
            label="Event (optional)"
            placeholder="e.g. Work, Class, Gym"
            value={newBlock.label}
            onChange={(e) =>
              setNewBlock({ ...newBlock, label: e.target.value })
            }
          />

          <TextInput
            label="Location (optional)"
            placeholder="e.g. Snell Library, Home, 360 Huntington Ave"
            value={newBlock.location}
            onChange={(e) =>
              setNewBlock({ ...newBlock, location: e.target.value })
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
            No blocks. Add when you&apos;re usually busy.
          </Text>
        ) : (
          <Stack gap="xs">
            {blocks.map((b) => (
              <Group key={b.id} justify="space-between">
                <Text size="sm">
                  {
                    DAYS.find((d) => d.value === String(b.day_of_week))?.label
                  }{" "}
                  {b.start_time}–{b.end_time}
                  {b.label && ` (${b.label})`}
                  {b.location && ` · 📍 ${b.location}`}
                </Text>
                <Button
                  size="xs"
                  color="red"
                  variant="subtle"
                  onClick={() => handleRemove(b.id)}
                >
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
