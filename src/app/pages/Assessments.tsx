import { FileBarChart, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAssessments } from "../../hooks/useApi";
import { apiPost } from "../../lib/api";
import { asArray, assessmentTitle, dateTime } from "../lib/poaw";

export default function Assessments() {
  const { data, isLoading, refetch } = useAssessments();

  const rerun = async (assessmentId: string) => {
    try {
      await apiPost(`/assessments/${assessmentId}/rerun`, {});
      toast.success("Assessment queued for rerun");
      refetch();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to rerun assessment");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading assessments...
      </div>
    );
  }

  const assessments = asArray<any>(data);

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Assessments</div>
          <h1 className="mt-2 text-3xl tracking-tight">Evaluation runs and results.</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5C5C5C]">
            Completed projects can be evaluated. From there you can open results, inspect the work profile,
            and create a proof page.
          </p>
        </div>
      </header>

      <div className="px-8 py-8">
        {assessments.length === 0 ? (
          <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-8 text-[14px] text-[#5C5C5C] shadow-sm">
            No assessments yet.
          </Card>
        ) : (
          <div className="space-y-3">
            {assessments.map((assessment) => (
              <Card key={assessment.id} className="border border-[#D8D2C4] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-[15px]">
                      <FileBarChart className="h-4 w-4 text-[#315D8A]" />
                      {assessmentTitle(assessment)}
                    </div>
                    <div className="mt-2 text-[13px] text-[#5C5C5C]">
                      status {assessment.status}
                      {assessment.project_title ? ` • ${assessment.project_title}` : ""}
                      {assessment.confidence ? ` • confidence ${assessment.confidence}` : ""}
                    </div>
                    <div className="mt-1 text-[12px] text-[#6B6B66]">
                      created {dateTime(assessment.created_at)} • updated {dateTime(assessment.updated_at)}
                    </div>
                    {assessment.failure_reason ? (
                      <div className="mt-2 text-[12px] text-[#8E3B34]">{assessment.failure_reason}</div>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/app/assessment/${assessment.id}/results`}>
                      <Button variant="outline">Open results</Button>
                    </Link>
                    <Button variant="outline" onClick={() => rerun(assessment.id)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Rerun
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
