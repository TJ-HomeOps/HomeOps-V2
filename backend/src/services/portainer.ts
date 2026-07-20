import axios from "axios";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

export const portainer = axios.create({
  baseURL: process.env.PORTAINER_URL,
  headers: {
    "X-API-Key": process.env.PORTAINER_TOKEN!,
    "Content-Type": "application/json",
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});
