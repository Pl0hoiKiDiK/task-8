import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthUser = { id: string; email: string };

type AuthState = {
    user: AuthUser | null;
    accessToken: string | null;
};

const initialState: AuthState = {
    user: null,
    accessToken: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        sessionStarted(state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
        },
        sessionCleared(state) {
            state.user = null;
            state.accessToken = null;
        },
    },
});

export const { sessionStarted, sessionCleared } = authSlice.actions;
export const authReducer = authSlice.reducer;

const REFRESH_KEY = "cv-builder-refresh-token";

export const refreshTokenStorage = {
    get(): string | null {
        try {
            return localStorage.getItem(REFRESH_KEY);
        } catch {
            return null;
        }
    },
    set(token: string) {
        try {
            localStorage.setItem(REFRESH_KEY, token);
        } catch (error) {
            console.warn("Failed to save refresh token to localStorage:", error);
        }
    },
    clear() {
        try {
            localStorage.removeItem(REFRESH_KEY);
        } catch (error) {
            console.error("Failed to clear token from localStorage:", error);
        }
    },
};