import type { Handler, HandlerEvent } from '@netlify/functions';

const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzPYXuXu8FSvtmRVaDywv8OxsDZZX45WfxpNBoPmdF29cnezThtfv2bxRxoELdTjUSz/exec';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

export const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  try {
    let targetUrl = GOOGLE_APPS_SCRIPT_URL;

    // Forward GET requests with query parameters
    if (event.httpMethod === 'GET') {
      const queryString = event.rawQuery || '';
      if (queryString) {
        targetUrl += `?${queryString}`;
      }

      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      const responseText = await response.text();
      return {
        statusCode: response.status,
        headers: CORS_HEADERS,
        body: responseText,
      };
    }

    // Forward POST requests
    if (event.httpMethod === 'POST') {
      const body = event.body || '{}';

      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: typeof body === 'string' ? body : JSON.stringify(body),
        redirect: 'follow',
      });

      const responseText = await response.text();
      return {
        statusCode: response.status,
        headers: CORS_HEADERS,
        body: responseText,
      };
    }

    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: `Método ${event.httpMethod} no permitido` }),
    };
  } catch (error: any) {
    console.error('Error forwarding request to Google Apps Script:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: false,
        error: error.message || 'Error de conexión con Google Apps Script',
      }),
    };
  }
};
