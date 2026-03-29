import { Link } from "react-router";
import { ArrowRight, Brain, Shield, TrendingUp, Zap, Upload, BarChart3, GraduationCap } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuthStore } from "../../stores/authStore";

export default function Landing() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Nav */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-xl font-bold tracking-tight">
          Proof<span className="text-blue-400">Of</span>AI<span className="text-blue-400">Work</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to={isAuthenticated() ? "/student" : "/sign-in?next=/student"}>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <GraduationCap className="w-4 h-4 mr-1.5" />
              For students
            </Button>
          </Link>
          {isAuthenticated() ? (
            <Link to="/dashboard">
              <Button variant="outline" className="border-gray-700 text-black bg-white hover:bg-gray-100">
                Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <Link to="/sign-in">
              <Button className="bg-blue-600 hover:bg-blue-500">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24 text-center max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Turn AI-assisted work into{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            verifiable proof
          </span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Upload your ChatGPT, Claude, or Grok conversations. Get scored on leadership,
          AI leverage, and cognitive amplification. Share proof of how you work with AI.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to={isAuthenticated() ? "/dashboard" : "/sign-in"}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-lg px-8 py-6">
              {isAuthenticated() ? "Go to Dashboard" : "Get Started"} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ═══════════ Student section ═══════════ */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/20 border-blue-700/30 p-0 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left - messaging */}
              <div className="p-10">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-6 h-6 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300 uppercase tracking-wider">For students</span>
                </div>
                <h2 className="text-3xl font-bold mb-4 text-white">
                  Prove your work is yours
                </h2>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Used ChatGPT or Claude to help with an assignment? Upload the conversation,
                  and we'll show exactly what you directed versus what AI produced.
                  Share the report with your professor.
                </p>
                <Link to={isAuthenticated() ? "/student" : "/sign-in?next=/student"}>
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-500">
                    Submit your work
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Right - 3 steps */}
              <div className="bg-gray-900/50 p-10 flex flex-col justify-center">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">Upload your conversation</h3>
                      <p className="text-sm text-gray-500">Export from ChatGPT or Claude. Drop the file.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">Get your report</h3>
                      <p className="text-sm text-gray-500">See how much you directed versus what AI produced.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">Share with your professor</h3>
                      <p className="text-sm text-gray-500">One link. No account needed on their end.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* How it works (professional) */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-gray-900/50 border-gray-800 p-8 text-center">
            <Upload className="w-10 h-10 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">1. Upload your exports</h3>
            <p className="text-gray-400 text-sm">
              Download your data from ChatGPT, Claude, or Grok. Upload the zip.
              We parse conversations, attachments, code blocks — everything.
            </p>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800 p-8 text-center">
            <Brain className="w-10 h-10 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">2. Get evaluated</h3>
            <p className="text-gray-400 text-sm">
              Our pipeline scores your work across leadership, execution, complexity,
              and amplification. Three scores, not one — because ownership, labor, and
              leverage are different things.
            </p>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800 p-8 text-center">
            <BarChart3 className="w-10 h-10 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">3. Share your profile</h3>
            <p className="text-gray-400 text-sm">
              Publish a proof page showing your AI Work Profile.
              Backed by evidence, not vibes. Verifiable, not claims.
            </p>
          </Card>
        </div>
      </section>

      {/* Three scores */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Three scores. Three dimensions.</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border border-blue-800/30 rounded-xl p-8">
            <div className="text-4xl font-bold text-blue-400 mb-2">HLS</div>
            <div className="text-sm text-blue-300 mb-4">Human Leadership Score</div>
            <p className="text-gray-400 text-sm">
              Who directed, constrained, corrected, and owned the work?
              Measures authorship and orchestration, not execution. 0–100.
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border border-purple-800/30 rounded-xl p-8">
            <div className="text-4xl font-bold text-purple-400 mb-2">AEL</div>
            <div className="text-sm text-purple-300 mb-4">AI Execution Load</div>
            <p className="text-gray-400 text-sm">
              How much of the literal production was handled by AI?
              A user can write zero code and still score high leadership. 0–100%.
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 border border-green-800/30 rounded-xl p-8">
            <div className="text-4xl font-bold text-green-400 mb-2">CAI</div>
            <div className="text-sm text-green-300 mb-4">Cognitive Amplification Index</div>
            <p className="text-gray-400 text-sm">
              How much did AI increase your effective capacity?
              Log₂-bounded. Measures real leverage, not inflation. Baseline 100%.
            </p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Evidence-backed scoring</div>
          <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> Adversarial integrity checks</div>
          <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Longitudinal maturity tracking</div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to prove your work?</h2>
        <p className="text-gray-400 mb-8">Upload your first conversation export and get scored in minutes.</p>
        <div className="flex gap-4 justify-center">
          <Link to={isAuthenticated() ? "/dashboard" : "/sign-in"}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-lg px-8 py-6">
              {isAuthenticated() ? "Go to Dashboard" : "Get Started Free"} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link to={isAuthenticated() ? "/student" : "/sign-in?next=/student"}>
            <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 text-lg px-8 py-6">
              <GraduationCap className="w-5 h-5 mr-2" />
              I'm a student
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-gray-600">
          ProofOfAIWork — Adam Thomas LLC
        </div>
      </footer>
    </div>
  );
}
