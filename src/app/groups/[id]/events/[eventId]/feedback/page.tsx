"use client";

import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  SegmentedControl,
  Textarea,
} from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";

export default function FeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const eventId = params.eventId as string;
  const [rating, setRating] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
          Submit feedback
        </Button>
      </Paper>
    </Container>
  );
}
