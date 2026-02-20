import type { Metadata } from "next";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "../styles/globals.css";
import { AppShellNav } from "@/components/AppShellNav";

export const metadata: Metadata = {
  title: "Ketchup - Social Coordination",
  description: "AI-powered social coordination for friend groups",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MantineProvider defaultColorScheme="light">
          <AppShellNav>{children}</AppShellNav>
        </MantineProvider>
      </body>
    </html>
  );
}
