"use strict";
/* Training content: warm-ups, cool-downs, equipment, target muscles, grips and how-to videos. */
const W = {
  upper:{title:"إحماء الجزء العلوي", time:"8–10 دقايق", items:[
    ["5 دقايق عجلة أو <span class='en'>Rowing</span>","خفيف، لحد ما تعرق سنة. الصبح طوّلها دقيقتين."],
    ["<span class='en'>Arm Circles</span>","10 لقدّام و10 لورا"],
    ["<span class='en'>Band Pull-Aparts</span>","2×15 بأستك خفيف","Band Pull-Aparts"],
    ["<span class='en'>Band Dislocates</span>","10 عدات، الإيد واسعة","Band Dislocates"],
    ["<span class='en'>Cat-Cow</span>","8 عدات ببطء","Cat-Cow"],
    ["<span class='en'>Push-ups</span>","10 عدات عادية أو على الركب"]]},
  lower:{title:"إحماء الرجل", time:"10 دقايق", items:[
    ["5 دقايق عجلة","خفيف ومنتظم"],
    ["<span class='en'>Hip Circles</span>","10 لكل اتجاه"],
    ["<span class='en'>Leg Swings</span>","10 لقدّام و10 للجنب لكل رجل"],
    ["<span class='en'>World's Greatest Stretch</span>","5 لكل ناحية"],
    ["<span class='en'>Glute Bridge</span>","12 عدة، اقفل وسطك فوق"],
    ["<span class='en'>Lateral Band Walk</span>","10 خطوات لكل ناحية بأستك فوق الركبة، وركبتك متدخلش لجوه"],
    ["<span class='en'>Bodyweight Squat</span>","10 عدات بمدى كامل"],
    ["<span class='en'>Ankle Rocks</span>","10 لكل رجل"]]},
  football:{title:"إحماء الكورة (مبني على FIFA 11+)", time:"15 دقيقة", items:[
    ["جري خفيف بتنويعات","عرض الملعب مرتين لكل واحدة: مستقيم، فتح الحوض لبرّه، قفله لجوه، جنب، قدّام وورا"],
    ["<span class='en'>Leg Swings</span>","10 لقدّام و10 للجنب لكل رجل"],
    ["<span class='en'>Plank</span>","2×20 ثانية"],
    ["<span class='en'>Side Plank</span>","20 ثانية لكل ناحية"],
    ["وقوف على رجل واحدة بالكورة","30 ثانية لكل رجل، ولف الكورة حوالين وسطك"],
    ["<span class='en'>Squat</span> مع رفع على صوابعك","10 عدات"],
    ["نط لفوق","2×6. انزل على الرجلين، ركبتك مثنية ومش داخلة لجوه"],
    ["نط للجنب","2×6 لكل ناحية، واثبت ثانية بعد كل نزلة"],
    ["<span class='en'>Bounding</span>","خطوات نط طويلة، عرض الملعب مرة"],
    ["تغيير اتجاه (<span class='en'>Plant & Cut</span>)","3 مرات لكل ناحية بسرعة متوسطة"],
    ["سرعات متدرجة","3 مرات 20 متر: 50%، بعدها 70%، بعدها 90%"]]}
};
const C = {
  upper:{title:"إطالات آخر التمرين (اختياري)", time:"5 دقايق", items:[
    ["إطالة الصدر على الباب","30 ثانية لكل ناحية. الفيديو فيه كمان طريقة على العمود وطريقة على البنش","Chest Stretch"],
    ["إطالة الـ <span class='en'>Lats</span> على العمود","30 ثانية لكل ناحية","Lat Stretch"],
    ["<span class='en'>Child's Pose</span>","45 ثانية","Childs Pose"]]},
  lower:{title:"إطالات آخر التمرين (اختياري)", time:"5 دقايق", items:[
    ["إطالة قدّام الحوض (<span class='en'>Hip Flexor</span>)","30 ثانية لكل رجل"],
    ["إطالة الفخد الخلفي","30 ثانية لكل رجل"],
    ["إطالة الفخد الأمامي واقف","30 ثانية لكل رجل"],
    ["إطالة السمانة على الحيطة","30 ثانية لكل رجل"]]},
  football:{title:"بعد الماتش", time:"5–8 دقايق", items:[
    ["مشي خفيف","دقيقتين لحد ما نفسك يهدى"],
    ["إطالة الفخد الخلفي والأمامي","30 ثانية لكل واحدة لكل رجل"],
    ["إطالة الضامة (<span class='en'>Butterfly</span>)","45 ثانية"],
    ["إطالة السمانة","30 ثانية لكل رجل"]]}
};
const WARM_MAIN = "<span dir='ltr' class='num'>40% × 8 → 60% × 5 → 80% × 3</span>";
const WARM_COMP = "<span dir='ltr' class='num'>50% × 8 → 75% × 4</span>";
const WARM_ISO  = "مجموعة واحدة <span dir='ltr' class='num'>50–70% × 10</span>";
const TREAD = {n:"Incline Treadmill Walk", k:"walk", sets:"10–15 دقيقة", c:"ميل 8–12، سرعة 4.5–5.5. تنهج بس تقدر تتكلم."};

