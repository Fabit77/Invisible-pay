import {describe,it,expect} from 'vitest';
import {stroops,xlm,differentSigner} from './amount';
import {contains} from './bytes';
describe('exact amounts and origin privacy',()=>{
 it('preserves the smallest unit and does not round',()=>{expect(stroops('0.0000001')).toBe(1n);expect(stroops('12345678.1234567')).toBe(123456781234567n);expect(xlm(10_000_000n)).toBe('1');});
 it.each(['0','-1','1e4','NaN','Infinity','0.00000001','01','1.',' 1'])('rejects ambiguous or invalid amount %s',v=>expect(()=>stroops(v)).toThrow());
 it('refuses the owner as signer',()=>{expect(()=>differentSigner('owner','owner')).toThrow();expect(()=>differentSigner('owner','signer')).not.toThrow();});
 it('finds an embedded public key byte sequence',()=>{expect(contains(new Uint8Array([0,7,8,9]),new Uint8Array([7,8]))).toBe(true);expect(contains(new Uint8Array([0,7,8,9]),new Uint8Array([8,7]))).toBe(false);});
});
