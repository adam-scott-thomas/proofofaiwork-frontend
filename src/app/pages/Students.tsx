import MarketingPage from "../components/MarketingPage";

export default function Students() {
  return (
    <MarketingPage
      title="AI Portfolio for Students | Prove AI Skills to Employers"
      description="Build an AI portfolio that proves how you work. Show employers and internship teams evidence, process, and judgment behind AI-assisted student projects."
      canonical="https://proofofaiwork.com/students"
      eyebrow="For students"
      h1="Build an AI portfolio that proves how you work"
      intro="Students do not need another polished portfolio with zero evidence behind it. ProofOfAIWork helps you show how you used AI, where you led, what you corrected, and what actually counts as your contribution."
      sections={[
        {
          title: "Prove AI skills to employers",
          body: "Turn class projects, side projects, and internship work into evidence-backed proof pages that show process, judgment, and iteration instead of just finished output.",
        },
        {
          title: "Document AI-assisted work clearly",
          body: "Show your prompts, revisions, and evidence without pretending AI was never involved. The point is not hiding AI use. The point is proving you used it well.",
        },
        {
          title: "Stand out in a skeptical market",
          body: "Anyone can submit polished AI-assisted work. Fewer people can back it up with a verified AI portfolio that makes their contribution legible.",
        },
      ]}
    />
  );
}
