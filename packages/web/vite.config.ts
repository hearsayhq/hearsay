import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The web UI talks to the local engine service (FR-020). No hosting is required
// for judging: `npm run dev:web` next to `earshot serve` is the whole setup.
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, proxy: { '/api': 'http://localhost:4100' } },
});
