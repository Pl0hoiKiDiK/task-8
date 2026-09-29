"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector, useAppStore } from "@/lib/hooks";
import { setTheme, type ThemePreference } from "@/lib/preferences-slice";

const themeKey = "cv-builder-theme";

export function ThemeSync() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const theme = useAppSelector((state) => state.preferences.theme);
  const awaitingSavedTheme = useRef<ThemePreference | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(themeKey);
    if ((saved === "system" || saved === "light" || saved === "dark") && saved !== store.getState().preferences.theme) {
      awaitingSavedTheme.current = saved;
      dispatch(setTheme(saved));
    }
  }, [dispatch, store]);

  useEffect(() => {
    if (awaitingSavedTheme.current !== null && theme !== awaitingSavedTheme.current) return;
    document.documentElement.dataset.theme = theme;
    awaitingSavedTheme.current = null;
    localStorage.setItem(themeKey, theme);
  }, [theme]);

  return null;
}
