// src/components/AppShellNav.tsx

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppShell, Group, Title, Button } from "@mantine/core";
import { signOut } from "next-auth/react";

export function AppShellNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show nav on the landing page
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Title
              order={4}
              component={Link}
              href="/dashboard"
              c="red.7"
              style={{ textDecoration: "none" }}
            >
              🍅 Ketchup
            </Title>
            <Group gap="xs" ml="xl">
              <Button
                component={Link}
                href="/dashboard"
                variant={pathname === "/dashboard" ? "light" : "subtle"}
                size="sm"
              >
                Dashboard
              </Button>
              <Button
                component={Link}
                href="/settings"
                variant={pathname?.startsWith("/settings") ? "light" : "subtle"}
                size="sm"
              >
                Availability
              </Button>
            </Group>
          </Group>
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </Button>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
