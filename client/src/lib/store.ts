import { configureStore } from "@reduxjs/toolkit";
import { preferencesReducer } from "@/lib/preferences-slice";
import { authReducer } from "./auth/auth-slice";

export const makeStore = () =>
  configureStore({
    reducer: {
      preferences: preferencesReducer,
      auth: authReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
