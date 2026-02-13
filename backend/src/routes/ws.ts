import { FastifyPluginAsync } from 'fastify';
import { addClient } from '../services/ws.service.js';

const wsRoutes: FastifyPluginAsync = async (fastify) => {
  // WebSocket endpoint for real-time grid order updates
  // Connect: ws://host:port/api/v1/ws?chain_id=97&owner=0x...
  fastify.get('/ws', { websocket: true }, (socket, request) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const chainId = Number(url.searchParams.get('chain_id') || '97');
    const owner = url.searchParams.get('owner') || undefined;

    addClient(socket, chainId, owner);
  });
};

export default wsRoutes;
