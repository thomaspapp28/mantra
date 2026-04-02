import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SuggestionsList } from "./SuggestionsList";

const defaults = {
  completions: ["llo", "lp", "lmet"],
  completionType: "word" as const,
  activeIndex: -1,
  listboxId: "test-listbox",
  onSelect: vi.fn(),
  onHover: vi.fn(),
};

describe("SuggestionsList", () => {
  it("renders nothing when completions are empty", () => {
    const { container } = render(
      <SuggestionsList {...defaults} completions={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all options with correct text", () => {
    render(<SuggestionsList {...defaults} />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(screen.getByText("llo")).toBeInTheDocument();
    expect(screen.getByText("lp")).toBeInTheDocument();
    expect(screen.getByText("lmet")).toBeInTheDocument();
  });

  it("sets aria-selected on the active option only", () => {
    render(<SuggestionsList {...defaults} activeIndex={1} />);
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "false");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[2]).toHaveAttribute("aria-selected", "false");
  });

  it("calls onSelect with the correct index on click", async () => {
    const onSelect = vi.fn();
    render(<SuggestionsList {...defaults} onSelect={onSelect} />);
    await userEvent.setup().click(screen.getByText("lp"));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("calls onHover with the correct index on mouse enter", async () => {
    const onHover = vi.fn();
    render(<SuggestionsList {...defaults} onHover={onHover} />);
    await userEvent.setup().hover(screen.getByText("lmet"));
    expect(onHover).toHaveBeenCalledWith(2);
  });

  it("shows the completion type chip", () => {
    render(<SuggestionsList {...defaults} />);
    expect(screen.getAllByText("word")).toHaveLength(3);
  });

  it("shows sentence chips for sentence completions", () => {
    render(<SuggestionsList {...defaults} completionType="sentence" />);
    expect(screen.getAllByText("sentence")).toHaveLength(3);
  });

  it("has a listbox role with an accessible label", () => {
    render(<SuggestionsList {...defaults} />);
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-label", "Word completions");
  });
});
