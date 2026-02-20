/** API client - calls Next.js API routes (which proxy to backend). */
const API_BASE = "/api";

function getHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const devUserId = sessionStorage.getItem("ketchup_dev_user_id");
  if (devUserId) {
    return { "X-User-Id": devUserId, "Content-Type": "application/json" };
  }
  return { "Content-Type": "application/json" };
}

function parseErrorBody(text: string): string {
  try {
    const json = JSON.parse(text);
    if (typeof json.detail === "string") return json.detail;
    if (Array.isArray(json.detail)) return json.detail.map((d: unknown) => String(d)).join("; ");
    if (json.error) return String(json.error);
  } catch {
    /* not JSON */
  }
  return text || "Request failed";
}

async function checkOk(res: Response): Promise<void> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorBody(text));
  }
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, { headers: getHeaders() });
  await checkOk(res);
  return res.json();
}

export async function apiPost<T = unknown>(path: string, body?: object | null): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  await checkOk(res);
  return res.json();
}

export async function apiPut<T = unknown>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "PUT",
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  await checkOk(res);
  return res.json();
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  await checkOk(res);
  return res.json();
}
