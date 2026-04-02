import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("updates only after the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 300 } },
    );

    rerender({ value: "ab", delay: 300 });
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("ab");
  });

  it("resets the timer on each new value", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: "x" } },
    );

    rerender({ value: "xy" });
    act(() => vi.advanceTimersByTime(100));

    rerender({ value: "xyz" });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("x");

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("xyz");
  });

  it("handles empty string", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: "hi" } },
    );

    rerender({ value: "" });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("");
  });
});
