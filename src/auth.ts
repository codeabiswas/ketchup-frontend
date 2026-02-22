// src/auth.ts — Auth.js v5 configuration

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// The backend URL — inside Docker, this is the service name.
// Outside Docker, it's localhost.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    /**
     * JWT callback — runs on every token creation/refresh.
     *
     * On FIRST sign-in (when `account` and `profile` exist),
     * we call the backend's google-signin endpoint to upsert
     * the user and get their stable UUID.
     */
    async jwt({ token, account, profile }) {
      if (account && profile) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/google-signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name,
              google_id: profile.sub,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.userId = data.user_id;
          }
        } catch (err) {
          console.error("Backend user sync failed:", err);
        }
      }
      return token;
    },

    /**
     * Session callback — exposes the userId to client components
     * via useSession() or the session object.
     */
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Redirect to home page for sign-in
  },
});
