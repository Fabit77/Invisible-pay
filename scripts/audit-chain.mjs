import { rpc, xdr, Address, scValToNative } from '@stellar/stellar-sdk';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const config=JSON.parse(await readFile('config/deployments.json','utf8'));
const server=new rpc.Server(config.rpcUrl);
const health=await server.getHealth();
const latest=await server.getLatestLedger();
const entries=[];
for(const id of [config.pools[0].poolContractId,config.verifiers.B,config.asp_non_membership]) {
 const key=xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({contract:Address.fromString(id).toScAddress(),key:xdr.ScVal.scvLedgerKeyContractInstance(),durability:xdr.ContractDataDurability.persistent}));
 const result=await server.getLedgerEntries(key);
 const entry=result.entries[0];
 if(!entry) throw new Error(`Contract missing: ${id}`);
 if(entry.val.type!=='contractData' || entry.val.contractData.val.type!=='scvContractInstance') throw new Error('Invalid contract instance');
 const instance=entry.val.contractData.val.instance;
 const storage=instance.storage?.map(e=>({key:scValToNative(e.key),value:scValToNative(e.val)}));
 entries.push({id,liveUntilLedger:entry.liveUntilLedgerSeq,wasmHash:instance.executable.type==='contractExecutableWasm' ? instance.executable.wasmHash.toString() : null,storage});
}
const report={checkedAt:new Date().toISOString(),health,latest:{sequence:latest.sequence,protocolVersion:latest.protocolVersion,id:latest.id},entries};
await mkdir('docs/audit',{recursive:true});
await writeFile('docs/audit/chain-state.json',JSON.stringify(report,(_,v)=>typeof v==='bigint'?v.toString():v,2));
console.log(JSON.stringify(report,(_,v)=>typeof v==='bigint'?v.toString():v,2));
