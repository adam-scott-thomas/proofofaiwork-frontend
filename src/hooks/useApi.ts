import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPatch } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

export type ClusterJobResponse = {
  job_id: string;
  status: "queued";
};

export type ClusterStatusResponse = {
  job_id: string;
  status: "queued" | "running" | "complete" | "failed";
  result?: {
    projects?: any[];
    unclustered_count?: number;
    total_conversations?: number;
  };
  error_message?: string;
};

export type FrontendState = {
  dashboard?: {
    next_recommended_action?: string | {
      label?: string;
      href?: string;
      action?: string;
      disabled?: boolean;
      reason?: string;
    };
    [key: string]: any;
  };
  actions?: Record<string, boolean | { enabled?: boolean; disabled?: boolean; reason?: string; label?: string; href?: string }>;
  counts?: Record<string, number>;
  [key: string]: any;
};

export function getClusterStatus(jobId: string) {
  return apiFetch<ClusterStatusResponse>(`/projects/cluster-status/${jobId}`);
}

// Helper used by raw-fetch multipart uploads — reads from zustand, not localStorage
function getAuthHeader(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Helper: only run query when authenticated
function useAuthQuery<T>(key: string[], fn: () => Promise<T>, opts?: { enabled?: boolean; retry?: boolean }) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: key,
    queryFn: fn,
    enabled: isAuthenticated() && (opts?.enabled ?? true),
    ...(opts?.retry !== undefined ? { retry: opts.retry } : {}),
  });
}

// Auth
export const useFrontendState = () =>
  useAuthQuery<FrontendState>(["state"], () => apiFetch<FrontendState>("/state"));

export const useCurrentUser = () =>
  useAuthQuery(["me"], () => apiFetch<any>("/auth/me"));

// Pool view uses the approved conversations endpoint as its source.
export const usePool = () =>
  useAuthQuery(["conversations"], () => apiFetch<any>("/conversations"));

// Conversations
export const useConversations = (params?: { project_id?: string; cursor?: string }) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["conversations", params],
    queryFn: () => {
      const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : "";
      return apiFetch<any>(`/conversations${qs ? `?${qs}` : ""}`);
    },
    enabled: isAuthenticated(),
  });
};

export const useConversation = (id: string) =>
  useAuthQuery(["conversation", id], () => apiFetch<any>(`/conversations/${id}`), { enabled: !!id });

// Projects
export const useProjects = () =>
  useAuthQuery(["projects"], () => apiFetch<any>("/projects"));

export const useProject = (id: string) =>
  useAuthQuery(["project", id], () => apiFetch<any>(`/projects/${id}`), { enabled: !!id });

// Assessments
export const useAssessments = () =>
  useAuthQuery(["assessments"], () => apiFetch<any>("/assessments"));

// Proof Pages
export const useProofPages = () =>
  useAuthQuery(["proof-pages"], () => apiFetch<any>("/proof-pages"));

// Upload
export const usePresignUpload = () =>
  useMutation({ mutationFn: (body: any) => apiPost<any>("/uploads/presign", body) });

export const useCompleteUpload = () =>
  useMutation({ mutationFn: (body: any) => apiPost<any>("/uploads/complete", body) });

// Evaluate
export const useTriggerEvaluation = () =>
  useMutation({
    mutationFn: (projectId: string) =>
      apiPost<any>(`/projects/${projectId}/evaluate`, {}),
  });

// Billing
export const useBilling = () =>
  useAuthQuery(["billing-entitlements"], () => apiFetch<any>("/billing/entitlements"));

export const useBillingSkus = () =>
  useAuthQuery(["billing-skus"], () => apiFetch<any>("/billing/skus"));

export const useBillingCheckout = () =>
  useMutation({ mutationFn: (body: any) => apiPost<any>("/billing/checkout", body) });

// Projects — mutations
export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    // Backend expects `title`; accept `name` from legacy callers and normalize.
    mutationFn: (body: { title?: string; name?: string; description?: string }) =>
      apiPost<any>("/projects", {
        title: body.title ?? body.name ?? "",
        description: body.description,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useAiCluster = () => {
  return useMutation({
    mutationFn: (body?: { tier?: "free" | "paid" | "premium" }) =>
      apiPost<ClusterJobResponse>("/projects/ai-cluster", body ?? { tier: "free" }),
  });
};

export const useClusterStatus = (jobId: string | null, enabled = true) =>
  useQuery({
    queryKey: ["cluster-status", jobId],
    queryFn: () => getClusterStatus(jobId!),
    enabled: !!jobId && enabled,
    refetchInterval: enabled && jobId ? 1500 : false,
  });

// Proof Pages — mutations
export const useCreateProofPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => apiPost<any>("/proof-pages", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proof-pages"] }),
  });
};

export const usePublishProofPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<any>(`/proof-pages/${id}/publish`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proof-pages"] }),
  });
};

// Assessments — single item + results
export const useAssessment = (id: string, opts?: { refetchInterval?: number | false }) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["assessment", id],
    queryFn: () => apiFetch<any>(`/assessments/${id}`),
    enabled: isAuthenticated() && !!id,
    refetchInterval: opts?.refetchInterval,
  });
};

export const useAssessmentResults = (id: string) =>
  useAuthQuery(
    ["assessment-results", id],
    () => apiFetch<any>(`/assessments/${id}/results`),
    { enabled: !!id },
  );

// Direct Upload — presign → PUT file(s) → complete
export const useDirectUpload = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      files,
      metadata,
    }: {
      files: File | File[];
      metadata?: Record<string, any>;
    }) => {
      const fileArray = Array.isArray(files) ? files : [files];
      const isSingle = fileArray.length === 1;

      // Step 1: presign
      const firstFile = fileArray[0];
      const ext = firstFile.name.includes(".") ? firstFile.name.split(".").pop()! : "txt";
      const presignRes = await apiPost<any>("/uploads/presign", {
        file_name: firstFile.name,
        file_type: ext,
        file_size_bytes: firstFile.size,
        ...metadata,
      });
      const uploadId: string = presignRes.upload_id;

      const apiHost = import.meta.env.VITE_API_URL || "";
      const apiBase = apiHost ? `${apiHost.replace(/\/$/, "")}/api/v1` : "/api/v1";
      const authHeader = getAuthHeader();

      // Step 2: PUT file(s) — FastAPI expects multipart form data
      let putResp: Response;
      if (isSingle) {
        const formData = new FormData();
        formData.append("file", fileArray[0]);
        putResp = await fetch(`${apiBase}/uploads/${uploadId}/file`, {
          method: "PUT",
          headers: { ...authHeader },
          body: formData,
        });
      } else {
        const formData = new FormData();
        fileArray.forEach((f) => formData.append("files", f));
        putResp = await fetch(`${apiBase}/uploads/${uploadId}/files`, {
          method: "PUT",
          headers: { ...authHeader },
          body: formData,
        });
      }

      if (!putResp.ok) {
        const err = await putResp.json().catch(() => ({ detail: putResp.statusText }));
        throw new Error(err.detail || err.message || `Upload failed (${putResp.status})`);
      }

      // Step 3: complete
      const result = await apiPost<any>("/uploads/complete", { upload_id: uploadId });
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["uploads"] }),
  });
};

// Update Profile
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => apiPatch<any>("/auth/me", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
};
