import { Address, Keypair, StrKey, TransactionBuilder, scValToNative } from '@stellar/stellar-sdk';
import type { WalletSigner } from 'stellar-private-payments';
import { NETWORK, POOL } from './config';
import { stellarRpc } from './rpc';
import { contains } from './bytes';

// Disposable fee payer: memory only, never stored or sent to the server.
let payer:Keypair|undefined;
let funding:Promise<string>|undefined;
export function automaticSignerAddress(){return payer?.publicKey();}
export async function prepareAutomaticSigner():Promise<string> {
 if(funding)return funding;
 funding=(async()=>{
  if((await stellarRpc().getNetwork()).passphrase!==NETWORK)throw new Error('RPC fuera de Testnet.');
  payer??=Keypair.random();const address=payer.publicKey();
  const existing=await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
  if(!existing.ok){
   if(existing.status!==404)throw new Error('No se pudo consultar la cuenta firmante.');
   const response=await fetch(`https://friendbot.stellar.org/?addr=${address}`);
   if(!response.ok)throw new Error('Friendbot no pudo financiar la firmante. Reintenta en unos momentos.');
  }
  await stellarRpc().getAccount(address);
  return address;
 })();
 try{return await funding;}finally{funding=undefined;}
}
export function validatePrivateEnvelope(value:string,owner:string,signer:string){
 const tx=TransactionBuilder.fromXDR(value,NETWORK);
 if(owner===signer || !('source' in tx) || tx.source!==signer || tx.operations.length!==1)throw new Error('Firmante u operación privada inesperados.');
 const op=tx.operations[0];
 if(op.source && op.source!==signer || op.type!=='invokeHostFunction' || op.func.type!=='hostFunctionTypeInvokeContract')throw new Error('Operación privada inesperada.');
 const fn=op.func.invokeContract;const [,ext,sender]=fn.args.map(scValToNative);
 if(Address.fromScAddress(fn.contractAddress).toString()!==POOL || fn.functionName.toString()!=='transact' || String(ext.ext_amount)!=='0' || ext.recipient!==POOL || sender!==signer)throw new Error('Parámetros públicos inseguros.');
 if(contains(tx.toEnvelope().toXDR(),StrKey.decodeEd25519PublicKey(owner)))throw new Error('El XDR expone al propietario de notas.');
 return tx;
}
export function automaticWalletSigner(owner:string):WalletSigner {
 const key=payer;if(!key)throw new Error('Prepara la firmante automática.');
 return {
  getPublicKey:async()=>key.publicKey(),
  signMessage:async()=>{throw new Error('La firmante automática no deriva claves del propietario.');},
  signAuthEntry:async()=>{throw new Error('La firmante automática requiere autorización por source account.');},
  signTransaction:async value=>{
   if((await stellarRpc().getNetwork()).passphrase!==NETWORK)throw new Error('RPC fuera de Testnet.');
   const tx=validatePrivateEnvelope(value,owner,key.publicKey());tx.sign(key);
   return {signedTxXdr:tx.toXDR(),signerAddress:key.publicKey()};
  },
 };
}
