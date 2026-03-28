import { useEffect, useState } from "react";
import api from "../utils/api";

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      {title && <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#1f2937" }}>{title}</h3>}
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, color = "#22c55e" }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, textAlign: "center" }}>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{icon} {label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

function SimpleBar({ label, value, max, color = "#22c55e" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: "#374151" }}>{label}</span>
        <span style={{ color: "#6b7280" }}>{value}</span>
      </div>
      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

async function exportPDF() {
  try {
    const res = await api.get("/report/export");
    const d = res.data;
    const html = `<!DOCTYPE html><html><head><title>GutSense Report</title>
<style>body{font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#333}
h1{color:#16a34a}h2{color:#444;font-size:16px;border-bottom:1px solid #eee;padding-bottom:5px;margin-top:25px}
table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}
th{background:#f0fdf4;text-align:left;padding:7px 10px;border:1px solid #d1fae5}
td{padding:6px 10px;border:1px solid #e5e7eb}
.stat{display:inline-block;width:120px;margin:8px;text-align:center;background:#f0fdf4;border-radius:8px;padding:10px}
.stat-val{font-size:22px;font-weight:bold;color:#16a34a}.stat-label{font-size:11px;color:#6b7280}</style></head>
<body><h1>🌿 GutSense Weekly Report</h1>
<p style="color:#6b7280;font-size:13px">${d.user.name} | ${d.user.email} | Generated: ${new Date(d.generatedAt).toLocaleDateString()}</p>
<p style="font-size:13px">🔥 Streak: <strong>${d.user.streak} days</strong></p>
<h2>Summary</h2>
<div><div class="stat"><div class="stat-val">${d.summary.avgScore}</div><div class="stat-label">Avg score</div></div>
<div class="stat"><div class="stat-val">${d.summary.totalMeals}</div><div class="stat-label">Meals</div></div>
<div class="stat"><div class="stat-val">${d.summary.triggerCount}</div><div class="stat-label">Triggers</div></div></div>
<h2>Meals</h2>${Object.entries(d.mealsByDay).map(([day, meals]) =>
  `<p style="font-weight:bold;margin-top:12px">${day}</p><table><tr><th>Food</th><th>Type</th><th>Score</th></tr>
  ${meals.map(m => `<tr><td>${m.foodName}${m.isTrigger?" ⚠️":""}</td><td>${m.mealType}</td><td>${m.gutScore}/100</td></tr>`).join("")}</table>`
).join("")}
</body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  } catch {
    alert("Could not generate report. Log some meals first!");
  }
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api.get(`/analytics/dashboard?days=${days}`)
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#6b7280", fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
        <p style={{ fontSize: 32 }}>😕</p>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Could not load dashboard</p>
        <button onClick={() => window.location.reload()} style={{ color: "#22c55e", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>Try again</button>
      </div>
    );
  }

  const { gutTrend, topFoods, mealTypes, triggerFoods, todaySummary } = data;
  const scoreColor = !todaySummary.score ? "#9ca3af" : todaySummary.score >= 75 ? "#22c55e" : todaySummary.score >= 50 ? "#eab308" : "#ef4444";

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📊 Dashboard</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>Your gut health overview</p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setDays(d)} style={{ padding: "5px 12px", borderRadius: 6, border: days === d ? "2px solid #22c55e" : "1px solid #d1d5db", background: days === d ? "#f0fdf4" : "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              {d} days
            </button>
          ))}
          <button onClick={exportPDF} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", fontSize: 12, cursor: "pointer" }}>
            📄 Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
        <StatCard icon="🫁" label="Today's Score" value={todaySummary.score || "—"} color={scoreColor} />
        <StatCard icon="🍽️" label="Meals Today" value={todaySummary.mealCount} color="#3b82f6" />
        <StatCard icon="💧" label="Water" value={`${todaySummary.waterGlasses} glasses`} color="#38bdf8" />
        <StatCard icon="🔥" label="Streak" value={`${todaySummary.streak} days`} color="#f97316" />
      </div>

      {gutTrend.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
            <p style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>No meal data yet</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Go to Chat and tell GutSense what you ate!</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Gut score trend - simple table */}
          <Card title="📈 Gut Score Trend">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#6b7280", fontWeight: 500 }}>Date</th>
                    <th style={{ textAlign: "center", padding: "6px 8px", color: "#6b7280", fontWeight: 500 }}>Score</th>
                    <th style={{ textAlign: "center", padding: "6px 8px", color: "#6b7280", fontWeight: 500 }}>Meals</th>
                    <th style={{ textAlign: "center", padding: "6px 8px", color: "#6b7280", fontWeight: 500 }}>Calories</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: "#6b7280", fontWeight: 500 }}>Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {gutTrend.map((row) => (
                    <tr key={row._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "6px 8px" }}>{row._id.slice(5)}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: Math.round(row.avgScore) >= 70 ? "#22c55e" : "#eab308" }}>{Math.round(row.avgScore)}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{row.mealCount}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{row.totalCalories || 0}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, width: 80, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.round(row.avgScore)}%`, background: Math.round(row.avgScore) >= 70 ? "#22c55e" : "#eab308", borderRadius: 3 }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top foods */}
          <Card title="🏆 Most Eaten Foods">
            {topFoods.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>No data yet</p>
            ) : (
              topFoods.slice(0, 6).map((f, i) => (
                <SimpleBar key={i} label={`${i + 1}. ${f._id}`} value={f.count} max={topFoods[0]?.count || 1} color={Math.round(f.avgScore) >= 70 ? "#22c55e" : "#eab308"} />
              ))
            )}
          </Card>

          {/* Meal types */}
          <Card title="🥗 Meal Type Breakdown">
            {mealTypes.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>No data yet</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {mealTypes.map((t, i) => (
                  <div key={i} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>
                    <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{t._id}</span>
                    <span style={{ color: "#6b7280", marginLeft: 6 }}>{t.count}x</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Trigger foods */}
          {triggerFoods.length > 0 && (
            <Card title="⚠️ Trigger Foods This Week">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {triggerFoods.map((f) => (
                  <span key={f._id} style={{ background: "#fef3c7", color: "#92400e", borderRadius: 20, padding: "4px 12px", fontSize: 12, border: "1px solid #fde68a" }}>
                    {f.foodName}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>Go to Goals to manage your avoid-foods list.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
