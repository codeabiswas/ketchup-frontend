// src/app/api/auth/[...nextauth]/route.ts

// Auth.js v5 route handler — handles Google OAuth callbacks

import { handlers } from "@/auth";
export const { GET, POST } = handlers;
