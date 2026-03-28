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
