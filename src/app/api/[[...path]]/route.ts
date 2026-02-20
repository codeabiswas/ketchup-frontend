/**
 * Next.js API proxy - forwards requests to FastAPI backend.
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxyRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxyRequest(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxyRequest(request, params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  return proxyRequest(request, params, "DELETE");
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path?: string[] }>,
  method: string
) {
  const { path } = await params;
  const pathSegments = path || [];
  const pathStr = pathSegments.join("/");
  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const targetUrl = `${BACKEND_URL}/api/${pathStr}${query ? `?${query}` : ""}`;

  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    if (k.toLowerCase() === "host") return;
    headers[k] = v;
  });

  try {
    const body = method !== "GET" && method !== "HEAD" ? await request.text() : undefined;
    const res = await fetch(targetUrl, { method, headers, body });
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
      { status: 502 }
    );
  }
}
