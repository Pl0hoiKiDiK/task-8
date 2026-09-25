import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemePreference = "system" | "light" | "dark";

type PreferencesState = {
  theme: ThemePreference;
};

const initialState: PreferencesState = {
  theme: "system",
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemePreference>) {
      state.theme = action.payload;
    },
  },
});

export const { setTheme } = preferencesSlice.actions;
export const preferencesReducer = preferencesSlice.reducer;
