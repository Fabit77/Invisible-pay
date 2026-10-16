import { rpc } from '@stellar/stellar-sdk';
import { RPC } from './config';
export function stellarRpc() {
 const server=new rpc.Server(RPC);
 // The SDK's underlying client retains its initial telemetry headers even when
 // defaults.headers is replaced. Send RPC JSON with only CORS-supported headers.
 server.httpClient.defaults.adapter=async request=>{
  if(!request.url || new URL(request.url).href!==new URL(RPC).href) throw new Error('Unexpected RPC destination.');
  const response=await fetch(RPC,{method:'POST',headers:{'Content-Type':'application/json'},body:typeof request.data==='string'?request.data:JSON.stringify(request.data),signal:AbortSignal.timeout(request.timeout || 30_000)});
  if(!response.ok) throw new Error(`Stellar RPC HTTP ${response.status}`);
  return {data:await response.json(),headers:Object.fromEntries(response.headers),config:request,status:response.status,statusText:response.statusText};
 };
 return server;
}
