import { contains as containsBytes } from './bytes';
import { FreighterSigner } from 'stellar-private-payments/freighter';
import { getNetworkDetails, getAddress } from '@stellar/freighter-api';
import type { Client, Account, PrivatePool, Storage, WalletSigner } from 'stellar-private-payments';
import { rpc, TransactionBuilder, scValToNative, Address, StrKey } from '@stellar/stellar-sdk';
import { BOOTNODE, NETWORK, POOL, RPC, VERIFIER, config, circuitLock } from './config';
import { differentSigner } from './amount';
type SDK=typeof import('stellar-private-payments');
let sdk:SDK; let client:Client; let storage:Storage; let account:Account; let pool:PrivatePool;
export async function testnet() {
 const details=await getNetworkDetails();
 if(details.error || details.networkPassphrase!==NETWORK) throw new Error('Abre Freighter → Settings → Network → Testnet.');
 const network=await new rpc.Server(RPC).getNetwork();
 if(network.passphrase!==NETWORK) throw new Error('RPC fuera de Stellar Testnet.');
}
export async function initialize(allowArchive:boolean) {
 const network=await new rpc.Server(RPC).getNetwork();
 if(network.passphrase!==NETWORK) throw new Error('RPC fuera de Stellar Testnet.');
 if(!sdk) {
  const path=new URL('/spp/js/index.js',location.origin).href; sdk=await import(/* @vite-ignore */ path) as SDK;
  await sdk.default(); sdk.configureTelemetry({level:'error',sink:'ringBuffer',revealSensitive:false});
 }
 storage ??= await sdk.Storage.open({workerUrl:new URL('/spp/dist/workers/storage-worker.js',location.origin).href});
 if(client) return;
 let gap=true;
 try {gap=await sdk.bootnodeRequired(RPC,storage,{contractConfig:config});}
 catch(error) {if(!allowArchive || !(error instanceof Error) || !error.message.toLowerCase().includes('sync gap')) throw error;}
 if(gap && !allowArchive) throw new Error('El historial RPC es insuficiente. Autoriza el bootnode para reconstruir el árbol.');
 const created=await sdk.Client.new({rpcUrl:RPC,storage,contractConfig:config,circuitLock,circuitsBaseUrl:new URL('/spp/dist/circuits/',location.origin).href,proverWorkerUrl:new URL('/spp/dist/workers/prover-worker.js',location.origin).href,bootnodeUrl:allowArchive?BOOTNODE:undefined});
 try {
  await created.sync();
  const state=await created.allContractsData(); const selected=state.pools.find(p=>p.contractId===POOL);
  if(!selected || selected.verifier!==VERIFIER || selected.gvkMode && selected.gvkMode!==0 || selected.policyFlags.join(',')!=='blocklist' || selected.token!==config.pools[0].tokenContractId) throw new Error('Deployment on-chain incompatible.');
  await created.backgroundSync(); client=created;
 } catch(error) {created.dispose();throw error;}
}
async function adapter(owner:string,signer:string):Promise<WalletSigner> {
 const base=new FreighterSigner();
 return {
  getPublicKey:()=>base.getPublicKey(),
  signMessage:async(message,opts)=>{await testnet();return base.signMessage(message,opts);},
  signAuthEntry:async(value,opts)=>{await testnet();return base.signAuthEntry(value,opts);},
  signTransaction:async(value,opts)=>{
   await testnet();
   const tx=TransactionBuilder.fromXDR(value,NETWORK);
   if(!('source' in tx) || tx.source!==signer) throw new Error('Source account inesperado.');
   // Prevent ownership/address leaks before the wallet signs any private transfer.
   if(owner!==signer) {
    differentSigner(owner,signer);
    if(tx.operations.length!==1) throw new Error('Operación privada inesperada.');
    const op=tx.operations[0];
    if(op.type!=='invokeHostFunction') throw new Error('Se esperaba Soroban.');
    if(op.func.type!=='hostFunctionTypeInvokeContract') throw new Error('Host function incorrecta.');
 const fn=op.func.invokeContract;
    const [,ext,sender]=fn.args.map(scValToNative);
    if(Address.fromScAddress(fn.contractAddress).toString()!==POOL || fn.functionName.toString()!=='transact' || String(ext.ext_amount)!=='0' || ext.recipient!==POOL || sender!==signer) throw new Error('Parámetros públicos inseguros.');
    if(containsBytes(tx.toEnvelope().toXDR(),StrKey.decodeEd25519PublicKey(owner))) throw new Error('El XDR expone al propietario de notas.');
   }
   return base.signTransaction(value,opts);
  }
 };
}
export async function connect():Promise<string> {
 await testnet();
 const owner=await new FreighterSigner().getPublicKey();
 await bind(owner,owner); return owner;
}
async function bind(owner:string,signer:string) {
 if(!client) throw new Error('Activa primero el SDK.');
 pool?.free(); account?.free();
 account=await client.account({networkPassphrase:NETWORK,userAddress:owner,signerAddress:signer},await adapter(owner,signer));
 if(owner===signer) await account.derivePrivacyKeys();
 pool=await account.pool({poolContract:POOL});
}
export async function register(owner:string) {await bind(owner,owner);return account.registerPublicKeys();}
export async function refresh() {await testnet();await client.sync();const balance=await pool.balance();return {balance,registered:await account.isRegistered()};}
export async function publicBalance(owner:string) {
 const response=await fetch(`https://horizon-testnet.stellar.org/accounts/${owner}`);if(!response.ok) throw new Error('Cuenta sin financiar. Usa Friendbot.');
 const data=await response.json();return String(data.balances.find((b:{asset_type:string})=>b.asset_type==='native')?.balance || '0');
}
export async function deposit(owner:string,amount:bigint) {await bind(owner,owner);return pool.deposit(amount);}
export async function donate(owner:string,signer:string,recipient:string,amount:bigint) {
 differentSigner(owner,signer); if(!StrKey.isValidEd25519PublicKey(signer)||!StrKey.isValidEd25519PublicKey(recipient)) throw new Error('Dirección Stellar inválida.');
 const active=await getAddress();if(active.address!==signer) throw new Error('Selecciona la cuenta firmante en Freighter, conservando al donante conectado en ShadowDonate.');
 await client.sync(); const lookup=await client.recipientLookup(recipient);
 if(!lookup.registryFullySynced || !lookup.entry) throw new Error('Beneficiario sin claves registradas o registry sin sincronizar.');
 await bind(owner,signer);if(await pool.balance()<amount) throw new Error('Saldo privado insuficiente.');
 const estimate=await pool.estimate(amount);if(estimate.txCount!==1) throw new Error('Para esta evidencia usa notas que permitan una sola transacción.');
 return pool.transfer(recipient,amount);
}
export async function withdraw(owner:string,amount:bigint) {await bind(owner,owner);return pool.withdraw(amount,owner);}
