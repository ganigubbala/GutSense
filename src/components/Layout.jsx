import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "💬 Chat", end: true },
  { to: "/dashboard", label: "📊 Dashboard" },
  { to: "/goals", label: "🎯 Goals" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f3f4f6" }}>
      {/* Desktop sidebar */}
      <aside className="desktop-sidebar" style={{ width: 200, display: "flex", flexDirection: "column", background: "#fff", borderRight: "1px solid #e5e7eb", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "16px 14px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🌿</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: "#1f2937" }}>GutSense</p>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>AI Health Tracker</p>
          </div>
        </div>

        {/* User */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#15803d" }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>🔥 {user?.streak || 0} day streak</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: "block",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                marginBottom: 4,
                background: isActive ? "#f0fdf4" : "transparent",
                color: isActive ? "#15803d" : "#6b7280",
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "10px", borderTop: "1px solid #e5e7eb" }}>
          <button onClick={handleLogout} style={{ width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setMenuOpen(false)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <aside style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 200, background: "#fff" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "16px 14px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🌿</span>
              <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: "#1f2937" }}>GutSense</p>
            </div>
            <nav style={{ padding: "12px 10px" }}>
              {navItems.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: "block",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    marginBottom: 4,
                    background: isActive ? "#f0fdf4" : "transparent",
                    color: isActive ? "#15803d" : "#6b7280",
                  })}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div style={{ padding: "10px", borderTop: "1px solid #e5e7eb" }}>
              <button onClick={handleLogout} style={{ width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                🚪 Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Mobile header */}
        <header className="mobile-header" style={{ display: "none", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
          <button onClick={() => setMenuOpen(true)} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            ☰
          </button>
          <span style={{ fontSize: 18 }}>🌿</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#1f2937" }}>GutSense</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>🔥 {user?.streak || 0}</span>
        </header>

        <main style={{ flex: 1, overflow: "hidden" }}>{children}</main>
      </div>
    </div>
  );
}
