import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { UserRole } from "../api/graphql";

export type AuthUser = { id: string; email: string; role: UserRole; is_verified: boolean };

type AuthState = {
    user: AuthUser | null;
    accessToken: string | null;
    status: "restoring" | "ready";
};

const initialState: AuthState = {
    user: null,
    accessToken: null,
    status: "restoring",
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        sessionStarted(state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.status = "ready"
        },
        sessionCleared(state) {
            state.user = null;
            state.accessToken = null;
            state.status = "ready"
        },
        restoreFinished(state) {
            state.status = "ready"
        },
        emailVerified(state) {
            if (state.user) state.user.is_verified = true;
        },
    },
});

export const { sessionStarted, sessionCleared, restoreFinished, emailVerified } = authSlice.actions;
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