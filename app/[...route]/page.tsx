import {notFound} from 'next/navigation';
import {ScolaApp} from '@/components/scola/app';
const routes=['login','register','forgot-password','reset-password','dashboard','axenda','alumnado','faltas','horarios','diario','centro','configuracion','titorias','reunions'];
export default async function Page({params}:{params:Promise<{route:string[]}>}){const{route}=await params;if(!routes.includes(route[0])||route.length>2||route.length===2&&(route[0]!=='alumnado'||! /^[0-9a-f-]{36}$/i.test(route[1])))notFound();return <ScolaApp route={route[0]} id={route[1]}/>;}
