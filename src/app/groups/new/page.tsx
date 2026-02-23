"use client";

import { useState } from "react";
import {
  Container,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Paper,
  Group,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiPost<{ group_id: string }>("groups", {
        name: name.trim(),
      });
      router.push(`/groups/${res.group_id}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" py={40}>
      <Title order={2} mb="xl">
        Create a Group
      </Title>
      <Paper p="xl" withBorder>
        <Stack gap="md">
          <TextInput
            label="Group Name"
            placeholder="e.g. Weekend Crew"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}
          <Group>
            <Button onClick={handleCreate} loading={loading} color="red">
              Create
            </Button>
            <Button component={Link} href="/dashboard" variant="subtle">
              Cancel
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
