import { useState, useEffect } from "react";
import api from "../services/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { TrendingUp, Eye, Heart, Zap } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:"1px solid #e8eaf5", borderRadius:10, padding:"10px 14px", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}>
      <p style={{ color:"#9a9ab8", fontSize:11, marginBottom:4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, fontSize:12, fontWeight:600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const ActivityHeatmap = ({ data }) => {
  const today = new Date();
  const weeks = [];
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);

  for (let w = 0; w < 53; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      if (date > today) { week.push(null); continue; }
      const key = date.toISOString().split("T")[0];
      week.push({ date: key, count: data[key] || 0 });
    }
    weeks.push(week);
  }

  const getColor = (count) => {
    if (!count) return "#e8eaf5";
    if (count === 1) return "#c7d2fe";
    if (count === 2) return "#818cf8";
    if (count === 3) return "#6366f1";
    return "#4338ca";
  };

  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"flex", gap:3, minWidth:"max-content" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {week.map((day, di) => day ? (
              <div key={di} title={`${day.date}: ${day.count} post${day.count !== 1 ? "s" : ""}`}
                style={{ width:12, height:12, borderRadius:3, background:getColor(day.count), cursor:"default", transition:"opacity 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.opacity="0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity="1"}
              />
            ) : (
              <div key={di} style={{ width:12, height:12 }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, justifyContent:"flex-end" }}>
        <span style={{ fontSize:11, color:"#b0b3cc" }}>Less</span>
        {["#e8eaf5","#c7d2fe","#818cf8","#6366f1","#4338ca"].map(c => (
          <div key={c} style={{ width:12, height:12, borderRadius:3, background:c }} />
        ))}
        <span style={{ fontSize:11, color:"#b0b3cc" }}>More</span>
      </div>
    </div>
  );
};

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [topPosts, setTopPosts] = useState([]);
  const [digest,   setDigest]   = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/overview"),
      api.get("/analytics/top-posts"),
      api.get("/ai/weekly-digest"),
    ]).then(([ov, tp, dg]) => {
      setOverview(ov.data);
      setTopPosts(tp.data.posts);
      setDigest(dg.data.digest);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      <div style={{ width:32, height:32, border:"2px solid #5b5ef4", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const { overview: stats, platformStats, activityHeatmap } = overview || {};

  const platformChartData = Object.entries(platformStats || {}).map(([name, s]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    Posts: s.posts, Impressions: s.impressions, Engagement: s.engagement,
  }));

  const topPostsChart = topPosts.slice(0, 6).map((p, i) => ({
    name: `Post ${i + 1}`,
    Score: p.engagementScore?.score || 0,
  }));

  const statCards = [
    { label:"Total Posts",       value: stats?.totalPosts||0,                              icon:TrendingUp, color:"#5b5ef4", bg:"#eeeffe" },
    { label:"Published",         value: stats?.publishedPosts||0,                          icon:Zap,        color:"#16a34a", bg:"#dcfce7" },
    { label:"Total Impressions", value: (stats?.totalImpressions||0).toLocaleString(),     icon:Eye,        color:"#7c3aed", bg:"#ede9fe" },
    { label:"Avg Score",         value: `${stats?.avgEngagementScore||0}/10`,              icon:Heart,      color:"#ca8a04", bg:"#fef9c3" },
  ];

  return (
    <div style={{ padding:"32px 32px", width:"100%" }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:"#1a1a2e", letterSpacing:"-0.02em" }}>Analytics</h1>
        <p style={{ color:"#9a9ab8", fontSize:13, marginTop:4 }}>Your brand performance at a glance</p>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        {statCards.map(({ label, value, icon:Icon, color, bg }) => (
          <div key={label} className="card" style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p style={{ fontFamily:"JetBrains Mono,monospace", fontSize:22, fontWeight:700, color:"#1a1a2e" }}>{value}</p>
              <p style={{ fontSize:12, color:"#9a9ab8", marginTop:1 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="card" style={{ marginBottom:22 }}>
        <h2 style={{ fontWeight:600, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Posting Activity</h2>
        <ActivityHeatmap data={activityHeatmap || {}} />
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:22 }}>
        <div className="card">
          <h2 style={{ fontWeight:600, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Platform Breakdown</h2>
          {platformChartData.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#b0b3cc", fontSize:13 }}>No data yet — publish some posts!</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={platformChartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" />
                <XAxis dataKey="name" tick={{ fill:"#9a9ab8", fontSize:12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"#9a9ab8", fontSize:12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize:12, color:"#9a9ab8" }} />
                <Bar dataKey="Posts"      fill="#5b5ef4" radius={[6,6,0,0]} />
                <Bar dataKey="Engagement" fill="#a78bfa" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontWeight:600, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Top Posts by Score</h2>
          {topPostsChart.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#b0b3cc", fontSize:13 }}>No scored posts yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={topPostsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" />
                <XAxis dataKey="name" tick={{ fill:"#9a9ab8", fontSize:12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,10]} tick={{ fill:"#9a9ab8", fontSize:12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Score" stroke="#5b5ef4" strokeWidth={2.5} dot={{ fill:"#5b5ef4", r:5, strokeWidth:2, stroke:"#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top posts list */}
      <div className="card" style={{ marginBottom:22 }}>
        <h2 style={{ fontWeight:600, fontSize:14, color:"#1a1a2e", marginBottom:16 }}>Best Performing Posts</h2>
        {topPosts.length === 0 ? (
          <div style={{ textAlign:"center", padding:"32px 0", color:"#b0b3cc", fontSize:13 }}>Publish posts to see performance here.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {topPosts.map((post, i) => (
              <div key={post._id} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"12px 14px", background:"#f7f8ff", borderRadius:12, border:"1px solid #e8eaf5" }}>
                <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:18, fontWeight:700, color:"#e2e4f0", width:24, flexShrink:0 }}>{i+1}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, color:"#2a2a4a", lineHeight:1.6, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{post.content}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:6 }}>
                    <span style={{ fontSize:11, color:"#9a9ab8", textTransform:"capitalize" }}>{post.platforms?.join(", ")}</span>
                    {post.publishedAt && <span style={{ fontSize:11, color:"#b0b3cc" }}>{new Date(post.publishedAt).toLocaleDateString()}</span>}
                    {post.aiGenerated && <span style={{ fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:99, background:"#eeeffe", color:"#5b5ef4" }}>AI</span>}
                  </div>
                </div>
                {post.engagementScore?.score && (
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <p style={{ fontFamily:"JetBrains Mono,monospace", fontSize:18, fontWeight:700, color: post.engagementScore.score>=8?"#16a34a":post.engagementScore.score>=6?"#ca8a04":"#ef4444" }}>
                      {post.engagementScore.score}
                    </p>
                    <p style={{ fontSize:10, color:"#b0b3cc" }}>/ 10</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly digest */}
      {digest && (
        <div style={{ background:"linear-gradient(135deg,#eeeffe,#f3e8ff)", border:"1px solid #ddd6fe", borderRadius:16, padding:"20px 22px" }}>
          <h2 style={{ fontWeight:600, fontSize:14, color:"#3730c4", display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
            <Zap size={15}/> AI Weekly Summary
          </h2>
          <p style={{ fontSize:13, color:"#4c4c7a", lineHeight:1.8 }}>{digest}</p>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
