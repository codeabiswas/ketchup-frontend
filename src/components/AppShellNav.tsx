"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppShell, Group, Text, Button } from "@mantine/core";
import { IconSoup } from "@tabler/icons-react";
import { signOut } from "next-auth/react";

export function AppShellNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="xl">
            <Link
              href="/dashboard"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}
            >
              <IconSoup size={24} color="var(--mantine-color-ketchupRed-6)" />
              <Text fw={700} size="lg" c="ketchupRed.6">
                Ketchup
              </Text>
            </Link>
            <Group gap="xs">
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
                Busy Times
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
