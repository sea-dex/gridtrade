/**
 * Shared Axios instance with automatic proxy support.
 *
 * Node.js built-in `fetch()` does NOT respect HTTP_PROXY / HTTPS_PROXY
 * environment variables.  This module creates a pre-configured Axios
 * instance that automatically routes requests through the proxy when
 * the standard environment variables are set:
 *
 *   - HTTPS_PROXY / https_proxy
 *   - HTTP_PROXY  / http_proxy
 *   - NO_PROXY    / no_proxy
 *
 * Usage:
 *   import { http } from '../utils/http.js';
 *   const { data } = await http.get('https://api.example.com/data');
 */

import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { httpLogger } from './logger.js';

// ---------------------------------------------------------------------------
// Resolve proxy URL from environment (case-insensitive)
// ---------------------------------------------------------------------------

function getProxyUrl(): string | undefined {
  return (
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    undefined
  );
}

// ---------------------------------------------------------------------------
// Create Axios instance
// ---------------------------------------------------------------------------

function createHttpClient(): import('axios').AxiosInstance {
  const proxyUrl = getProxyUrl();

  const instance = axios.create({
    // Disable Axios's built-in proxy handling – we use https-proxy-agent instead
    // because it supports CONNECT tunnelling for HTTPS targets.
    proxy: false,
    headers: {
      Accept: 'application/json',
    },
  });

  if (proxyUrl) {
    const agent = new HttpsProxyAgent(proxyUrl);
    instance.defaults.httpAgent = agent;
    instance.defaults.httpsAgent = agent;
    httpLogger.info({ proxy: proxyUrl }, 'Using proxy');
  }

  return instance;
}

/**
 * Pre-configured Axios instance that respects HTTP_PROXY / HTTPS_PROXY
 * environment variables.
 */
export const http = createHttpClient();
