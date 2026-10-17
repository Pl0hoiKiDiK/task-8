import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { authReducer, restoreFinished, sessionStarted } from "@/lib/auth/model/auth-slice";

export function makeJwt(payload: unknown): string {
    const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
    return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.signature`;
}

export const makeStore = () => configureStore({ reducer: { auth: authReducer } });
export type TestStore = ReturnType<typeof makeStore>;

export const asGuest = (store: TestStore) => void store.dispatch(restoreFinished());
export const asUser = (store: TestStore, role: "Admin" | "Employee" = "Employee", is_verified = true) =>
    void store.dispatch(sessionStarted({ user: { id: "1", email: "a@b.co", role, is_verified }, accessToken: "t" }));

export const withStore = (store: TestStore) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return <Provider store={store}> {children} </Provider>;
    };