/* equipment per exercise: [type, detail] — type picks the chip color */
const EQ_LABEL = {bar:"بار", db:"دمبل", cable:"كابل", machine:"جهاز", bw:"وزن الجسم", band:"أستك", bar2:"عقلة", tread:"مشاية", wheel:"عجلة البطن"};
const EQUIP = {
  "Bench Press":["bar","بنش مستوي"], "Chest-supported Row (Machine)":["machine","صدرك على المسند، أو T-Bar Row بمسند"], "Machine Shoulder Press":["machine",""],
  "Lat Pulldown":["cable","جهاز السحب العالي"], "Lateral Raise":["db",""], "EZ-Bar Curl":["bar","بار EZ المتعرّج"],
  "Triceps Rope Pushdown":["cable","حبل"], "Back Squat":["bar","رَك السكوات"], "Romanian Deadlift":["bar",""],
  "Walking Lunges (Dumbbell)":["db",""], "Leg Curl":["machine",""], "Standing Calf Raise":["machine","أو سميث"],
  "Tibialis Raise":["bw","ضهرك على الحيطة"], "Incline Dumbbell Press":["db","بنش مايل 30°"],
  "Assisted Pull-ups":["machine","جهاز المساعدة، أو عقلة بأستك"], "Seated Cable Row":["cable","مقبض V"],
  "Arnold Press":["db","بنش ضهره مفرود"], "Face Pull":["cable","حبل، البكرة في مستوى وشك"],
  "Incline Dumbbell Curl":["db","بنش مايل 45°"], "Overhead Cable Triceps Extension":["cable","حبل"],
  "Hammer Curl":["db",""], "Reverse Pec Deck":["machine","جهاز الـ Pec Deck وأنت قاعد بالعكس"], "Cable Lateral Raise":["cable","مقبض واحد، البكرة تحت"], "Deadlift (Trap Bar)":["bar","Trap Bar، أو بار عادي"], "Bulgarian Split Squat":["db","بنش ورا"],
  "Hip Thrust":["bar","بنش + وسادة للبار، أو جهاز"], "Nordic Curl":["bw","رجلك متثبتة تحت بنش أو مع زميل"],
  "Copenhagen Plank":["bw","بنش"], "Single-leg Balance":["bw",""], "Single-leg Calf Raise":["bw","سلمة، وممكن دمبل في إيدك"],
  "Incline Treadmill Walk":["tread",""],
  "Cable Crunch":["cable","حبل، وأنت راكع"], "Dead Bug":["bw","على مرتبة"], "Hanging Knee Raise":["bar2",""],
  "Plank":["bw",""], "Hanging Leg Raise":["bar2",""], "Pallof Press":["cable","مقبض واحد، البكرة في مستوى صدرك"],
  "Ab Wheel Rollout":["wheel","على ركبك"], "Side Plank":["bw",""],
  "Lateral Band Walk":["band","mini band فوق الركبة"], "Single-leg Step-down":["bw","سلمة"], "Single-leg RDL":["bw",""],
  "Y-Balance Reach":["bw",""], "Snap-down Landing":["bw",""], "Single-leg Glute Bridge":["bw","على الأرض"],
  "Bird Dog":["bw","على مرتبة"], "Side Plank with Reach":["bw",""],
  "90/90 Hip Switch":["bw","على الأرض"], "Couch Stretch":["bw","كنبة أو حيطة"], "Pigeon Stretch":["bw","على مرتبة"],
  "Adductor Rock-back":["bw","على مرتبة"], "Half-kneeling Hamstring Stretch":["bw",""], "Knee-to-Wall Ankle":["bw","حيطة"],
  "Deep Squat Hold":["bw",""], "Thoracic Open Book":["bw","على مرتبة"],
  "Dead Hang":["bar2",""], "Farmer's Carry":["db","دمبلتين تقال، أو Trap Bar"]
};

