import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AutocompleteInput } from "./AutocompleteInput";

const MOCK = {
  completions: ["llo", "lp", "lmet"],
  completion_type: "word",
  text: "he",
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK),
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("AutocompleteInput", () => {
  it("renders with correct ARIA attributes", () => {
    render(<AutocompleteInput />);
    const input = screen.getByRole("combobox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("shows suggestions after typing", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AutocompleteInput />);

    await user.type(screen.getByRole("combobox"), "he");

    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("applies completion on click", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AutocompleteInput />);

    await user.type(screen.getByRole("combobox"), "he");
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());

    await user.click(screen.getByText("llo"));
    expect(screen.getByRole("combobox")).toHaveValue("hello");
  });

  it("shows error on API failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({ detail: "LLM unavailable" }),
    }));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AutocompleteInput />);

    await user.type(screen.getByRole("combobox"), "he");
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("LLM unavailable")).toBeInTheDocument();
  });

  it("no suggestions when input is empty", () => {
    render(<AutocompleteInput />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
