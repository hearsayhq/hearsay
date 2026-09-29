import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The console talks to the local engine service (FR-040). No hosting is required
// for judging: `npm run dev:web` next to `hearsay serve` is the whole setup.
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, proxy: { '/api': 'http://localhost:4100' } },
});
