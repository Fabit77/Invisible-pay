import { Keypair, hash, TransactionBuilder } from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';
import { NETWORK,RPC,config,circuitLock,POOL,BOOTNODE } from '../src/lib/config';
import { inspect } from '../src/lib/evidence';
import type {WalletSigner,PoolExecuteResult} from 'stellar-private-payments';
const output=document.querySelector('#output')!;
const log=(message:string)=>{output.textContent+=message+'\n';};
window.addEventListener('stellar-private-payments:tx-progress',(event)=>{const d=(event as CustomEvent).detail;log(`${d.flow}: ${d.stage} — ${d.message}`);});
let prepared:Promise<import('stellar-private-payments').Client>|undefined;
async function prepare(){
  const path=new URL('/spp/js/index.js',location.origin).href;const sdk=await import(/* @vite-ignore */ path) as typeof import('stellar-private-payments');
  await sdk.default();sdk.configureTelemetry({level:'error',sink:'ringBuffer',revealSensitive:false});log('WASM initialized.');
  const storage=await sdk.Storage.open();log('OPFS storage worker ready.');
  let gap=true;try{gap=await sdk.bootnodeRequired(RPC,storage,{contractConfig:config});}catch(e){if(!(e instanceof Error) || !e.message.toLowerCase().includes('sync gap'))throw e;}log(`Historical archive required: ${gap}; official archive fallback enabled.`);
  const client=await sdk.Client.new({rpcUrl:RPC,storage,contractConfig:config,circuitLock,circuitsBaseUrl:new URL('/spp/dist/circuits/',location.origin).href,bootnodeUrl:BOOTNODE});
  for(let attempt=0;;attempt++){try{await client.sync();break;}catch(e){if(attempt>=4 || !(e instanceof Error) || !/sync gap|missing field .events./i.test(e.message))throw e;log('Transient RPC pagination error; retrying read-only synchronization.');await new Promise(resolve=>setTimeout(resolve,1000));}}await client.backgroundSync();log('Pool synchronized; prover worker configured with trusted fingerprints.');
return client;
}
document.querySelector('#prepare')!.addEventListener('click',async()=>{try{prepared??=prepare();await prepared;log('READY: synchronization complete. You can start the real flow.');}catch(e){prepared=undefined;log('SYNC FAILED: '+(e instanceof Error?e.message:String(e)));}});
let running=false;
document.querySelector('#start')!.addEventListener('click',async()=>{
 if(running)return;running=true;log('STARTED: real Testnet flow requested by user.');
 const report:Record<string,unknown>={startedAt:new Date().toISOString(),network:'testnet',pool:POOL};
 const save=()=>fetch('/__testnet/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report,(_,v)=>typeof v==='bigint'?v.toString():v)});
 try {
  prepared??=prepare();const client=await prepared;
  const wallets=await (await fetch('/__testnet/wallets')).json();
  const signer=(role:string):WalletSigner=>{
   const key=Keypair.fromSecret(wallets[role].secret);
   return {getPublicKey:async()=>key.publicKey(),signMessage:async(message)=>({signedMessage:Buffer.from(key.sign(hash(Buffer.from('Stellar Signed Message:\n'+message)))).toString('base64'),signerAddress:key.publicKey()}),signAuthEntry:async(value)=>({signedAuthEntry:Buffer.from(key.sign(hash(Buffer.from(value,'base64')))).toString('base64'),signerAddress:key.publicKey()}),signTransaction:async(value)=>{const tx=TransactionBuilder.fromXDR(value,NETWORK);tx.sign(key);return {signedTxXdr:tx.toXDR(),signerAddress:key.publicKey()};}};
  };
  const open=async(owner:string,payer=owner)=>{const account=await client.account({networkPassphrase:NETWORK,userAddress:wallets[owner].publicKey,signerAddress:wallets[payer].publicKey},signer(payer));if(owner===payer)await account.derivePrivacyKeys();return account;};
  const accepted=(r:PoolExecuteResult)=>{if(r.status!=='ok')throw new Error(r.message||r.status);return r.hashes;};
  for(const role of ['education','opensource','community']) {
   const account=await open(role);if(!await account.isRegistered()){await account.registerPublicKeys();log(`${role}: privacy keys registered on-chain.`);}else log(`${role}: privacy keys already registered.`);account.free();await client.sync();
  }
  report.causes=Object.fromEntries(['education','opensource','community'].map(r=>[r,wallets[r].publicKey]));await save();
  for(const role of ['participant2','participant3','donor']) {
   const account=await open(role);const pool=await account.pool({poolContract:POOL});const balance=await pool.balance();
   if(balance<30_000_000n){log(`${role}: proving public deposit.`);accepted(await pool.deposit(30_000_000n));log(`${role}: deposit confirmed.`);}else log(`${role}: existing funded notes.`);
   pool.free();account.free();await client.sync();
  }
  report.independentDepositWallets=3;await save();
  const owner=await open('donor','signer');const pool=await owner.pool({poolContract:POOL});
  const recipient=await open('education');const receiverPool=await recipient.pool({poolContract:POOL});
  const before=await receiverPool.balance();log('Generating real private donation with independent signer.');
  const hashes=accepted(await pool.transfer(wallets.education.publicKey,10_000_000n));
  report.transferHashes=hashes;await save();
  if(hashes.length!==1)throw new Error('Expected one transfer.');
  report.evidence=await inspect(hashes[0],wallets.donor.publicKey,wallets.education.publicKey);await save();
  await client.sync();const after=await receiverPool.balance();
  report.recipientBefore=before;report.recipientAfter=after;report.recipientIncrease=after-before;
  if(after-before!==10_000_000n)throw new Error('Private recipient balance increase incorrect.');
  report.status='SUCCESS';await save();log(`SUCCESS. Private donation: ${hashes[0]}`);log('Recipient discovered notes: +1 XLM. Public XDR privacy checks passed.');
 } catch(e) {report.status='FAILED';report.error=e instanceof Error?e.message:String(e);await save();log(`FAILED: ${report.error}`);} finally{running=false;}
});
