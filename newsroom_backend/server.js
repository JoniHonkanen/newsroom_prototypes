import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@as-integrations/express5';
import cors from "cors";
import dotenv from "dotenv";
import typeDefs from "./schema.js";
import resolvers from "./resolvers.js";

// Lataa ympäristömuuttujat
dotenv.config();

const app = express();

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

app.use(
  "/graphql",
  cors({
    origin: ["http://localhost:3000", "http://192.168.1.217:3000"],
    credentials: true,
  }),
  express.json(),
  expressMiddleware(server)
);

// Terveystarkistus endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;

app.listen({ port: PORT }, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📊 Health check at http://localhost:${PORT}/health`);
});