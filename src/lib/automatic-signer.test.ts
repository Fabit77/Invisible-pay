import { afterEach, expect, it, vi } from 'vitest';
import { Account, Address, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import recorded from '../../docs/audit/donation.json';
import { NETWORK } from './config';
import { automaticWalletSigner, prepareAutomaticSigner, validatePrivateEnvelope } from './automatic-signer';
const owner=Keypair.random().publicKey();
afterEach(()=>vi.unstubAllGlobals());
it('accepts the real private envelope and refuses the owner as signer',()=>{
 expect(validatePrivateEnvelope(recorded.envelopeXdr,owner,recorded.source).source).toBe(recorded.source);
 expect(()=>validatePrivateEnvelope(recorded.envelopeXdr,recorded.source,recorded.source)).toThrow();
 expect(()=>validatePrivateEnvelope(recorded.envelopeXdr,owner,owner)).toThrow();
});
it('funds a distinct account directly through Friendbot and signs only private pool transactions',async()=>{
 let fundedAddress='';
 vi.stubGlobal('fetch',vi.fn(async(input:string,options?:RequestInit)=>{
  if(input.includes('friendbot.stellar.org')){fundedAddress=new URL(input).searchParams.get('addr')!;return Response.json({successful:true});}
  if(input.includes('horizon-testnet'))return new Response('',{status:404});
  const request=JSON.parse(String(options?.body));
  if(request.method!=='getNetwork')throw new Error('Unexpected RPC method');
  const result={passphrase:NETWORK};
  return Response.json({jsonrpc:'2.0',id:request.id,result});
 }));
 // Account lookup is separate from funding and is mocked at the SDK boundary.
 const { rpc }=await import('@stellar/stellar-sdk');
 const lookup=vi.spyOn(rpc.Server.prototype,'getAccount').mockImplementation(async address=>new Account(address,'1'));
 try {
  const address=await prepareAutomaticSigner();expect(address).toBe(fundedAddress);expect(address).not.toBe(owner);
  const wallet=automaticWalletSigner(owner);
  await expect(wallet.signMessage('derive')).rejects.toThrow();
  await expect(wallet.signAuthEntry('unexpected')).rejects.toThrow();
  const original=TransactionBuilder.fromXDR(recorded.envelopeXdr,NETWORK);
  if(!('source' in original))throw new Error('Unexpected fixture');
  const op=original.operations[0];if(op.type!=='invokeHostFunction'||op.func.type!=='hostFunctionTypeInvokeContract')throw new Error('Unexpected fixture');
  const fn=op.func.invokeContract;
  const tx=new TransactionBuilder(new Account(address,'1'),{fee:'100',networkPassphrase:NETWORK}).addOperation(Operation.invokeContractFunction({contract:recorded.pool,function:'transact',args:[fn.args[0],fn.args[1],Address.fromString(address).toScVal()]})).setTimeout(60).build();
  const response=await wallet.signTransaction(tx.toXDR());
  if(typeof response==='string')throw new Error('Unexpected signature response');
  const signed=TransactionBuilder.fromXDR(response.signedTxXdr,NETWORK);
  expect(Keypair.fromPublicKey(address).verify(signed.hash(),signed.signatures[0].signature)).toBe(true);
  const publicPayment=new TransactionBuilder(new Account(address,'1'),{fee:'100',networkPassphrase:NETWORK}).addOperation(Operation.payment({destination:owner,asset:(await import('@stellar/stellar-sdk')).Asset.native(),amount:'1'})).setTimeout(60).build();
  await expect(wallet.signTransaction(publicPayment.toXDR())).rejects.toThrow();
 }finally{lookup.mockRestore();}
});
