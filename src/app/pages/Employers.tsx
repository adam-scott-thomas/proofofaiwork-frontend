import MarketingPage from "../components/MarketingPage";

export default function Employers() {
  return (
    <MarketingPage
      title="Evaluate AI-Assisted Work | AI Portfolio Assessment for Employers"
      description="Evaluate AI-assisted work with proof, not polish. Review verified AI portfolios, evidence-backed projects, and process signals for hiring and candidate assessment."
      canonical="https://proofofaiwork.com/employers"
      eyebrow="For employers"
      h1="Evaluate AI-assisted work with proof, not polish"
      intro="Hiring teams do not need another self-reported portfolio or another AI detector. ProofOfAIWork gives employers a way to inspect how a candidate used AI: what they directed, what they rejected, what they verified, and how much judgment remained in the loop."
      sections={[
        {
          title: "Assess candidate AI skills",
          body: "Use verified AI portfolios and public proof pages to evaluate process, not just presentation. Look at evidence, observations, and trust signals instead of guessing from a polished artifact.",
        },
        {
          title: "Support skills-based hiring",
          body: "The most useful hiring signal is not whether AI was used. It is whether the candidate still demonstrated authorship, direction, and sound judgment while using it.",
        },
        {
          title: "Reduce ambiguity in interviews",
          body: "Candidates can show public proof of AI-assisted work before or during the hiring process, making portfolio review more concrete and less vulnerable to overclaiming.",
        },
      ]}
    />
  );
}
