import {z} from 'zod';
import {entities,type EntityName,type Value} from './entities';
export function entitySchema(table:EntityName){
 const shape:Record<string,z.ZodType>={};
 for(const f of entities[table].fields){
  let schema:z.ZodType;
  if(f.kind==='checkbox')schema=z.boolean();
  else if(f.kind==='weekday')schema=z.coerce.number().int().min(1).max(5);
  else {let s=z.string().trim().max(['textarea','markdown'].includes(f.kind)?20000:500,'O texto é demasiado longo.');if(f.required)s=s.min(1,'Este campo é obrigatorio.');if(f.kind==='email')s=s.refine(v=>!v||z.email().safeParse(v).success,'Revisa o correo electrónico.');if(f.kind==='url')s=s.refine(v=>!v||/^https?:\/\//i.test(v),'Usa un enderezo http ou https.');if(f.kind==='reference')s=s.refine(v=>!v||z.uuid().safeParse(v).success,'Selecciona unha opción válida.');if(f.kind==='date')s=s.refine(v=>!v||/^\d{4}-\d{2}-\d{2}$/.test(v),'Revisa a data.');if(f.options)s=s.refine(v=>f.options!.includes(v),'Selecciona unha opción válida.');schema=s;}
  shape[f.name]=schema;
 }
 return z.object(shape).superRefine((v,ctx)=>{
  if(v.ends_on&&v.starts_on&&String(v.ends_on)<String(v.starts_on))ctx.addIssue({code:'custom',path:['ends_on'],message:'A fin non pode ser anterior ao inicio.'});
  if(v.end_time&&v.start_time&&String(v.end_time)<=String(v.start_time))ctx.addIssue({code:'custom',path:['end_time'],message:'A hora de fin debe ser posterior ao inicio.'});
  if(table==='calendar_events'&&v.recurrence!=='Non se repite'&&(!v.repeat_until||String(v.repeat_until)<String(v.starts_on)))ctx.addIssue({code:'custom',path:['repeat_until'],message:'Indica unha data de fin válida para a repetición.'});
  if(table==='calendar_events'&&!v.all_day&&(!v.start_time||!v.end_time))ctx.addIssue({code:'custom',path:['start_time'],message:'Indica tanto a hora de inicio como a de fin.'});
 }) as z.ZodType<Record<string,Value>>;
}
export function errorMessage(error:unknown):string{
 const e=error as {code?:string;message?:string};
 if(e.code==='23503')return 'O rexistro ten información relacionada. Revisa esas relacións antes de eliminalo.';
 if(e.code==='23505')return 'Xa existe un rexistro con estes datos.';
 if(e.code==='42501')return 'Non tes permiso para realizar esta operación. Volve iniciar sesión.';
 if(e.code==='23514'||e.code==='23502')return 'Revisa os campos obrigatorios, as datas e as horas.';
 if(e.code==='invalid_credentials')return 'O correo ou o contrasinal non son correctos.';
 if(e.code==='email_not_confirmed')return 'Confirma o correo electrónico antes de entrar.';
 if(e.code==='over_email_send_rate_limit')return 'Alcanzouse o límite de correos. Agarda uns minutos antes de intentalo de novo.';
 if(e.message?.includes('fetch'))return 'Non se puido conectar. Comproba a conexión e volve intentalo.';
 return 'Non se puido completar a operación. Revisa os datos e volve intentalo.';
}
