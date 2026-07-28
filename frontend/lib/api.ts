import type { PublicResume, Resume, ResumeDocument } from "./types";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(`API request failed: ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

export function getApiBase(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }
  const override = new URLSearchParams(window.location.search).get("api");
  if (override) return override;
  const port = import.meta.env.VITE_API_PORT || "8000";
  return `${window.location.protocol}//${window.location.hostname}:${port}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload as T;
}

export const api = {
  listResumes: (includeDeleted = false) =>
    request<Resume[]>(`/api/resumes${includeDeleted ? "?include_deleted=true" : ""}`),
  createResume: (title = "새 문서", document?: ResumeDocument) =>
    request<Resume>("/api/resumes", {
      method: "POST",
      body: JSON.stringify({ title, document }),
    }),
  getResume: (id: string) => request<Resume>(`/api/resumes/${id}`),
  saveResume: (
    id: string,
    payload: { baseRevision: number; title: string; document: ResumeDocument },
  ) =>
    request<Resume>(`/api/resumes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteResume: (id: string) => request<Resume>(`/api/resumes/${id}`, { method: "DELETE" }),
  restoreResume: (id: string) =>
    request<Resume>(`/api/resumes/${id}/restore`, { method: "POST" }),
  duplicateResume: (id: string) =>
    request<Resume>(`/api/resumes/${id}/duplicate`, { method: "POST" }),
  publishResume: (id: string) =>
    request<Resume>(`/api/resumes/${id}/publish`, { method: "POST" }),
  unpublishResume: (id: string) =>
    request<Resume>(`/api/resumes/${id}/unpublish`, { method: "POST" }),
  getPublicResume: async (slug: string) => {
    const host = typeof window === "undefined" ? "localhost" : window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1" || host === "web";
    if (!isLocal) {
      const response = await fetch(`/data/${slug}.json`);
      if (!response.ok) throw new ApiError(response.status, null);
      return (await response.json()) as PublicResume;
    }
    return request<PublicResume>(`/api/public/resumes/${slug}`);
  },
  pdfUrl: (id: string) => `${getApiBase()}/api/resumes/${id}/pdf`,
  publicPdfUrl: (slug: string) => `${getApiBase()}/api/public/resumes/${slug}/pdf`,
};
