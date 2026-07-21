import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { Trophy, CheckCircle, X, Send, RefreshCw, Star, Code, Github, Zap } from "lucide-react";

const PLATFORM_CONFIG = {
  codeforces: { icon: Trophy, color: "#ca8a04", bg: "#fef9c3", label: "Codeforces" },
  leetcode:   { icon: Code,   color: "#f97316", bg: "#ffedd5", label: "LeetCode"   },
  github:     { icon: Github, color: "#4b5563", bg: "#f3f4f6", label: "GitHub"     },
};

const STATUS_FILTERS = [
  { key: "all",            label: "All"       },
  { key: "pending",        label: "Pending"   },
  { key: "post_drafted",   label: "Drafted"   },
  { key: "post_published", label: "Published" },
  { key: "dismissed",      label: "Dismissed" },
];

export default function Milestones() {
  const navigate = useNavigate();
  const [milestones,   setMilestones]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState("all");
  const [expanded,     setExpanded]     = useState(null);
  const [scheduling,   setScheduling]   = useState({});
  const [dismissing,   setDismissing]   = useState({});
  const [scheduleTime, setScheduleTime] = useState({});
  const [checking,     setChecking]     = useState(false);

  useEffect(() => {
    api.patch("/milestones/notifications/read").catch(() => {});
  }, []);

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const { data } = await api.get("/milestones", { params });
      setMilestones(data.milestones);
    } catch { toast.error("Failed to load milestones"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMilestones(); }, [filter]);

  const handleSchedule = async (m) => {
    const time = scheduleTime[m._id];
    if (!time) return toast.error("Pick a schedule time first");
    setScheduling(s => ({ ...s, [m._id]: true }));
    try {
      await api.post("/posts", {
        content: m.draftedContent, platforms: ["linkedin"],
        scheduledAt: time, aiGenerated: true, aiSource: m.platform, milestoneId: m._id,
      });
      await api.patch(`/milestones/${m._id}/dismiss`);
      toast.success("Post scheduled! 🎉");
      fetchMilestones();
      navigate("/calendar");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setScheduling(s => ({ ...s, [m._id]: false })); }
  };

  const handleDismiss = async (id) => {
    setDismissing(s => ({ ...s, [id]: true }));
    try { await api.patch(`/milestones/${id}/dismiss`); fetchMilestones(); }
    catch { toast.error("Failed to dismiss"); }
    finally { setDismissing(s => ({ ...s, [id]: false })); }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      await api.post("/accounts/check-milestones");
      toast.success("Checking milestones... refresh in a moment");
      setTimeout(() => { fetchMilestones(); setChecking(false); }, 4000);
    } catch { toast.error("Failed"); setChecking(false); }
  };

  const pendingCount = milestones.filter(m => m.status === "pending").length;
  const minDateTime  = new Date(Date.now() + 2 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div style={{ minHeight: "100%", width: "100%", padding: "32px 40px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a2e", letterSpacing: "-0.02em" }}>Milestones</h1>
              {pendingCount > 0 && (
                <span style={{ background: "#fef9c3", color: "#ca8a04", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, border: "1px solid #fde68a" }}>
                  {pendingCount} pending
                </span>
              )}
            </div>
            <p style={{ color: "#9a9ab8", fontSize: 13 }}>Achievements auto-detected from your coding activity</p>
          </div>
          <button onClick={handleCheckNow} disabled={checking} className="btn-secondary" style={{ fontSize: 13 }}>
            <RefreshCw size={13} style={{ animation: checking ? "spin 0.7s linear infinite" : "none" }} />
            {checking ? "Checking..." : "Check Now"}
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f0f2f7", padding: 4, borderRadius: 12, width: "fit-content", border: "1px solid #e8eaf5" }}>
          {STATUS_FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: "7px 18px", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif", transition: "all 0.15s",
              background: filter === key ? "#ffffff" : "transparent",
              color: filter === key ? "#5b5ef4" : "#9a9ab8",
              boxShadow: filter === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>{label}</button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: 28, height: 28, border: "2px solid #5b5ef4", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : milestones.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #e8eaf5", borderRadius: 16, padding: "64px 32px", textAlign: "center" }}>
            <Trophy size={44} color="#e8eaf5" style={{ margin: "0 auto 14px" }} />
            <p style={{ color: "#1a1a2e", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No milestones yet</p>
            <p style={{ color: "#9a9ab8", fontSize: 13, lineHeight: 1.7 }}>
              Connect your Codeforces, LeetCode, or GitHub profile.<br />
              Milestones are checked every 30 minutes automatically.
            </p>
            <button onClick={handleCheckNow} disabled={checking} className="btn-primary" style={{ marginTop: 18, fontSize: 13 }}>
              <RefreshCw size={13} /> Check Now
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(520px, 1fr))", gap: 14 }}>
            {milestones.map((m, i) => {
              const cfg       = PLATFORM_CONFIG[m.platform] || { icon: Star, color: "#5b5ef4", bg: "#eeeffe", label: m.platform };
              const Icon      = cfg.icon;
              const isExpanded  = expanded === m._id;
              const isPending   = m.status === "pending";
              const isPublished = m.status === "post_published";
              const isDismissed = m.status === "dismissed";

              return (
                <div key={m._id} className="animate-fade-up" style={{
                  animationDelay: `${i * 30}ms`,
                  background: "#ffffff",
                  border: `1px solid ${isPending ? "#fde68a" : isPublished ? "#bbf7d0" : "#e8eaf5"}`,
                  borderRadius: 14, padding: "18px 20px",
                  opacity: isDismissed ? 0.55 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={18} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e", lineHeight: 1.4 }}>{m.title}</p>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, flexShrink: 0,
                          fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.05em",
                          background: isPending ? "#fef9c3" : isPublished ? "#dcfce7" : isDismissed ? "#f1f5f9" : "#eeeffe",
                          color:      isPending ? "#ca8a04" : isPublished ? "#16a34a" : isDismissed ? "#94a3b8" : "#5b5ef4",
                          border: `1px solid ${isPending ? "#fde68a" : isPublished ? "#bbf7d0" : "#e2e8f0"}`,
                        }}>
                          {m.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#9a9ab8", marginTop: 3 }}>
                        <span style={{ color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
                        {" · "}
                        {new Date(m.detectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {isPending && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                      <button onClick={() => setExpanded(isExpanded ? null : m._id)} style={{
                        fontSize: 12, color: "#5b5ef4", background: "none", border: "none",
                        cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 500,
                        padding: 0, marginBottom: isExpanded ? 10 : 12,
                      }}>
                        {isExpanded ? "▲ Hide AI draft" : "▼ View AI draft post"}
                      </button>

                      {isExpanded && (
                        <div style={{ background: "#f7f8ff", border: "1px solid #e2e4f0", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                            <Zap size={11} color="#5b5ef4" />
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#5b5ef4", letterSpacing: "0.08em", fontFamily: "JetBrains Mono" }}>AI DRAFT</span>
                          </div>
                          <p style={{ fontSize: 13, color: "#2a2a4a", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                            {m.draftedContent || "No draft available"}
                          </p>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <input type="datetime-local" min={minDateTime}
                          className="input" style={{ flex: 1, minWidth: 180, fontSize: 13 }}
                          value={scheduleTime[m._id] || ""}
                          onChange={e => setScheduleTime(s => ({ ...s, [m._id]: e.target.value }))}
                        />
                        <button onClick={() => handleSchedule(m)}
                          disabled={scheduling[m._id] || !scheduleTime[m._id]}
                          className="btn-primary" style={{ flexShrink: 0, fontSize: 13 }}>
                          {scheduling[m._id]
                            ? <><RefreshCw size={13} style={{ animation: "spin 0.7s linear infinite" }} /> Scheduling...</>
                            : <><Send size={13} /> Schedule Post</>}
                        </button>
                        <button onClick={() => handleDismiss(m._id)} disabled={dismissing[m._id]}
                          className="btn-secondary" style={{ flexShrink: 0, fontSize: 13 }}>
                          <X size={13} /> Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  {isPublished && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle size={13} color="#16a34a" />
                      <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>Post published successfully</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
