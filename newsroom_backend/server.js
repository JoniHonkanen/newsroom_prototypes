import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@as-integrations/express5';
import cors from "cors";
import typeDefs from "./schema.js";
import resolvers from "./resolvers.js";

const app = express();

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

app.use(
  "/",
  cors({
    origin: ["http://localhost:3000", "http://192.168.1.217:3000"],
    credentials: true,
  }),
  express.json(), // LISÄTTY TÄHÄN!
  expressMiddleware(server)
);

app.listen({ port: 4000 }, () => {
  console.log(`🚀 Server ready at http://localhost:4000/`);
});