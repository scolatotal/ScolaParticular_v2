'use client';
import {useEffect,useState,type FormEvent} from 'react';
import Image from 'next/image';
import {BookOpen,CalendarDays,ShieldCheck,ArrowRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {supabase} from '@/lib/supabase';
import {errorMessage} from '@/lib/validation';
import {useApp} from './provider';
import {AppLink as Link} from './app-link';
export function Brand() {
  const logo = process.env.NEXT_PUBLIC_SCOLA_LOGO_PATH || '/logo-scola.png';
  return (
    <Link href="/dashboard" className="wordmark" aria-label="Scola, inicio">
      <Image src={logo} alt="Scola" className="official-logo" width={1390} height={421} unoptimized />
    </Link>
  );
}
export function Auth({mode='login'}:{mode?:string}){
 const[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[failed,setFailed]=useState(false);const{user,authReady,error}=useApp();
 const register=mode==='register',forgot=mode==='forgot-password',reset=mode==='reset-password';
 useEffect(()=>{if(authReady&&user&&!reset)window.location.replace('/dashboard');},[authReady,user,reset]);
 const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setBusy(true);setMessage('');setFailed(false);const fd=new FormData(e.currentTarget);const email=String(fd.get('email')||''),password=String(fd.get('password')||'');
  try{const client=supabase();if(forgot){const{error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});if(error)throw error;setMessage('Se hai unha conta con este correo, recibirás unha ligazón para recuperar o contrasinal.');}
  else if(reset){if(!user)throw new Error('Recovery session missing');if(password!==fd.get('confirm')){setFailed(true);setMessage('Os contrasinais non coinciden.');return;}const{error}=await client.auth.updateUser({password});if(error)throw error;await client.auth.signOut();window.location.assign('/login?reset=ok');}
  else if(register){const{error,data}=await client.auth.signUp({email,password,options:{data:{first_name:String(fd.get('name'))},emailRedirectTo:`${window.location.origin}/dashboard`}});if(error)throw error;if(data.session)window.location.assign('/dashboard');else setMessage('Revisa o teu correo para confirmar a conta e despois inicia sesión.');}
  else{const{error}=await client.auth.signInWithPassword({email,password});if(error)throw error;window.location.assign('/dashboard');}}
  catch(err){setFailed(true);setMessage(errorMessage(err));}finally{setBusy(false);}
 };
 return <main className="auth-page"><section className="auth-story"><Brand/><div><span className="eyebrow">O TEU DÍA, CON MÁIS CLARIDADE</span><h1>Espazo para ensinar.<br/>Tempo para o que importa.</h1><p>Alumnado, clases e pequenas ideas. Todo o teu día docente, nun mesmo lugar.</p><div className="auth-features"><span><CalendarDays/> Unha axenda á túa medida</span><span><BookOpen/> Cada grupo, cada progreso</span><span><ShieldCheck/> Un espazo persoal e privado</span></div></div><small>Feita para acompañar o teu día a día.</small></section><section className="auth-form"><div className="auth-box"><span className="eyebrow">{register?'COMEZA A ORGANIZAR O TEU CURSO':'BENVIDO/A A SCOLA'}</span><h2>{register?'O teu novo espazo docente.':forgot?'Recupera o acceso.':reset?'Un novo contrasinal.':'A túa aula, organizada.'}</h2><p>{forgot?'Enviarémosche unha ligazón ao teu correo.':reset?'Escolle un contrasinal de polo menos 10 caracteres.':'Accede ao teu espazo persoal e privado.'}</p>{error&&<p role="alert" className="error-box">{error}</p>}{reset&&authReady&&!user?<div className="error-box">A ligazón caducou ou non é válida. <a href="/forgot-password">Solicitar outra ligazón</a></div>:<form onSubmit={submit}>{register&&<label>Nome<Input name="name" required maxLength={80} autoComplete="given-name"/></label>}{!reset&&<label>Correo electrónico<Input name="email" type="email" placeholder="nome@exemplo.gal" required autoComplete="email"/></label>}{!forgot&&<label>Contrasinal<Input name="password" type="password" required minLength={register||reset?10:1} maxLength={128} autoComplete={register||reset?'new-password':'current-password'}/></label>}{reset&&<label>Repetir contrasinal<Input name="confirm" type="password" required minLength={10} autoComplete="new-password"/></label>}{!register&&!forgot&&!reset&&<a href="/forgot-password" className="small-link">Esqueciches o contrasinal?</a>}<Button type="submit" className="primary" disabled={busy||!!error}>{busy?'Agarda un intre…':register?'Crear a miña conta':forgot?'Enviar ligazón':reset?'Gardar contrasinal':'Entrar na miña axenda'}<ArrowRight size={18}/></Button></form>}{message&&<div className={failed?'error-box':'success-box'} role={failed?'alert':'status'}>{message}</div>}<p className="auth-bottom">{mode==='login'?<>Aínda non tes conta? <a href="/register">Crear conta</a></>:<a href="/login">Volver a iniciar sesión</a>}</p><div className="privacy-note"><ShieldCheck size={18}/> Os teus datos só son accesibles para ti.</div></div></section></main>;
}
