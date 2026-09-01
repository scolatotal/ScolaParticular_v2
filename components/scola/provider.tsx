'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from '@/lib/supabase';
import {emptyDataset,entities,entityNames,type Dataset,type EntityName,type DataRow,type Value} from '@/lib/entities';
import {errorMessage} from '@/lib/validation';
type Editor={table:EntityName;row?:DataRow;defaults?:Record<string,Value>};
type Context={user:User|null;authReady:boolean;loading:boolean;data:Dataset;error:string;reload:()=>Promise<void>;save:(table:EntityName,values:Record<string,Value>,id?:string)=>Promise<void>;remove:(table:EntityName,row:DataRow)=>Promise<void>;editor:Editor|null;edit:(table:EntityName,row?:DataRow,defaults?:Record<string,Value>)=>void;closeEditor:()=>void;notice:(text:string,failed?:boolean)=>void;signOut:()=>Promise<void>};
const AppContext=createContext<Context|null>(null);
export const useApp=()=>{const ctx=useContext(AppContext);if(!ctx)throw new Error('AppProvider required');return ctx;};
export function AppProvider({children}:{children:ReactNode}){
 const[user,setUser]=useState<User|null>(null),[authReady,setAuthReady]=useState(false),[loading,setLoading]=useState(false),[data,setData]=useState(emptyDataset),[error,setError]=useState(''),[editor,setEditor]=useState<Editor|null>(null),[toast,setToast]=useState<{text:string;failed:boolean}|null>(null);
 const generation=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const notice=useCallback((text:string,failed=false)=>{setToast({text,failed});if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setToast(null),6000);},[]);
 useEffect(()=>{
  try {const client=supabase();client.auth.getUser().then(({data,error})=>{setUser(error?null:data.user);setAuthReady(true);}).catch(()=>{setAuthReady(true);setError('Non se puido comprobar a sesión.');});
  const{data:subscription}=client.auth.onAuthStateChange((_event,session)=>{setUser(session?.user??null);setAuthReady(true);});return()=>{subscription.subscription.unsubscribe();if(timer.current)clearTimeout(timer.current);};}
  catch{setAuthReady(true);setError('Falta configurar a conexión con Supabase.');}
 },[]);
 const reload=useCallback(async()=>{
  const ticket=++generation.current;if(!user){setData(emptyDataset());setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const result=emptyDataset();
   await Promise.all(entityNames.map(async table=>{let page=0;while(true){let query=supabase().from(table).select('*').order('id').range(page*500,page*500+499);if(!entities[table].readonly)query=query.eq('user_id',user.id);const{data:rows,error}=await query;if(error)throw error;result[table].push(...(rows as DataRow[]));if(rows.length<500)break;page++;}}));
   if(!result.profiles.length){const{data:profile,error}=await supabase().from('profiles').insert({id:user.id,user_id:user.id,first_name:user.user_metadata?.first_name||'Docente',display_name:user.user_metadata?.first_name||'Docente'}).select().single();if(error)throw error;result.profiles=[profile as DataRow];}
   if(ticket===generation.current)setData(result);
  }catch(e){if(ticket===generation.current)setError(errorMessage(e));}finally{if(ticket===generation.current)setLoading(false);}
 },[user?.id]);
 useEffect(()=>{setData(emptyDataset());setEditor(null);void reload();},[reload]);
 const save=async(table:EntityName,values:Record<string,Value>,id?:string)=>{
  if(!user||entities[table].readonly)throw new Error('Unauthorized');
  const payload={...values,user_id:user.id};const query=id?supabase().from(table).update(payload).eq('id',id).eq('user_id',user.id):supabase().from(table).insert(payload);
  const{data:rows,error}=await query.select();if(error)throw error;if(!rows?.length)throw new Error('No rows changed');
  await reload();notice(`${entities[table].singular} gardado correctamente`);
 };
 const remove=async(table:EntityName,row:DataRow)=>{if(!user||entities[table].readonly)return;const{data:rows,error}=await supabase().from(table).delete().eq('id',row.id).eq('user_id',user.id).select('id');if(error)throw error;if(!rows?.length)throw new Error('No rows deleted');for(const f of entities[table].fields.filter(f=>f.bucket&&row[f.name])){await supabase().storage.from(f.bucket!).remove([String(row[f.name])]);}await reload();notice('Rexistro eliminado');};
 const signOut=async()=>{const{error}=await supabase().auth.signOut();if(error){notice(errorMessage(error),true);return;}generation.current++;setData(emptyDataset());setUser(null);window.location.assign('/login');};
 return <AppContext.Provider value={{user,authReady,loading,data,error,reload,save,remove,editor,edit:(table,row,defaults)=>setEditor({table,row,defaults}),closeEditor:()=>setEditor(null),notice,signOut}}>{children}{toast&&<div className={`toast ${toast.failed?'toast-error':''}`} role={toast.failed?'alert':'status'}>{toast.text}<button onClick={()=>setToast(null)} aria-label="Pechar aviso">×</button></div>}</AppContext.Provider>;
}
