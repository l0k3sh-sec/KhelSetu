// KhelSetu — Sports Learning Library
// YouTube videos are embedded with the official YouTube IFrame player.
// Learning progression is based on lessons/practice, not on rewarding YouTube views.

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXWjlSbvOTQZj_u1ealCsh04nuPdFcp80",
  authDomain: "khelsetu-cb915.firebaseapp.com",
  projectId: "khelsetu-cb915",
  storageBucket: "khelsetu-cb915.firebasestorage.app",
  messagingSenderId: "671711161753",
  appId: "1:671711161753:web:5a091eb5f43bcf38753708"
};

// Reuse an already-initialized app if another script on the page created one.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUid = null;
let progressSynced = false; // becomes true once the cloud copy has been loaded/merged

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  const ATTR_LABELS = { lower:'Lower Body', power:'Power', agility:'Agility', speed:'Speed', upper:'Upper Body' };

  // Fixed IDs are used when a specific lesson has been curated.
  // Every sport + level also has its own level-specific in-app YouTube search lane,
  // so Intermediate and Pro never fall back to the Beginner lesson.
  const VERIFIED_VIDEOS = {
    // Every sport + level uses a different video ID. No level reuses another level's video.
    'Football': { beginner:'mUBsH0PabyA', intermediate:'pH_G1f6KzfI', pro:'nWbeUBzOZyo' },
    'Cricket': { beginner:'hjaJN7Egwl8', intermediate:'Z0CMU9_ez_M', pro:'m5tudvaSSiY' },
    'Basketball': { beginner:'ynkhxHilaKA', intermediate:'bvy5u3YgDEk', pro:'XJfp1uC13J8' },
    'Volleyball': { beginner:'69l6O7i27yg', intermediate:'3Mpc4rcr-Es', pro:'hzOzVihhyis' },
    'Badminton': { beginner:'WKU7w3AoTyw', intermediate:'flFsPfIVlRA', pro:'JZgp4rFW_XY' },
    'Tennis': { beginner:'ogYGv0g3VFA', intermediate:'hQ2ETdwn4-w', pro:'UssXqzq6Js8' },
    'Hockey': { beginner:'u1gDO1Eajks', intermediate:'bmCMQTG71FI', pro:'1GdzAHXc9sU' },
    'Kabaddi': { beginner:'eKjf-HGeMHk', intermediate:'xDSnEoaRf4U', pro:'kJ_-T6dC7Sw' },
    'Athletics': { beginner:'U0JjbMMTOmw', intermediate:'B9WnbQSejm4', pro:'XiXtFiR_F7M' },
    'Wrestling': { beginner:'h5kspyLJlbY', intermediate:'zMeH7sS9TY4', pro:'LsxnzFXJBPY' },
    'Boxing': { beginner:'xf8wdP0bGt4', intermediate:'Ip2uXDXORSc', pro:'LZx7lP8LQrE' },
    'Swimming': { beginner:'STMjcvViMYY', intermediate:'B9AmrMktofI', pro:'ODZ5VM-_cDc' },
    'Table Tennis': { beginner:'lG4pNqkzfkg', intermediate:'ySBVgUag4q8', pro:'8Eljp2Eg_lc' },
    'Squash': { beginner:'FLVlyoXO3hQ', intermediate:'bVqprFwcyag', pro:'lmazRHmB8Yg' },
    'Handball': { beginner:'hxiWLp0JnO0', intermediate:'3KEDBtGVNFQ', pro:'7uIlcyLsSn4' },
    'Basketball 3x3': { beginner:'mu_Ogwqyyic', intermediate:'HQY1ZO9RQ9U', pro:'i4FK7v4Xlbk' },
    'Kho Kho': { beginner:'c6GbhBYe8Ck', intermediate:'CaIykZFm628', pro:'rnPEdbswYTc' },
    'Archery': { beginner:'V4TVh1F46kY', intermediate:'7viFuy45i6g', pro:'-mX1qu94DRI' },
    'Cycling': { beginner:'mv0H9iCz8Ms', intermediate:'hsA12_9HoEU', pro:'mWbzHdGuT00' },
    'Gymnastics': { beginner:'O2wmnPTOWHU', intermediate:'OinM1v2Q7GE', pro:'T5zaUp9690s' }
  };

  const SPORTS = [
    ['Football','⚽',{lower:.20,power:.20,agility:.25,speed:.25,upper:.10},'Team field sport built on sprint speed, change of direction and endurance.','Passing • Dribbling • Shooting'],
    ['Cricket','🏏',{lower:.20,power:.15,agility:.20,speed:.25,upper:.20},'Bat-and-ball sport mixing explosive sprints with hand-eye coordination.','Batting • Bowling • Fielding'],
    ['Basketball','🏀',{lower:.20,power:.25,agility:.25,speed:.20,upper:.10},'Fast-paced court sport demanding jump power and quick direction changes.','Ball handling • Shooting • Footwork'],
    ['Volleyball','🏐',{lower:.20,power:.30,agility:.25,speed:.15,upper:.10},'Net sport built around vertical jump power and reactive agility.','Serve • Pass • Spike'],
    ['Badminton','🏸',{lower:.15,power:.15,agility:.35,speed:.25,upper:.10},'Racquet sport rewarding footwork, agility and burst speed across the court.','Grip • Footwork • Strokes'],
    ['Tennis','🎾',{lower:.15,power:.15,agility:.35,speed:.25,upper:.10},'Racquet sport combining lateral agility with repeated sprint speed.','Groundstrokes • Serve • Movement'],
    ['Hockey','🏑',{lower:.20,power:.20,agility:.25,speed:.25,upper:.10},'Stick-and-ball field sport needing sustained speed and sharp agility.','Dribbling • Passing • Shooting'],
    ['Kabaddi','🤾',{lower:.25,power:.20,agility:.20,speed:.20,upper:.15},'Contact team sport blending raw strength with agility and breath control.','Raid • Defence • Footwork'],
    ['Athletics','🏃',{lower:.20,power:.30,agility:.15,speed:.30,upper:.05},'Track & field events centred on explosive power and raw sprint speed.','Sprint • Start • Conditioning'],
    ['Wrestling','🤼',{lower:.25,power:.20,agility:.15,speed:.15,upper:.25},'Combat sport built on lower-body drive and upper-body strength.','Stance • Motion • Takedowns'],
    ['Boxing','🥊',{lower:.15,power:.15,agility:.20,speed:.30,upper:.20},'Combat sport rewarding hand speed, footwork and upper-body power.','Guard • Footwork • Punches'],
    ['Swimming','🏊',{lower:.15,power:.20,agility:.10,speed:.25,upper:.30},'Water sport driven by upper-body power and sustained speed endurance.','Body position • Breathing • Stroke'],
    ['Table Tennis','🏓',{lower:.10,power:.10,agility:.35,speed:.30,upper:.15},'Fast racquet sport built almost entirely on agility and reaction speed.','Grip • Serve • Topspin'],
    ['Squash','🎯',{lower:.15,power:.15,agility:.35,speed:.25,upper:.10},'High-intensity racquet sport demanding constant agility in a small court.','Movement • Swing • Recovery'],
    ['Handball','🖐️',{lower:.20,power:.20,agility:.25,speed:.20,upper:.15},'Team sport pairing sprint speed with agile, throw-ready upper body.','Pass • Jump shot • Defence'],
    ['Basketball 3x3','🏀',{lower:.20,power:.25,agility:.25,speed:.20,upper:.10},'Compact half-court format that rewards power, agility and decision speed.','Spacing • 1v1 • Finishing'],
    ['Kho Kho','🏃‍♀️',{lower:.20,power:.15,agility:.30,speed:.25,upper:.10},'Traditional chase sport built on sharp agility and repeated bursts of speed.','Chasing • Diving • Direction change'],
    ['Archery','🏹',{lower:.10,power:.15,agility:.10,speed:.10,upper:.55},'Precision sport dominated by upper-body strength and control.','Stance • Draw • Release'],
    ['Cycling','🚴',{lower:.35,power:.15,agility:.10,speed:.30,upper:.10},'Endurance sport driven by lower-body power and sustained speed.','Cadence • Position • Endurance'],
    ['Gymnastics','🤸',{lower:.20,power:.25,agility:.25,speed:.10,upper:.20},'Artistic sport blending power, agility and upper-body strength.','Balance • Strength • Control']
  ];

  const LEVELS = [
    {key:'beginner',label:'BEGINNER',title:'Start Strong',desc:'Rules, equipment, safety and the core movement patterns.',icon:'🌱'},
    {key:'intermediate',label:'INTERMEDIATE',title:'Build Your Game',desc:'Technique, combinations, decision-making and repeatable drills.',icon:'⚡'},
    {key:'pro',label:'PRO',title:'Train Like An Athlete',desc:'Advanced technique, tactical thinking, intensity and competition habits.',icon:'🏆'}
  ];

  let selectedLevel = 'all';
  let selectedLesson = null;
  // localStorage is kept as an offline/instant-load cache; the athlete's Firestore
  // doc (athletes/{uid}.libraryProgress) is the source of truth across devices.
  const progress = JSON.parse(localStorage.getItem('khelsetuLibraryProgress') || '{}');

  function saveProgressLocally(){
    localStorage.setItem('khelsetuLibraryProgress', JSON.stringify(progress));
  }

  async function loadCloudProgress(uid){
    try {
      const snap = await getDoc(doc(db, "athletes", uid));
      const cloudProgress = snap.exists() ? (snap.data().libraryProgress || {}) : {};
      // Merge: keep anything explored locally that hasn't reached the cloud yet,
      // and pull in anything explored on other devices/sessions.
      let changed = false;
      Object.keys(cloudProgress).forEach(key => {
        if (!progress[key]) { progress[key] = true; changed = true; }
      });
      progressSynced = true;
      if (changed) saveProgressLocally();
      // Push the merged set back up so the cloud doc has everything too
      // (covers lessons explored locally before the athlete was ever synced).
      await setDoc(doc(db, "athletes", uid), { libraryProgress: progress }, { merge: true });
      updateStats(); render();
    } catch (e) {
      console.error("Error syncing library progress:", e);
    }
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUid = user.uid;
      loadCloudProgress(user.uid);
    }
  });

  function topAttrs(weights,n=2){
    return Object.entries(weights).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k])=>ATTR_LABELS[k]);
  }

  function youtubeSearch(name, level){
    const q = `${name} ${level} training skills tutorial`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  }

  function getVideoId(name, level){ return VERIFIED_VIDEOS[name]?.[level] || ''; }
  function hasInAppVideo(name, level){ return !!getVideoId(name, level); }

  function markLessonExplored(key){
    if(!progress[key]){
      progress[key] = true;
      saveProgressLocally();
      updateStats();
      if (currentUid) {
        setDoc(doc(db, "athletes", currentUid), { libraryProgress: { [key]: true } }, { merge: true })
          .catch(e => console.error("Error saving lesson progress:", e));
      }
    }
  }

  function updateStats(){
    const count = Object.keys(progress).length;
    $('libraryLessonCount').textContent = count;
    $('libraryLevelCount').textContent = count >= 20 ? 3 : count >= 10 ? 2 : 1;
  }

  function cardHtml(sport){
    const [name,icon,weights,desc,skills] = sport;
    const tags = topAttrs(weights).map(t=>`<span class="sport-tag">${t}</span>`).join('');
    const completed = LEVELS.filter(l=>progress[`${name}:${l.key}`]).length;
    const levels = LEVELS.map(l=>{
      const id = `${name}:${l.key}`;
      const video = getVideoId(name,l.key);
      const done = !!progress[id];
      const available = hasInAppVideo(name,l.key);
      return `<button class="lesson-card ${available ? 'has-video':''} ${done?'done':''}" data-sport="${name}" data-level="${l.key}">
        <span class="lesson-card-icon">${l.icon}</span><span class="lesson-card-copy"><b>${l.label}</b><small>${l.title}</small></span><span class="lesson-status">${done?'✓':'▶'}</span>
      </button>`;
    }).join('');
    return `<article class="sport-lib-card" data-name="${name.toLowerCase()}" data-levels="${LEVELS.map(l=>l.key).join(' ')}">
      <div class="sport-card-top"><div class="sport-lib-icon">${icon}</div><span class="sport-progress">${completed}/3 levels</span></div>
      <h3 class="sport-lib-name">${name}</h3><p class="sport-lib-desc">${desc}</p>
      <div class="sport-lib-tags">${tags}</div>
      <div class="sport-skill-line"><span>Core focus</span><strong>${skills}</strong></div>
      <div class="sport-levels">${levels}</div>
    </article>`;
  }

  function render(){
    const q = $('sportsLibrarySearch').value.trim().toLowerCase();
    const list = SPORTS.filter(s=>{
      const name = s[0].toLowerCase();
      const levelMatch = selectedLevel==='all' || hasInAppVideo(s[0],selectedLevel);
      return name.includes(q) && levelMatch;
    });
    $('sportsLibraryGrid').innerHTML = list.map(cardHtml).join('');
    $('sportsLibraryEmpty').style.display = list.length ? 'none' : 'block';
  }

  function openLesson(name, level){
    const sport = SPORTS.find(s=>s[0]===name);
    const levelData = LEVELS.find(l=>l.key===level);
    if(!sport || !levelData) return;
    selectedLesson = {name,level};
    const videoId = getVideoId(name,level);
    $('lessonLevel').textContent = levelData.label;
    $('lessonModalTitle').textContent = `${name} — ${levelData.title}`;
    $('lessonModalDescription').textContent = `${levelData.desc} The video lane is curated specifically for ${name} at ${levelData.label.toLowerCase()} level.`;
    $('lessonSportName').textContent = name;
    $('lessonSkillText').textContent = sport[4];
    $('lessonYoutubeFallback').href = youtubeSearch(name,level);
    const wrap = $('lessonVideoWrap');
    if(!videoId){
      wrap.innerHTML = `<div class=\"lesson-video-placeholder\"><div class=\"placeholder-icon\">🎥</div><strong>Video is being curated</strong><span>We only show verified sport-specific YouTube videos inside KhelSetu.</span></div>`;
    } else {
      const src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&rel=0`;
      wrap.innerHTML = `<iframe class=\"lesson-video\" src=\"${src}\" title=\"${name} ${levelData.label} training\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen></iframe>`;
    }
    markLessonExplored(`${name}:${level}`);
    $('lessonModal').classList.add('open');
    $('lessonModal').setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
  }

  function closeLesson(){
    $('lessonModal').classList.remove('open');
    $('lessonModal').setAttribute('aria-hidden','true');
    $('lessonVideoWrap').innerHTML = `<div class="lesson-video-placeholder" id="lessonVideoPlaceholder"><div class="placeholder-icon">▶</div><strong>In-app YouTube lesson</strong><span>This level uses its own sport + level video lane inside KhelSetu.</span></div>`;
    document.body.classList.remove('modal-open');
    selectedLesson = null;
  }

  $('sportsLibraryGrid').addEventListener('click',e=>{
    const btn=e.target.closest('.lesson-card');
    if(btn) openLesson(btn.dataset.sport,btn.dataset.level);
  });
  $('lessonClose').addEventListener('click',closeLesson);
  $('lessonModal').addEventListener('click',e=>{ if(e.target.hasAttribute('data-close-modal')) closeLesson(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && selectedLesson) closeLesson(); });
  $('sportsLibrarySearch').addEventListener('input',render);
  $('levelFilter').addEventListener('click',e=>{
    const btn=e.target.closest('.level-filter-btn'); if(!btn) return;
    selectedLevel=btn.dataset.level;
    document.querySelectorAll('.level-filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); render();
  });
  $('sportsLibraryBackBtn').addEventListener('click',()=>window.location.href='athlete-dashboard.html');

  updateStats(); render();
});
