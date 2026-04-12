"use client";

import { useCallback, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TagInputProps = {
  id?: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  addLabel: string;
  removeTagAria: string;
  inputClassName?: string;
  disabled?: boolean;
  hint?: string;
};

export function TagInput({
  id,
  tags,
  onTagsChange,
  placeholder,
  addLabel,
  removeTagAria,
  inputClassName,
  disabled,
  hint,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const add = useCallback(() => {
    const v = draft.trim();
    if (!v) return;
    if (tags.some((t) => t === v)) {
      setDraft("");
      return;
    }
    onTagsChange([...tags, v]);
    setDraft("");
  }, [draft, tags, onTagsChange]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex min-h-11 flex-wrap gap-2 rounded-md border border-input bg-background px-2 py-2",
          tags.length === 0 && "items-center",
        )}
      >
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/12 px-2.5 py-1 text-sm text-foreground"
          >
            <span className="min-w-0 break-words">{tag}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onTagsChange(tags.filter((_, j) => j !== i))}
              className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-primary/20 hover:text-foreground disabled:opacity-50"
              aria-label={removeTagAria}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <Input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("h-11 min-h-11", inputClassName)}
        />
        <Button type="button" variant="secondary" className="h-11 shrink-0 sm:min-w-[5.5rem]" disabled={disabled} onClick={add}>
          {addLabel}
        </Button>
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