/* target muscles per exercise: [main, helpers] */
const MUSCLES = {
  "Bench Press":["الصدر","الكتف الأمامي، التراي"],
  "Chest-supported Row (Machine)":["نص الضهر والـ Lats","الكتف الخلفي، البايسبس"],
  "Machine Shoulder Press":["الكتف الأمامي والجانبي","التراي، أعلى الصدر"],
  "Lat Pulldown":["الـ Lats (عرض الضهر)","البايسبس، الكتف الخلفي"],
  "Lateral Raise":["الكتف الجانبي","الترابيس"],
  "Cable Lateral Raise":["الكتف الجانبي",""],
  "Reverse Pec Deck":["الكتف الخلفي","نص الضهر (الرومبويد)"],
  "EZ-Bar Curl":["البايسبس","الساعد"],
  "Triceps Rope Pushdown":["التراي (الرأس الجانبية)",""],
  "Back Squat":["الفخد الأمامي","المقعدة، الضامة، أسفل الضهر، الكور"],
  "Romanian Deadlift":["الفخد الخلفي (الهامسترنج)","المقعدة، أسفل الضهر"],
  "Walking Lunges (Dumbbell)":["الفخد الأمامي والمقعدة","الضامة، التوازن"],
  "Leg Curl":["الفخد الخلفي (الهامسترنج)","السمانة"],
  "Standing Calf Raise":["السمانة",""],
  "Tibialis Raise":["قصبة الرجل من قدّام","الكاحل"],
  "Incline Dumbbell Press":["أعلى الصدر","الكتف الأمامي، التراي"],
  "Assisted Pull-ups":["الـ Lats (عرض الضهر)","البايسبس، نص الضهر"],
  "Seated Cable Row":["نص الضهر (الرومبويد والترابيس الوسطانية)","الـ Lats، البايسبس، الكتف الخلفي"],
  "Arnold Press":["الكتف الأمامي والجانبي","التراي"],
  "Face Pull":["الكتف الخلفي","الروتيتر كاف، الترابيس الوسطانية"],
  "Incline Dumbbell Curl":["البايسبس (الرأس الطويلة)","الساعد"],
  "Overhead Cable Triceps Extension":["التراي (الرأس الطويلة)",""],
  "Hammer Curl":["البراكياليس (جنب الدراع)","الساعد، البايسبس"],
  "Deadlift (Trap Bar)":["المقعدة والفخد الأمامي والخلفي","أسفل الضهر، الترابيس، القبضة، الكور"],
  "Bulgarian Split Squat":["الفخد الأمامي والمقعدة","الضامة، التوازن"],
  "Hip Thrust":["المقعدة","الفخد الخلفي"],
  "Nordic Curl":["الفخد الخلفي (الهامسترنج)","السمانة"],
  "Copenhagen Plank":["الضامة (Adductors)","الكور الجانبي"],
  "Single-leg Balance":["عضلات الكاحل والقدم","المقعدة الجانبية، الكور"],
  "Single-leg Calf Raise":["السمانة","الكاحل"],
  "Incline Treadmill Walk":["القلب والنَفَس","المقعدة، السمانة"],
  "Cable Crunch":["عضلة البطن الأمامية (Six-pack)",""],
  "Dead Bug":["عضلة البطن العميقة (Transverse)","البطن الأمامية"],
  "Hanging Knee Raise":["أسفل البطن","عضلات الحوض الأمامية، القبضة"],
  "Plank":["البطن العميقة والأمامية","الكتف، المقعدة"],
  "Hanging Leg Raise":["أسفل البطن","عضلات الحوض الأمامية، القبضة"],
  "Pallof Press":["جوانب البطن (Obliques)","البطن العميقة"],
  "Ab Wheel Rollout":["البطن الأمامية","الـ Lats، الكتف"],
  "Side Plank":["جوانب البطن (Obliques)","المقعدة الجانبية"],
  "Lateral Band Walk":["المقعدة الجانبية (Glute Medius)","ثبات الركبة"],
  "Single-leg Step-down":["الفخد الأمامي","المقعدة الجانبية، ثبات الركبة"],
  "Single-leg RDL":["الفخد الخلفي والمقعدة","التوازن، الكاحل"],
  "Y-Balance Reach":["عضلات الكاحل والمقعدة","التوازن، الكور"],
  "Snap-down Landing":["الفخد الأمامي والمقعدة","التحكم في الركبة وقت النزول"],
  "Single-leg Glute Bridge":["المقعدة","الفخد الخلفي"],
  "Bird Dog":["أسفل الضهر والكور","المقعدة، الكتف"],
  "Side Plank with Reach":["جوانب البطن (Obliques)","الكتف، الكور"],
  "90/90 Hip Switch":["ليونة مفصل الحوض",""],
  "Couch Stretch":["قدّام الفخد والحوض (Hip Flexors)",""],
  "Pigeon Stretch":["المقعدة وجانب الحوض",""],
  "Adductor Rock-back":["الضامة",""],
  "Half-kneeling Hamstring Stretch":["الفخد الخلفي",""],
  "Knee-to-Wall Ankle":["ليونة الكاحل والسمانة",""],
  "Deep Squat Hold":["الحوض والكاحل وأسفل الضهر",""],
  "Thoracic Open Book":["نص الضهر (Thoracic)","الصدر"],
  "Dead Hang":["المسكة والساعد","الـ Lats، الكتف"],
  "Farmer's Carry":["المسكة والساعد","الترابيس، البطن، الإلية"]
};

