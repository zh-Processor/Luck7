import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { draftPrivacy } from './scripts/draft-privacy';

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [draftPrivacy(), react()],
    base: env.VITE_BASE_PATH || '/',
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: isSsrBuild ? undefined : { markdown: ['react-markdown', 'remark-gfm'] },
        },
      },
    },
  };
});
