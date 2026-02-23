/** API helpers that call the frontend proxy routes under `/api`. */
const API_BASE = "/api";

function parseErrorBody(text: string): string {
  try {
    const json = JSON.parse(text);
    if (typeof json.detail === "string") return json.detail;
    if (Array.isArray(json.detail))
      return json.detail.map((d: unknown) => String(d)).join("; ");
    if (json.error) return String(json.error);
  } catch {
    // Keep raw text when response body is not JSON.
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
  const res = await fetch(`${API_BASE}/${path}`);
  await checkOk(res);
  return res.json();
}

export async function apiPost<T = unknown>(
  path: string,
  body?: object | null,
): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  await checkOk(res);
  return res.json();
}

export async function apiPut<T = unknown>(
  path: string,
  body?: object,
): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  await checkOk(res);
  return res.json();
}
