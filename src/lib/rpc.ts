import { rpc } from '@stellar/stellar-sdk';
import { RPC } from './config';
export function stellarRpc() {
 const server=new rpc.Server(RPC);
 // Gateway.fm permits Content-Type but not the optional SDK telemetry headers.
 const headers=new Headers(server.httpClient.defaults.headers);
 headers.delete('X-Client-Name');headers.delete('X-Client-Version');
 server.httpClient.defaults.headers=headers;
 return server;
}
