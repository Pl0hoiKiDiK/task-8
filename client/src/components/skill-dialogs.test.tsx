import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SkillRemoveDialog } from "@/components/skill-dialogs";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

afterEach(cleanup);

describe("skill removal", () => {
  it("keeps the count until removal succeeds, then closes before resetting selection", async () => {
    let resolveRemoval: (() => void) | undefined;
    const onConfirm = () => new Promise<void>((resolve) => { resolveRemoval = resolve; });
    const order: string[] = [];
    render(<SkillRemoveDialog count={2} error="" onConfirm={onConfirm}
      onClose={() => order.push("close")} onSuccess={() => order.push("reset")} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByText("2 skills")).toBeVisible();
    expect(screen.getByRole("button", { name: "Removing..." })).toBeDisabled();
    expect(order).toEqual([]);

    resolveRemoval?.();
    await waitFor(() => expect(order).toEqual(["close", "reset"]));
  });

  it("keeps the selection when removal fails", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    render(<SkillRemoveDialog count={1} error="" onConfirm={() => Promise.reject(new Error("failed"))}
      onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to remove skills");
    expect(screen.getByText("1 skill")).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
