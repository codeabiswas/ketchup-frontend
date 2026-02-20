"use client";

import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  TextInput,
  Paper,
  Stack,
  Tabs,
  PasswordInput,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiPost<{ user_id: string }>("auth/signup", {
        email: email.trim(),
        name: name.trim() || undefined,
        password,
      });
      sessionStorage.setItem("ketchup_dev_user_id", res.user_id);
      router.push("/dashboard");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiPost<{ user_id: string }>("auth/signin", {
        email: email.trim(),
        password,
      });
      sessionStorage.setItem("ketchup_dev_user_id", res.user_id);
      router.push("/dashboard");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDevSignIn = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiPost<{ user_id: string }>("auth/google-signin", {
        email: email.trim(),
        name: name.trim() || email.split("@")[0],
        google_id: `dev-${Date.now()}`,
      });
      sessionStorage.setItem("ketchup_dev_user_id", res.user_id);
      router.push("/dashboard");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" py={60}>
      <Stack gap="xl">
        <div>
          <Title order={1} c="red.7" mb="xs">
            🍅 Ketchup
          </Title>
          <Text c="dimmed" size="lg">
            AI-powered social coordination for friend groups
          </Text>
        </div>

        <Tabs defaultValue="signin">
          <Tabs.List>
            <Tabs.Tab value="signin">Sign In</Tabs.Tab>
            <Tabs.Tab value="signup">Sign Up</Tabs.Tab>
            <Tabs.Tab value="dev">Dev (no password)</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="signin" pt="md">
            <Paper p="xl" shadow="sm" radius="md" withBorder>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && (
                  <Text size="sm" c="red">
                    {error}
                  </Text>
                )}
                <Button onClick={handleSignIn} loading={loading} color="red">
                  Sign In
                </Button>
              </Stack>
            </Paper>
          </Tabs.Panel>
          <Tabs.Panel value="signup" pt="md">
            <Paper p="xl" shadow="sm" radius="md" withBorder>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <TextInput
                  label="Name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <PasswordInput
                  label="Password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && (
                  <Text size="sm" c="red">
                    {error}
                  </Text>
                )}
                <Button onClick={handleSignUp} loading={loading} color="red">
                  Create Account
                </Button>
              </Stack>
            </Paper>
          </Tabs.Panel>
          <Tabs.Panel value="dev" pt="md">
            <Paper p="xl" shadow="sm" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb="md">
                Local dev – no password required
              </Text>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextInput
                  label="Name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {error && (
                  <Text size="sm" c="red">
                    {error}
                  </Text>
                )}
                <Button onClick={handleDevSignIn} loading={loading} color="red">
                  Sign In
                </Button>
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>

        <Text size="xs" c="dimmed">
          Ketchup autonomously generates event options, manages voting, and
          coordinates logistics so your group can catch up without the planning
          friction.
        </Text>
      </Stack>
    </Container>
  );
}
