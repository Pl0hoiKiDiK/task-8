import { describe, expect, it } from "vitest";
import { setTheme } from "@/lib/preferences-slice";
import { makeStore } from "@/lib/store";

describe("Redux store isolation", () => {
  it("keeps UI preferences separate between store instances", () => {
    const firstRequestStore = makeStore();
    const secondRequestStore = makeStore();

    firstRequestStore.dispatch(setTheme("dark"));

    expect(firstRequestStore.getState().preferences.theme).toBe("dark");
    expect(secondRequestStore.getState().preferences.theme).toBe("system");
  });
});
