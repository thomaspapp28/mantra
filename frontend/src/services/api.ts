import type { CompletionRequest, CompletionResponse } from "../types";

const API = "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function throwIfNotOk(res: Response) {
  if (res.ok) return;
  const body = await res.json().catch(() => null);
  throw new ApiError(body?.detail ?? res.statusText, res.status);
}

export async function fetchCompletions(
  text: string,
  signal?: AbortSignal,
): Promise<CompletionResponse> {
  const res = await fetch(`${API}/completions?${new URLSearchParams({ text })}`, {
    signal,
  });
  await throwIfNotOk(res);
  return res.json();
}

export async function acceptCompletion(payload: CompletionRequest): Promise<void> {
  const res = await fetch(`${API}/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await throwIfNotOk(res);
}
