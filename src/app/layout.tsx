import type { Metadata } from "next";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "../styles/globals.css";
import { theme } from "@/theme";
import { AppShellNav } from "@/components/AppShellNav";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Ketchup - Plan Group Outings Without the Chaos",
  description:
    "AI-powered social coordination that generates personalized plans and handles group voting so friends can catch up.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <SessionProvider>
          <MantineProvider theme={theme} defaultColorScheme="light">
            <AppShellNav>{children}</AppShellNav>
          </MantineProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
