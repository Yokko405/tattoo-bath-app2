/**
 * Cloudflare Workers API for facilities data
 * This worker serves the facilities.json data with proper CORS headers
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS request for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // API Routes
    if (url.pathname === '/api/facilities') {
      return handleFacilitiesRequest(env, corsHeaders);
    }

    if (url.pathname.startsWith('/api/facility/')) {
      const id = url.pathname.split('/').pop();
      return handleFacilityByIdRequest(id, env, corsHeaders);
    }

    // Default response
    return new Response('Tattoo Bath App API', {
      headers: {
        'Content-Type': 'text/plain',
        ...corsHeaders,
      },
    });
  },
};

/**
 * Handle request for all facilities
 */
async function handleFacilitiesRequest(env, corsHeaders) {
  try {
    // In production, you would fetch from KV storage:
    // const data = await env.FACILITIES_KV.get('facilities', { type: 'json' });

    // For now, return a basic response
    // The actual data is served from the static JSON file
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Use /data/facilities.json for facility data',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch facilities' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

/**
 * Handle request for a specific facility by ID
 */
async function handleFacilityByIdRequest(id, env, corsHeaders) {
  try {
    // In production, you would fetch from KV storage:
    // const facility = await env.FACILITIES_KV.get(`facility:${id}`, { type: 'json' });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Facility ${id} - Use client-side filtering for now`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch facility' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}
