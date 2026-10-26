import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_', '']);
  const allEnv = { ...process.env, ...env };

  const findEnv = (pattern) => {
    for (const [rawKey, rawVal] of Object.entries(allEnv)) {
      const k = rawKey.trim();
      const v = typeof rawVal === 'string' ? rawVal.trim() : rawVal;
      if (typeof v === 'string' && v && pattern.test(k)) {
        return v;
      }
    }
    return '';
  };

  const supabaseUrl =
    allEnv.VITE_SUPABASE_URL ||
    findEnv(/SUPABASE_URL$/i) ||
    '';

  const supabaseKey =
    allEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    allEnv.VITE_SUPABASE_ANON_KEY ||
    findEnv(/(ANON_KEY|PUBLISHABLE_KEY)$/i) ||
    '';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseKey),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    },
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      exclude: ['xlsx'],
    },
  };
})
