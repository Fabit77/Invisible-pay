import { afterEach, expect, it, vi } from 'vitest';
import { stellarRpc } from './rpc';
import { NETWORK, RPC } from './config';

afterEach(()=>vi.unstubAllGlobals());
it('reads the network using only the RPC-supported Content-Type header',async()=>{
 const fetchMock=vi.fn(async()=>new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:{passphrase:NETWORK,protocolVersion:23}}),{status:200}));
 vi.stubGlobal('fetch',fetchMock);
 expect((await stellarRpc().getNetwork()).passphrase).toBe(NETWORK);
 const [url,options]=fetchMock.mock.calls[0] as unknown as [string,RequestInit];
 expect(url).toBe(RPC);
 expect([...new Headers(options.headers).keys()]).toEqual(['content-type']);
 expect(JSON.parse(String(options.body)).method).toBe('getNetwork');
});
it('surfaces RPC HTTP failures',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response('',{status:503})));
 await expect(stellarRpc().getNetwork()).rejects.toThrow('Stellar RPC HTTP 503');
});
