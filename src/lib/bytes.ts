export const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export const contains=(data:Uint8Array,needle:Uint8Array)=>hex(data).includes(hex(needle));
