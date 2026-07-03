import { useEffect, useRef, useState } from "react";
import { sl } from "../i18n/sl";
import { GuardedInput } from "./GuardedField";
import { useAppStore } from "../store/useAppStore";
import { todayISO } from "../lib/date";
import {
  mentorOpeningLine,
  sendMentorMessage,
  type MentorContext,
} from "../api/ai";
import type { ChatMessage } from "../types";

function uid() {
  return `m_${Math.random().toString(36).slice(2, 9)}`;
}

export function MentorPanel({ compact = false }: { compact?: boolean }) {
  const store = useAppStore();
  const chat = store.chat;
  const addMessage = store.addChatMessage;

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [violation, setViolation] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const incomplete =
    store.daily_logs[todayISO()]?.morning?.top_tasks
      .filter((t) => !t.completed)
      .map((t) => t.title) ?? [];

  const ctx: MentorContext = {
    status: store.status,
    streak_days: store.streak_days,
    drift_warnings: store.drift_warnings,
    incomplete_top_tasks: incomplete,
    display_name: store.profile.display_name,
  };

  useEffect(() => {
    if (useAppStore.getState().chat.length === 0) {
      void mentorOpeningLine(ctx).then((content) => {
        addMessage({
          id: uid(),
          role: "assistant",
          content,
          created_at: new Date().toISOString(),
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    feedRef.current?.scrollTo({
      top: feedRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat, thinking]);

  const send = async () => {
    const text = input.trim();
    if (!text || violation || thinking) return;
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    addMessage(userMsg);
    setInput("");
    setThinking(true);
    try {
      const history = chat.map((c) => ({ role: c.role, content: c.content }));
      const reply = await sendMentorMessage(text, ctx, history);
      addMessage({
        id: uid(),
        role: "assistant",
        content: reply,
        created_at: new Date().toISOString(),
      });
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className={`mentor-panel ${compact ? "mentor-panel-compact" : ""}`}>
      {!compact && (
        <div className="mentor-panel-head">
          <div>
            <h3>{sl.mentor.title}</h3>
            <p>{sl.mentor.subtitle}</p>
          </div>
          <span className="mentor-orb">AI</span>
        </div>
      )}

      <div className="chat-wrap mentor-chat-wrap">
        <div className="chat-feed" ref={feedRef}>
          {chat.map((m) => (
            <div key={m.id} className={`bubble ${m.role === "user" ? "me" : "ai"}`}>
              <span className="who">
                {m.role === "user" ? store.profile.display_name : "ZaLife Coach"}
              </span>
              {m.content}
            </div>
          ))}
          {thinking && (
            <div className="bubble ai">
              <span className="who">ZaLife Coach</span>
              {sl.mentor.thinking}
            </div>
          )}
        </div>

        <div className="chat-input-row mentor-input-row">
          <GuardedInput
            className="flex1"
            value={input}
            placeholder={sl.mentor.placeholder}
            onViolationChange={setViolation}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            className="btn btn-primary btn-sm"
            disabled={!input.trim() || violation || thinking}
            onClick={send}
          >
            {sl.mentor.send}
          </button>
        </div>
      </div>
    </div>
  );
}
