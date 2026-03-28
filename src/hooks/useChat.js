import { useState, useEffect } from "react";
import api from "../utils/api";

// This hook manages all the chat page state and actions
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [water, setWater] = useState(0);
  const [goals, setGoals] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
  const [streak, setStreak] = useState(0);

  // Load today's meals from the server
  async function refreshMeals() {
    try {
      const res = await api.get("/meals");
      setMeals(res.data);
    } catch {
      // Silently fail
    }
  }

  // Load all data when the chat page first opens
  useEffect(() => {
    // Load chat history
    api.get("/chat/history")
      .then((res) => {
        const loaded = [];
        for (const chat of res.data) {
          loaded.push({
            id: chat._id,
            role: chat.role,
            content: chat.content,
            timestamp: new Date(chat.createdAt),
            imageUrl: chat.imageUrl || "",
          });
        }
        setMessages(loaded);
      })
      .catch(() => {});

    // Load today's meals
    refreshMeals();

    // Load water count
    api.get("/water/today")
      .then((res) => setWater(res.data.glasses))
      .catch(() => {});

    // Load goals
    api.get("/goals")
      .then((res) => setGoals(res.data))
      .catch(() => {});

    // Load streak
    api.get("/auth/me")
      .then((res) => setStreak(res.data.streak || 0))
      .catch(() => {});
  }, []);

  // Send a message (text or image) to the AI
  async function sendMessage(text, imageFile, options) {
    const silentUserMessage = options?.silentUserMessage || false;
    let imageBase64 = null;
    let imageMimeType = null;
    let imageUrl = null;

    // If user attached an image, read it as base64
    if (imageFile) {
      imageMimeType = imageFile.type;
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(imageFile);
      });
      imageBase64 = imageUrl.split(",")[1];
    }

    // Add user's message to the chat (unless it's a retry)
    if (!silentUserMessage) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          content: text,
          timestamp: new Date(),
          imageUrl: imageUrl || "",
        },
      ]);
    }

    // Save the request so we can retry later
    setLastRequest({ text, imageFile: imageFile || null });
    setIsLoading(true);

    try {
      // Send to the backend
      const res = await api.post("/chat/send", {
        message: text,
        imageBase64: imageBase64,
        imageMimeType: imageMimeType,
      });

      // Add AI's reply to the chat
      setMessages((prev) => [
        ...prev,
        {
          id: res.data.chatId || Date.now().toString() + "_ai",
          role: "assistant",
          content: res.data.reply,
          timestamp: new Date(),
        },
      ]);

      // If food was logged, refresh the meals list and streak
      if (res.data.foodEntries && res.data.foodEntries.length > 0) {
        await refreshMeals();
        api.get("/auth/me")
          .then((r) => setStreak(r.data.streak || 0))
          .catch(() => {});
      }

      return { ok: true };
    } catch (err) {
      // Show a friendly error message
      let errorMessage = "Something went wrong. Please check your connection and try again.";
      if (err.response?.status === 429) {
        errorMessage = err.response?.data?.message || "Too many requests. Please wait a moment and try again.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          role: "assistant",
          content: errorMessage,
          timestamp: new Date(),
        },
      ]);
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  // Retry the last message (remove old AI reply and resend)
  async function regenerateLastReply() {
    if (!lastRequest || isLoading) return { ok: false };

    // Remove the last AI reply
    setMessages((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && copy[copy.length - 1].role === "assistant") {
        copy.pop();
      }
      return copy;
    });

    // Resend the last message (silently, without adding user message again)
    return sendMessage(lastRequest.text, lastRequest.imageFile, { silentUserMessage: true });
  }

  // Add one glass of water
  async function addWater() {
    try {
      const res = await api.post("/water/add");
      setWater(res.data.glasses);
    } catch {
      // Silently fail
    }
  }

  // Remove one glass of water
  async function removeWater() {
    try {
      const res = await api.post("/water/remove");
      setWater(res.data.glasses);
    } catch {
      // Silently fail
    }
  }

  // Clear all chat messages
  async function clearChat() {
    await api.delete("/chat/clear");
    setMessages([]);
  }

  // Manually log a meal (from the form, not AI)
  async function logMealManually(mealData) {
    try {
      const res = await api.post("/meals", mealData);
      await refreshMeals();
      if (res.data.streak) setStreak(res.data.streak);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.message || "Failed to log meal" };
    }
  }

  return {
    messages,
    meals,
    isLoading,
    sendMessage,
    regenerateLastReply,
    water,
    addWater,
    removeWater,
    goals,
    clearChat,
    refreshMeals,
    logMealManually,
    streak,
  };
}
