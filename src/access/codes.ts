/** Prototype public de détection d’erreurs, sans secret ni preuve d’achat. */
export const alphabet='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const dayMs=86_400_000;
export type Ticket={code:string;barId:string;expiresOn:string;expiresAt:number};
export type CodeError='invalid'|'expired'|'wrong_bar'|'used'|'storage';
export class TicketError extends Error{reason:CodeError;constructor(reason:CodeError){super(reason);this.reason=reason;}}
export function normalizeCode(value:string):string{return value.toUpperCase().replace(/[\s-]/g,'');}
export function encodeNumber(value:number,length:number):string{
 if(!Number.isSafeInteger(value)||value<0||value>=32**length)throw new TicketError('invalid');
 let result='';for(let i=0;i<length;i++){result=alphabet[value%32]+result;value=Math.floor(value/32);}return result;
}
function decode(value:string):number{return [...value].reduce((n,c)=>n*32+alphabet.indexOf(c),0);}
function checksum(body:string):string{
 let hash=2166136261;for(const c of 'BEERODYS-B1:'+body)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 return encodeNumber(hash%32**4,4);
}
export function formatCode(value:string):string{
 const raw=normalizeCode(value);return raw.slice(0,2)+'-'+(raw.slice(2).match(/.{1,4}/g)??[]).join('-');
}
export function issueCode(barId:string,expiresOn:string,nonce:string):string{
 const bar=barId.toUpperCase(),serial=nonce.toUpperCase();
 if(!/^[0-9A-HJKMNP-TV-Z]{4}$/.test(bar)||!/^[0-9A-HJKMNP-TV-Z]{8}$/.test(serial)||!/^\d{4}-\d{2}-\d{2}$/.test(expiresOn))throw new TicketError('invalid');
 const date=Date.parse(expiresOn+'T00:00:00Z');
 if(!Number.isFinite(date)||new Date(date).toISOString().slice(0,10)!==expiresOn)throw new TicketError('invalid');
 const body=bar+encodeNumber(Math.floor(date/dayMs),4)+serial;
 return formatCode('B1'+body+checksum(body));
}
export function validateCode(value:string,allowedBars:readonly string[],now=Date.now()):Ticket{
 const code=normalizeCode(value);
 if(!/^B1[0-9A-HJKMNP-TV-Z]{20}$/.test(code)||!Number.isFinite(now))throw new TicketError('invalid');
 const body=code.slice(2,18);
 if(checksum(body)!==code.slice(18))throw new TicketError('invalid');
 const barId=body.slice(0,4),day=decode(body.slice(4,8));
 if(!allowedBars.includes(barId))throw new TicketError('wrong_bar');
 const expiresAt=(day+1)*dayMs;
 if(now>=expiresAt)throw new TicketError('expired');
 return {code:formatCode(code),barId,expiresOn:new Date(day*dayMs).toISOString().slice(0,10),expiresAt};
}
