import { useState, useRef } from "react";
import { askGemini } from "@/lib/gemini";
import {
  MessageCircle,
  X,
  Send,
  Maximize2,
  Minimize2,
  Trash2,
  Scissors,
  Globe,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const WELCOME = "Hi! I'm the QuickCourt assistant. Ask me about booking, venues, pricing, or how to use the dashboards.";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [language, setLanguage] = useState<string>("English");
  const listRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const response = await askGemini(
        text,
        `You are a helpful assistant for the QuickCourt web app. Keep replies concise and actionable. Respond in ${language}.`
      );
      const answer = (await response.text())?.trim() || "(No response)";
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, I couldn't reach the assistant. Please check your internet or API key." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => setMessages([{ role: "assistant", content: WELCOME }]);

  const cutInput = async () => {
    const t = input;
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      // ignore clipboard errors
    }
    setInput("");
  };

  return (
    <div>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-lg hover:opacity-90"
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:block text-sm font-medium">Chat</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          className={
            (isFullscreen
              ? "fixed inset-0"
              : "fixed bottom-20 right-4 w-[90vw] max-w-md") +
            " z-50 rounded-xl border border-border/60 bg-background shadow-2xl flex flex-col"
          }
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 gap-2">
            <div className="font-semibold">QuickCourt Assistant</div>
            <div className="flex items-center gap-2">
              {/* Language select */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-4 w-4" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent border border-border/60 rounded px-2 py-1 text-xs hover:border-foreground"
                  aria-label="Language"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Gujarati</option>
                  <option>Marathi</option>
                  <option>Spanish</option>
                </select>
              </div>
              {/* Clear/Delete chat */}
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={clearChat}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              {/* Fullscreen toggle */}
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsFullscreen((v) => !v)}
                title={isFullscreen ? "Exit full screen" : "Full screen"}
                aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              {/* Close */}
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div ref={listRef} className="max-h-80 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={
                    "inline-block rounded-lg px-3 py-2 text-sm " +
                    (m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground")
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <div className="inline-block rounded-lg px-3 py-2 text-sm bg-muted text-foreground opacity-80">
                  Thinking...
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border/60 mt-auto">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                placeholder="Ask something..."
                className="flex-1 resize-none rounded-md border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={cutInput}
                disabled={!input}
                className="inline-flex items-center justify-center rounded-md border border-border/60 h-10 w-10 text-muted-foreground hover:text-foreground"
                title="Cut input"
                aria-label="Cut input"
              >
                <Scissors className="h-4 w-4" />
              </button>
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-10 w-10 disabled:opacity-60"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {!import.meta.env.VITE_GEMINI_API_KEY && (
              <p className="mt-2 text-xs text-amber-500">
                Set VITE_GEMINI_API_KEY in frontend/.env to enable the assistant.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
