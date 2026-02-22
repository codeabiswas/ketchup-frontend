// src/app/api/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Stack,
  Card,
  Badge,
  Loader,
  Group,
  Box,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";

interface UserData {
  user_id: string;
  email: string;
  name: string | null;
  groups: { id: string; name: string; role: string }[];
  pending_invites: {
    id: string;
    group_id: string;
    group_name: string;
    inviter_name: string;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<UserData>("users/me")
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [router]);

  const handleAcceptInvite = async (groupId: string) => {
    try {
      await apiPost(`groups/${groupId}/invite/accept`, {});
      setData(null);
      apiGet<UserData>("users/me").then(setData);
    } catch (e) {
      setError(String(e));
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
        <Button mt="md" variant="light" onClick={() => router.push("/")}>
          Back to Sign In
        </Button>
      </Container>
    );
  }

  return (
    <Container size="md" py={40}>
      <Box mb="xl">
        <Title order={2}>Dashboard</Title>
        <Text c="dimmed">Welcome, {data.name || data.email}</Text>
      </Box>

      {data.pending_invites.length > 0 && (
        <Paper p="md" mb="xl" withBorder>
          <Title order={3} mb="sm">
            Pending Invites
          </Title>
          <Stack gap="xs">
            {data.pending_invites.map((inv) => (
              <Group key={inv.id} justify="space-between">
                <Text>
                  {inv.inviter_name} invited you to{" "}
                  <strong>{inv.group_name}</strong>
                </Text>
                <Group gap="xs">
                  <Button
                    size="xs"
                    color="green"
                    onClick={() => handleAcceptInvite(inv.group_id)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="xs"
                    color="red"
                    variant="subtle"
                    onClick={async () => {
                      try {
                        await apiPost(
                          `groups/${inv.group_id}/invite/reject`,
                          {},
                        );
                        setData(null);
                        apiGet<UserData>("users/me").then(setData);
                      } catch (e) {
                        setError(String(e));
                      }
                    }}
                  >
                    Reject
                  </Button>
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      <Group justify="space-between" mb="md">
        <Title order={2}>Your Groups</Title>
        <Button component={Link} href="/groups/new" color="red">
          Create Group
        </Button>
      </Group>

      {data.groups.length === 0 ? (
        <Paper p="xl" withBorder>
          <Text c="dimmed" ta="center">
            No groups yet. Create one or accept an invite.
          </Text>
        </Paper>
      ) : (
        <Stack gap="md">
          {data.groups.map((g) => (
            <Card key={g.id} shadow="sm" padding="lg" withBorder>
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{g.name}</Text>
                  <Badge size="sm" variant="light" mt={4}>
                    {g.role}
                  </Badge>
                </div>
                <Button
                  component={Link}
                  href={`/groups/${g.id}`}
                  variant="light"
                  size="sm"
                >
                  Open
                </Button>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