/* grip per exercise: [English search term, Arabic how-to] — shown under the muscles and added to the YouTube search */
const GRIP = {
  "Bench Press":["medium grip","مسكة من فوق (Overhand)، أعرض من كتفك بشبر تقريبًا، بحيث دراعك يبقى عمودي لما البار ينزل على صدرك. الإبهام ملفوف حوالين البار."],
  "Chest-supported Row (Machine)":["neutral grip","المقابض اللي كفوفك فيها بتبص لبعض (Neutral). لو الجهاز فيه مقابض أفقية بس: من فوق وبعرض كتفك."],
  "Machine Shoulder Press":["neutral grip","المقابض اللي كفوفك فيها بتبص لبعض (Neutral) أريح للكتف. لو مفيش غير الأفقية: من فوق وبعرض كتفك تقريبًا."],
  "Lat Pulldown":["overhand grip","البار الطويل، مسكة من فوق (Overhand) أعرض من كتفك بشبر. مش على آخر البار، المسكة الواسعة جدًا بتقلل المدى."],
  "Lateral Raise":["","دمبل في كل إيد، الكف بيبص للأرض والدمبل موازي للأرض. إنت بترفع بكوعك مش بإيدك."],
  "EZ-Bar Curl":["close grip","مسكة من تحت (Underhand) على الانحناية الداخلية للبار، بعرض كتفك تقريبًا."],
  "Triceps Rope Pushdown":["","حبل، الإبهام لفوق والكفوف بتبص لبعض (Neutral). في الآخر افتح طرفين الحبل لبرّه."],
  "Back Squat":["high bar","البار على أعلى الترابيس (High bar)، مسكة من فوق أعرض من كتفك بشوية، وأضيق ما مرونتك تسمح. كوعك لتحت."],
  "Romanian Deadlift":["double overhand","مسكة من فوق بالإيدين (Double overhand)، بعرض كتفك، إيديك برّه فخادك على طول. لو مسكتك فلتت استخدم Straps."],
  "Walking Lunges (Dumbbell)":["","دمبل في كل إيد جنبك، الكفوف بتبص لجسمك (Neutral)."],
  "Standing Calf Raise":["","إمسك مقابض الجهاز للتوازن بس، متشدّش بإيدك."],
  "Incline Dumbbell Press":["","الكفوف لقدّام (Overhand)، ولفّها لجوّه سنة (حوالي 45°) لو كتفك بيضايقك. الدمبل فوق أعلى صدرك."],
  "Assisted Pull-ups":["overhand grip","مسكة من فوق (Overhand)، أعرض من كتفك سنة. ده نفس شكل العقلة اللي هدفك توصلها."],
  "Seated Cable Row":["v-bar","مقبض V الضيق، الكفوف بتبص لبعض (Neutral)."],
  "Arnold Press":["","بتبدأ والكفوف بتبص لوشك قدّام دقنك، ولما ترفع لفّ إيدك لحد ما الكفوف تبص لقدّام فوق."],
  "Face Pull":["rope","حبل، مسكة من فوق والإبهام بيبص لورا ناحيتك. اسحب ناحية وشك وافتح الحبل لبرّه عند ودانك."],
  "Incline Dumbbell Curl":["","مسكة من تحت (Underhand)، الكف لقدّام طول الحركة. دراعك سايب لتحت ورا جسمك."],
  "Overhead Cable Triceps Extension":["rope","حبل، ضهرك للجهاز، الإبهام لفوق والكفوف بتبص لبعض (Neutral)."],
  "Hammer Curl":["","دمبل، الإبهام لفوق والكفوف بتبص لجسمك (Neutral) طول الحركة."],
  "Cable Lateral Raise":["single arm","مقبض واحد (D-handle) في الإيد البعيدة عن الجهاز، الكابل معدّي قدّام جسمك."],
  "Deadlift (Trap Bar)":["high handles","إمسك في نص المقابض بالظبط عشان الوزن يتوازن، الكفوف بتبص لجسمك (Neutral). ابدأ بالمقابض العالية لحد ما تتعلم الحركة."],
  "Bulgarian Split Squat":["","دمبل في كل إيد جنبك، الكفوف بتبص لجسمك (Neutral)."],
  "Hip Thrust":["","مسكة من فوق على البار برّه وسطك، بس عشان تثبّته. الشغل كله من الإلية."],
  "Single-leg Calf Raise":["","الدمبل في نفس إيد الرجل اللي شغالة، والإيد التانية على الحيطة للتوازن."],
  "Cable Crunch":["rope","حبل، طرفينه جنب وشك أو قدّام جبهتك، وإيدك ثابتة مكانها طول الحركة."],
  "Hanging Knee Raise":["","مسكة من فوق (Overhand) بعرض كتفك. لو إيدك تعبت قبل بطنك استخدم Straps أو مساند الكوع."],
  "Hanging Leg Raise":["","مسكة من فوق (Overhand) بعرض كتفك. لو إيدك تعبت قبل بطنك استخدم Straps."],
  "Pallof Press":["","مقبض واحد (D-handle)، الإيدين الاتنين عليه لازقين في صدرك."],
  "Ab Wheel Rollout":["","إمسك مقابض العجلة من فوق، دراعك مفرود."],
  "Dead Hang":["overhand","مسكة من فوق (Overhand) بعرض كتفك، زي العقلة. الإبهام ملفوف حوالين البار."],
  "Farmer's Carry":["dumbbell","دمبل في كل إيد جنبك، الكفوف بتبص لجسمك (Neutral). إمسك في نص المقبض بالظبط واضغط عليه جامد."]
};

