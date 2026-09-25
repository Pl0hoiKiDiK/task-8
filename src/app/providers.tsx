"use client";

import { useState, type ReactNode } from "react";
import { HttpLink } from "@apollo/client";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { Provider as ReduxProvider } from "react-redux";
import { makeStore } from "@/lib/store";

function makeApolloClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3001/api/graphql",
    }),
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return (
    <ReduxProvider store={store}>
      <ApolloNextAppProvider makeClient={makeApolloClient}>
        {children}
      </ApolloNextAppProvider>
    </ReduxProvider>
  );
}
