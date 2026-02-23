"use client";

import { Container, Title, Text, Button, Paper, Stack } from "@mantine/core";
import { signIn } from "next-auth/react";

export default function HomePage() {
  return (
    <Container size="sm" py={60}>
      <Stack gap="xl" align="center">
        <div style={{ textAlign: "center" }}>
          <Title order={1} c="red.7" mb="xs">
            🍅 Ketchup
          </Title>
          <Text c="dimmed" size="lg">
            AI-powered social coordination for friend groups
          </Text>
        </div>

        <Paper p="xl" shadow="sm" radius="md" withBorder w="100%">
          <Stack gap="md" align="center">
            <Text size="sm" c="dimmed">
              Sign in with your Google account to get started
            </Text>
            <Button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              color="red"
              size="lg"
              fullWidth
            >
              Sign in with Google
            </Button>
          </Stack>
        </Paper>

        <Text size="xs" c="dimmed" ta="center">
          Ketchup autonomously generates event options, manages voting, and
          coordinates logistics so your group can catch up without the planning
          friction.
        </Text>
      </Stack>
    </Container>
  );
}
