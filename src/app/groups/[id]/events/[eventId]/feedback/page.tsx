"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  SegmentedControl,
  Textarea,
  Stack,
  Group,
  Badge,
  Loader,
} from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";

interface Feedback {
  id: string;
  user_id: string;
  name: string;
  rating: string;
  notes: string | null;
  attended: boolean;
}

interface FeedbackResponse {
  feedbacks: Feedback[];
  summary: { loved: number; liked: number; disliked: number };
}

export default function FeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const eventId = params.eventId as string;

  const [rating, setRating] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [otherFeedbacks, setOtherFeedbacks] = useState<Feedback[]>([]);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGet<FeedbackResponse>(`groups/${id}/events/${eventId}/feedback`),
      apiGet<{ id: string }>("users/me"),
    ])
      .then(([fbData, userData]) => {
        setCurrentUserId(userData.id);

        // Pre-populate if the current user already submitted feedback
        const mine = fbData.feedbacks.find(
          (f) => f.user_id === userData.id,
        );
        if (mine) {
          setRating(mine.rating);
          setNotes(mine.notes || "");
          setHasExisting(true);
        }

        // Collect other members' feedback
        setOtherFeedbacks(
          fbData.feedbacks.filter((f) => f.user_id !== userData.id),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, eventId]);

  const handleSubmit = async () => {
    if (!rating) {
      setError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiPost(`groups/${id}/events/${eventId}/feedback`, {
        rating,
        notes: notes || undefined,
        attended: true,
      });
      router.push(`/groups/${id}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabel = (r: string) => {
    if (r === "loved") return "Loved it";
    if (r === "liked") return "Liked it";
    if (r === "disliked") return "Disliked it";
    return r;
  };

  const ratingColor = (r: string) => {
    if (r === "loved") return "green";
    if (r === "liked") return "blue";
    if (r === "disliked") return "red";
    return "gray";
  };

  if (loading) {
    return (
      <Container size="sm" py={40}>
        <Loader />
      </Container>
    );
  }

  return (
    <Container size="sm" py={40}>
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
        How was it?
      </Title>
      <Text c="dimmed" mb="xl">
        Your feedback helps Ketchup plan better next time.
      </Text>

      <Paper p="xl" withBorder>
        <Text fw={500} mb="sm">
          Rate this event
        </Text>
        <SegmentedControl
          value={rating}
          onChange={setRating}
          data={[
            { value: "loved", label: "Loved it" },
            { value: "liked", label: "Liked it" },
            { value: "disliked", label: "Disliked it" },
          ]}
          color="red"
          fullWidth
          mb="md"
        />
        <Textarea
          label="Notes (optional)"
          placeholder="What went well? What could be better?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          minRows={3}
        />
        {error && (
          <Text c="red" size="sm" mt="sm">
            {error}
          </Text>
        )}
        <Button mt="md" onClick={handleSubmit} loading={submitting} color="red">
          {hasExisting ? "Update feedback" : "Submit feedback"}
        </Button>
      </Paper>

      {otherFeedbacks.length > 0 && (
        <Paper p="md" mt="xl" withBorder>
          <Title order={4} mb="sm">
            Other members&apos; feedback
          </Title>
          <Stack gap="sm">
            {otherFeedbacks.map((f) => (
              <Group key={f.id} gap="sm" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Group gap="xs" mb={2}>
                    <Text size="sm" fw={500}>
                      {f.name}
                    </Text>
                    <Badge size="sm" color={ratingColor(f.rating)}>
                      {ratingLabel(f.rating)}
                    </Badge>
                  </Group>
                  {f.notes && (
                    <Text size="sm" c="dimmed">
                      {f.notes}
                    </Text>
                  )}
                </div>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}
    </Container>
  );
}
