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
  Loader,
  Group,
  Textarea,
  Badge,
} from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";

interface Plan {
  id: string;
  title: string;
  description: string | null;
  vibe_type: string;
  location: string | null;
  venue_name: string | null;
  estimated_cost: string | null;
}

interface PlansData {
  plans: Plan[];
  voting_deadline: string | null;
}

export default function VotePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const roundId = params.roundId as string;
  const [data, setData] = useState<PlansData | null>(null);
  const [ranking, setRanking] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = sessionStorage.getItem("ketchup_dev_user_id");
    if (!userId) {
      router.push("/");
      return;
    }
    apiGet<PlansData>(`groups/${id}/plans/${roundId}`)
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id, roundId, router]);

  const handleRank = (planId: string) => {
    if (ranking.includes(planId)) {
      setRanking(ranking.filter((id) => id !== planId));
    } else {
      setRanking([...ranking, planId]);
    }
  };

  const handleSubmit = async () => {
    if (ranking.length !== (data?.plans.length ?? 0)) {
      setError("Please rank all 5 options (click in order of preference)");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiPost(`groups/${id}/plans/${roundId}/vote`, {
        rankings: ranking,
        notes: notes || undefined,
      });
      router.push(`/groups/${id}/vote/${roundId}/results`);
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container py={60}>
        <Loader />
      </Container>
    );
  }

  if (error && !data) {
    return (
      <Container py={60}>
        <Text c="red">{error}</Text>
        <Button mt="md" component={Link} href={`/groups/${id}`}>
          Back
        </Button>
      </Container>
    );
  }

  const plans = data?.plans ?? [];

  return (
    <Container size="md" py={40}>
      <Button component={Link} href={`/groups/${id}`} variant="subtle" size="xs" mb="md">
        ← Back to Group
      </Button>
      <Title order={2} mb="xl">
        Vote on Plans
      </Title>
      <Text c="dimmed" mb="xl">
        Rank the 5 options from most preferred (1) to least (5). Click plans in order.
      </Text>

      <Stack gap="md">
        {plans.map((plan) => {
          const pos = ranking.indexOf(plan.id);
          const selected = pos >= 0;
          return (
            <Card
              key={plan.id}
              shadow="sm"
              padding="lg"
              withBorder
              style={{
                cursor: "pointer",
                borderColor: selected ? "var(--mantine-color-red-6)" : undefined,
                borderWidth: selected ? 2 : 1,
              }}
              onClick={() => handleRank(plan.id)}
            >
              <Group justify="space-between" mb="xs">
                <Badge size="sm" variant="light" color="red">
                  {plan.vibe_type}
                </Badge>
                {selected && <Badge color="red">#{pos + 1}</Badge>}
              </Group>
              <Title order={4}>{plan.title}</Title>
              {plan.description && (
                <Text size="sm" c="dimmed" mt="xs">
                  {plan.description}
                </Text>
              )}
              {plan.venue_name && (
                <Text size="sm" mt="xs">
                  📍 {plan.venue_name} {plan.location && `• ${plan.location}`}
                </Text>
              )}
              {plan.estimated_cost && (
                <Text size="sm" c="dimmed">
                  {plan.estimated_cost}
                </Text>
              )}
            </Card>
          );
        })}
      </Stack>

      <Paper p="md" mt="xl" withBorder>
        <Textarea
          label="Notes (optional)"
          placeholder="e.g. Too pricey, prefer weekends..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          minRows={2}
        />
      </Paper>

      {error && (
        <Text c="red" size="sm" mt="md">
          {error}
        </Text>
      )}

      <Button
        mt="xl"
        onClick={handleSubmit}
        loading={submitting}
        color="red"
        disabled={ranking.length !== plans.length}
      >
        Submit Vote
      </Button>
    </Container>
  );
}
