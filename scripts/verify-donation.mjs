// Read-only ledger audit. Never signs or submits a transaction.
import { readFile, writeFile } from 'node:fs/promises';
import { rpc, TransactionBuilder, Address, Operation, xdr, scValToNative, nativeToScVal, StrKey } from '@stellar/stellar-sdk';
const network='Test SDF Network ; September 2015';
const pool='CA73PEBSX2GXZSMMVL46PTCXY424AIMPXKI7WWUMYJXV22AVY2DXC6DQ';
const verifier='CA66PGQD3OUO5R64CMOWL3FIRAQTWORLX36ZERALPPYOJ4ORETGFO3P5';
const txHash=process.argv[2] || '53e2a6517f620081fa543c125989ec8ef1dcaf4e0d65490656221d5847f69954';
const server=new rpc.Server('https://soroban-rpc.testnet.stellar.gateway.fm');
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
assert((await server.getNetwork()).passphrase===network,'Wrong network');
const result=await server.getTransaction(txHash);assert(result.status==='SUCCESS','Donation not successful');
const envelope=result.envelopeXdr.toXDR('base64');const meta=result.resultMetaXdr.toXDR('base64');
const tx=TransactionBuilder.fromXDR(envelope,network);assert('source' in tx && tx.operations.length===1,'Unexpected envelope');
const op=tx.operations[0];assert(op.type==='invokeHostFunction' && op.func.type==='hostFunctionTypeInvokeContract','Unexpected operation');
const fn=op.func.invokeContract;assert(Address.fromScAddress(fn.contractAddress).toString()===pool && fn.functionName.toString()==='transact','Wrong pool');
const [p,ext,sender]=fn.args.map(scValToNative);
assert(ext.ext_amount===0n && ext.recipient===pool && sender===tx.source,'Unsafe external data');
const instance=async id=>{
 const key=xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({contract:Address.fromString(id).toScAddress(),key:xdr.ScVal.scvLedgerKeyContractInstance(),durability:xdr.ContractDataDurability.persistent}));
 const data=(await server.getLedgerEntries(key)).entries[0].val.contractData.val.instance;
 return {wasm:Buffer.from(data.executable.wasmHash.toBytes()).toString('hex'),fields:new Map(data.storage?.map(e=>[String(scValToNative(e.key)),scValToNative(e.val)]))};
};
const poolState=await instance(pool);const verifierState=await instance(verifier);
assert(poolState.wasm==='48af991c66a1122534bdb345fb3b2797322bd5f53dec44a8aa620a317950e291','Pool code changed');
assert(verifierState.wasm==='ac1c1a38199f5bfdbd4a56109ebdc99977d11343198b0ee511d3eca24ef15ace','Verifier code changed');
assert(poolState.fields.get('Verifier')===verifier && poolState.fields.get('PolicyFlags')===2,'Verifier/policy changed');
const events=result.events.contractEventsXdr.flat().map(e=>({contract:StrKey.encodeContract(e.contractId.toBytes()),topics:e.body.v0.topics.map(scValToNative),data:scValToNative(e.body.v0.data)}));
const nullifiers=events.filter(e=>e.contract===pool && e.topics[0]==='new_nullifier_event');
const commitments=events.filter(e=>e.contract===pool && e.topics[0]==='new_commitment_event');
assert(nullifiers.length===2 && commitments.length===2,'Missing pool events');
assert(nullifiers.every((e,i)=>e.topics[1]===p.input_nullifiers[i]),'Nullifier mismatch');
assert(commitments[0].topics[1]===p.output_commitment0 && commitments[1].topics[1]===p.output_commitment1,'Commitment mismatch');
// Re-verify the exact public proof directly against the verifier using unsigned
// RPC simulation; then alter a public input and require rejection. No send call.
const proofScVal=fn.args[0].map.find(e=>scValToNative(e.key)==='proof').val;
const fr=v=>nativeToScVal(BigInt(v),{type:'u256'});
const publicInputs=[fr(p.root),fr(p.public_amount),fr(BigInt('0x'+Buffer.from(p.ext_data_hash).toString('hex'))),...p.input_nullifiers.map(fr),fr(p.output_commitment0),fr(p.output_commitment1),fr(p.asp_non_membership_root),fr(p.asp_non_membership_root)];
const simulate=async inputs=>{
 const source=await server.getAccount(tx.source);
 const unsigned=new TransactionBuilder(source,{fee:'100000',networkPassphrase:network}).addOperation(Operation.invokeContractFunction({contract:verifier,function:'verify',args:[proofScVal,xdr.ScVal.scvVec(inputs)]})).setTimeout(60).build();
 return server.simulateTransaction(unsigned);
};
const good=await simulate(publicInputs);if(rpc.Api.isSimulationError(good))throw new Error('Verifier simulation: '+good.error);assert(scValToNative(good.result.retval)===true,'Original proof rejected');
const bad=await simulate([fr(0),...publicInputs.slice(1)]);assert(rpc.Api.isSimulationError(bad),'Tampered public root accepted');
let localChecks;
try {
 const wallets=JSON.parse(await readFile('.private/wallets.json','utf8'));
 const bytes=[result.envelopeXdr.toXDR(),result.resultMetaXdr.toXDR(),...result.events.contractEventsXdr.flat().map(e=>e.toXDR())];
 const absent=role=>bytes.every(b=>!Buffer.from(b).includes(Buffer.from(StrKey.decodeEd25519PublicKey(wallets[role].publicKey))));
 localChecks={independentSigner:tx.source!==wallets.donor.publicKey,ownerBytesAbsent:absent('donor'),recipientBytesAbsent:absent('education')};
 assert(Object.values(localChecks).every(Boolean),'Protected account exposed');
}catch(error){if(error.code!=='ENOENT')throw error;}
const report={checkedAt:new Date().toISOString(),network:'testnet',hash:txHash,status:result.status,ledger:result.ledger,source:tx.source,pool,verifier,poolWasm:poolState.wasm,verifierWasm:verifierState.wasm,extAmount:String(ext.ext_amount),publicRecipient:ext.recipient,circuit:'policy_tx_2_2_B',originalProofDirectSimulation:true,tamperedRootRejected:true,localChecks,events,envelopeXdr:envelope,resultMetaXdr:meta};
await writeFile('docs/audit/donation.json',JSON.stringify(report,(_,v)=>typeof v==='bigint'?String(v):v instanceof Uint8Array?Buffer.from(v).toString('hex'):v,2)+'\n');
console.log(JSON.stringify({hash:txHash,ledger:result.ledger,status:result.status,originalProofDirectSimulation:true,tamperedRootRejected:true,localChecks}));
