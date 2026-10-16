import { testnetPlugin } from './scripts/testnet-plugin';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [tailwindcss(), ...(process.env.SHADOW_TESTNET === '1' ? [testnetPlugin()] : [])], server: { host: '127.0.0.1', port: 5173, strictPort:true, fs:{deny:['.private/**','**/.env*','**/.git/**']} }, build: { target: 'es2022' } });
