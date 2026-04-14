"use client";

import { useState, useEffect } from "react";
import { Group, Text, Button, Paper } from "@mantine/core";

const STORAGE_KEY = "ketchup-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  return (
    <Paper
      shadow="md"
      p="md"
      radius={0}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: "1px solid var(--mantine-color-gray-3)",
        backgroundColor: "white",
      }}
    >
      <Group justify="center" gap="md" wrap="wrap">
        <Text size="sm" c="gray.7">
          We use essential cookies to keep you signed in. No tracking cookies.
        </Text>
        <Button size="xs" onClick={handleDismiss}>
          Got it
        </Button>
      </Group>
    </Paper>
  );
}
