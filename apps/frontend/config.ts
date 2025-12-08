/**
 * Frontend configuration.
 * Uses Vite environment variables injected at build time.
 */

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;
