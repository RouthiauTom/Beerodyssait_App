import {describe,it,expect} from 'vitest';
import {issueCode,validateCode,normalizeCode,TicketError} from '../../src/access/codes';
const now=Date.parse('2026-10-19T12:00:00Z');
const code=issueCode('BEER','2026-10-20','12345678');
function error(fn:()=>unknown,reason:string){try{fn();throw new Error('expected rejection');}catch(e){expect(e).toBeInstanceOf(TicketError);expect((e as TicketError).reason).toBe(reason);}}
describe('public prototype ticket rule',()=>{
 it('roundtrips bar, expiry and serial',()=>{
  const ticket=validateCode(code,['BEER'],now);expect(ticket.barId).toBe('BEER');expect(ticket.expiresOn).toBe('2026-10-20');expect(ticket.code).toBe(code);expect(normalizeCode(code)).toHaveLength(22);
 });
 it('accepts lower case, spacing and pasted hyphenated codes',()=>expect(validateCode(code.toLowerCase().replaceAll('-',' '),['BEER'],now).code).toBe(code));
 it('expires at the exact next UTC midnight',()=>{
  expect(validateCode(code,['BEER'],Date.parse('2026-10-20T23:59:59.999Z'))).toBeTruthy();
  error(()=>validateCode(code,['BEER'],Date.parse('2026-10-21T00:00:00Z')),'expired');
 });
 it('refuses codes from a different configured bar',()=>error(()=>validateCode(code,['CAFE'],now),'wrong_bar'));
 it('rejects every single-character change in its payload or check',()=>{
  const raw=normalizeCode(code);for(let i=2;i<raw.length;i++){const changed=raw.slice(0,i)+(raw[i]==='0'?'1':'0')+raw.slice(i+1);error(()=>validateCode(changed,['BEER'],now),'invalid');}
 });
 it.each(['','B1','B2'+normalizeCode(code).slice(2),code+'0','<script>','B1-BEER-OOOO-OOOO-OOOO-OOOO'])('rejects malformed input %s',value=>error(()=>validateCode(value,['BEER'],now),'invalid'));
 it.each(['2026-02-30','2026-13-01','not-a-date'])('rejects invalid calendar dates %s',date=>error(()=>issueCode('BEER',date,'12345678'),'invalid'));
 it('rejects invalid identifiers and serials',()=>{error(()=>issueCode('ABC','2026-10-20','12345678'),'invalid');error(()=>issueCode('BEER','2026-10-20','123'),'invalid');});
 it('serials produce distinct tickets',()=>expect(issueCode('BEER','2026-10-20','12345679')).not.toBe(code));
});
