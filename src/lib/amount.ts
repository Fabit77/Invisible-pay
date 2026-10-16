export function stroops(value: string): bigint {
 if (!/^(0|[1-9]\d*)(\.\d{1,7})?$/.test(value)) throw new Error('Introduce un monto positivo con hasta 7 decimales.');
 const [whole, fraction = ''] = value.split('.');
 const amount = BigInt(whole)*10_000_000n + BigInt(fraction.padEnd(7,'0'));
 if (amount <= 0n || amount > (1n << 63n)-1n) throw new Error('Monto fuera de rango.');
 return amount;
}
export function xlm(value: bigint): string {return `${value/10_000_000n}.${(value%10_000_000n).toString().padStart(7,'0')}`.replace(/\.?0+$/,'');}
export function differentSigner(owner: string, signer: string) {if (!owner || !signer || owner === signer) throw new Error('La donación requiere un firmante independiente del propietario de las notas.');}
