import { Chip, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import type { CompletionType } from "../types";

interface Props {
  completions: string[];
  completionType: CompletionType | null;
  activeIndex: number;
  listboxId: string;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
}

export function SuggestionsList({
  completions,
  completionType,
  activeIndex,
  listboxId,
  onSelect,
  onHover,
}: Props) {
  if (!completions.length) return null;

  return (
    <List
      id={listboxId}
      role="listbox"
      aria-label={completionType === "sentence" ? "Sentence completions" : "Word completions"}
      disablePadding
      className="absolute z-10 mt-1 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl max-h-64"
    >
      {completions.map((text, i) => (
        <ListItem
          key={`${text}-${i}`}
          id={`${listboxId}-option-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          disablePadding
          onMouseEnter={() => onHover(i)}
        >
          <ListItemButton
            selected={i === activeIndex}
            onMouseDown={(e) => { e.preventDefault(); onSelect(i); }}
            sx={{
              py: 1.25, px: 2,
              "&.Mui-selected": { bgcolor: "rgba(59,130,246,0.08)" },
              "&.Mui-selected:hover": { bgcolor: "rgba(59,130,246,0.12)" },
            }}
          >
            <ListItemText
              primary={text}
              slotProps={{ primary: { className: "font-mono text-sm truncate" } }}
            />
            {completionType && (
              <Chip
                label={completionType}
                size="small"
                variant="outlined"
                sx={{
                  ml: 1.5, height: 22, fontSize: "0.7rem", fontWeight: 500,
                  borderColor: completionType === "sentence" ? "#8b5cf6" : "#3b82f6",
                  color: completionType === "sentence" ? "#7c3aed" : "#2563eb",
                }}
              />
            )}
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
