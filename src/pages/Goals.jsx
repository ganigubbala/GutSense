import { useEffect, useState } from "react";
import api from "../utils/api";

function ProgressBar({ label, current, goal, color = "#22c55e" }) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const done = pct >= 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#6b7280" }}>
          {current} / {goal}
          {done && <span style={{ marginLeft: 4, color: "#22c55e" }}>✓</span>}
        </span>
      </div>
      <div style={{ height: 10, background: "#f3f4f6", borderRadius: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: done ? "#86efac" : color, borderRadius: 5, transition: "width 0.5s" }} />
      </div>
      <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "right", marginTop: 2 }}>{pct}%</p>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, unit, hint, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{label}</label>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>{value} <span style={{ fontWeight: 400, color: "#9ca3af" }}>{unit}</span></span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {hint && <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState(null);
  const [progress, setProgress] = useState({ meals: 0, water: 0, calories: 0 });
  const [avoidInput, setAvoidInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/goals"),
      api.get("/meals"),
      api.get("/water/today"),
    ])
      .then(([g, m, w]) => {
        setGoals(g.data);
        const todayMeals = m.data.filter(
          (meal) => new Date(meal.eatenAt).toDateString() === new Date().toDateString()
        );
        setProgress({
          meals: todayMeals.length,
          water: w.data.glasses,
          calories: todayMeals.reduce((a, meal) => a + (meal.calories || 0), 0),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key, val) => setGoals((g) => ({ ...g, [key]: val }));

  const addAvoid = () => {
    const f = avoidInput.trim().toLowerCase();
    if (!f || goals.avoidFoods.includes(f)) return;
    setGoals((g) => ({ ...g, avoidFoods: [...g.avoidFoods, f] }));
    setAvoidInput("");
  };

  const removeAvoid = (f) =>
    setGoals((g) => ({ ...g, avoidFoods: g.avoidFoods.filter((x) => x !== f) }));

  const save = async () => {
    setSaving(true);
    setSavedMsg("");
    try {
      await api.put("/goals", goals);
      setSavedMsg("Goals saved! ✓");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch {
      setSavedMsg("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#6b7280", fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  if (!goals) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: 14 }}>
        Could not load goals. Try refreshing.
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1f2937" }}>🎯 Daily Goals</h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: "2px 0 0" }}>Set targets and track today's progress</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {savedMsg && (
            <span style={{ fontSize: 13, fontWeight: 500, color: savedMsg.includes("Failed") ? "#ef4444" : "#22c55e" }}>
              {savedMsg}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            style={{ background: "#22c55e", color: "#fff", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving..." : "Save goals"}
          </button>
        </div>
      </div>

      {/* Today's progress */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 14 }}>📋 Today's progress</h2>
        <ProgressBar label="🍽️ Meals logged" current={progress.meals} goal={goals.mealsPerDay} />
        <ProgressBar label="💧 Water intake" current={progress.water} goal={goals.waterGlasses} color="#38bdf8" />
        <ProgressBar label="🔥 Calories" current={progress.calories} goal={goals.maxCalories} color="#f97316" />
      </div>

      {/* Goal sliders */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 14 }}>⚙️ Adjust your goals</h2>
        <Slider label="💧 Daily water goal" value={goals.waterGlasses} min={4} max={16} unit="glasses" hint="8 glasses is recommended for good gut health" onChange={(v) => update("waterGlasses", v)} />
        <Slider label="🍽️ Meals per day" value={goals.mealsPerDay} min={1} max={6} unit="meals" hint="3 balanced meals a day is the standard recommendation" onChange={(v) => update("mealsPerDay", v)} />
        <Slider label="🔥 Daily calorie limit" value={goals.maxCalories} min={1000} max={4000} step={100} unit="kcal" hint="2000 kcal/day is average for most adults" onChange={(v) => update("maxCalories", v)} />
        <Slider label="🥦 Fiber-rich servings" value={goals.fiberFoodsPerDay} min={1} max={8} unit="servings" hint="Fiber is key for gut health — aim for 2-3 servings/day" onChange={(v) => update("fiberFoodsPerDay", v)} />
      </div>

      {/* Avoid foods */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>🚫 Foods to avoid</h2>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
          GutSense AI will warn you when you log any of these. They also sync as your trigger foods.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={avoidInput}
            onChange={(e) => setAvoidInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAvoid()}
            placeholder="e.g. spicy food, alcohol, dairy..."
            style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
          />
          <button
            onClick={addAvoid}
            style={{ background: "#22c55e", color: "#fff", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer" }}
          >
            Add
          </button>
        </div>

        {goals.avoidFoods.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", border: "2px dashed #e5e7eb", borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: "#9ca3af" }}>No foods added yet.</p>
            <p style={{ fontSize: 12, color: "#9ca3af" }}>Add things like "spicy food" or "fried food" to get alerts.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {goals.avoidFoods.map((f) => (
              <span key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "4px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 20 }}>
                {f}
                <button onClick={() => removeAvoid(f)} style={{ fontWeight: 700, background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 14, textAlign: "center" }}>
          Don't forget to click <strong>Save goals</strong> at the top when you're done!
        </p>
      </div>
    </div>
  );
}