/* how-to media: slug -> file in media/. Files are added as they arrive. */
const MEDIA = {
  "bench-press": {f:"media/bench-press.mp4", poster:"media/bench-press.jpg", talk:true, credit:"TikTok @kg.workouts"},
  "chest-supported-row-machine": {f:"media/chest-supported-row-machine.mp4", poster:"media/chest-supported-row-machine.jpg", talk:true, credit:"TikTok @haitham_salama0"},
  "machine-shoulder-press": {f:"media/machine-shoulder-press.mp4", poster:"media/machine-shoulder-press.jpg", talk:true, credit:"TikTok @kg.karimgabriel"},
  "lat-pulldown": {f:"media/lat-pulldown.mp4", poster:"media/lat-pulldown.jpg", talk:true, credit:"TikTok @kg.karimgabriel"},
  "lateral-raise": {f:"media/lateral-raise.mp4", poster:"media/lateral-raise.jpg", talk:true, credit:"TikTok @kg.karimgabriel"},
  "ez-bar-curl": {f:"media/ez-bar-curl.mp4", poster:"media/ez-bar-curl.jpg", talk:true, credit:"TikTok @informa180"},
  "triceps-rope-pushdown": {f:"media/triceps-rope-pushdown.mp4", poster:"media/triceps-rope-pushdown.jpg", talk:true, credit:"TikTok @kg.karimgabriel"},
  "cable-crunch": {f:"media/cable-crunch.mp4", poster:"media/cable-crunch.jpg", talk:true, credit:"TikTok @kg.karimgabriel"},
  "dead-bug": {f:"media/dead-bug.mp4", poster:"media/dead-bug.jpg", talk:true, credit:"TikTok @ibrku"},
  "chest-stretch": {f:"media/chest-stretch.mp4", poster:"media/chest-stretch.jpg", talk:true, credit:"TikTok @abuhmeidfitness"},
  "lat-stretch": {f:"media/lat-stretch.mp4", poster:"media/lat-stretch.jpg", talk:true, credit:"TikTok @resurgencept"},
  "childs-pose": {f:"media/childs-pose.mp4", poster:"media/childs-pose.jpg", talk:true, credit:"TikTok @matyfit.us"},
  "band-pull-aparts": {f:"media/band-pull-aparts.mp4", poster:"media/band-pull-aparts.jpg", credit:"TikTok @kylemcd7"},
  "band-dislocates": {f:"media/band-dislocates.mp4", poster:"media/band-dislocates.jpg", talk:true, credit:"TikTok @iamtreburns"},
  "cat-cow": {f:"media/cat-cow.mp4", poster:"media/cat-cow.jpg", talk:true, credit:"TikTok @bodyweightculture"}
};
