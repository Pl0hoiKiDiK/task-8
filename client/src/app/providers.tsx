"use client";

import { useState, type ReactNode } from "react";
import { HttpLink } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { Provider as ReduxProvider } from "react-redux";
import { makeStore, type AppStore } from "@/lib/store";

function makeApolloClient(store: AppStore) {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3001/api/graphql",
  });

  
  const authLink = new SetContextLink(({ headers }) => {
    const token = store.getState().auth.accessToken;
    return {
      headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) },
    };
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink),
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return (
    <ReduxProvider store={store}>
      <ApolloNextAppProvider makeClient={() => makeApolloClient(store)}>
        {children}
      </ApolloNextAppProvider>
    </ReduxProvider>
  );
}