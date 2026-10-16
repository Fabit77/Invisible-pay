import {Keypair} from '@stellar/stellar-sdk';
import {mkdir,writeFile,readFile,chmod} from 'node:fs/promises';
await mkdir('.private',{recursive:true,mode:0o700});
let wallets;
try { wallets=JSON.parse(await readFile('.private/wallets.json','utf8')); }
catch(e) {if(e.code!=='ENOENT') throw e;wallets=Object.fromEntries(['donor','participant2','participant3','signer','education','opensource','community'].map(role=>{const key=Keypair.random();return [role,{publicKey:key.publicKey(),secret:key.secret()}];}));await writeFile('.private/wallets.json',JSON.stringify(wallets),{mode:0o600});}
await chmod('.private/wallets.json',0o600);
for(const [role,wallet] of Object.entries(wallets)) {
 const exists=await fetch(`https://horizon-testnet.stellar.org/accounts/${wallet.publicKey}`);
 if(exists.status===404) {const response=await fetch(`https://friendbot.stellar.org?addr=${wallet.publicKey}`);if(!response.ok) throw new Error(`Friendbot failed for ${role}: ${response.status}`);}
 else if(!exists.ok) throw new Error('Horizon unavailable');
 console.log(`Testnet ${role}: funded independently (address kept in .private)`);
}
