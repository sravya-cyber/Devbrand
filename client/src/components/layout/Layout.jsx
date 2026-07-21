import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, PenSquare, Calendar,
  BarChart2, Link2, Trophy, LogOut, Code2, Bell
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../services/api";

const navItems = [
  { to: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { to: "/posts/create", icon: PenSquare,        label: "Create Post" },
  { to: "/calendar",     icon: Calendar,         label: "Calendar" },
  { to: "/analytics",    icon: BarChart2,        label: "Analytics" },
  { to: "/milestones",   icon: Trophy,           label: "Milestones" },
  { to: "/accounts",     icon: Link2,            label: "Accounts" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get("/milestones?status=pending")
      .then(({ data }) => setUnread(data.milestones.length))
      .catch(() => {});
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f7", display: "flex", flexDirection: "column" }}>

      {/* ── Top Navbar ── */}
      <header style={{
        background: "#ffffff",
        borderBottom: "1px solid #e8eaf5",
        boxShadow: "0 1px 8px rgba(30,30,80,0.05)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: "100%",
          padding: "0 28px",
          height: 58,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginRight: 24, flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg,#5b5ef4,#7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(91,94,244,0.35)",
            }}>
              <Code2 size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e", letterSpacing: "-0.02em" }}>
              DevBrand
            </span>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                style={{ fontSize: 13 }}
              >
                <Icon size={15} />
                {label}
                {label === "Milestones" && unread > 0 && (
                  <span style={{
                    background: "#5b5ef4", color: "#fff",
                    fontSize: 9, fontWeight: 700, fontFamily: "JetBrains Mono",
                    borderRadius: 99, minWidth: 16, height: 16,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: "0 4px", marginLeft: 2,
                  }}>{unread}</span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* Bell */}
            <button style={{
              width: 34, height: 34, borderRadius: 10, border: "1px solid #e8eaf5",
              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#9a9ab8", position: "relative",
            }}>
              <Bell size={15} />
              {unread > 0 && (
                <span style={{
                  position: "absolute", top: 6, right: 6,
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#ef4444", border: "1.5px solid #fff",
                }} />
              )}
            </button>

            {/* User chip */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#f7f8ff", border: "1px solid #e2e4f0",
              borderRadius: 12, padding: "5px 10px 5px 6px",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: "linear-gradient(135deg,#5b5ef4,#7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 11, color: "#fff",
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>
                {user?.name?.split(" ")[0]}
              </span>
              <button onClick={handleLogout} title="Logout"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#b0b3cc", display: "flex", alignItems: "center", padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                onMouseLeave={e => e.currentTarget.style.color = "#b0b3cc"}
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ flex: 1, width: "100%" }}>
        <Outlet />
      </main>
    </div>
  );
}
