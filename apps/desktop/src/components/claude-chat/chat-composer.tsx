import { type FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpIcon, SquareIcon, PlusIcon, XIcon } from "lucide-react";
import { useClaudeChatStore, offsetToLineCol } from "@/stores/claude-chat-store";
import { useDocumentStore } from "@/stores/document-store";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

interface PinnedContext {
  label: string;       // @file:line:col-line:col
  filePath: string;
  selectedText: string;
}

export const ChatComposer: FC = () => {
  const sendPrompt = useClaudeChatStore((s) => s.sendPrompt);
  const cancelExecution = useClaudeChatStore((s) => s.cancelExecution);
  const newSession = useClaudeChatStore((s) => s.newSession);
  const isStreaming = useClaudeChatStore((s) => s.isStreaming);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pinned context — persists after selection clears and after send
  const [pinnedContext, setPinnedContext] = useState<PinnedContext | null>(null);

  // Watch selection changes to auto-pin context
  const selectionRange = useDocumentStore((s) => s.selectionRange);
  const activeFileId = useDocumentStore((s) => s.activeFileId);
  const files = useDocumentStore((s) => s.files);

  const currentContextLabel = useMemo(() => {
    if (!selectionRange) return null;
    const file = files.find((f) => f.id === activeFileId);
    if (!file?.content) return null;
    const start = offsetToLineCol(file.content, selectionRange.start);
    const end = offsetToLineCol(file.content, selectionRange.end);
    return `@${file.relativePath}:${start.line}:${start.col}-${end.line}:${end.col}`;
  }, [selectionRange, activeFileId, files]);

  // Auto-pin when a new selection is made
  useEffect(() => {
    if (!selectionRange || !currentContextLabel) return;
    const file = files.find((f) => f.id === activeFileId);
    if (!file?.content) return;
    setPinnedContext({
      label: currentContextLabel,
      filePath: file.relativePath,
      selectedText: file.content.slice(selectionRange.start, selectionRange.end),
    });
  }, [selectionRange, currentContextLabel, activeFileId, files]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    // Send with pinned context override so it works even if selection was cleared
    if (pinnedContext) {
      sendPrompt(trimmed, pinnedContext);
    } else {
      sendPrompt(trimmed);
    }
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    // Clear pinned context after send — it's now part of the chat message
    setPinnedContext(null);
  }, [input, isStreaming, sendPrompt, pinnedContext]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      // Backspace at start of empty input removes pinned context
      if (e.key === "Backspace" && pinnedContext && input === "") {
        e.preventDefault();
        setPinnedContext(null);
      }
    },
    [handleSend, pinnedContext, input],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      // Auto-resize
      const el = e.target;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    },
    [],
  );

  return (
    <div className="shrink-0 p-3">
      <div className="flex w-full flex-col rounded-2xl border border-input bg-muted/30 transition-colors focus-within:border-ring focus-within:bg-background">
        {/* Pinned context chip + textarea in one flow */}
        <div className="flex flex-wrap items-center gap-1 px-4 pt-3 pb-0">
          {pinnedContext && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {pinnedContext.label}
              <button
                onClick={() => setPinnedContext(null)}
                className="ml-0.5 rounded-sm p-0.5 transition-colors hover:bg-muted-foreground/20"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          )}
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about LaTeX..."
          className="max-h-40 min-h-10 w-full resize-none bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
          autoFocus
          rows={1}
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <TooltipIconButton
            tooltip="New conversation"
            side="top"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={newSession}
          >
            <PlusIcon className="size-4" />
          </TooltipIconButton>

          <div>
            {isStreaming ? (
              <TooltipIconButton
                tooltip="Stop"
                side="top"
                variant="secondary"
                size="icon"
                className="size-8 rounded-full"
                onClick={cancelExecution}
              >
                <SquareIcon className="size-3 fill-current" />
              </TooltipIconButton>
            ) : (
              <TooltipIconButton
                tooltip="Send"
                side="top"
                variant="default"
                size="icon"
                className="size-8 rounded-full"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <ArrowUpIcon className="size-4" />
              </TooltipIconButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
