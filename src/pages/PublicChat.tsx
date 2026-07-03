import { useEffect, useRef, useState } from "react";
import { sl } from "../i18n/sl";
import { Card, PageHead } from "../components/ui";
import { GuardedInput } from "../components/GuardedField";
import { usePublicChat } from "../hooks/usePublicChat";
import { isPublicChatConfigured } from "../api/publicChat";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";
import type { PublicChatMessage } from "../types";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("sl-SI", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function MessageRow({
  msg,
  mine,
}: {
  msg: PublicChatMessage;
  mine: boolean;
}) {
  return (
    <div className={`public-msg ${mine ? "mine" : ""}`}>
      {msg.avatar_url ? (
        <img className="public-msg-avatar" src={msg.avatar_url} alt="" />
      ) : (
        <div className="public-msg-avatar">{initials(msg.display_name)}</div>
      )}
      <div className="public-msg-body">
        <div className="public-msg-meta">
          <span className="public-msg-name">{msg.display_name}</span>
          {mine && <span className="tag tag-teal public-msg-you">ti</span>}
          <span className="public-msg-time">{formatTime(msg.created_at)}</span>
        </div>
        <div className="public-msg-text">{msg.content}</div>
      </div>
    </div>
  );
}

export function PublicChat() {
  const userId = useAuthStore((s) => s.current_user_id);
  const account = useAuthStore((s) => s.currentAccount());
  const displayName = useAppStore((s) => s.profile.display_name);
  const avatarUrl = useAppStore((s) => s.profile.avatar_url);

  const { messages, loading, sending, error, send, setError } =
    usePublicChat(userId);
  const [input, setInput] = useState("");
  const [violation, setViolation] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const name = displayName || account?.name || "Voditelj";
  const pic = avatarUrl || account?.picture || "";

  useEffect(() => {
    feedRef.current?.scrollTo({
      top: feedRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const onSend = async () => {
    const text = input.trim();
    if (!text || violation || sending) return;
    const ok = await send(text, { displayName: name, avatarUrl: pic });
    if (ok) setInput("");
  };

  if (!isPublicChatConfigured()) {
    return (
      <div className="page">
        <PageHead title={sl.publicChat.title}>{sl.publicChat.subtitle}</PageHead>
        <Card>
          <p className="small text-muted">{sl.publicChat.notConfigured}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="page public-chat-page">
      <PageHead title={sl.publicChat.title}>{sl.publicChat.subtitle}</PageHead>

      <Card className="public-chat-card">
        <div className="public-chat-feed" ref={feedRef}>
          {loading && (
            <p className="small text-muted center-text">{sl.publicChat.loading}</p>
          )}
          {!loading && messages.length === 0 && (
            <p className="small text-muted center-text">{sl.publicChat.empty}</p>
          )}
          {messages.map((m) => (
            <MessageRow key={m.id} msg={m} mine={m.user_id === userId} />
          ))}
        </div>

        <div className="public-chat-compose">
          {error && (
            <p className="small text-crimson public-chat-error">{error}</p>
          )}
          <div className="chat-input-row public-chat-input-row">
            <GuardedInput
              className="flex1"
              value={input}
              placeholder={sl.publicChat.placeholder}
              maxLength={500}
              onViolationChange={setViolation}
              onChange={(e) => {
                setError("");
                setInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
            />
            <button
              className="btn btn-primary btn-sm"
              type="button"
              disabled={!input.trim() || violation || sending}
              onClick={() => void onSend()}
            >
              {sending ? sl.publicChat.sending : sl.publicChat.send}
            </button>
          </div>
          <p className="small text-muted public-chat-hint">{sl.publicChat.hint}</p>
        </div>
      </Card>
    </div>
  );
}
