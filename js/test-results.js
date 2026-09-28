import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const btnRetakeTest = $('btnRetakeTest');
  const btnBackToDashboard = $('btnBackToDashboard');
  const resultsContainer = $('resultsContainer');
  const sportsContainer = $('sportsRecommendationContainer');
  const profileContainer = $('physicalProfileContainer');
  const sessionScoreBadge = $('sessionScoreBadge');
  
  const session = window.KhelSetu ? window.KhelSetu.getSession() : {};
<<<<<<< HEAD
  const sportEnvironment = session.sportEnvironment || 'both';
=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
  
  const ASSESSMENT_STORAGE_KEY = 'khelsetu_assessment_results_v1';
  function readAssessmentSnapshot(){
    const merged={};
    const stores=[];
    try{ stores.push(sessionStorage); }catch(_){}
    try{ stores.push(localStorage); }catch(_){}
    const merge=(candidate)=>{
      if(!candidate || typeof candidate!=='object')return;
      for(const [k,v] of Object.entries(candidate)){
        if(v && typeof v==='object' && !Array.isArray(v)) merged[k]={...(merged[k]||{}),...v};
        else if(v!==undefined && v!==null) merged[k]=v;
      }
    };
    for(const key of ['khelsetu_last_assessment',ASSESSMENT_STORAGE_KEY]){
      for(const store of stores){
        try{const parsed=JSON.parse(store.getItem(key)||'null'); merge(parsed?.results ?? parsed);}catch(_){}
      }
    }
    merge(session.assessmentResults); merge(session.exerciseResults); merge(session.lastAssessmentResults);
    
    if(Number(session.squatReps)>0) merged.squat={...(merged.squat||{}),reps:Number(session.squatReps)};
    if(Number(session.jumpCm)>0) merged.jump={...(merged.jump||{}),maxJumpCm:Number(session.jumpCm)};
    if(Number(session.sideLungeReps)>0) merged['side-lunges']={...(merged['side-lunges']||{}),reps:Number(session.sideLungeReps)};
    if(Number(session.jumpingJackReps)>0) merged['jumping-jacks']={...(merged['jumping-jacks']||{}),reps:Number(session.jumpingJackReps)};
    if(Number(session.pushupReps)>0) merged.pushups={...(merged.pushups||{}),reps:Number(session.pushupReps)};
    return merged;
  }
  
  const data = readAssessmentSnapshot();

  const BENCHMARKS = {
    squat: { min: 10, max: 45 },
    jump: { min: 15, max: 70 },
    sideLunges: { min: 8, max: 40 },
    jumpingJacks: { min: 15, max: 80 },
    pushups: { min: 5, max: 40 }
  };

  const clamp = (n,min=0,max=100) => Math.max(min, Math.min(max,n));
  const scoreRange = (value, range) => {
    const v = Number(value)||0;
    if (v <= 0) return 0;
    if (v < range.min) return clamp((v/range.min)*25);
    return clamp(25 + (v-range.min)/(range.max-range.min)*75);
  };
  const round = n => Math.round(n);

  const raw = {
    squat: Number(data.squat?.reps ?? data.squats?.reps ?? session.squatReps ?? 0),
    jump: Number(data.jump?.maxJumpCm ?? data['vertical-jump']?.maxJumpCm ?? data.verticalJump?.maxJumpCm ?? session.jumpCm ?? 0),
    sideLunges: Number(data['side-lunges']?.reps ?? data.sideLunges?.reps ?? session.sideLungeReps ?? 0),
    jumpingJacks: Number(data['jumping-jacks']?.reps ?? data.jumpingJacks?.reps ?? session.jumpingJackReps ?? 0),
    pushups: Number(data.pushups?.reps ?? data['push-ups']?.reps ?? data.pushUp?.reps ?? session.pushupReps ?? 0)
  };

  const hasRawResults = Object.values(raw).some(v => Number(v) > 0);
  const rawNotice = document.getElementById('resultsDataNotice');
  if (rawNotice) {
    rawNotice.textContent = hasRawResults ? '' : 'No exercise measurements were found.';
    rawNotice.hidden = hasRawResults;
  }

  const profile = {
    lower: round(scoreRange(raw.squat, BENCHMARKS.squat)),
    power: round(scoreRange(raw.jump, BENCHMARKS.jump)),
    agility: round(scoreRange(raw.sideLunges, BENCHMARKS.sideLunges)),
    speed: round(scoreRange(raw.jumpingJacks, BENCHMARKS.jumpingJacks)),
    upper: round(scoreRange(raw.pushups, BENCHMARKS.pushups))
  };

