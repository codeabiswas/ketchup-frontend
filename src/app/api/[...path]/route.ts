// src/app/api/[...path]/route.ts

/**
 * Next.js API proxy — forwards requests to FastAPI backend.
 *
 * KEY CHANGE: Reads the Auth.js session server-side and injects
 * the X-User-Id header. The browser never sees or sends this header.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const BACKEND_INTERNAL_API_KEY = process.env.BACKEND_INTERNAL_API_KEY || "";
const BACKEND_REQUEST_TIMEOUT_MS = Number(
  process.env.BACKEND_REQUEST_TIMEOUT_MS || "360000",
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return proxyRequest(request, params, "DELETE");
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path?: string[] }>,
  method: string,
) {
  const { path } = await params;
  const pathSegments = path || [];
  const pathStr = pathSegments.join("/");

  // Don't proxy auth routes — Auth.js handles those via [...nextauth]
  if (pathStr.startsWith("auth/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const targetUrl = `${BACKEND_URL}/api/${pathStr}${query ? `?${query}` : ""}`;

  // Read Auth.js session to get the user's backend UUID
  const session = await auth();
  const userId = session?.user?.id;

  const headers: Record<string, string> = {
    "Content-Type": request.headers.get("Content-Type") || "application/json",
  };

  if (BACKEND_INTERNAL_API_KEY) {
    headers["X-Internal-Auth"] = BACKEND_INTERNAL_API_KEY;
  }

  // Inject X-User-Id if user is authenticated
  if (userId) {
    headers["X-User-Id"] = userId;
  }

  try {
    const body =
      method !== "GET" && method !== "HEAD" ? await request.text() : undefined;
    const signal = AbortSignal.timeout(BACKEND_REQUEST_TIMEOUT_MS);
    const res = await fetch(targetUrl, {
      method,
      headers,
      body,
      signal,
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { error: "Backend unavailable", details: String(err) },
      { status: 502 },
    );
  }
}
