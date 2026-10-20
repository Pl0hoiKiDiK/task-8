"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HttpLink } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { SetContextLink } from "@apollo/client/link/context";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { Provider as ReduxProvider } from "react-redux";
import { makeStore, type AppStore } from "@/lib/store";
import { useAppDispatch } from "@/lib/hooks";
import { restoreFinished, sessionStarted } from "@/lib/auth/model/auth-slice";
import { restoreSession } from "@/lib/auth/api/restore-session";
import { RequireAuth } from "@/components/auth/require-auth";

import { createNetworkRetryLink } from "@/lib/system/network-retry-link";

import { NoInternetGate } from "@/components/system/no-internet-gate";
import { UnsupportedDevice } from "@/components/system/unsupported-device";

const retryLink = createNetworkRetryLink();


function makeApolloClient(store: AppStore) {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3001/api/graphql",
  });

  const authLink = new SetContextLink(({ headers }) => {
    const token = store.getState().auth.accessToken;
    if (!token || headers?.authorization) return {};
    return { headers: { ...headers, authorization: `Bearer ${token}` } };
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: retryLink.concat(authLink).concat(httpLink),
  });
}

function SessionRestorer() {
  const client = useApolloClient();
  const dispatch = useAppDispatch();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    restoreSession(client)
      .then((session) => dispatch(session ? sessionStarted(session) : restoreFinished()))
      .catch(() => dispatch(restoreFinished()));
  }, [client, dispatch]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return (
    <ReduxProvider store={store}>
      <ApolloNextAppProvider makeClient={() => makeApolloClient(store)}>
        <SessionRestorer />
        <UnsupportedDevice />
        <div className="contents max-md:hidden">
          <NoInternetGate>
            <RequireAuth>{children}</RequireAuth>
          </NoInternetGate>
        </div>
      </ApolloNextAppProvider>
    </ReduxProvider>
  );
}