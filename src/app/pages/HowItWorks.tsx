import MarketingPage from "../components/MarketingPage";

export default function HowItWorks() {
  return (
    <MarketingPage
      title="How AI Work Verification Works | Verified AI Portfolio Method"
      description="Learn how AI work verification works. ProofOfAIWork turns conversations, exports, and artifacts into verified AI portfolios with evidence, observations, and public proof."
      canonical="https://proofofaiwork.com/how-it-works"
      eyebrow="How it works"
      h1="How AI work verification works"
      intro="ProofOfAIWork does not try to detect whether AI was used. It starts from the assumption that AI was used and asks the question that actually matters: what did the human contribute to the process, direction, judgment, and execution of the work?"
      sections={[
        {
          title: "Upload the real workflow",
          body: "Users upload conversations, exports, and supporting artifacts so the system can inspect actual working context instead of polished final output alone.",
        },
        {
          title: "Trace signal from behavior",
          body: "The system evaluates signals like clarity, constraint quality, iteration discipline, verification habit, workflow efficiency, and output judgment.",
        },
        {
          title: "Publish evidence-backed proof",
          body: "The result is a verified AI portfolio or public proof page that shows observations, trust metadata, and selected excerpts without exposing private raw uploads.",
        },
      ]}
    />
  );
}
