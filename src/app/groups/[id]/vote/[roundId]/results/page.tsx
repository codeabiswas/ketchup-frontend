"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Stack,
  Loader,
  Group,
  Badge,
} from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";

interface ResultsData {
  consensus: boolean;
  winning_plan_id: string | null;
  vote_summary: Record<string, number>;
  iteration_count: number;
}

interface Plan {
  id: string;
  title: string;
  vibe_type: string;
}

export default function VoteResultsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const roundId = params.roundId as string;
  const [results, setResults] = useState<ResultsData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = sessionStorage.getItem("ketchup_dev_user_id");
    if (!userId) {
      router.push("/");
      return;
    }
    Promise.all([
      apiGet<ResultsData>(`groups/${id}/plans/${roundId}/results`),
      apiGet<{ plans: Plan[] }>(`groups/${id}/plans/${roundId}`),
    ])
      .then(([r, p]) => {
        setResults(r);
        setPlans(p.plans);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id, roundId, router]);

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      await apiPost(`groups/${id}/plans/${roundId}/finalize`, {});
      router.push(`/groups/${id}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <Container py={60}>
        <Loader />
      </Container>
    );
  }

  if (error || !results) {
    return (
      <Container py={60}>
        <Text c="red">{error || "Failed to load"}</Text>
        <Button mt="md" component={Link} href={`/groups/${id}`}>
          Back
        </Button>
      </Container>
    );
  }

  const winningPlan = results.winning_plan_id
    ? plans.find((p) => p.id === results.winning_plan_id)
    : null;

  return (
    <Container size="md" py={40}>
      <Button component={Link} href={`/groups/${id}`} variant="subtle" size="xs" mb="md">
        ← Back to Group
      </Button>
      <Title order={2} mb="xl">
        Voting Results
      </Title>

      {results.consensus && winningPlan ? (
        <Paper p="xl" mb="xl" withBorder>
          <Badge color="green" mb="sm">
            Consensus reached!
          </Badge>
          <Title order={3}>{winningPlan.title}</Title>
          <Text c="dimmed" mt="xs">
            {winningPlan.vibe_type}
          </Text>
          <Button
            mt="md"
            color="red"
            onClick={handleFinalize}
            loading={finalizing}
          >
            Finalize event
          </Button>
        </Paper>
      ) : (
        <Paper p="xl" mb="xl" withBorder>
          <Badge color="orange" mb="sm">
            No consensus yet
          </Badge>
          <Text>
            Not enough votes for a clear winner. Try refining to get 5 new options.
          </Text>
          <Button
            mt="md"
            component={Link}
            href={`/groups/${id}`}
            variant="light"
          >
            Back to group
          </Button>
        </Paper>
      )}

      <Paper p="md" withBorder>
        <Title order={4} mb="sm">
          Vote summary
        </Title>
        {Object.keys(results.vote_summary).length === 0 ? (
          <Text c="dimmed" size="sm">No votes yet.</Text>
        ) : (
          <Stack gap="xs">
            {Object.entries(results.vote_summary).map(([planId, count]) => {
              const plan = plans.find((p) => p.id === planId);
              return (
                <Group key={planId} justify="space-between">
                  <Text size="sm">{plan?.title || planId}</Text>
                  <Badge>{count} vote{count !== 1 ? "s" : ""}</Badge>
                </Group>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
