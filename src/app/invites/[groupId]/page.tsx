// src/app/invites/[groupId]/page.tsx

/**
 * Invite landing page — where email links point to.
 *
 * Flow:
 *   1. User clicks "Accept" or "Decline" in the invite email
 *   2. Link goes to /invites/{groupId}?action=accept (or decline)
 *   3. Proxy checks auth — if not logged in, redirects to "/"
 *   4. After sign-in, user lands back here
 *   5. This page auto-fires the accept/decline API call
 *   6. Redirects to the group page (accept) or dashboard (decline)
 */

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
  const action = searchParams.get("action"); // "accept" or "decline"

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Guard: must have a valid action
    if (action !== "accept" && action !== "decline") {
      setStatus("error");
      setMessage("Invalid invite link. Please check the email and try again.");
      return;
    }

    const endpoint =
      action === "accept"
        ? `groups/${groupId}/invite/accept`
        : `groups/${groupId}/invite/reject`;

    apiPost(endpoint, {})
      .then(() => {
        setStatus("success");
        if (action === "accept") {
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
  }, [action, groupId, router]);

  return (
    <Container size="sm" py={60}>
      <Paper p="xl" withBorder>
        <Stack align="center" gap="md">
          {/* Loading */}
          {status === "loading" && (
            <>
              <Loader color="red" />
              <Title order={3}>
                {action === "accept"
                  ? "Joining group..."
                  : "Declining invite..."}
              </Title>
              <Text c="dimmed" size="sm">
                Hang tight, this only takes a second.
              </Text>
            </>
          )}

          {/* Success */}
          {status === "success" && (
            <>
              <Text style={{ fontSize: 48 }}>
                {action === "accept" ? "🎉" : "👋"}
              </Text>
              <Title order={3}>{message}</Title>
            </>
          )}

          {/* Error */}
          {status === "error" && (
            <>
              <Text style={{ fontSize: 48 }}>😕</Text>
              <Title order={3}>Couldn&apos;t process invite</Title>
              <Text c="dimmed" ta="center">
                {message}
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
