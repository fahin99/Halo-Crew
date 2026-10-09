import {lazy,Suspense} from "react";
const Material=lazy(()=>import("./SpaceMaterial"));
const themes:Record<string,{domain:number;label:string;title:string;note:string}>={
 wellbeing:{domain:0,label:"YOUR SIGNALS",title:"A rhythm that's yours.",note:"Read the pattern. Keep the context."},
 insights:{domain:6,label:"CONNECTED EVIDENCE",title:"From signals to understanding.",note:"Your reference. Your changes. Your next step."},
 medical:{domain:9,label:"MISSION CARE",title:"Care, with intention.",note:"Context → Review → Record → Follow up"},
 future:{domain:4,label:"YOUR NEXT 48 HOURS",title:"Make room for a better tomorrow.",note:"Explore possibilities with transparent assumptions."},
 support:{domain:3,label:"A LITTLE SPACE FOR YOU",title:"Pause. Breathe. Reconnect.",note:"Small actions, with a moment to reflect."},
 copilot:{domain:6,label:"YOUR PERSONAL HALO",title:"A conversation with context.",note:"Your readings and saved check-in, together."},
 handoff:{domain:6,label:"MISSION CONTINUITY",title:"Every moment has a record.",note:"Saved here. Ready for the next connection."},
 privacy:{domain:8,label:"YOUR DATA",title:"Private by choice.",note:"Know what is saved. Decide what stays."},
 settings:{domain:6,label:"YOUR MISSION SPACE",title:"Make HALO feel like yours.",note:"Manage your local mission environment."},
 crew:{domain:3,label:"YOUR CREW",title:"Connected people. Shared mission.",note:"A clear view of the people alongside you."},
 mission:{domain:6,label:"MISSION CONTEXT",title:"One crew. One shared orbit.",note:"Keep the wider mission in view."},
};
export default function PageAtmosphere({page}:{page:string}){const t=themes[page];if(!t)return null;return <section className="page-atmosphere"><div><span className="eyebrow">{t.label}</span><h1>{t.title}</h1><p>{t.note}</p></div><div className="atmosphere-art" aria-hidden="true"><Suspense fallback={<div className="material-placeholder"><i/></div>}><Material kind="domain" domain={t.domain}/></Suspense></div><span className="atmosphere-coordinate">HALO / ARES III / 147</span></section>}
