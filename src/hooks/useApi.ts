import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPatch, apiDelete } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

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
export const useCurrentUser = () =>
  useAuthQuery(["me"], () => apiFetch<any>("/auth/me"));

// Pool
export const usePool = () =>
  useAuthQuery(["pool"], () => apiFetch<any>("/pool"));

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

// Work Profile
export const useWorkProfile = (projectId?: string) =>
  useAuthQuery(
    ["work-profile", projectId],
    () => apiFetch<any>(`/work-profile${projectId ? `?project_id=${projectId}` : ""}`),
    { retry: false },
  );

// Assessments
export const useAssessments = () =>
  useAuthQuery(["assessments"], () => apiFetch<any>("/assessments"));

// Proof Pages
export const useProofPages = () =>
  useAuthQuery(["proof-pages"], () => apiFetch<any>("/proof-pages"));

// Search (POST /memory/query)
export const useMemorySearch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (query: {
      q?: string;
      filter?: any;
      group_by?: string;
      aggregate?: string[];
      limit?: number;
    }) => apiPost<any>("/memory/query", query),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["search"] }),
  });
};

// Tags
export const useAddTag = () =>
  useMutation({
    mutationFn: ({
      uploadId,
      tag,
      turnIndex,
    }: {
      uploadId: string;
      tag: string;
      turnIndex?: number;
    }) => apiPost<any>(`/conversations/${uploadId}/tags`, { tag, turn_index: turnIndex }),
  });

export const useDeleteTag = () =>
  useMutation({
    mutationFn: ({ uploadId, tagId }: { uploadId: string; tagId: string }) =>
      apiDelete(`/conversations/${uploadId}/tags/${tagId}`),
  });

// Activity
export const useActivity = () =>
  useAuthQuery(["activity"], () => apiFetch<any>("/activity"));

// Upload
export const usePresignUpload = () =>
  useMutation({ mutationFn: (body: any) => apiPost<any>("/uploads/presign", body) });

export const useCompleteUpload = () =>
  useMutation({ mutationFn: (body: any) => apiPost<any>("/uploads/complete", body) });

// Upload Pool (list of uploads)
export const useUploads = () =>
  useAuthQuery(["uploads"], () => apiFetch<any>("/uploads"));

// Clustering
export const useTriggerClustering = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<any>("/projects/cluster", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

// Intake
export const useIntake = (projectId: string) =>
  useAuthQuery(["intake", projectId], () => apiFetch<any>(`/intake/${projectId}`), { enabled: !!projectId, retry: false });

export const useCreateIntake = () =>
  useMutation({ mutationFn: (body: any) => apiPost<any>("/intake", body) });

// Evaluate
export const useTriggerEvaluation = () =>
  useMutation({
    mutationFn: (projectId: string) =>
      apiPost<any>(`/work-profile/evaluate?project_id=${projectId}`, {}),
  });

// Billing
export const usePaymentConfig = () =>
  useAuthQuery<{ app_id: string; location_id: string }>(
    ["payment-config"],
    () => apiFetch<{ app_id: string; location_id: string }>("/payments/config"),
  );

export const useBilling = () =>
  useAuthQuery(["billing"], () => apiFetch<any>("/payments/billing"));

export const useSaveCard = () =>
  useMutation({ mutationFn: (body: any) => apiPost<any>("/payments/save-card", body) });

export const useCharge = () =>
  useMutation({ mutationFn: (body: any) => apiPost<any>("/payments/charge", body) });

export const useSubscribe = () =>
  useMutation({ mutationFn: (body: any) => apiPost<any>("/payments/subscribe", body) });

export const useSetModelTier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tier: string) => apiPost<any>(`/payments/set-model-tier?tier=${tier}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billing"] }),
  });
};

// Crypto (NowPayments)
export const useCreateCryptoInvoice = () =>
  useMutation({ mutationFn: (body: { feature: string }) => apiPost<any>("/payments/crypto-invoice", body) });

export const useCryptoStatus = (invoiceId: string | null) =>
  useAuthQuery(
    ["crypto-status", invoiceId],
    () => apiFetch<any>(`/payments/crypto-status/${invoiceId}`),
    { enabled: !!invoiceId },
  );

// Projects — mutations
export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      apiPost<any>("/projects", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

// AI Cluster
export const useAiClusterEstimate = () =>
  useAuthQuery(["ai-cluster-estimate"], () => apiFetch<any>("/projects/ai-cluster/estimate"));

export const useAiCluster = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: { source_id?: string }) =>
      apiPost<any>("/projects/ai-cluster", body ?? {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

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
      const token = localStorage.getItem("poaw-token");
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

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

// Global Search
export const useGlobalSearch = (q: string) =>
  useAuthQuery(
    ["search", q],
    () => apiFetch<any>(`/search?q=${encodeURIComponent(q)}`),
    { enabled: q.length >= 2 },
  );

// Update Profile
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => apiPatch<any>("/auth/me", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
};
