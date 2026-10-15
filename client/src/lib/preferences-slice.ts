import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemePreference = "system" | "light" | "dark";
export const languageOptions = ["English", "French", "German", "Italian", "Polish", "Portuguese", "Russian", "Spanish", "Ukrainian"] as const;
export type LanguagePreference = (typeof languageOptions)[number];

type PreferencesState = {
  theme: ThemePreference;
  language: LanguagePreference;
};

const initialState: PreferencesState = {
  theme: "system",
  language: "English",
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemePreference>) {
      state.theme = action.payload;
    },
    setLanguage(state, action: PayloadAction<LanguagePreference>) {
      state.language = action.payload;
    },
  },
});

export const { setTheme, setLanguage } = preferencesSlice.actions;
export const preferencesReducer = preferencesSlice.reducer;
