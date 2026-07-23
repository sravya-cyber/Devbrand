import { Link } from "react-router-dom";
import {
  Code2, Github, Trophy, Zap, BarChart2, CheckCircle, ArrowRight
} from "lucide-react";

const Feature = ({ icon: Icon, color, title, desc }) => (
  <div className="card hover:border-brand-500/30 transition-colors">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
      <Icon size={20} className="text-white" />
    </div>
    <h3 className="font-semibold text-slate-200 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const milestones = [
  "Codeforces rank upgrades (Newbie → Pupil → Expert...)",
  "LeetCode: 50, 100, 250, 500, 1000 problems solved",
  "LeetCode streaks: 7, 30, 100 days",
  "GitHub repo crossing 10, 50, 100 stars",
  "First open source PR merged",
  "New personal best rating in a contest",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_35%),linear-gradient(135deg,_#f8fbff_0%,_#f3f6ff_48%,_#eef4ff_100%)] text-slate-800">
      <nav className="mx-auto flex max-w-6xl items-center justify-between border-b border-slate-200/80 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20">
            <Code2 size={17} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">DevBrand</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary py-1.5 text-sm">Sign in</Link>
          <Link to="/register" className="btn-primary py-1.5 text-sm">Get started</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-6 py-16 text-center sm:px-8 sm:py-20">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
          <Zap size={12} /> AI-Powered Personal Branding
        </span>
        <h1 className="mb-5 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Your code deserves to be <span className="text-violet-600">seen</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-600">
          DevBrand watches your GitHub, LeetCode, and Codeforces activity, detects milestones the moment they happen, and drafts authentic social media posts about your real work — automatically.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="btn-primary flex items-center gap-2 px-6 py-2.5">
            Start for free <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn-secondary px-6 py-2.5">Sign in</Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">No credit card required. Completely free.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Everything you need to build your developer brand</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={Github}
            color="bg-slate-800"
            title="GitHub Activity Tracker"
            desc="Reads your commits, new repos, and merged PRs. Turns your coding activity into ready-to-post content automatically."
          />
          <Feature
            icon={Trophy}
            color="bg-amber-500"
            title="Milestone Detection"
            desc="Detects Codeforces rank upgrades, LeetCode streaks, GitHub star milestones the moment they happen and drafts a celebration post."
          />
          <Feature
            icon={Zap}
            color="bg-violet-600"
            title="AI Content Generator"
            desc="Generates 3 variants of every post in different tones. Scores your post before publishing and suggests improvements."
          />
          <Feature
            icon={BarChart2}
            color="bg-indigo-600"
            title="Analytics Dashboard"
            desc="Track impressions, engagement, and posting consistency with a GitHub-style activity heatmap and weekly AI summary."
          />
          <Feature
            icon={Code2}
            color="bg-emerald-600"
            title="Smart Scheduler"
            desc="Powered by a Bull.js job queue — posts are published reliably even if the server restarts, with automatic retry logic."
          />
          
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-16 sm:px-8">
        <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-6 shadow-sm sm:p-8">
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-slate-900">Never miss a milestone again</h2>
          <p className="mb-5 text-sm text-slate-500">DevBrand monitors these moments automatically and drafts a post for each one:</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {milestones.map((m) => (
              <div key={m} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle size={15} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-20 text-center sm:px-8">
        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-900">Ready to make your work visible?</h2>
        <p className="mb-6 text-sm text-slate-500">Connect your profiles and DevBrand starts watching for milestones immediately.</p>
        <Link to="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base">
          Get started free <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="border-t border-slate-200/80 py-6 text-center">
        <p className="text-xs text-slate-500">Built with MERN Stack · Gemini AI · Bull.js · Redis</p>
      </footer>
    </div>
  );
}
