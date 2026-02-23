"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Container,
  Title,
  Text,
  Paper,
  Loader,
  Stack,
  Button,
} from "@mantine/core";
import Link from "next/link";
import { apiPost } from "@/lib/api";

export default function InviteActionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const groupId = params.groupId as string;
  const action = searchParams.get("action");
  const normalizedAction = action === "accept" || action === "decline" ? action : null;

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!normalizedAction) {
      return;
    }

    const endpoint =
      normalizedAction === "accept"
        ? `groups/${groupId}/invite/accept`
        : `groups/${groupId}/invite/reject`;

    apiPost(endpoint, {})
      .then(() => {
        setStatus("success");
        if (normalizedAction === "accept") {
          setMessage("You've joined the group! Redirecting...");
          setTimeout(() => router.push(`/groups/${groupId}`), 1500);
        } else {
          setMessage("Invite declined. Redirecting to your dashboard...");
          setTimeout(() => router.push("/dashboard"), 1500);
        }
      })
      .catch((err) => {
        setStatus("error");
        const msg = String(err);
        if (msg.includes("No pending invite")) {
          setMessage(
            "This invite has already been used or has expired. " +
              "Check your dashboard for any active groups.",
          );
        } else {
          setMessage(msg || "Something went wrong. Please try again.");
        }
      });
  }, [groupId, normalizedAction, router]);

  const displayStatus = normalizedAction ? status : "error";
  const displayMessage = normalizedAction
    ? message
    : "Invalid invite link. Please check the email and try again.";

  return (
    <Container size="sm" py={60}>
      <Paper p="xl" withBorder>
        <Stack align="center" gap="md">
          {displayStatus === "loading" && (
            <>
              <Loader color="red" />
              <Title order={3}>
                {normalizedAction === "accept"
                  ? "Joining group..."
                  : "Declining invite..."}
              </Title>
              <Text c="dimmed" size="sm">
                Hang tight, this only takes a second.
              </Text>
            </>
          )}

          {displayStatus === "success" && (
            <>
              <Text style={{ fontSize: 48 }}>
                {normalizedAction === "accept" ? "🎉" : "👋"}
              </Text>
              <Title order={3}>{displayMessage}</Title>
            </>
          )}

          {displayStatus === "error" && (
            <>
              <Text style={{ fontSize: 48 }}>😕</Text>
              <Title order={3}>Couldn&apos;t process invite</Title>
              <Text c="dimmed" ta="center">
                {displayMessage}
              </Text>
              <Button component={Link} href="/dashboard" color="red" mt="md">
                Go to Dashboard
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
