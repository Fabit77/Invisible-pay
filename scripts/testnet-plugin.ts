import type { Plugin } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
// Only mounted by `SHADOW_TESTNET=1 npm run dev`. Never included in a production build.
export function testnetPlugin():Plugin {return {name:'local-testnet-fixtures',configureServer(server){
 server.middlewares.use(async(req,res,next)=>{
  if(!req.url?.startsWith('/__testnet/')) return next();
  if(req.headers.host!=='127.0.0.1:5173' || req.headers['sec-fetch-site']!=='same-origin') {res.statusCode=403;res.end();return;}
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
  try {
   if(req.url==='/__testnet/wallets' && req.method==='GET'){res.end(await readFile('.private/wallets.json'));return;}
   if(req.url==='/__testnet/report' && req.method==='POST') {let body='';for await(const part of req){body+=part;if(body.length>2_000_000)throw new Error('Report too large');}await writeFile('.private/testnet-result.json',body,{mode:0o600});res.end('{"saved":true}');return;}
   res.statusCode=404;res.end();
  }catch{res.statusCode=500;res.end('{"error":"Local fixture unavailable"}');}
 });
}};}
