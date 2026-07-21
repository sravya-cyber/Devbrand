import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Github, Twitter, Linkedin, Link2, CheckCircle, RefreshCw, Code, Trophy, Zap, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Accounts() {
  const { user } = useAuth();
  const [accounts,   setAccounts]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [cfHandle,   setCfHandle]   = useState("");
  const [lcUser,     setLcUser]     = useState("");
  const [ghUser,     setGhUser]     = useState("");
  const [submitting, setSubmitting] = useState({});
  const [checking,   setChecking]   = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error   = params.get("error");
    if (success) { toast.success(`${success.charAt(0).toUpperCase()+success.slice(1)} connected! 🎉`); window.history.replaceState({}, "", "/accounts"); }
    if (error)   { toast.error(error.replace(/_/g, " ")); window.history.replaceState({}, "", "/accounts"); }
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try { const { data } = await api.get("/accounts"); setAccounts(data); }
    catch { toast.error("Failed to load accounts"); }
    finally { setLoading(false); }
  };

  const connect = async (platform, payload, reset) => {
    setSubmitting(s => ({ ...s, [platform]: true }));
    try {
      await api.post(`/accounts/${platform}`, payload);
      toast.success(`${platform.charAt(0).toUpperCase()+platform.slice(1)} connected!`);
      reset(); fetchAccounts();
    } catch (err) { toast.error(err.response?.data?.message || `Failed to connect ${platform}`); }
    finally { setSubmitting(s => ({ ...s, [platform]: false })); }
  };

  const disconnect = async (platform) => {
    if (!confirm(`Disconnect ${platform}?`)) return;
    try { await api.delete(`/accounts/${platform}`); toast.success(`${platform} disconnected`); fetchAccounts(); }
    catch { toast.error("Failed to disconnect"); }
  };

  const connectOAuth = (platform) => {
    const token = localStorage.getItem("accessToken");
    window.location.href = `/api/accounts/${platform}/auth?token=${token}`;
  };

  const triggerCheck = async () => {
    setChecking(true);
    try { await api.post("/accounts/check-milestones"); toast.success("Milestone check started!"); }
    catch { toast.error("Failed"); }
    finally { setChecking(false); }
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      <div style={{ width:32, height:32, border:"2px solid #5b5ef4", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const profiles = accounts?.codingProfiles || {};
  const social   = accounts?.socialAccounts  || [];
  const stats    = accounts?.stats           || {};

  const cfConnected = !!profiles?.codeforces?.handle;
  const lcConnected = !!profiles?.leetcode?.username;
  const ghConnected = !!profiles?.github?.username;
  const liConnected = social.some(a => a.platform === "linkedin");
  const twConnected = social.some(a => a.platform === "twitter");

  const ConnectedBadge = () => (
    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#16a34a", fontWeight:600 }}>
      <CheckCircle size={13}/> Connected
    </span>
  );

  const statBox = (label, value) => (
    <div key={label} style={{ textAlign:"center", flex:1 }}>
      <p style={{ fontFamily:"JetBrains Mono,monospace", fontWeight:700, fontSize:20, color:"#1a1a2e" }}>{value ?? "—"}</p>
      <p style={{ fontSize:11, color:"#9a9ab8", marginTop:2 }}>{label}</p>
    </div>
  );

  const card = (content) => (
    <div style={{ background:"#fff", border:"1px solid #e8eaf5", borderRadius:14, padding:"18px 20px", boxShadow:"0 1px 4px rgba(30,30,80,0.04)" }}>
      {content}
    </div>
  );

  return (
    <div style={{ padding:"32px 32px", width:"100%" }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:"#1a1a2e", letterSpacing:"-0.02em" }}>Connected Accounts</h1>
        <p style={{ color:"#9a9ab8", fontSize:13, marginTop:4 }}>
          Connect your coding profiles so DevBrand can detect milestones and post on your behalf
        </p>
      </div>

      {/* Two column layout */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>

        {/* ── Coding Profiles column ── */}
        <div>
          <p style={{ fontSize:10, fontWeight:700, color:"#b0b3cc", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Coding Profiles</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Codeforces */}
            {card(<>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"#fef9c3", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Trophy size={20} color="#ca8a04"/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:600, fontSize:14, color:"#1a1a2e" }}>Codeforces</p>
                  {cfConnected ? <ConnectedBadge/> : <p style={{ fontSize:12, color:"#b0b3cc" }}>Not connected</p>}
                </div>
                {cfConnected && <button onClick={() => disconnect("codeforces")} style={{ fontSize:12, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontWeight:500 }}>Disconnect</button>}
              </div>
              {cfConnected && (
                <div style={{ display:"flex", marginTop:14, paddingTop:14, borderTop:"1px solid #f1f5f9" }}>
                  {statBox("Rating",   stats.codeforces?.rating)}
                  {statBox("Rank",     stats.codeforces?.rank)}
                  {statBox("Problems", stats.codeforces?.problemsSolved)}
                </div>
              )}
              {!cfConnected && (
                <div style={{ marginTop:14, display:"flex", gap:8 }}>
                  <input className="input" placeholder="Codeforces handle e.g. tourist" value={cfHandle} onChange={e => setCfHandle(e.target.value)} onKeyDown={e => e.key==="Enter" && connect("codeforces",{handle:cfHandle},()=>setCfHandle(""))} />
                  <button onClick={() => connect("codeforces",{handle:cfHandle},()=>setCfHandle(""))} disabled={submitting.codeforces||!cfHandle.trim()} className="btn-primary" style={{ flexShrink:0, fontSize:13 }}>
                    {submitting.codeforces ? <RefreshCw size={14} style={{ animation:"spin 0.7s linear infinite" }}/> : <Link2 size={14}/>} Connect
                  </button>
                </div>
              )}
            </>)}

            {/* LeetCode */}
            {card(<>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"#ffedd5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Code size={20} color="#f97316"/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:600, fontSize:14, color:"#1a1a2e" }}>LeetCode</p>
                  {lcConnected ? <ConnectedBadge/> : <p style={{ fontSize:12, color:"#b0b3cc" }}>Not connected</p>}
                </div>
                {lcConnected && <button onClick={() => disconnect("leetcode")} style={{ fontSize:12, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontWeight:500 }}>Disconnect</button>}
              </div>
              {lcConnected && (
                <div style={{ display:"flex", marginTop:14, paddingTop:14, borderTop:"1px solid #f1f5f9" }}>
                  {statBox("Solved",  stats.leetcode?.totalSolved)}
                  {statBox("Streak",  stats.leetcode?.streak ? `${stats.leetcode.streak}d` : 0)}
                  {statBox("Ranking", stats.leetcode?.ranking?.toLocaleString())}
                </div>
              )}
              {!lcConnected && (
                <div style={{ marginTop:14, display:"flex", gap:8 }}>
                  <input className="input" placeholder="LeetCode username" value={lcUser} onChange={e => setLcUser(e.target.value)} onKeyDown={e => e.key==="Enter" && connect("leetcode",{username:lcUser},()=>setLcUser(""))} />
                  <button onClick={() => connect("leetcode",{username:lcUser},()=>setLcUser(""))} disabled={submitting.leetcode||!lcUser.trim()} className="btn-primary" style={{ flexShrink:0, fontSize:13 }}>
                    {submitting.leetcode ? <RefreshCw size={14} style={{ animation:"spin 0.7s linear infinite" }}/> : <Link2 size={14}/>} Connect
                  </button>
                </div>
              )}
            </>)}

            {/* GitHub */}
            {card(<>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Github size={20} color="#1a1a2e"/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:600, fontSize:14, color:"#1a1a2e" }}>GitHub</p>
                  {ghConnected ? <ConnectedBadge/> : <p style={{ fontSize:12, color:"#b0b3cc" }}>Not connected</p>}
                </div>
                {ghConnected && <button onClick={() => disconnect("github")} style={{ fontSize:12, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontWeight:500 }}>Disconnect</button>}
              </div>
              {ghConnected && (
                <div style={{ display:"flex", marginTop:14, paddingTop:14, borderTop:"1px solid #f1f5f9" }}>
                  {statBox("Repos",     stats.github?.publicRepos)}
                  {statBox("Stars",     stats.github?.totalStars)}
                  {statBox("Followers", stats.github?.followers)}
                </div>
              )}
              {!ghConnected && (
                <div style={{ marginTop:14, display:"flex", gap:8 }}>
                  <input className="input" placeholder="GitHub username" value={ghUser} onChange={e => setGhUser(e.target.value)} onKeyDown={e => e.key==="Enter" && connect("github",{username:ghUser},()=>setGhUser(""))} />
                  <button onClick={() => connect("github",{username:ghUser},()=>setGhUser(""))} disabled={submitting.github||!ghUser.trim()} className="btn-primary" style={{ flexShrink:0, fontSize:13 }}>
                    {submitting.github ? <RefreshCw size={14} style={{ animation:"spin 0.7s linear infinite" }}/> : <Link2 size={14}/>} Connect
                  </button>
                </div>
              )}
            </>)}
          </div>
        </div>

        {/* ── Social + Actions column ── */}
        <div>
          <p style={{ fontSize:10, fontWeight:700, color:"#b0b3cc", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Social Media Accounts</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* LinkedIn */}
            {card(<>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"#dbeafe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Linkedin size={20} color="#1d4ed8"/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:600, fontSize:14, color:"#1a1a2e" }}>LinkedIn</p>
                  {liConnected ? <ConnectedBadge/> : <p style={{ fontSize:12, color:"#b0b3cc" }}>Not connected</p>}
                </div>
                {liConnected
                  ? <button onClick={() => disconnect("linkedin")} style={{ fontSize:12, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontWeight:500 }}>Disconnect</button>
                  : <button onClick={() => connectOAuth("linkedin")} className="btn-primary" style={{ fontSize:13 }}><ExternalLink size={14}/> Connect</button>
                }
              </div>
              {liConnected
                ? <p style={{ fontSize:12, color:"#16a34a", marginTop:12, paddingTop:12, borderTop:"1px solid #f1f5f9" }}>✓ Ready to post to LinkedIn</p>
                : <div style={{ marginTop:12, padding:"10px 14px", background:"#f7f8ff", borderRadius:10, border:"1px solid #e2e4f0", fontSize:12, color:"#6b6b8f" }}>
                    Requires <code style={{ background:"#eeeffe", padding:"1px 5px", borderRadius:4, color:"#5b5ef4", fontSize:11 }}>LINKEDIN_CLIENT_ID</code> and <code style={{ background:"#eeeffe", padding:"1px 5px", borderRadius:4, color:"#5b5ef4", fontSize:11 }}>LINKEDIN_CLIENT_SECRET</code> in .env
                  </div>
              }
            </>)}

            {/* Twitter */}
            {card(<>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"#e0f2fe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Twitter size={20} color="#0284c7"/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:600, fontSize:14, color:"#1a1a2e" }}>Twitter / X</p>
                  {twConnected ? <ConnectedBadge/> : <p style={{ fontSize:12, color:"#b0b3cc" }}>Not connected</p>}
                </div>
                {twConnected
                  ? <button onClick={() => disconnect("twitter")} style={{ fontSize:12, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontWeight:500 }}>Disconnect</button>
                  : <button onClick={() => connectOAuth("twitter")} className="btn-primary" style={{ fontSize:13, background:"linear-gradient(135deg,#0284c7,#0ea5e9)" }}><ExternalLink size={14}/> Connect</button>
                }
              </div>
              {twConnected
                ? <p style={{ fontSize:12, color:"#16a34a", marginTop:12, paddingTop:12, borderTop:"1px solid #f1f5f9" }}>✓ Ready to post to Twitter / X</p>
                : <div style={{ marginTop:12, padding:"10px 14px", background:"#f0f9ff", borderRadius:10, border:"1px solid #bae6fd", fontSize:12, color:"#6b6b8f" }}>
                    Twitter API requires a paid plan ($100/month). Posts will use mock publishing for demo.
                  </div>
              }
            </>)}

            {/* Milestone trigger */}
            <div style={{ background:"linear-gradient(135deg,#eeeffe,#f3e8ff)", border:"1px solid #ddd6fe", borderRadius:14, padding:"18px 20px" }}>
              <p style={{ fontWeight:600, fontSize:14, color:"#3730c4", display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <Zap size={15}/> Milestone Check
              </p>
              <p style={{ fontSize:12, color:"#6b6b9f", marginBottom:14, lineHeight:1.6 }}>
                Milestones are checked every 30 min and on server startup. Trigger a manual check right now.
              </p>
              <button onClick={triggerCheck} disabled={checking||(!cfConnected&&!lcConnected&&!ghConnected)} className="btn-secondary" style={{ fontSize:13, width:"100%", justifyContent:"center" }}>
                <RefreshCw size={14} style={{ animation:checking?"spin 0.7s linear infinite":"none" }}/>
                {checking ? "Checking..." : "Check Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
