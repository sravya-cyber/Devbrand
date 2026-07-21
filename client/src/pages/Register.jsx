import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Code2, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return toast.error("Passwords do not match");
    }
    if (form.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created! Welcome to DevBrand 🎉");
      navigate("/accounts");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_35%),linear-gradient(135deg,_#f8fbff_0%,_#f3f6ff_48%,_#eef4ff_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-[0_25px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
        <div className="w-full max-w-md px-6 py-10 sm:px-10">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20">
              <Code2 size={18} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">DevBrand</span>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-6 shadow-sm sm:p-8">
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Create account</h1>
            <p className="mb-6 text-sm text-slate-500">Start building your developer brand automatically.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-500">Full name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Sravya K"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-500">Email</label>
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
                <label className="mb-1.5 block text-sm text-slate-500">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className="input pr-10"
                    placeholder="Min. 6 characters"
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
              <div>
                <label className="mb-1.5 block text-sm text-slate-500">Confirm password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Re-enter password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-violet-600 transition hover:text-violet-500">Sign in</Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            After signing up, connect your GitHub, Codeforces, and LeetCode profiles to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
