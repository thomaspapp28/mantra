import { useCallback, useId, useRef, useState } from "react";
import { Alert, CircularProgress, TextField } from "@mui/material";
import { useAutocomplete } from "../hooks/useAutocomplete";
import { SuggestionsList } from "./SuggestionsList";

export function AutocompleteInput() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const uid = useId();
  const listboxId = `${uid}-listbox`;

  const { completions, completionType, isLoading, error, accept } = useAutocomplete(value);
  const showList = open && completions.length > 0;

  const applyCompletion = useCallback((i: number) => {
    const c = completions[i];
    if (!c) return;
    setValue((prev) => prev + c);
    setOpen(false);
    setActiveIndex(-1);
    accept(c);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [completions, accept]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showList) return;
    const last = completions.length - 1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i < last ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : last));
        break;
      case "Enter":
      case "Tab":
        if (activeIndex >= 0) { e.preventDefault(); applyCompletion(activeIndex); }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }, [showList, activeIndex, completions.length, applyCompletion]);

  const activeDescendant = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <label htmlFor={`${uid}-input`} className="block mb-2 text-sm font-medium text-gray-600">
        Start typing to see completions
      </label>

      <div className="relative">
        <TextField
          inputRef={inputRef}
          id={`${uid}-input`}
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true); setActiveIndex(-1); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Type something…"
          multiline
          minRows={4}
          fullWidth
          spellCheck={false}
          slotProps={{
            htmlInput: {
              role: "combobox" as const,
              "aria-autocomplete": "list" as const,
              "aria-expanded": showList,
              "aria-controls": showList ? listboxId : undefined,
              "aria-activedescendant": activeDescendant,
              "aria-haspopup": "listbox" as const,
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              bgcolor: "#fff",
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#93c5fd" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3b82f6", borderWidth: 2 },
            },
          }}
        />

        {isLoading && (
          <div className="absolute right-3 top-3 pointer-events-none" role="status" aria-label="Loading">
            <CircularProgress size={20} thickness={4} />
          </div>
        )}
      </div>

      {error && (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: "10px" }}>
          {error}
        </Alert>
      )}

      {showList && (
        <SuggestionsList
          completions={completions}
          completionType={completionType}
          activeIndex={activeIndex}
          listboxId={listboxId}
          onSelect={applyCompletion}
          onHover={setActiveIndex}
        />
      )}
    </div>
  );
}