<<<<<<< HEAD
  // Each sport is tagged by the environment in which it is most commonly played.
  // "both" sports are included when the athlete chooses either environment or Both.
  const SPORTS = [
    ['Football',       {lower:.20,power:.20,agility:.25,speed:.25,upper:.10}, 'outdoor'],
    ['Cricket',        {lower:.20,power:.15,agility:.20,speed:.25,upper:.20}, 'outdoor'],
    ['Basketball',     {lower:.20,power:.25,agility:.25,speed:.20,upper:.10}, 'indoor'],
    ['Volleyball',     {lower:.20,power:.30,agility:.25,speed:.15,upper:.10}, 'both'],
    ['Badminton',      {lower:.15,power:.15,agility:.35,speed:.25,upper:.10}, 'both'],
    ['Tennis',         {lower:.15,power:.15,agility:.35,speed:.25,upper:.10}, 'both'],
    ['Hockey',         {lower:.20,power:.20,agility:.25,speed:.25,upper:.10}, 'outdoor'],
    ['Kabaddi',        {lower:.25,power:.20,agility:.20,speed:.20,upper:.15}, 'both'],
    ['Athletics',      {lower:.20,power:.30,agility:.15,speed:.30,upper:.05}, 'outdoor'],
    ['Wrestling',      {lower:.25,power:.20,agility:.15,speed:.15,upper:.25}, 'indoor'],
    ['Boxing',         {lower:.15,power:.15,agility:.20,speed:.30,upper:.20}, 'indoor'],
    ['Swimming',       {lower:.15,power:.20,agility:.10,speed:.25,upper:.30}, 'both'],
    ['Table Tennis',   {lower:.10,power:.10,agility:.35,speed:.30,upper:.15}, 'indoor'],
    ['Squash',         {lower:.15,power:.15,agility:.35,speed:.25,upper:.10}, 'indoor'],
    ['Handball',       {lower:.20,power:.20,agility:.25,speed:.20,upper:.15}, 'indoor'],
    ['Basketball 3x3', {lower:.20,power:.25,agility:.25,speed:.20,upper:.10}, 'outdoor'],
    ['Kho Kho',        {lower:.20,power:.15,agility:.30,speed:.25,upper:.10}, 'outdoor'],
    ['Archery',        {lower:.10,power:.15,agility:.10,speed:.10,upper:.55}, 'outdoor'],
    ['Cycling',        {lower:.35,power:.15,agility:.10,speed:.30,upper:.10}, 'outdoor'],
    ['Gymnastics',     {lower:.20,power:.25,agility:.25,speed:.10,upper:.20}, 'indoor']
  ];

  // "both"-tagged sports always stay eligible; otherwise only sports matching
  // the athlete's chosen environment are considered (this is the actual filter —
  // choosing "indoor" hides outdoor-only sports from the suggestions, and vice versa).
  const sports = SPORTS
    .filter(([, , environment]) =>
      sportEnvironment === 'both' ||
      environment === sportEnvironment ||
      environment === 'both'
    )
    .map(([name,w,environment]) => ({
      name,
      environment,
      score: round(profile.lower*w.lower + profile.power*w.power + profile.agility*w.agility + profile.speed*w.speed + profile.upper*w.upper)
    }))
    .sort((a,b)=>b.score-a.score);
