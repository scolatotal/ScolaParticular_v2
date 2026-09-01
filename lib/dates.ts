import {addDays,addMonths,differenceInCalendarDays,differenceInCalendarMonths,format,isWithinInterval,parseISO,startOfDay} from 'date-fns';
import {gl} from 'date-fns/locale';
import {type DataRow,type Dataset,type EntityName,textValue,rowTitle} from './entities';
export const today=()=>format(new Date(),'yyyy-MM-dd');
export const dateLabel=(day:string,pattern='d MMM yyyy')=>day?format(parseISO(day),pattern,{locale:gl}):'Sen data';
export const weekdays=['Luns','Martes','Mércores','Xoves','Venres','Sábado','Domingo'];
export function age(birth:string,day=today()){if(!birth)return null;const b=parseISO(birth),d=parseISO(day);let n=d.getFullYear()-b.getFullYear();if(d.getMonth()<b.getMonth()||(d.getMonth()===b.getMonth()&&d.getDate()<b.getDate()))n--;return n;}
export function eventOccurs(row:DataRow,day:string):boolean {
 const start=textValue(row,'starts_on'),end=textValue(row,'ends_on')||start;if(!start||day<start)return false;
 if(day>=start&&day<=end)return true;
 const recurrence=textValue(row,'recurrence');if(!recurrence||recurrence==='Non se repite')return false;
 const until=textValue(row,'repeat_until');if(!until||day>until)return false;
 const duration=differenceInCalendarDays(parseISO(end),parseISO(start));
 if(recurrence==='Diaria')return true;
 if(recurrence==='Semanal')return differenceInCalendarDays(parseISO(day),parseISO(start))%7<=duration;
 const months=differenceInCalendarMonths(parseISO(day),parseISO(start));
 return [months,months-1].filter(m=>m>=0).some(m=>{const s=addMonths(parseISO(start),m);return isWithinInterval(parseISO(day),{start:s,end:addDays(s,duration)});});
}
export function isTeachingDay(data:Dataset,day:string,year='2026/27'){
 const dow=parseISO(day).getDay();if(dow===0||dow===6)return false;
 const calendar=data.school_calendar_events.filter(r=>r.academic_year===year);
 const first=calendar.find(r=>r.name==='Inicio das actividades lectivas'),last=calendar.find(r=>r.name==='Fin das actividades lectivas');
 if(first&&day<textValue(first,'starts_on')||last&&day>textValue(last,'ends_on'))return false;
 return !calendar.some(r=>r.is_non_teaching&&eventOccurs(r,day))&&!data.calendar_events.some(r=>['Festivo','Non lectivo'].includes(textValue(r,'type'))&&eventOccurs(r,day));
}
export type AgendaItem={id:string;title:string;kind:string;time:string;endTime:string;location:string;table:EntityName;row:DataRow;readonly?:boolean};
// The dashboard mirrors the weekly timetable, even outside teaching dates.
export function classesForDay(data: Dataset, day: string, year = '2026/27'): AgendaItem[] {
 const weekday = parseISO(day).getDay();
 return data.teacher_schedules
  .filter(row => row.weekday === weekday && row.academic_year === year)
  .map(row => ({
   id: `teacher_schedules-${row.id}`,
   title: rowTitle('teacher_schedules', row, data),
   kind: 'Clase',
   time: textValue(row, 'start_time'),
   endTime: textValue(row, 'end_time'),
   location: textValue(row, 'room'),
   table: 'teacher_schedules' as const,
   row,
  }))
  .sort((a, b) => a.time.localeCompare(b.time));
}
export function schoolCalendarForDay(data: Dataset, day: string, year = '2026/27'): AgendaItem[] {
 const items: AgendaItem[] = [];
 for (const table of ['school_calendar_events', 'school_commemorations'] as const) {
  for (const row of data[table]) {
   if (row.academic_year !== year || !eventOccurs(row, day)) continue;
   items.push({
    id: `${table}-${row.id}`,
    title: rowTitle(table, row, data),
    kind: table === 'school_commemorations' ? 'Conmemoración' : row.is_non_teaching ? 'Non lectivo' : 'Calendario escolar',
    time: '',
    endTime: '',
    location: '',
    table,
    row,
    readonly: true,
   });
  }
 }
 return items;
}
export function calendarForDay(data: Dataset, day: string, year = '2026/27'): AgendaItem[] {
 const personal: AgendaItem[] = data.calendar_events
  .filter(row => eventOccurs(row, day))
  .map(row => ({
   id: `calendar_events-${row.id}`,
   title: rowTitle('calendar_events', row, data),
   kind: textValue(row, 'type'),
   time: row.all_day ? '' : textValue(row, 'start_time'),
   endTime: row.all_day ? '' : textValue(row, 'end_time'),
   location: textValue(row, 'location'),
   table: 'calendar_events',
   row,
  }));
 return [...schoolCalendarForDay(data, day, year), ...personal]
  .sort((a, b) => a.time.localeCompare(b.time));
}
export function agendaForDay(data:Dataset,day:string,year='2026/27'):AgendaItem[]{
 const output:AgendaItem[]=[];const push=(table:EntityName,row:DataRow,kind:string,readonly=false)=>output.push({id:`${table}-${row.id}`,title:rowTitle(table,row,data),kind,time:textValue(row,'start_time'),endTime:textValue(row,'end_time'),location:textValue(row,'location')||textValue(row,'room'),table,row,readonly});
 data.calendar_events.filter(r=>eventOccurs(r,day)).forEach(r=>push('calendar_events',r,textValue(r,'type')));
 output.push(...schoolCalendarForDay(data,day,year));
 data.tutoring_sessions.filter(r=>r.date===day&&r.status!=='Cancelada').forEach(r=>push('tutoring_sessions',r,'Titoría'));
 data.meetings.filter(r=>r.date===day&&r.status!=='Cancelada'&&r.show_in_agenda).forEach(r=>push('meetings',r,'Reunión'));
 if(isTeachingDay(data,day,year))output.push(...classesForDay(data,day,year).filter(item=>!data.groups.find(g=>g.id===item.row.group_id)?.archived));
 return output.sort((a,b)=>a.time.localeCompare(b.time));
}
export function reminderDue(item:AgendaItem,day:string,now=new Date()){
 const reminder=textValue(item.row,'reminder');if(!reminder||reminder==='Sen aviso')return false;
 const date=parseISO(`${day}T${item.time||'09:00'}`);const lead=reminder==='1 día antes'?86400000:reminder==='15 minutos antes'?900000:0;
 return now.getTime()>=date.getTime()-lead&&now.getTime()<=date.getTime()+3600000&&startOfDay(now)<=date;
}
