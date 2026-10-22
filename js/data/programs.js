"use strict";
/* Ready-made training sessions and programs, plus the exercise library used by the editor.
   Exercises from Mans's plan keep their cues; a few common ones are added here. */
const EXTRA_EX = [
  {n:"Leg Press", k:"comp", reps:"10–12", rest:"راحة 2 د", c:"رجلك بعرض كتفك في نص اللوح. انزل لحد ما ركبتك تبقى زاوية قايمة، ومتقفلش ركبتك فوق."},
  {n:"Leg Extension", k:"iso", reps:"12–15", rest:"راحة 60 ث", c:"اثبت ثانية فوق، وانزل ببطء."},
  {n:"Goblet Squat", k:"comp", reps:"10–12", rest:"راحة 90 ث", c:"الدمبل قدّام صدرك، ضهرك مفرود، وانزل بين رجليك لحد تحت."},
  {n:"Push-ups", k:"comp", reps:"لحد قرب الفشل", rest:"راحة 90 ث", c:"جسمك خط واحد من راسك لرجلك، وصدرك ينزل قريب من الأرض."},
  {n:"One-arm Dumbbell Row", k:"comp", reps:"10–12", rest:"راحة 90 ث", c:"إيدك وركبتك على البنش، واسحب الدمبل ناحية وسطك مش صدرك."},
  {n:"Hip Thrust", k:"comp", reps:"8–12", rest:"راحة 2 د", c:"ضهرك على البنش، وادفع الوسط لفوق لحد ما جسمك يبقى مستقيم، واقفل المقعدة ثانية."},
  {n:"Dumbbell Shoulder Press", k:"comp", reps:"8–10", rest:"راحة 90 ث", c:"قاعد وضهرك مسنود، الدمبل في مستوى ودانك، وادفع لفوق من غير ما تقوّس ضهرك."},
  {n:"Cable Fly", k:"iso", reps:"12–15", rest:"راحة 60 ث", c:"كوعك مثني سنة وثابت، وقفّل إيديك قدّام صدرك كأنك بتحضن شجرة."}
];
/* name → exercise (with kind, reps, rest and cue) */
function exerciseLibrary(){
  const lib = {};
  DEFAULT_DAYS.forEach(d => (d.ex||[]).concat(d.abs||[]).forEach(e => { if (!lib[e.n]) lib[e.n] = JSON.parse(JSON.stringify(e)); }));
  EXTRA_EX.forEach(e => { if (!lib[e.n]) lib[e.n] = e; });
  return lib;
}
function ex(name, over){
  const e = exerciseLibrary()[name] || {n:name, k:"iso", reps:"10–12", rest:"راحة 60 ث", c:""};
  const o = Object.assign(JSON.parse(JSON.stringify(e)), over || {});
  if (/Superset/i.test(o.rest || "")) o.rest = "راحة 60 ث";   // supersets only make sense in the original pairing
  return o;
}
const ABS_A = ["Cable Crunch","Dead Bug"], ABS_B = ["Hanging Knee Raise","Plank"], ABS_C = ["Hanging Leg Raise","Pallof Press"];
const SESSIONS = {
  fbA:{k:"Full Body A", t:"الجسم كله A", wu:"lower", cd:"lower", ex:[["Back Squat"],["Bench Press"],["Chest-supported Row (Machine)"],["Romanian Deadlift"],["Lateral Raise"],["Incline Dumbbell Curl"]], abs:ABS_A},
  fbB:{k:"Full Body B", t:"الجسم كله B", wu:"lower", cd:"lower", ex:[["Leg Press"],["Incline Dumbbell Press"],["Lat Pulldown"],["Bulgarian Split Squat"],["Face Pull"],["Triceps Rope Pushdown"]], abs:ABS_B},
  upA:{k:"Upper A", t:"الجزء العلوي A", wu:"upper", cd:"upper", ex:[["Bench Press"],["Chest-supported Row (Machine)"],["Machine Shoulder Press"],["Lat Pulldown"],["Lateral Raise"]], abs:ABS_A},
  loA:{k:"Lower A", t:"الرجل A", wu:"lower", cd:"lower", ex:[["Back Squat"],["Romanian Deadlift"],["Bulgarian Split Squat"],["Leg Curl"],["Standing Calf Raise"]], abs:ABS_B},
  upB:{k:"Upper B", t:"الجزء العلوي B", wu:"upper", cd:"upper", ex:[["Incline Dumbbell Press"],["Assisted Pull-ups"],["Seated Cable Row"],["Arnold Press"],["Lateral Raise"],["Face Pull"]], abs:ABS_C},
  loB:{k:"Lower B", t:"الرجل B", wu:"lower", cd:"lower", ex:[["Leg Press",{k:"main"}],["Hip Thrust"],["Leg Curl"],["Leg Extension"],["Standing Calf Raise"]], abs:ABS_C},
  push:{k:"Push", t:"دفع: صدر وكتف وتراي", wu:"upper", cd:"upper", ex:[["Bench Press"],["Machine Shoulder Press"],["Incline Dumbbell Press",{k:"comp"}],["Lateral Raise"],["Triceps Rope Pushdown"],["Overhead Cable Triceps Extension"]], abs:ABS_A},
  pull:{k:"Pull", t:"سحب: ضهر وباي", wu:"upper", cd:"upper", ex:[["Lat Pulldown",{k:"comp"}],["Seated Cable Row"],["Chest-supported Row (Machine)"],["Face Pull"],["Incline Dumbbell Curl"],["Hammer Curl"]], abs:ABS_B},
  legs:{k:"Legs", t:"رجل", wu:"lower", cd:"lower", ex:[["Back Squat"],["Romanian Deadlift"],["Leg Press"],["Leg Curl"],["Standing Calf Raise"]], abs:ABS_C}
};
const PROGRAMS = {
  1:{n:"الجسم كله", s:["fbA"]}, 2:{n:"الجسم كله A/B", s:["fbA","fbB"]}, 3:{n:"الجسم كله A/B/A", s:["fbA","fbB","fbA"]},
  4:{n:"Upper / Lower", s:["upA","loA","upB","loB"]}, 5:{n:"Push / Pull / Legs + Upper / Lower", s:["push","pull","legs","upA","loA"]},
  6:{n:"Push / Pull / Legs × 2", s:["push","pull","legs","push","pull","legs"]}
};
function sessionWorkout(key){
  const S = SESSIONS[key];
  return {k:S.k, wu:S.wu, cd:S.cd, ex:S.ex.map(([n, o]) => ex(n, o)), abs:S.abs.map(n => ex(n))};
}
