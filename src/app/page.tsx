"use client";

import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  SimpleGrid,
  ThemeIcon,
  Group,
  Anchor,
  Divider,
  Box,
} from "@mantine/core";
import {
  IconSettings,
  IconSparkles,
  IconThumbUp,
  IconBrain,
  IconChartBar,
} from "@tabler/icons-react";
import { signIn } from "next-auth/react";
import { CookieConsent } from "@/components/CookieConsent";

function HeroSection() {
  return (
    <Box py={60} style={{ backgroundColor: "white" }}>
      <Container size="md">
        <Stack align="center" gap="md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Ketchup"
            style={{
              width: "min(400px, 75vw)",
              height: "auto",
              display: "block",
              margin: "-40px 0 -50px 0",
            }}
          />
          <Title
            order={1}
            ta="center"
            fw={800}
            fz={{ base: 32, sm: 42 }}
            c="gray.9"
          >
            Plan group outings without the group chat chaos
          </Title>
          <Text
            size="lg"
            c="gray.6"
            ta="center"
            maw={560}
            lh={1.6}
          >
            Ketchup uses AI to generate personalized plans for your group
            and handles voting so you can catch up without the planning friction.
          </Text>
          <Button
            size="lg"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            leftSection={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
            }
          >
            Get started with Google
          </Button>
          <Text size="xs" c="gray.5">
            Free to use &middot; No credit card required
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}

const steps = [
  {
    icon: IconSettings,
    title: "Set your preferences",
    description:
      "Budget, activity types, and busy times — so plans fit your life.",
  },
  {
    icon: IconSparkles,
    title: "AI generates 5 plans",
    description:
      "Personalized to your group's location, schedule, and tastes.",
  },
  {
    icon: IconThumbUp,
    title: "Vote and go",
    description:
      "Group ranks options and the winning plan is finalized automatically.",
  },
];

function HowItWorksSection() {
  return (
    <Box py={60}>
      <Container size="md">
        <Title order={2} ta="center" fw={700} mb={40} c="gray.9">
          How it works
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
          {steps.map((step, i) => (
            <Stack key={step.title} align="center" gap="sm">
              <ThemeIcon size={56} radius="xl" variant="light">
                <step.icon size={28} />
              </ThemeIcon>
              <Text size="xs" fw={700} c="gray.5">
                STEP {i + 1}
              </Text>
              <Text fw={600} size="lg" ta="center" c="gray.9">
                {step.title}
              </Text>
              <Text size="sm" c="gray.6" ta="center" maw={260}>
                {step.description}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

const features = [
  {
    icon: IconBrain,
    title: "Smart planning",
    description:
      "AI considers travel time, budget, and everyone's preferences to find the best options.",
  },
  {
    icon: IconChartBar,
    title: "Democratic decisions",
    description:
      "Ranked voting so no one person dominates the group chat.",
  },
];

function FeaturesSection() {
  return (
    <Box py={60} style={{ backgroundColor: "white" }}>
      <Container size="md">
        <Title order={2} ta="center" fw={700} mb={40} c="gray.9">
          Why Ketchup?
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" maw={600} mx="auto">
          {features.map((feature) => (
            <Stack key={feature.title} align="center" gap="sm">
              <ThemeIcon size={48} radius="xl" variant="light">
                <feature.icon size={24} />
              </ThemeIcon>
              <Text fw={600} size="lg" ta="center" c="gray.9">
                {feature.title}
              </Text>
              <Text size="sm" c="gray.6" ta="center" maw={280}>
                {feature.description}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

function Footer() {
  return (
    <Box
      py="lg"
      style={{
        borderTop: "1px solid var(--mantine-color-gray-2)",
        backgroundColor: "white",
      }}
    >
      <Container size="md">
        <Group justify="space-between" wrap="wrap">
          <Text size="sm" fw={600} c="gray.7">
            Ketchup
          </Text>
          <Group gap="lg">
            <Anchor href="#" size="xs" c="gray.5" underline="hover">
              Privacy Policy
            </Anchor>
            <Anchor href="#" size="xs" c="gray.5" underline="hover">
              Terms of Service
            </Anchor>
          </Group>
        </Group>
        <Text size="xs" c="gray.4" mt="xs">
          &copy; 2026 Ketchup. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <Divider color="gray.2" />
      <Footer />
      <CookieConsent />
    </>
  );
}
