import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { OtpField } from "./otp-field";

let latest: string[] = [];
function Harness({ readOnly }: { readOnly?: boolean }) {
    const [v, setV] = useState<string[]>(Array(6).fill(""));
    latest = v;
    return <OtpField value={v} onChange={setV} readOnly={readOnly} />;
}
const cell = (i: number) => screen.getByLabelText(`Digit ${i + 1} of 6`) as HTMLInputElement;
const code = () => latest.join("");

describe("OtpField", () => {
    it("typing moves focus forward", async () => {
        const user = userEvent.setup();
        render(<Harness />);
        await user.click(cell(0));
        await user.keyboard("123");
        expect(code()).toBe("123");
        expect(document.activeElement).toBe(cell(3));
    });
    it("ignores non-digits", async () => {
        const user = userEvent.setup();
        render(<Harness />);
        await user.click(cell(0));
        await user.keyboard("a-b1");
        expect(code()).toBe("1");
    });
    it("paste of full code fills all cells", () => {
        render(<Harness />);
        fireEvent.paste(cell(2), { clipboardData: { getData: () => "654321" } });
        expect(code()).toBe("654321");
    });
    it("paste with separators / extra chars: takes digits, trims to length", () => {
        render(<Harness />);
        fireEvent.paste(cell(0), { clipboardData: { getData: () => "12 34-56 78" } });
        expect(code()).toBe("123456");
    });
    it("paste in the middle fills from that cell", () => {
        render(<Harness />);
        fireEvent.paste(cell(3), { clipboardData: { getData: () => "99" } });
        expect(latest).toEqual(["", "", "", "9", "9", ""]);
    });
    it("Backspace on an empty cell clears previous and focuses it", async () => {
        const user = userEvent.setup();
        render(<Harness />);
        await user.click(cell(0));
        await user.keyboard("12");
        await user.keyboard("{Backspace}");
        expect(code()).toBe("1");
        expect(document.activeElement).toBe(cell(1));
    });
    it("arrows move focus and clamp at edges", async () => {
        const user = userEvent.setup();
        render(<Harness />);
        await user.click(cell(0));
        await user.keyboard("{ArrowLeft}");
        expect(document.activeElement).toBe(cell(0));
        await user.keyboard("{ArrowRight}{ArrowRight}");
        expect(document.activeElement).toBe(cell(2));
    });
    it("readOnly blocks typing", async () => {
        const user = userEvent.setup();
        render(<Harness readOnly />);
        await user.click(cell(0));
        await user.keyboard("1");
        expect(code()).toBe("");
    });
});
