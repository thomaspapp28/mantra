import { useCallback, useEffect, useReducer, useRef } from "react";
import { acceptCompletion, fetchCompletions } from "../services/api";
import type { CompletionType } from "../types";
import { useDebounce } from "./useDebounce";

interface State {
  completions: string[];
  completionType: CompletionType | null;
  isLoading: boolean;
  error: string | null;
}

type Action =
  | { type: "start" }
  | { type: "success"; completions: string[]; completionType: CompletionType }
  | { type: "error"; error: string };

const initial: State = { completions: [], completionType: null, isLoading: false, error: null };

function reducer(prev: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { ...prev, isLoading: true, error: null };
    case "success":
      return { completions: action.completions, completionType: action.completionType, isLoading: false, error: null };
    case "error":
      return { ...initial, error: action.error };
  }
}

export function useAutocomplete(input: string) {
  const [state, dispatch] = useReducer(reducer, initial);
  const debounced = useDebounce(input, 200);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!debounced) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    dispatch({ type: "start" });

    fetchCompletions(debounced, ctrl.signal)
      .then((data) => {
        if (!ctrl.signal.aborted) {
          dispatch({ type: "success", completions: data.completions, completionType: data.completion_type });
        }
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        dispatch({ type: "error", error: err instanceof Error ? err.message : "Something went wrong" });
      });

    return () => ctrl.abort();
  }, [debounced]);

  const accept = useCallback(
    async (completion: string) => {
      try {
        await acceptCompletion({ text: debounced, completion });
      } catch {
        // best-effort save
      }
    },
    [debounced],
  );

  return { ...(debounced ? state : initial), accept };
}
