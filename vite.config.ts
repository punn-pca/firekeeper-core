import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: '',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Keep large, stable third-party libraries out of the application chunk.
          // This improves browser caching and keeps feature code easier to inspect.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/@firebase/auth/') || id.includes('/firebase/auth/')) return 'firebase-auth';
            if (id.includes('/@firebase/firestore/') || id.includes('/firebase/firestore/')) return 'firebase-firestore';
            if (id.includes('/@firebase/analytics/') || id.includes('/firebase/analytics/')) return 'firebase-analytics';
            if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase-core';
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) return 'react-vendor';
            if (
              id.includes('/react-markdown/') ||
              id.includes('/remark-') ||
              id.includes('/rehype-') ||
              id.includes('/katex/')
            ) return 'markdown';
            if (id.includes('/lucide-react/') || id.includes('/motion/')) return 'ui-vendor';
            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
