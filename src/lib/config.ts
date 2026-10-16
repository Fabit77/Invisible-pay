import deployment from '../../config/deployments.json';
import fingerprints from '../../config/circuits.json';
import type { ContractConfigInput, CircuitLockInput } from 'stellar-private-payments';
export const NETWORK = 'Test SDF Network ; September 2015';
export const RPC = import.meta.env.VITE_STELLAR_RPC || 'https://soroban-rpc.testnet.stellar.gateway.fm';
export const BOOTNODE = import.meta.env.VITE_BOOTNODE_URL || 'https://bootnode.dev-nethermind.xyz';
export const config: ContractConfigInput = deployment as ContractConfigInput;
export const circuitLock: CircuitLockInput = fingerprints;
export const POOL = deployment.pools.find(p => p.asset.kind === 'native' && !('gvkMode' in p))!.poolContractId;
export const VERIFIER = deployment.verifiers.B;
export const causes = [
 {id:'education', name:'Educación tecnológica', category:'APRENDER', description:'Abrir caminos al conocimiento digital.', address:import.meta.env.VITE_CAUSE_EDUCATION || ''},
 {id:'opensource', name:'Código abierto', category:'CONSTRUIR', description:'Herramientas abiertas para todos.', address:import.meta.env.VITE_CAUSE_OPENSOURCE || ''},
 {id:'community', name:'Iniciativas comunitarias', category:'CONECTAR', description:'Ideas pequeñas. Impacto compartido.', address:import.meta.env.VITE_CAUSE_COMMUNITY || ''},
];
