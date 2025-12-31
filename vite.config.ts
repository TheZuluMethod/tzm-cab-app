/**
 * Vite Configuration
 * 
 * Build tool configuration for the TZM CAB application.
 * Handles environment variables, path aliases, and build optimization.
 * 
 * @module vite.config
 */

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration function
 * 
 * Configures Vite with React plugin, environment variables, path aliases,
 * and optimized build settings.
 * 
 * @param mode - Build mode (development, production, etc.)
 * @returns Vite configuration object
 */
export default defineConfig(({ mode }) => {
  // Load environment variables from .env file
  const env = loadEnv(mode, process.cwd(), '');
  
  // Debug: Log if API key is found (without exposing the key)
  if (env['GEMINI_API_KEY']) {
    const keyPreview = env['GEMINI_API_KEY'].substring(0, 10);
    const isPlaceholder = env['GEMINI_API_KEY'].includes('your_gemini_api_key');
    console.log(`[Vite Config] GEMINI_API_KEY found: ${keyPreview}... (placeholder: ${isPlaceholder})`);
  } else {
    console.warn('[Vite Config] ⚠️ GEMINI_API_KEY not found in .env file');
  }
  
  /**
   * Helper to safely stringify environment variables
   * 
   * @param value - Environment variable value
   * @returns JSON stringified value or 'undefined' string
   */
  const stringifyEnv = (value: string | undefined): string => {
    return value ? JSON.stringify(value) : 'undefined';
  };
  
  return {
    // Development server configuration
    server: {
      port: 5173,
      host: '0.0.0.0', // Allow external connections
      open: false, // Don't auto-open browser
    },
    
    // Plugins
    plugins: [react()],
    
    // Environment variable definitions
    // These are injected at build time for client-side access
    define: {
      'process.env.API_KEY': stringifyEnv(env['GEMINI_API_KEY']),
      'process.env.GEMINI_API_KEY': stringifyEnv(env['GEMINI_API_KEY']),
      'process.env.PERPLEXITY_API_KEY': stringifyEnv(env['PERPLEXITY_API_KEY']),
      'process.env.SENDGRID_API_KEY': stringifyEnv(env['SENDGRID_API_KEY']),
      'process.env.SMTP_HOST': stringifyEnv(env['SMTP_HOST']),
      'process.env.SMTP_PORT': stringifyEnv(env['SMTP_PORT']),
      'process.env.SMTP_SECURE': stringifyEnv(env['SMTP_SECURE']),
      'process.env.SMTP_USER': stringifyEnv(env['SMTP_USER']),
      'process.env.SMTP_PASS': stringifyEnv(env['SMTP_PASS']),
      'process.env.ERROR_REPORT_FROM_EMAIL': stringifyEnv(
        env['ERROR_REPORT_FROM_EMAIL'] ?? 'errors@thezulumethod.com'
      ),
      'import.meta.env.VITE_SUPABASE_URL': stringifyEnv(env['VITE_SUPABASE_URL']),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': stringifyEnv(env['VITE_SUPABASE_ANON_KEY']),
    },
    
    // Path resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    
    // Build configuration
    build: {
      // Code splitting configuration
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            'react-vendor': ['react', 'react-dom'],
            'markdown': ['react-markdown', 'remark-gfm'],
            'icons': ['lucide-react'],
          },
        },
      },
      // Increase chunk size warning limit (for large markdown content)
      chunkSizeWarningLimit: 600,
      // Source maps for production debugging
      sourcemap: mode === 'development',
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-markdown', 'remark-gfm', 'lucide-react'],
    },
  };
});