=======
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

  const sports = SPORTS.map(([name,w]) => ({
    name,
    score: round(profile.lower*w.lower + profile.power*w.power + profile.agility*w.agility + profile.speed*w.speed + profile.upper*w.upper)
  })).sort((a,b)=>b.score-a.score);
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031

  const overall = round((profile.lower+profile.power+profile.agility+profile.speed+profile.upper)/5);
  if(sessionScoreBadge) sessionScoreBadge.innerHTML = `${overall}<span>/100</span>`;

  const profileItems = [
    ['lower','Lower-body Strength','Squats'],
    ['power','Explosive Power','Jump'],
    ['agility','Agility','Side Lunges'],
    ['speed','Speed & Endurance','Jumping Jacks'],
    ['upper','Upper-body Strength','Push-ups']
  ];

  if(profileContainer){
    profileContainer.innerHTML = profileItems.map(([key,label,source]) => `
      <div class="profile-row">
        <div class="profile-row-top"><span>${label}</span><strong>${profile[key]}</strong></div>
        <div class="profile-bar"><span style="width:${profile[key]}%"></span></div>
        <small>${source}</small>
      </div>`).join('');
  }

  const cards = [
    ['Squats', raw.squat, 'reps', profile.lower],
    ['Push-ups', raw.pushups, 'reps', profile.upper],
    ['Side Lunges', raw.sideLunges, 'reps', profile.agility],
    ['Jumping Jacks', raw.jumpingJacks, 'reps', profile.speed],
    ['Jump', raw.jump, 'cm', profile.power]
  ];

  if(resultsContainer){
    resultsContainer.innerHTML = cards.map(([name,value,unit,score]) => `
      <article class="exercise-result-card">
        <header class="exercise-result-header"><h3 class="exercise-result-title">${name}</h3></header>
        <div class="exercise-result-metrics">
          <div class="exercise-metric"><span class="exercise-metric-label">Result</span><span class="exercise-metric-value">${value} ${unit}</span></div>
          <div class="exercise-metric-divider"></div>
          <div class="exercise-metric"><span class="exercise-metric-label">Physical Score</span><span class="exercise-metric-value">${score}/100</span></div>
        </div>
      </article>`).join('');
  }

  const visibleSports = sports.slice(0,3);
<<<<<<< HEAD
  const envLabel = env => env === 'both' ? 'Indoor / Outdoor' : (env.charAt(0).toUpperCase()+env.slice(1));

  if(sportsContainer){
    sportsContainer.innerHTML = visibleSports.length
      ? visibleSports.map((sport,index) => `
      <article class="sport-recommendation-card">
        <div class="sport-rank">${index+1}</div>
        <div class="sport-info">
          <h3>${sport.name}</h3>
          <span class="sport-category-badge sport-category-${sport.environment}">${envLabel(sport.environment)}</span>
          <p>Physical-demand match based on your five test scores</p>
        </div>
        <div class="sport-score"><strong>${sport.score}</strong><span>/100</span></div>
      </article>`).join('')
      : `<p class="sport-preference-empty">No ${sportEnvironment} sports matched your results. Try choosing "Both" on the preparation screen.</p>`;
=======

  if(sportsContainer){
    sportsContainer.innerHTML = visibleSports.map((sport,index) => `
      <article class="sport-recommendation-card">
        <div class="sport-rank">${index+1}</div>
        <div class="sport-info"><h3>${sport.name}</h3><p>Physical-demand match based on your five test scores</p></div>
        <div class="sport-score"><strong>${sport.score}</strong><span>/100</span></div>
      </article>`).join('');
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
  }

  // --- FIREBASE DOT-NOTATION SYNC LOGIC ---
  onAuthStateChanged(auth, async (user) => {
    // Only attempt to sync if we have actual numeric results
    if (user && hasRawResults) {
      try {
        const athleteRef = doc(db, "athletes", user.uid);
        
        // We use dot notation ("aiAnalysis.property") to surgically merge 
        // into the existing aiAnalysis map without overwriting rawMetrics.
        await updateDoc(athleteRef, {
          "talentScore.overall": overall,
          "aiAnalysis.spiderChart": {
            explosive: profile.power,
            agility: profile.agility,
            strength: profile.upper,
            speed: profile.speed,
            endurance: profile.lower
          },
          "aiAnalysis.sportRecommendations": visibleSports.map(s => ({
<<<<<<< HEAD
            sport: s.name,
            matchPercent: s.score,
            environment: s.environment
          })),
          "aiAnalysis.recommendationPreference": sportEnvironment
=======
            sport: s.name, 
            matchPercent: s.score
          }))
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
        });

        console.log("[KhelSetu] Synced sport recommendations and radar securely to Firestore.");
      } catch (error) {
        console.error("Error updating Firestore with final recommendations:", error);
      }
    }
  });

  // Button Routing
  if (btnRetakeTest) {
    btnRetakeTest.addEventListener('click', () => {
      window.location.href = 'test-prepare.html?test=fitness-assessment';
    });
  }
  
  if (btnBackToDashboard) {
    btnBackToDashboard.addEventListener('click', () => {
      window.location.href = 'athlete-dashboard.html';
    });
  }
});