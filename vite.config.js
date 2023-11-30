import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'tfhe_bg.wasm': '/node_modules/node-tfhe/tfhe_bg.wasm' // Use a placeholder path for now
    },
  },
});