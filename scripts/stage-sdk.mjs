import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const source = 'node_modules/stellar-private-payments';
const dest = 'public/spp';
const lock = JSON.parse(await readFile('config/circuits.json','utf8'));
await rm(dest,{recursive:true,force:true});
await mkdir(dest,{recursive:true});
// Keep SDK-relative worker and WASM paths intact. Ship only the selected circuit.
await cp(`${source}/js`, `${dest}/js`, {recursive:true});
await cp(`${source}/dist`, `${dest}/dist`, {recursive:true, filter: path => !path.includes('/dist/circuits/')});
await mkdir(`${dest}/dist/circuits`,{recursive:true});
const artifacts = [['r1cs','policy_tx_2_2_B.r1cs'],['graph.bin','policy_tx_2_2_B.graph.bin'],['proving_key.bin','policy_tx_2_2_B_proving_key.bin']];
for (const [key,file] of artifacts) {
 const data = await readFile(`${source}/dist/circuits/${file}`);
 const actual = createHash('sha256').update(data).digest('hex');
 if(actual !== lock.policy_tx_2_2_B[key]) throw new Error(`Circuit fingerprint mismatch: ${file}`);
 await writeFile(`${dest}/dist/circuits/${file}`,data);
 console.log(`Verified SHA-256 ${file}: ${actual}`);
}
for(const file of ['NOTICE.txt','source-bundle.tar.gz']) await cp(`${source}/dist/circuits/${file}`,`${dest}/dist/circuits/${file}`);
