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
  votes_in: number;
  total_members: number;
}

interface Plan {
  id: string;
  title: string;
  vibe_type: string;
  description: string | null;
  date_time: string | null;
  location: string | null;
  venue_name: string | null;
  estimated_cost: string | null;
  logistics: Record<string, unknown>;
}

interface GroupData {
  is_lead: boolean;
}

export default function VoteResultsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const roundId = params.roundId as string;
  const [results, setResults] = useState<ResultsData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLead, setIsLead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiGet<ResultsData>(`groups/${id}/plans/${roundId}/results`),
      apiGet<{ plans: Plan[] }>(`groups/${id}/plans/${roundId}`),
      apiGet<GroupData>(`groups/${id}`),
    ])
      .then(([r, p, g]) => {
        setResults(r);
        setPlans(p.plans);
        setIsLead(g.is_lead);
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

  const waitingForVotes = results.votes_in < results.total_members;
  const noConsensus =
    !results.consensus && results.votes_in >= results.total_members;
  const consensusReached = results.consensus && winningPlan;

  return (
    <Container size="md" py={40}>
      <Button
        component={Link}
        href={`/groups/${id}`}
        variant="subtle"
        size="xs"
        mb="md"
      >
        ← Back to Group
      </Button>
      <Title order={2} mb="xl">
        Voting Results
      </Title>

      {/* State 1: Waiting for all members to vote */}
      {waitingForVotes && (
        <Paper p="xl" mb="xl" withBorder>
          <Badge color="blue" mb="sm">
            Waiting for votes
          </Badge>
          <Text>
            Waiting for all members to vote. {results.votes_in}/
            {results.total_members} votes so far.
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

      {/* State 2: Everyone voted, no consensus */}
      {noConsensus && (
        <Paper p="xl" mb="xl" withBorder>
          <Badge color="orange" mb="sm">
            No consensus yet
          </Badge>
          {isLead ? (
            <Text>
              Not enough votes for a clear winner. Try refining to get 5 new
              options.
            </Text>
          ) : (
            <Text>
              Not enough votes for a clear winner. We have let the Group Lead
              know so that you can vote on some new plans.
            </Text>
          )}
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

      {/* State 3: Consensus reached */}
      {consensusReached && (
        <Paper p="xl" mb="xl" withBorder>
          <Badge color="green" mb="sm">
            Consensus reached!
          </Badge>
          <Title order={3}>{winningPlan.title}</Title>
          {winningPlan.date_time && (
            <Text size="sm" mt="xs">
              <strong>When:</strong>{" "}
              {new Date(winningPlan.date_time).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          )}
          {(winningPlan.venue_name || winningPlan.location) && (
            <Text size="sm" mt={4}>
              <strong>Where:</strong>{" "}
              {winningPlan.venue_name}
              {winningPlan.venue_name && winningPlan.location ? " — " : ""}
              {winningPlan.location}
            </Text>
          )}
          {winningPlan.estimated_cost && (
            <Text size="sm" mt={4}>
              <strong>Cost:</strong> {winningPlan.estimated_cost}
            </Text>
          )}
          {isLead ? (
            <Button
              mt="md"
              color="red"
              onClick={handleFinalize}
              loading={finalizing}
            >
              Finalize event
            </Button>
          ) : (
            <Text size="sm" c="dimmed" mt="md">
              Waiting for the group lead to finalize this event.
            </Text>
          )}
        </Paper>
      )}

      <Paper p="md" withBorder>
        <Title order={4} mb="sm">
          Vote summary
        </Title>
        {Object.keys(results.vote_summary).length === 0 ? (
          <Text c="dimmed" size="sm">
            No votes yet.
          </Text>
        ) : (
          <Stack gap="xs">
            {Object.entries(results.vote_summary).map(([planId, count]) => {
              const plan = plans.find((p) => p.id === planId);
              return (
                <Group key={planId} justify="space-between">
                  <Text size="sm">{plan?.title || planId}</Text>
                  <Badge>
                    {count} vote{count !== 1 ? "s" : ""}
                  </Badge>
                </Group>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
