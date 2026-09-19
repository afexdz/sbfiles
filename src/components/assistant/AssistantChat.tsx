"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import dynamic from "next/dynamic";
import { MessageCircle, X, Send, AlertCircle, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ICON_BTN =
  "relative border border-line2 bg-card w-10 h-10 rounded cursor-pointer grid place-items-center " +
  "hover:border-ink2 hover:shadow-card transition-[border-color,box-shadow] duration-[180ms]";

// ── 3-D robot — desktop only, no SSR ─────────────────────────────────────────
const RobotScene = dynamic(
  () => import("./RobotScene").then((m) => m.RobotScene),
  { ssr: false, loading: () => <SimpleFAB isOpen={false} isThinking={false} onClick={() => {}} /> },
);

// ── Fallback: plain ember circle (mobile + loading state) ─────────────────────
interface SimpleFABProps { isOpen: boolean; isThinking: boolean; onClick: () => void }
function SimpleFAB({ isOpen, isThinking, onClick }: SimpleFABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Fermer l'assistant" : "Ouvrir l'assistant IA"}
      aria-expanded={isOpen}
      className={`w-14 h-14 rounded-full bg-ember text-white grid place-items-center active:scale-95
        transition-[background-color,box-shadow,transform] duration-[180ms] cursor-pointer
        ${isThinking
          ? "shadow-[0_4px_20px_rgba(0,196,255,0.5)] animate-pulse"
          : "shadow-[0_4px_20px_rgba(225,9,27,0.35)] hover:bg-ember-ink hover:shadow-[0_4px_28px_rgba(225,9,27,0.5)]"
        }`}
    >
      {isOpen ? <X size={22} aria-hidden /> : <MessageCircle size={22} aria-hidden />}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AssistantChat() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [robotHovered, setRobotHovered] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || limitReached) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question: text, history: messages }),
      });

      if (res.status === 429) {
        setLimitReached(true);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setMessages([...next, { role: "assistant", content: data.answer }]);
    } catch {
      setError("Impossible de joindre l'assistant. Vérifiez votre connexion.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function toggleOpen() { setOpen((o) => !o); }

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3">

      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-label="Assistant SBFiles"
          className="w-[min(92vw,380px)] flex flex-col bg-card border border-line rounded-[16px] shadow-card-lg overflow-hidden"
          style={{ height: "min(72vh, 560px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-soft">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-ember grid place-items-center">
                <MessageCircle size={14} className="text-white" aria-hidden />
              </span>
              <span className="font-semibold text-[14px] text-ink">Assistant SBFiles</span>
            </div>
            <button
              aria-label="Fermer l'assistant"
              onClick={() => setOpen(false)}
              className={`${ICON_BTN} w-8 h-8`}
            >
              <X size={15} aria-hidden />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 text-[13.5px]">
            {messages.length === 0 && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
                <MessageCircle size={32} className="text-ember opacity-60" aria-hidden />
                <p className="text-ink font-medium">Bonjour ! Comment puis-je vous aider ?</p>
                <p className="text-mute text-[12.5px] max-w-[240px]">
                  Posez vos questions sur le catalogue, les tarifs, ou vos demandes de tuning.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-[12px] leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-ember text-white rounded-br-[4px]"
                      : "bg-soft text-ink border border-line rounded-bl-[4px]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-soft border border-line rounded-[12px] rounded-bl-[4px] px-3.5 py-2.5">
                  <Loader2 size={14} className="text-mute animate-spin" aria-label="Chargement…" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5 text-red-600 text-[12.5px]">
                <AlertCircle size={14} className="mt-[1px] flex-shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}

            {limitReached && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-[10px] px-3 py-2.5 text-amber-700 text-[12.5px]">
                <AlertCircle size={14} className="mt-[1px] flex-shrink-0" aria-hidden />
                <span>Limite de 20 messages/heure atteinte. Réessayez dans une heure.</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-line bg-card">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={limitReached ? "Limite atteinte…" : "Votre question…"}
                disabled={loading || limitReached}
                rows={1}
                aria-label="Votre message"
                className="flex-1 resize-none bg-soft border border-line rounded-[10px] px-3 py-2 text-[13.5px] text-ink placeholder:text-mute outline-none focus:border-ink2 transition-[border-color] duration-[150ms] disabled:opacity-50 max-h-[120px] overflow-y-auto"
                style={{ minHeight: "38px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading || limitReached}
                aria-label="Envoyer"
                className="w-9 h-9 rounded-[10px] bg-ember text-white grid place-items-center flex-shrink-0 hover:bg-ember-ink disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color,opacity] duration-[150ms] cursor-pointer"
              >
                {loading
                  ? <Loader2 size={15} className="animate-spin" aria-hidden />
                  : <Send size={15} aria-hidden />
                }
              </button>
            </div>
            <p className="text-mute text-[11px] mt-1.5 text-center">
              Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
            </p>
          </div>
        </div>
      )}

      {/* ── FAB ──────────────────────────────────────────────────────────────── */}

      {/* Desktop: 3-D robot (hidden ≤ 1023 px) */}
      {/* When panel is open → show compact X button instead of robot */}
      <div className="hidden lg:flex items-center justify-center">
        {open ? (
          <button
            onClick={toggleOpen}
            aria-label="Fermer l'assistant"
            className="w-14 h-14 rounded-full bg-[#0a0f1a] border border-[rgba(0,196,255,0.35)] text-[#00c4ff] grid place-items-center shadow-[0_4px_24px_rgba(0,196,255,0.3)] hover:border-[rgba(0,196,255,0.7)] hover:shadow-[0_4px_32px_rgba(0,196,255,0.5)] active:scale-95 transition-[border-color,box-shadow,transform] duration-[180ms] cursor-pointer"
          >
            <X size={20} aria-hidden />
          </button>
        ) : (
          <div
            onMouseEnter={() => setRobotHovered(true)}
            onMouseLeave={() => setRobotHovered(false)}
          >
            <RobotScene
              isThinking={loading}
              isHovered={robotHovered}
              onClick={toggleOpen}
            />
          </div>
        )}
      </div>

      {/* Mobile: simple ember FAB */}
      <div className="lg:hidden">
        <SimpleFAB isOpen={open} isThinking={loading} onClick={toggleOpen} />
      </div>
    </div>
  );
}
