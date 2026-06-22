import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Raise chunk warning threshold (large glassmorphic app)
      chunkSizeWarningLimit: 800,
      // Enable source maps only in dev (save build size on Render)
      sourcemap: false,
      // Rollup code-splitting: split heavy vendor libs into separate cached chunks
      rollupOptions: {
        output: {
          manualChunks: {
            // React core — rarely changes, cache aggressively
            'vendor-react': ['react', 'react-dom'],
            // Animation library — large, isolate it
            'vendor-motion': ['motion'],
            // Chart library
            'vendor-recharts': ['recharts'],
            // Lucide icons
            'vendor-lucide': ['lucide-react'],
          },
        },
      },
      // Minify with esbuild (faster than terser, good enough for production)
      minify: 'esbuild' as const,
      target: 'es2020',
    },
  };
});
