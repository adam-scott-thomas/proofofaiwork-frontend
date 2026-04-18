export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["items", "data", "results", "assessments", "proof_pages", "projects"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

export function isoDate(value?: string | number | null, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", opts ?? {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function dateTime(value?: string | number | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function assessmentTitle(assessment: any) {
  return (
    assessment?.project_title ||
    assessment?.task_context ||
    assessment?.title ||
    `Assessment ${String(assessment?.id ?? "").slice(0, 8)}`
  );
}

export function proofPageTitle(page: any) {
  return page?.headline || page?.project_title || page?.summary || `Proof ${String(page?.id ?? "").slice(0, 8)}`;
}

export function proofPagePath(page: any) {
  const slug = page?.slug || page?.public_token;
  return slug ? `/p/${slug}` : null;
}

export function proofPageUrl(page: any) {
  const path = proofPagePath(page);
  return path ? `${window.location.origin}${path}` : null;
}

export function isPublishedProofPage(page: any) {
  return page?.status === "published";
}
