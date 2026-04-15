"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

const ketchupRed: MantineColorsTuple = [
  "#fff0f0",
  "#ffdddd",
  "#fbb8b8",
  "#f78f8f",
  "#f36c6c",
  "#f15656",
  "#f14a4a",
  "#d63b3b",
  "#bf3232",
  "#a52727",
];

export const theme = createTheme({
  primaryColor: "ketchupRed",
  colors: {
    ketchupRed,
  },
  fontFamily: "Inter, sans-serif",
  headings: {
    fontFamily: "Inter, sans-serif",
    fontWeight: "700",
  },
  radius: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
  defaultRadius: "md",
  components: {
    Paper: {
      defaultProps: {
        radius: "md",
        p: "lg",
      },
    },
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Card: {
      defaultProps: {
        radius: "md",
        withBorder: true,
      },
    },
  },
});
