import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Code2, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_35%),linear-gradient(135deg,_#f8fbff_0%,_#f3f6ff_48%,_#eef4ff_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-[0_25px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20">
                <Code2 size={18} />
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-900">DevBrand</span>
            </div>

            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">Sign in</h1>
            <p className="mb-7 text-sm text-slate-500">Welcome back to your brand command center.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className="input pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary mt-2 w-full justify-center">
                {loading ? "Signing in..." : <><span>Sign in</span><ArrowRight size={15} /></>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-violet-600 transition hover:text-violet-500">Sign up</Link>
            </p>
          </div>
        </div>

        <div className="hidden w-[420px] flex-col justify-center gap-4 border-l border-slate-200/80 bg-gradient-to-br from-violet-600/10 via-white to-cyan-500/10 p-10 lg:flex">
          <div className="max-w-[300px] text-center">
            <div className="mb-4 text-5xl">🏆</div>
            <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-900">Your milestones, shared automatically</h2>
            <p className="text-sm leading-7 text-slate-600">
              DevBrand watches your Codeforces, LeetCode, and GitHub activity and turns your achievements into polished posts in minutes.
            </p>
          </div>
          {['Newbie → Pupil detected 🎉', '100 problems solved 🔥', 'First PR merged ⭐'].map((t, i) => (
            <div key={i} className="w-full max-w-[300px] rounded-2xl border border-violet-200 bg-white/85 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
