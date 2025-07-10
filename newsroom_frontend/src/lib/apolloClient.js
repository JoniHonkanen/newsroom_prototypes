import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client"

// Palvelin- ja client-puolella yhteinen funktio
export function createApolloClient(headers = {}) {
  return new ApolloClient({
    // Palvelinpuolella ssrMode = true, clientpuolella automaattisesti false
    ssrMode: typeof window === "undefined",
    link: new HttpLink({
      uri: process.env.NODE_ENV === "development"
        ? "http://localhost:4000/graphql"   // kehitysportti
        : "https://your-production-api/graphql",
      credentials: "include",
      headers,                     // serverkutsuissa Next 15:s headers()
      fetch,
    }),
    cache: new InMemoryCache()
  })
}
