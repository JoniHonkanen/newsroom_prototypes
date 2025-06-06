"use client"

import { ApolloProvider as ClientApolloProvider } from "@apollo/client"
import { createApolloClient } from "@/lib/apolloClient"

let globalApolloClient = null

function initializeApollo(headers = {}) {
  if (typeof window !== "undefined" && globalApolloClient) {
    return globalApolloClient
  }
  const client = createApolloClient(headers)
  if (typeof window !== "undefined") {
    globalApolloClient = client
  }
  return client
}

export default function ApolloProvider({ children }) {
  // Emme lataa initialStatea, vaan luomme clientin vasta selaimessa
  const client = initializeApollo()
  return <ClientApolloProvider client={client}>{children}</ClientApolloProvider>
}
