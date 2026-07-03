import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchPublicChatMessages,
  sendPublicChatMessage,
  subscribePublicChat,
} from "../api/publicChat";
import type { PublicChatMessage } from "../types";

function mergeMessage(
  list: PublicChatMessage[],
  msg: PublicChatMessage
): PublicChatMessage[] {
  if (list.some((m) => m.id === msg.id)) return list;
  return [...list, msg].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function usePublicChat(userId: string | null) {
  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const lastSent = useRef(0);

  const reload = useCallback(() => {
    void fetchPublicChatMessages().then(setMessages);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    void fetchPublicChatMessages()
      .then((rows) => {
        if (active) setMessages(rows);
      })
      .catch(() => {
        if (active) setError("Napaka pri nalaganju klepeta.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsub = subscribePublicChat(
      (msg) => setMessages((prev) => mergeMessage(prev, msg)),
      reload
    );

    const poll = window.setInterval(reload, 5000);

    return () => {
      active = false;
      unsub();
      window.clearInterval(poll);
    };
  }, [userId, reload]);

  const send = useCallback(
    async (content: string, meta: { displayName: string; avatarUrl?: string }) => {
      if (!userId || sending) return false;
      const now = Date.now();
      if (now - lastSent.current < 1200) {
        setError("Počakaj trenutek pred naslednjim sporočilom.");
        return false;
      }

      setSending(true);
      setError("");
      const { msg, error: sendError } = await sendPublicChatMessage({
        userId,
        displayName: meta.displayName,
        avatarUrl: meta.avatarUrl,
        content,
      });
      setSending(false);

      if (!msg) {
        setError(
          sendError
            ? `Sporočilo ni bilo poslano: ${sendError}`
            : "Sporočilo ni bilo poslano. Preveri povezavo."
        );
        return false;
      }

      lastSent.current = now;
      setMessages((prev) => mergeMessage(prev, msg));
      return true;
    },
    [userId, sending]
  );

  return { messages, loading, sending, error, send, setError };
}
