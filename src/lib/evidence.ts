import { stellarRpc } from './rpc';
import { contains as containsBytes, hex } from './bytes';
import { Address, TransactionBuilder, scValToNative, StrKey, xdr } from '@stellar/stellar-sdk';
import { NETWORK, POOL, VERIFIER, config } from './config';
export interface Evidence { hash:string; ledger:number; source:string; pool:string; verifier:string; extAmount:string; publicRecipient:string; nullifiers:string[]; commitments:string[]; proofAcceptedByPool:boolean; independentSigner:boolean|null; ownerBytesAbsent:boolean|null; recipientBytesAbsent:boolean; envelopeXdr:string; resultMetaXdr:string; events:string[]; checkedAt:string }
export async function inspect(hash:string, owner?:string, recipient?:string):Promise<Evidence> {
 if(!/^[a-f0-9]{64}$/i.test(hash)) throw new Error('Hash inválido.');
 const server=stellarRpc();
 const network=await server.getNetwork();
 if(network.passphrase!==NETWORK) throw new Error('RPC fuera de Testnet.');
 const result=await server.getTransaction(hash);
 if(result.status!=='SUCCESS') throw new Error(`Transacción sin éxito confirmado: ${result.status}`);
 const envelope=result.envelopeXdr.toXDR('base64');
 const tx=TransactionBuilder.fromXDR(envelope,NETWORK);
 if(!('source' in tx)) throw new Error('Fee bump no soportado por este inspector.');
 if(tx.operations.length!==1) throw new Error('Se requiere una única operación para verificar esta demo.');
 const op=tx.operations[0];
 if(op.type!=='invokeHostFunction') throw new Error('No invoca Soroban.');
 if(op.func.type!=='hostFunctionTypeInvokeContract') throw new Error('Host function incorrecta.');
 const fn=op.func.invokeContract;
 if(Address.fromScAddress(fn.contractAddress).toString()!==POOL || fn.functionName.toString()!=='transact') throw new Error('Pool o método incorrectos.');
 const [proof,ext,sender]=fn.args.map(scValToNative);
 if(String(ext.recipient)!==POOL) throw new Error('El recipient externo no es el pool.');
 if(String(ext.ext_amount)!=='0') throw new Error('ext_amount no es cero: no es una transferencia puramente privada.');
 if(sender!==tx.source || op.source && op.source!==tx.source) throw new Error('Signer/autor de contrato inconsistente.');
 if(!proof.proof) throw new Error('Falta la prueba Groth16.');
 // Pin the on-chain verifier relationship, not just a front-end configuration label.
 const key=xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({contract:Address.fromString(POOL).toScAddress(),key:xdr.ScVal.scvLedgerKeyContractInstance(),durability:xdr.ContractDataDurability.persistent}));
 const state=await server.getLedgerEntries(key);
 const entry=state.entries[0]?.val;
 if(entry?.type!=='contractData' || entry.contractData.val.type!=='scvContractInstance') throw new Error('Estado del contrato ausente.');
 const instance=entry.contractData.val.instance;
 const fields=new Map(instance.storage?.map(e=>[String(scValToNative(e.key)),scValToNative(e.val)]));
 if(fields.get('Verifier')!==VERIFIER || fields.get('PolicyFlags')!==2 || fields.get('Token')!==config.pools[0].tokenContractId) throw new Error('La configuración on-chain ha cambiado.');
 if((instance.executable.type==='contractExecutableWasm' ? hex(instance.executable.wasmHash.toBytes()) : '')!=='48af991c66a1122534bdb345fb3b2797322bd5f53dec44a8aa620a317950e291') throw new Error('Código de pool distinto del auditado.');
 const verifierKey=xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({contract:Address.fromString(VERIFIER).toScAddress(),key:xdr.ScVal.scvLedgerKeyContractInstance(),durability:xdr.ContractDataDurability.persistent}));
 const verifierEntry=(await server.getLedgerEntries(verifierKey)).entries[0]?.val;
 if(verifierEntry?.type!=='contractData' || verifierEntry.contractData.val.type!=='scvContractInstance') throw new Error('Verificador ausente.');
 const executable=verifierEntry.contractData.val.instance.executable;
 if(executable.type!=='contractExecutableWasm' || hex(executable.wasmHash.toBytes())!=='ac1c1a38199f5bfdbd4a56109ebdc99977d11343198b0ee511d3eca24ef15ace') throw new Error('Código de verificador distinto del auditado.');
 const meta=result.resultMetaXdr.toXDR('base64');
 const bytes=[result.envelopeXdr.toXDR(),result.resultMetaXdr.toXDR()];
 const contains=(address:string)=>{const key=StrKey.decodeEd25519PublicKey(address);return bytes.some(b=>containsBytes(b,key));};
 const events=result.events.contractEventsXdr.flat().map(e=>e.toXDR('base64'));
 const report:Evidence={hash,ledger:result.ledger,source:tx.source,pool:POOL,verifier:VERIFIER,extAmount:String(ext.ext_amount),publicRecipient:String(ext.recipient),nullifiers:proof.input_nullifiers.map(String),commitments:[String(proof.output_commitment0),String(proof.output_commitment1)],proofAcceptedByPool:true,independentSigner:owner?tx.source!==owner:null,ownerBytesAbsent:owner?!contains(owner):null,recipientBytesAbsent:recipient ? !contains(recipient) : false,envelopeXdr:envelope,resultMetaXdr:meta,events,checkedAt:new Date().toISOString()};
 if(owner && (!report.independentSigner || !report.ownerBytesAbsent) || recipient && !report.recipientBytesAbsent) throw new Error('Falla crítica: los datos públicos exponen una wallet protegida.');
 return report;
}
