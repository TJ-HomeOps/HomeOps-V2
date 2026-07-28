import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const wud = axios.create({
  baseURL: process.env.WUD_URL!,
});
