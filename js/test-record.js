import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXWjlSbvOTQZj_u1ealCsh04nuPdFcp80",
  authDomain: "khelsetu-cb915.firebaseapp.com",
  projectId: "khelsetu-cb915",
  storageBucket: "khelsetu-cb915.firebasestorage.app",
  messagingSenderId: "671711161753",
  appId: "1:671711161753:web:5a091eb5f43bcf38753708"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentAthleteUid = null;

document.addEventListener('DOMContentLoaded', async () => {
  const $ = id => document.getElementById(id);
  const video = $('videoFeed'), canvas =$('poseCanvas');
  const btnClose = $('btnCloseRecording'), btnRecord = $('btnRecord'), btnCalibrate =$('btnCalibrate');
  const status = $('statusMessage'), guide =$('positionGuideText'), badge = $('bodyDetectionStatus'), timer =$('recordingTimer');
  const title = document.querySelector('.test-record-title');

  const EXERCISES = [
    { id:'squat', name:'Squats', cue:'Stand tall, squat down, then stand fully upright.', metric:'reps' },
    { id:'pushups', name:'Push-ups', cue:'Turn sideways. Keep your full body visible, lower your chest, then push back up.', metric:'reps' },
    { id:'side-lunges', name:'Side Lunges', cue:'Step to one side, bend that knee, return to center, then switch sides.', metric:'reps' },
    { id:'jumping-jacks', name:'Jumping Jacks', cue:'Jump feet apart while raising your arms overhead, then return to the starting position.', metric:'reps' },
    { id:'jump', name:'Jump', cue:'Stand tall and jump as high as you can. Land safely and reset.', metric:'cm' }
  ];

  let stream=null, pose=null, raf=0, lastPose=0, processing=false, closing=false;
  let running=false, phase='idle', exerciseIndex=0, seconds=30, timerInterval=null;
  let calibrated=false, calibrationHeight=172, standingBodyPx=0, baselineHipY=null, peakHipY=null, maxJumpCm=0;
  let calibratedHipY=null;
  let filteredLandmarks=null, lastGood=null, bodyGoodFrames=0, bodyLostFrames=0;
  let canvasReady=false, canvasW=0, canvasH=0;
  let reps=0, repState='up';
  let squatDownFrames=0, squatUpFrames=0;
  let sideLungeArmed=true, sideLungeFrames=0;
  let jumpingJackState='closed', jumpingJackOpenFrames=0, jumpingJackCloseFrames=0;
  let jumpPendingCm=0, jumpPendingFrames=0;
  let exerciseStartedAt=0;
  const results = {};
  const ASSESSMENT_STORAGE_KEY = 'khelsetu_assessment_results_v1';
  
  const smoother = window.KhelSetuCamera?.createLandmarkSmoother?.(.35);

  try {
    const s=window.KhelSetu?.getSession?.()||{};
    calibrationHeight=Number(s.calibrationHeight||s.user?.height||172);
    if(!Number.isFinite(calibrationHeight)) calibrationHeight=172;
  } catch(_){}

  const visible=(p,t=.08)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1&&(p.visibility==null||p.visibility>=t);
  const ids=[0,7,8,11,12,13,14,15,16,23,24,25,26,27,28,29,30,31,32];
  const angle=(a,b,c)=>{if(!visible(a)||!visible(b)||!visible(c))return null;const ab={x:a.x-b.x,y:a.y-b.y},cb={x:c.x-b.x,y:c.y-b.y};const dot=ab.x*cb.x+ab.y*cb.y;const den=Math.hypot(ab.x,ab.y)*Math.hypot(cb.x,cb.y);return den?Math.acos(Math.max(-1,Math.min(1,dot/den)))*180/Math.PI:null;};
  
  function detect(lm){
    if(!Array.isArray(lm)||lm.length<33)return false;
    const core=[11,12,23,24].filter(i=>visible(lm[i],.04)).length;
    const count=ids.filter(i=>visible(lm[i],.04)).length;
    if(core<2||count<6)return false;
    const pts=ids.map(i=>lm[i]).filter(p=>visible(p,.04));
    const h=Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y));
    const w=Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x));
    return Math.max(h,w)>=.18;
  }
  function bodyPx(lm){const pts=ids.map(i=>lm[i]).filter(p=>visible(p));if(pts.length<5||!video.videoHeight)return 0;return(Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y)))*video.videoHeight;}
  function hipPx(lm){const a=lm[23],b=lm[24];if(!visible(a)||!visible(b))return null;return((a.y+b.y)/2)*video.videoHeight;}
  function draw(lm){
    if(!lm?.length||!video.videoWidth)return;
    if(!canvasReady||canvasW!==video.videoWidth||canvasH!==video.videoHeight){canvasW=video.videoWidth;canvasH=video.videoHeight;canvas.width=canvasW;canvas.height=canvasH;canvasReady=true;}
    const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);
    const links=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,31],[28,32]];
    c.lineWidth=Math.max(2,canvas.width/320);c.strokeStyle='#10B981';c.fillStyle='#10B981';
    for(const[a,b]of links){const p=lm[a],q=lm[b];if(!visible(p)||!visible(q))continue;c.beginPath();c.moveTo(p.x*canvas.width,p.y*canvas.height);c.lineTo(q.x*canvas.width,q.y*canvas.height);c.stroke();}
    for(const p of lm){if(!visible(p))continue;c.beginPath();c.arc(p.x*canvas.width,p.y*canvas.height,Math.max(2,canvas.width/180),0,Math.PI*2);c.fill();}
  }

  function setExerciseUI(){
    const ex=EXERCISES[exerciseIndex];
    if(title)title.textContent=`${ex.name}  •  ${exerciseIndex+1}/${EXERCISES.length}`;
    if(guide)guide.textContent=ex.cue;
    if(timer)timer.textContent='30s';
  }

  function resetDetector(id){
    reps=0;repState='up';
    squatDownFrames=0;squatUpFrames=0;
    sideLungeArmed=true;sideLungeFrames=0;
    jumpingJackState='closed';jumpingJackOpenFrames=0;jumpingJackCloseFrames=0;
    baselineHipY=hipPx(lastGood||[]);peakHipY=baselineHipY;maxJumpCm=0;jumpPendingCm=0;jumpPendingFrames=0;
    if(id==='jump'){
      baselineHipY=calibratedHipY!=null?calibratedHipY:hipPx(lastGood||[]);
      if(baselineHipY==null && lastGood)baselineHipY=hipPx(lastGood);
      peakHipY=baselineHipY;
    }
  }

  function updateSquat(lm){
    const l=angle(lm[23],lm[25],lm[27]), r=angle(lm[24],lm[26],lm[28]);
    if(l==null&&r==null)return;
    const knee=(l!=null&&r!=null)?(l+r)/2:(l??r);
    if(repState==='up'){
      if(knee<120){ squatDownFrames++; if(squatDownFrames>=2){repState='down';squatDownFrames=0;} }
      else squatDownFrames=0;
    }else{
      if(knee>160){ squatUpFrames++; if(squatUpFrames>=2){reps++;repState='up';squatUpFrames=0;} }
      else squatUpFrames=0;
    }
  }
  
  function updateJump(lm){
    const y=hipPx(lm);
    if(y==null||standingBodyPx<=0||baselineHipY==null)return;
    const rise=Math.max(0,baselineHipY-y);
    let cm=Math.min((rise/standingBodyPx)*calibrationHeight,100);
    if(cm>maxJumpCm){
      if(Math.abs(cm-jumpPendingCm)<=6){
        jumpPendingFrames++;
        if(jumpPendingFrames>=2)maxJumpCm=cm;
      }else jumpPendingFrames=1;
      jumpPendingCm=cm;
    }
  }

  function updateSideLunges(lm){
    const lKnee=angle(lm[23],lm[25],lm[27]);
    const rKnee=angle(lm[24],lm[26],lm[28]);
    if(lKnee==null&&rKnee==null)return;
    const leftBend=lKnee!=null&&lKnee<145;
    const rightBend=rKnee!=null&&rKnee<145;
    const oneSideBent=(leftBend&&!rightBend)||(rightBend&&!leftBend);
    const resetReady=(lKnee==null||lKnee>160)&&(rKnee==null||rKnee>160);
    if(sideLungeArmed&&oneSideBent){
      sideLungeFrames++;
      if(sideLungeFrames>=2){reps++;sideLungeArmed=false;sideLungeFrames=0;}
    }else if(!sideLungeArmed&&resetReady){
      sideLungeArmed=true;
    }else if(!oneSideBent){
      sideLungeFrames=0;
    }
  }

  function updateJumpingJacks(lm){
    const ls=lm[11],rs=lm[12],lw=lm[15],rw=lm[16],la=lm[27],ra=lm[28],lh=lm[23],rh=lm[24];
    if(!visible(ls,.02)||!visible(rs,.02)||!visible(lw,.02)||!visible(rw,.02)||!visible(la,.02)||!visible(ra,.02)||!visible(lh,.02)||!visible(rh,.02))return;
    const shoulderWidth=Math.max(.05,Math.abs(ls.x-rs.x));
    const hipWidth=Math.max(.05,Math.abs(lh.x-rh.x));
    const ankleDistance=Math.abs(la.x-ra.x);
    const handAboveShoulders=(lw.y<ls.y-.06)&&(rw.y<rs.y-.06);
    const feetOpen=ankleDistance>Math.max(hipWidth*1.35,shoulderWidth*1.55);
    const feetClosed=ankleDistance<hipWidth*1.18;
    const handsDown=(lw.y>ls.y-.02)&&(rw.y>rs.y-.02);
    const open=handAboveShoulders&&feetOpen;
    const closed=feetClosed&&handsDown;
    if(jumpingJackState==='closed'){
      if(open){jumpingJackOpenFrames++;if(jumpingJackOpenFrames>=2){jumpingJackState='open';jumpingJackOpenFrames=0;}}
      else jumpingJackOpenFrames=0;
    }else{
      if(closed){jumpingJackCloseFrames++;if(jumpingJackCloseFrames>=2){reps++;jumpingJackState='closed';jumpingJackCloseFrames=0;}}
      else jumpingJackCloseFrames=0;
    }
  }

  function updatePushups(lm){
    const leftElbow=angle(lm[11],lm[13],lm[15]);
    const rightElbow=angle(lm[12],lm[14],lm[16]);
    const leftScore=visible(lm[13],.02)?(lm[13].visibility??0):0;
    const rightScore=visible(lm[14],.02)?(lm[14].visibility??0):0;
    const elbow=leftElbow!=null&&rightElbow!=null
      ? (leftScore>=rightScore?leftElbow:rightElbow)
      : (leftElbow??rightElbow);
    if(elbow==null)return;
    const shoulderPts=[lm[11],lm[12]].filter(p=>visible(p,.02));
    const hipPts=[lm[23],lm[24]].filter(p=>visible(p,.02));
    if(!shoulderPts.length||!hipPts.length)return;
    const shoulderY=shoulderPts.reduce((s,p)=>s+p.y,0)/shoulderPts.length;
    const hipY=hipPts.reduce((s,p)=>s+p.y,0)/hipPts.length;
    if(Math.abs(hipY-shoulderY)>=.48)return;
    if(repState==='up'&&elbow<125)repState='down';
    else if(repState==='down'&&elbow>150){reps++;repState='up';}
  }
  
  function updateExercise(lm, raw){
    if(phase!=='exercise')return;
    const fastLm = (raw && raw.length>=33) ? raw : lm;
    switch(EXERCISES[exerciseIndex].id){
      case'squat': updateSquat(lm); break;
      case'pushups': updatePushups(lm); break;
      case'side-lunges': updateSideLunges(fastLm); break;
      case'jumping-jacks': updateJumpingJacks(fastLm); break;
      case'jump': updateJump(lm); break;
    }
  }

  function persistAssessmentSnapshot(extra={}) {
    const snapshot = JSON.parse(JSON.stringify(results));
    const direct = {
      squatReps: Number(snapshot.squat?.reps || 0),
      jumpCm: Number(snapshot.jump?.maxJumpCm || 0),
      pushupReps: Number(snapshot.pushups?.reps || 0),
      sideLungeReps: Number(snapshot['side-lunges']?.reps || 0),
      jumpingJackReps: Number(snapshot['jumping-jacks']?.reps || 0)
    };
    const payload = { results: snapshot, ...direct, savedAt: Date.now(), ...extra };
    try { localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(payload)); } catch(_) {}
    try { sessionStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(payload)); } catch(_) {}
    window.KhelSetu?.updateSession?.({
      assessmentResults:snapshot,
      exerciseResults:snapshot,
      lastAssessmentResults:snapshot,
      assessmentSavedAt:payload.savedAt,
      calibrationHeight
    });
    return snapshot;
  }

  function finishExercise(){
    const id=EXERCISES[exerciseIndex].id;
    results[id]=id==='jump'?{maxJumpCm:Math.round(maxJumpCm)}:{reps:Math.max(0,reps)};
    persistAssessmentSnapshot({ currentExercise:id, completed:false });
    if(timer)timer.textContent='Done';
    if(exerciseIndex<EXERCISES.length-1)startRest();else finishAssessment();
  }

  function startExercise(){
    phase='exercise';running=true;exerciseStartedAt=Date.now();resetDetector(EXERCISES[exerciseIndex].id);setExerciseUI();
    if(status)status.textContent='GO!';if(btnRecord)btnRecord.classList.add('is-recording');seconds=30;if(timer)timer.textContent='30s';
    clearInterval(timerInterval);timerInterval=setInterval(()=>{seconds--;if(timer)timer.textContent=Math.max(0,seconds)+'s';if(seconds<=0){clearInterval(timerInterval);timerInterval=null;finishExercise();}},1000);
  }

  function startRest(){
    phase='rest';running=false;if(btnRecord)btnRecord.classList.remove('is-recording');
    const next=EXERCISES[exerciseIndex+1];seconds=30;if(timer)timer.textContent='30s';
    if(status)status.textContent='REST';if(guide)guide.textContent=`Take a 30-second rest. Next: ${next.name}`;
    clearInterval(timerInterval);timerInterval=setInterval(()=>{seconds--;if(timer)timer.textContent=Math.max(0,seconds)+'s';if(seconds<=0){clearInterval(timerInterval);timerInterval=null;exerciseIndex++;startExercise();}},1000);
  }

  function startAssessment(){
    if(!lastGood||!detect(lastGood)){status.textContent='Body not detected. Keep your whole body inside the frame.';return;}
    if(!calibrated){calibrate();if(!calibrated)return;}
    exerciseIndex=0;Object.keys(results).forEach(k=>delete results[k]);
    try { localStorage.removeItem(ASSESSMENT_STORAGE_KEY); sessionStorage.removeItem(ASSESSMENT_STORAGE_KEY); } catch(_) {}
    window.KhelSetu?.updateSession?.({assessmentResults:{},exerciseResults:{},lastAssessmentResults:{},assessmentVersion:6,currentTest:'fitness-assessment'});
    startExercise();
  }

  function calibrate(){
    if(!lastGood||!detect(lastGood)){status.textContent='Body not detected. Keep your whole body visible.';return;}
    const px=bodyPx(lastGood),hip=hipPx(lastGood);if(px<120||hip==null){status.textContent='Move farther or nearer until your complete body is visible.';return;}
    standingBodyPx=px;baselineHipY=hip;peakHipY=hip;maxJumpCm=0;jumpPendingCm=0;jumpPendingFrames=0;calibrated=true;
    calibratedHipY=hip;
    status.textContent=`Calibrated using ${Math.round(calibrationHeight)} cm height reference.`;guide.textContent='Ready for 5 exercises. Press Start.';
  }

  // --- FIREBASE INTEGRATION: UPLOAD RESULTS WHEN FINISHED ---
  async function finishAssessment(){
    running=false;phase='done';clearInterval(timerInterval);timerInterval=null;if(btnRecord)btnRecord.classList.remove('is-recording');
    const snapshot = persistAssessmentSnapshot({ currentExercise:null, completed:true });
    
    if(status)status.textContent='Saving to Database...';
    if(guide)guide.textContent='Please wait, syncing results...';

    try {
      if (currentAthleteUid) {
        // Build the AI Analysis payload using your exact metrics
        const rawSquats = Number(results.squat?.reps || 0);
        const rawJump = Number(results.jump?.maxJumpCm || 0);
        const rawLunges = Number(results['side-lunges']?.reps || 0);
        const rawJacks = Number(results['jumping-jacks']?.reps || 0);
        const rawPushups = Number(results.pushups?.reps || 0);

        // Simple clamp function to convert raw reps into the 0-100 radar scores
        const clamp = (n) => Math.max(0, Math.min(100, n));
        const score = (v, min, max) => v <= 0 ? 0 : (v < min ? clamp((v/min)*25) : clamp(25 + (v-min)/(max-min)*75));

        const lower = Math.round(score(rawSquats, 10, 45));
        const power = Math.round(score(rawJump, 15, 70));
        const agility = Math.round(score(rawLunges, 8, 40));
        const speed = Math.round(score(rawJacks, 15, 80));
        const upper = Math.round(score(rawPushups, 5, 40));

        const overallScore = Math.round((lower + power + agility + speed + upper) / 5);

        // Same 20-sport weighted match model used on the results page, computed
        // here too so it rides along in this write — which is already awaited
        // before navigation — instead of depending on a second Firestore call
        // from test-results.js that can get cancelled if the user navigates
        // away before it finishes.
        const SPORTS = [
          ['Football',      {lower:.20,power:.20,agility:.25,speed:.25,upper:.10}],
          ['Cricket',       {lower:.20,power:.15,agility:.20,speed:.25,upper:.20}],
          ['Basketball',    {lower:.20,power:.25,agility:.25,speed:.20,upper:.10}],
          ['Volleyball',    {lower:.20,power:.30,agility:.25,speed:.15,upper:.10}],
          ['Badminton',     {lower:.15,power:.15,agility:.35,speed:.25,upper:.10}],
          ['Tennis',        {lower:.15,power:.15,agility:.35,speed:.25,upper:.10}],
          ['Hockey',        {lower:.20,power:.20,agility:.25,speed:.25,upper:.10}],
          ['Kabaddi',       {lower:.25,power:.20,agility:.20,speed:.20,upper:.15}],
          ['Athletics',     {lower:.20,power:.30,agility:.15,speed:.30,upper:.05}],
          ['Wrestling',     {lower:.25,power:.20,agility:.15,speed:.15,upper:.25}],
          ['Boxing',        {lower:.15,power:.15,agility:.20,speed:.30,upper:.20}],
          ['Swimming',      {lower:.15,power:.20,agility:.10,speed:.25,upper:.30}],
          ['Table Tennis',  {lower:.10,power:.10,agility:.35,speed:.30,upper:.15}],
          ['Squash',        {lower:.15,power:.15,agility:.35,speed:.25,upper:.10}],
          ['Handball',      {lower:.20,power:.20,agility:.25,speed:.20,upper:.15}],
          ['Basketball 3x3',{lower:.20,power:.25,agility:.25,speed:.20,upper:.10}],
          ['Kho Kho',       {lower:.20,power:.15,agility:.30,speed:.25,upper:.10}],
          ['Archery',       {lower:.10,power:.15,agility:.10,speed:.10,upper:.55}],
          ['Cycling',       {lower:.35,power:.15,agility:.10,speed:.30,upper:.10}],
          ['Gymnastics',    {lower:.20,power:.25,agility:.25,speed:.10,upper:.20}]
        ];
        const topSports = SPORTS.map(([name,w]) => ({
          name,
          score: Math.round(lower*w.lower + power*w.power + agility*w.agility + speed*w.speed + upper*w.upper)
        })).sort((a,b)=>b.score-a.score).slice(0,3);

        const aiAnalysisData = {
          spiderChart: { explosive: power, agility: agility, strength: Math.round((lower+upper)/2), speed: speed, endurance: Math.round((lower+speed)/2) },
          rawMetrics: {
             squats: rawSquats,
             verticalJumpCm: rawJump,
             sideLunges: rawLunges,
             jumpingJacks: rawJacks,
             pushups: rawPushups
          },
          sportRecommendations: topSports.map(s => ({ sport: s.name, matchPercent: s.score })),
          analysisText: `Assessment complete. Recorded a maximum vertical jump of ${Math.round(rawJump)}cm and ${rawPushups} push-ups.`
        };

        const athleteRef = doc(db, "athletes", currentAthleteUid);
        await updateDoc(athleteRef, {
          aiAnalysis: aiAnalysisData,
          talentScore: { overall: overallScore, badge: overallScore > 80 ? "Platinum" : overallScore > 60 ? "Gold" : "Silver" },
          testHistory: arrayUnion({
            attemptId: "attempt_" + Date.now(),
            date: new Date().toISOString().split('T')[0],
            talentScore: overallScore,
            status: "completed"
          })
        });
      }
    } catch (error) {
      console.error("Firebase save error", error);
    }

    stopCamera();
    setTimeout(()=>location.href='test-analyzing.html', 500);
  }

  function stopRecording(){
    if(phase==='exercise')finishExercise();
    else if(phase==='rest'){clearInterval(timerInterval);timerInterval=null;exerciseIndex++;startExercise();}
  }

  function onPose(r){
    const raw=r.poseLandmarks||[];const lm=smoother?smoother.filter(raw):raw;filteredLandmarks=lm;
    const detected=detect(lm);if(detected){bodyGoodFrames++;bodyLostFrames=0;}else{bodyLostFrames++;bodyGoodFrames=0;}
    const ok=bodyGoodFrames>=2?true:(bodyLostFrames>=5?false:!!lastGood);
    badge.textContent=ok?'Body Detected: YES':'Body Detected: NO';badge.classList.toggle('detected',ok);badge.classList.toggle('not-detected',!ok);
    if(detected){lastGood=lm;draw(lm);if(!calibrated){const px=bodyPx(lm);if(px>0)standingBodyPx=standingBodyPx?standingBodyPx*.8+px*.2:px;}}
    else if(lastGood&&bodyLostFrames<10)draw(lastGood);
    else if(lm?.length>=33){draw(lm);}
    else if(canvas.width)canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
    if(detected)updateExercise(lm, raw);
    if(phase==='exercise'){
      const ex=EXERCISES[exerciseIndex];
      if(ex.id==='jump' && status) status.textContent=`GO! Best jump: ${Math.round(maxJumpCm)} cm`;
      else if(status) status.textContent=`GO! ${ex.name}: ${reps} reps`;
    }
  }

  async function initPose(){
    if(!window.Pose)throw new Error('MediaPipe Pose did not load.');
    pose=new Pose({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`});
    const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    pose.setOptions({modelComplexity:mobile?0:1,smoothLandmarks:true,enableSegmentation:false,minDetectionConfidence:.55,minTrackingConfidence:.60});pose.onResults(onPose);
  }

  async function loop(now){
    if(closing)return;
    if(video.readyState>=2&&pose&&!processing&&now-lastPose>=67){lastPose=now;processing=true;try{await pose.send({image:video});}catch(e){console.warn('Pose frame',e);}finally{processing=false;}}
    raf=requestAnimationFrame(loop);
  }

  async function startCamera(){
    closing=false;filteredLandmarks=null;lastGood=null;bodyGoodFrames=0;bodyLostFrames=0;canvasReady=false;canvasW=0;canvasH=0;if(smoother)smoother.reset();
    status.textContent='Starting camera...';
    if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;
    if(!window.KhelSetuCamera?.isSecure?.()){status.textContent='On a phone, use HTTPS. On this computer, use localhost.';btnRecord.disabled=true;btnCalibrate.disabled=true;return;}
    try{stream=await navigator.mediaDevices.getUserMedia(window.KhelSetuCamera.constraints());await window.KhelSetuCamera.setVideo(video,stream);await initPose();status.textContent='Camera ready. Keep your whole body visible.';guide.textContent=`Height reference: ${Math.round(calibrationHeight)} cm`;raf=requestAnimationFrame(loop);}
    catch(e){console.error(e);status.textContent=e?.name==='NotAllowedError'?'Camera permission denied. Allow camera access.':e?.name==='NotReadableError'?'Camera is busy. Close other camera apps.':e?.name==='TypeError'?'Phone access requires HTTPS.':`Camera error: ${e?.name||'Unknown error'}`;btnRecord.disabled=true;btnCalibrate.disabled=true;}
  }

  function stopCamera(){closing=true;cancelAnimationFrame(raf);if(pose){try{pose.close()}catch(_){}pose=null;}if(smoother)smoother.reset();filteredLandmarks=null;lastGood=null;bodyGoodFrames=0;bodyLostFrames=0;if(stream)stream.getTracks().forEach(t=>{try{t.stop()}catch(_){}});stream=null;if(video)video.srcObject=null;}
  function close(){clearInterval(timerInterval);stopCamera();history.back();}

  btnCalibrate?.addEventListener('click',calibrate);
  btnRecord?.addEventListener('click',()=>{
    if(phase==='exercise')stopRecording();
    else if(phase==='rest')stopRecording();
    else startAssessment();
  });
  btnClose?.addEventListener('click',close);
  window.addEventListener('pagehide',()=>{clearInterval(timerInterval);stopCamera();});
  window.addEventListener('beforeunload',()=>{clearInterval(timerInterval);stopCamera();});
  
  // Start the auth listener. If logged in, set the UID and warm up the camera.
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentAthleteUid = user.uid;
      setExerciseUI();
      await startCamera();
    } else {
      window.location.href = "auth-phone.html";
    }
  });
});