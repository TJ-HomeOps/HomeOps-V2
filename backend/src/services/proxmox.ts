import axios from "axios";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const PROXMOX_URL = process.env.PROXMOX_URL!;
const PROXMOX_TOKEN_ID = process.env.PROXMOX_TOKEN_ID!;
const PROXMOX_TOKEN_SECRET = process.env.PROXMOX_TOKEN_SECRET!;

export const proxmox = axios.create({
  baseURL: `${PROXMOX_URL}/api2/json`,

  headers: {
    Authorization: `PVEAPIToken=${PROXMOX_TOKEN_ID}=${PROXMOX_TOKEN_SECRET}`,
    "Content-Type": "application/json",
  },

  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),

  timeout: 10000,
});
