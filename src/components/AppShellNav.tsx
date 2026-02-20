"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppShell, Group, Title, Button, Text } from "@mantine/core";

export function AppShellNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <>{children}</>;
  }

  const handleSignOut = () => {
    sessionStorage.removeItem("ketchup_dev_user_id");
    window.location.href = "/";
  };

  return (
    <AppShell
      header={{ height: 56 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Title order={4} component={Link} href="/dashboard" c="red.7" style={{ textDecoration: "none" }}>
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
          <Button variant="subtle" color="gray" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
