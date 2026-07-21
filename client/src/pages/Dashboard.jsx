import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  PenSquare, Trophy, BarChart2, Clock,
  CheckCircle, Zap, TrendingUp, ArrowRight, Code
} from "lucide-react";

const StatCard = ({ label, value, icon: Icon, color, bg }) => (
  <div className="card" style={{ display:"flex", alignItems:"center", gap:14, flex:1 }}>
    <div style={{ width:44, height:44, borderRadius:13, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <Icon size={21} color={color} />
    </div>
    <div>
      <p className="stat-num">{value}</p>
      <p style={{ fontSize:12, color:"#9a9ab8", marginTop:1 }}>{label}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { user, fetchMe } = useAuth();

  // Re-fetch user after 6s to get updated stats from background check
  useEffect(() => {
    const timer = setTimeout(() => fetchMe().catch(() => {}), 6000);
    return () => clearTimeout(timer);
  }, []);
  const [overview,    setOverview]    = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [milestones,  setMilestones]  = useState([]);
  const [digest,      setDigest]      = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/analytics/overview"),
      api.get("/posts?limit=4"),
      api.get("/milestones?status=pending"),
      api.get("/ai/weekly-digest"),
    ]).then(([ov, po, mi, dg]) => {
      setOverview(ov.data);
      setRecentPosts(po.data.posts);
      setMilestones(mi.data.milestones);
      setDigest(dg.data.digest);
    }).catch(console.error);
  }, []);

  const statusCfg = {
    published: { bg:"#dcfce7", color:"#16a34a", label:"Published" },
    scheduled:  { bg:"#fef9c3", color:"#ca8a04", label:"Scheduled" },
    failed:     { bg:"#fee2e2", color:"#dc2626", label:"Failed" },
    draft:      { bg:"#f1f5f9", color:"#64748b", label:"Draft" },
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ padding:"28px 32px", maxWidth:"100%" }}>

      {/* Header */}
      <div style={{ marginBottom:24, display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontSize:12, color:"#9a9ab8", fontWeight:500, marginBottom:3 }}>{greeting}, {user?.name?.split(" ")[0]} 👋</p>
          <h1 style={{ fontSize:26, fontWeight:700, color:"#1a1a2e", letterSpacing:"-0.03em" }}>Brand Dashboard</h1>
        </div>
        <Link to="/posts/create" className="btn-primary" style={{ fontSize:13 }}>
          <PenSquare size={15}/> Create Post
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display:"flex", gap:14, marginBottom:24 }}>
        <StatCard label="Total Posts"       value={overview?.overview?.totalPosts||0}     icon={PenSquare}  color="#5b5ef4" bg="#eeeffd" />
        <StatCard label="Published"         value={overview?.overview?.publishedPosts||0} icon={CheckCircle} color="#16a34a" bg="#dcfce7" />
        <StatCard label="Scheduled"         value={overview?.overview?.scheduledPosts||0} icon={Clock}      color="#ca8a04" bg="#fef9c3" />
        <StatCard label="Total Impressions" value={(overview?.overview?.totalImpressions||0).toLocaleString()} icon={TrendingUp} color="#7c3aed" bg="#ede9fe" />
      </div>

      {/* Main grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 320px", gap:18 }}>

        {/* Coding activity */}
        <div className="card">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <p style={{ fontWeight:600, fontSize:14, color:"#1a1a2e" }}>Coding Activity</p>
            <span className="code-tag">live</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { label:"Codeforces Rating", value: user?.stats?.codeforces?.rating ?? "—", sub: user?.stats?.codeforces?.rank || "Connect profile", subColor:"#5b5ef4", bar: Math.min((user?.stats?.codeforces?.rating||0)/3000*100,100) },
              { label:"LeetCode Solved",   value: user?.stats?.leetcode?.totalSolved ?? "—", sub: user?.stats?.leetcode?.streak ? `🔥 ${user.stats.leetcode.streak}-day streak` : "Connect profile", subColor:"#f97316", bar: Math.min((user?.stats?.leetcode?.totalSolved||0)/1000*100,100) },
              { label:"GitHub Stars",      value: user?.stats?.github?.totalStars ?? "—", sub: user?.stats?.github?.publicRepos ? `${user.stats.github.publicRepos} repositories` : "Connect profile", subColor:"#7c3aed", bar: Math.min((user?.stats?.github?.totalStars||0)/100*100,100) },
            ].map(({ label, value, sub, subColor, bar }) => (
              <div key={label} style={{ background:"#f7f8ff", borderRadius:12, padding:"13px 16px", border:"1px solid #e8eaf5" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:12, color:"#9a9ab8", fontWeight:500 }}>{label}</span>
                  <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:18, color:"#1a1a2e" }}>{value}</span>
                </div>
                <div style={{ height:4, borderRadius:99, background:"#e8eaf5", marginBottom:6 }}>
                  <div style={{ height:"100%", borderRadius:99, background:subColor, width:`${bar}%`, transition:"width 0.6s ease" }} />
                </div>
                <p style={{ fontSize:11, color:subColor, fontWeight:500 }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent posts */}
        <div className="card">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <p style={{ fontWeight:600, fontSize:14, color:"#1a1a2e" }}>Recent Posts</p>
            <Link to="/posts/create" style={{ fontSize:12, color:"#5b5ef4", textDecoration:"none", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
              + New <ArrowRight size={11}/>
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 0", color:"#b0b3cc" }}>
              <PenSquare size={28} style={{ margin:"0 auto 10px", opacity:0.3 }} />
              <p style={{ fontSize:13 }}>No posts yet</p>
              <Link to="/posts/create" className="btn-primary" style={{ marginTop:12, fontSize:12, padding:"8px 18px", display:"inline-flex" }}>
                Create your first post
              </Link>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {recentPosts.map(post => {
                const s = statusCfg[post.status] || statusCfg.draft;
                return (
                  <div key={post._id} style={{ padding:"12px 14px", borderRadius:12, background:"#f7f8ff", border:"1px solid #e8eaf5", display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, color:"#2a2a4a", lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                        {post.content}
                      </p>
                      <div style={{ display:"flex", gap:6, marginTop:8, alignItems:"center" }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:s.bg, color:s.color }}>{s.label}</span>
                        {post.platforms?.map(p => <span key={p} style={{ fontSize:11, color:"#9a9ab8", textTransform:"capitalize" }}>{p}</span>)}
                      </div>
                    </div>
                    {post.engagementScore?.score && (
                      <div style={{ textAlign:"center", flexShrink:0 }}>
                        <p style={{ fontFamily:"JetBrains Mono", fontSize:17, fontWeight:700, color: post.engagementScore.score>=7?"#16a34a":"#ca8a04" }}>{post.engagementScore.score}</p>
                        <p style={{ fontSize:9, color:"#b0b3cc" }}>score</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Milestones */}
          <div className="card" style={{ flex:"none" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <p style={{ fontWeight:600, fontSize:14, color:"#1a1a2e", display:"flex", alignItems:"center", gap:6 }}>
                <Trophy size={15} color="#ca8a04"/> Milestones
              </p>
              {milestones.length > 0 && (
                <span style={{ background:"#fef9c3", color:"#ca8a04", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, border:"1px solid #fde68a" }}>
                  {milestones.length} new
                </span>
              )}
            </div>
            {milestones.length === 0 ? (
              <p style={{ fontSize:12, color:"#b0b3cc", textAlign:"center", padding:"12px 0" }}>No pending milestones</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {milestones.slice(0,3).map(m => (
                  <Link key={m._id} to="/milestones" style={{
                    display:"block", padding:"10px 12px", borderRadius:10,
                    background:"#f7f8ff", border:"1px solid #e8eaf5",
                    textDecoration:"none", transition:"border-color 0.15s",
                  }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#c5c7e8"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#e8eaf5"}
                  >
                    <p style={{ fontSize:12, fontWeight:600, color:"#1a1a2e" }}>{m.title}</p>
                    <p style={{ fontSize:11, color:"#9a9ab8", marginTop:2, textTransform:"capitalize" }}>{m.platform}</p>
                  </Link>
                ))}
                <Link to="/milestones" style={{ fontSize:12, color:"#5b5ef4", textDecoration:"none", fontWeight:500, display:"flex", alignItems:"center", gap:4, padding:"4px 4px 0" }}>
                  View all {milestones.length} <ArrowRight size={11}/>
                </Link>
              </div>
            )}
          </div>

          {/* Weekly Digest */}
          {digest && (
            <div style={{ background:"linear-gradient(135deg,#eeeffe,#f3e8ff)", border:"1px solid #ddd6fe", borderRadius:16, padding:"18px 18px" }}>
              <p style={{ fontWeight:600, fontSize:13, color:"#3730c4", display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                <Zap size={14}/> Weekly Digest
              </p>
              <p style={{ fontSize:12, color:"#4c4c7a", lineHeight:1.8 }}>{digest}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}