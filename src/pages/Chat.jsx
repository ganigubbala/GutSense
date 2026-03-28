import { useRef, useEffect, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../context/AuthContext";

const SUGGESTIONS = [
  "I just had biryani and curd",
  "What should I eat for gut health?",
  "I feel bloated after lunch",
  "Suggest something light to eat",
];

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      <div
        style={{
          maxWidth: "75%",
          padding: "10px 14px",
          borderRadius: 12,
          fontSize: 14,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          background: isUser ? "#22c55e" : "#fff",
          color: isUser ? "#fff" : "#333",
          border: isUser ? "none" : "1px solid #e5e7eb",
        }}
      >
        {msg.imageUrl && (
          <img
            src={msg.imageUrl}
            alt="food"
            style={{ maxHeight: 120, borderRadius: 8, marginBottom: 6, display: "block" }}
          />
        )}
        {msg.content}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", marginBottom: 12 }}>
      <div style={{ padding: "10px 18px", borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb", fontSize: 18, letterSpacing: 2 }}>
        ...
      </div>
    </div>
  );
}

function ManualLogForm({ onLog, onClose }) {
  const [food, setFood] = useState("");
  const [qty, setQty] = useState("");
  const [type, setType] = useState("snack");
  const [cal, setCal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!food.trim()) { setError("Food name is required"); return; }
    setSaving(true);
    setError("");
    const result = await onLog({ foodName: food.trim(), quantity: qty.trim(), mealType: type, calories: cal ? Number(cal) : 0 });
    if (result.ok) onClose();
    else setError(result.error || "Failed to log meal");
    setSaving(false);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 380 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Log a Meal</h3>
        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{error}</p>}

        <label style={{ fontSize: 13, fontWeight: 500 }}>Food name *</label>
        <input autoFocus value={food} onChange={(e) => setFood(e.target.value)} placeholder="e.g. Dal chawal, Apple" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px", fontSize: 13, marginTop: 4, marginBottom: 10, outline: "none" }} />

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Quantity</label>
            <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="1 bowl" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px", fontSize: 13, marginTop: 4, outline: "none" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Calories</label>
            <input type="number" value={cal} onChange={(e) => setCal(e.target.value)} placeholder="300" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px", fontSize: 13, marginTop: 4, outline: "none" }} />
          </div>
        </div>

        <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginTop: 10 }}>Meal type</label>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          {MEAL_TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: type === t ? "2px solid #22c55e" : "1px solid #d1d5db", background: type === t ? "#f0fdf4" : "#fff", fontSize: 12, fontWeight: 500, textTransform: "capitalize", cursor: "pointer" }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#f3f4f6", color: "#666" }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#22c55e", color: "#fff", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Log Meal"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { messages, meals, isLoading, sendMessage, regenerateLastReply, water, addWater, removeWater, goals, clearChat, logMealManually, streak } = useChat();
  const { user } = useAuth();
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showManualLog, setShowManualLog] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const send = async () => {
    const text = input.trim();
    if (!text && !imageFile) return;
    setInput("");
    setImageFile(null);
    setImagePreview(null);
    await sendMessage(text || "Analyse this food image", imageFile);
  };

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const todayMeals = meals.filter((m) => new Date(m.eatenAt).toDateString() === new Date().toDateString());
  const waterGoal = goals?.waterGlasses || 8;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {showManualLog && <ManualLogForm onLog={logMealManually} onClose={() => setShowManualLog(false)} />}

      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fafafa" }}>

        {/* Top bar with quick stats */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #e5e7eb", background: "#fff", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
            {streak > 0 && <span>🔥 {streak} day streak</span>}
            <span>💧 {water}/{waterGoal} glasses
              <button onClick={addWater} style={{ marginLeft: 4, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>+</button>
            </span>
            <span>🍽️ {todayMeals.length} meals today</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowManualLog(true)} style={{ fontSize: 12, color: "#22c55e", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 500 }}>+ Log Meal</button>
            <button onClick={clearChat} style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Clear Chat</button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>
                Hey {user?.name?.split(" ")[0]}! 👋
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>
                Tell me what you ate and I'll track your gut health. You can also upload a food photo!
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 420, margin: "0 auto" }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, color: "#374151", cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => <Message key={m.id} msg={m} />)}
          {isLoading && <TypingDots />}
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div style={{ padding: "0 16px 8px" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <img src={imagePreview} alt="preview" style={{ height: 60, width: 60, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: "8px 16px 16px", borderTop: "1px solid #e5e7eb", background: "#fafafa" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #d1d5db", borderRadius: 10, padding: "6px 10px" }}>
            <button onClick={() => fileRef.current?.click()} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", padding: 0 }} title="Upload food photo">📷</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
              placeholder="Tell me what you ate..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, padding: "6px 0", background: "transparent" }}
            />
            <button
              onClick={send}
              disabled={isLoading || (!input.trim() && !imageFile)}
              style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: isLoading || (!input.trim() && !imageFile) ? 0.4 : 1 }}
            >
              Send
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 6 }}>
            Press Enter to send · 📷 to upload food photo
          </p>
        </div>
      </div>
    </div>
  );
}
