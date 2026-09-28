import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { INDIA_STATES_DISTRICTS, INDIA_STATES } from "./india-states-districts.js";

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

let athletesData = []; 

document.addEventListener('DOMContentLoaded', () => {
  initFilterLocationDropdowns();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("[KhelSetu] Scout authenticated:", user.uid);
      await fetchAthletes();
    } else {
      window.location.href = "scout-login.html";
    }
  });

  const navLinks = document.querySelectorAll('.scout-nav-link');
  navLinks.forEach(link => {
    if (link.textContent.trim() === 'Logout') {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut(auth);
        if (typeof KhelSetu !== 'undefined') KhelSetu.clearSession();
        window.location.href = "../index.html";
      });
    }
  });

  // Attach Filter Listeners
  document.getElementById('scoutSearchInput')?.addEventListener('input', applyFilters);
  document.getElementById('btnApplyFilters')?.addEventListener('click', applyFilters);
  
  const sportChips = document.querySelectorAll('.scout-chip');
  sportChips.forEach(chip => {
    chip.addEventListener('click', function() {
      this.classList.toggle('active');
    });
  });

  document.getElementById('btnResetFilters')?.addEventListener('click', resetFilters);
});

// --- DYNAMIC STATE/DISTRICT DROPDOWNS ---
function initFilterLocationDropdowns() {
  const stateSelect = document.getElementById('filterState');
  const districtSelect = document.getElementById('filterDistrict');
  if (!stateSelect || !districtSelect) return;

  stateSelect.innerHTML = '<option value="">All States</option>' + INDIA_STATES.map(s => `<option value="${s}">${s}</option>`).join('');

  stateSelect.addEventListener('change', () => {
    const selectedState = stateSelect.value;
    const districts = INDIA_STATES_DISTRICTS[selectedState] || [];
    districtSelect.innerHTML = '<option value="">All Districts</option>' + districts.map(d => `<option value="${d}">${d}</option>`).join('');
  });
}

// --- FIREBASE FETCHING ---
async function fetchAthletes() {
  try {
    const grid = document.getElementById('athleteResultsGrid');
    if (grid) grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Loading athletes...</p>';

    const querySnapshot = await getDocs(collection(db, "athletes"));
    athletesData = [];
    
    querySnapshot.forEach((doc) => {
      let athlete = { id: doc.id, ...doc.data() };
      
      // BEST SCORE LOGIC: Normalize the best score across history immediately upon fetch
      // This ensures both the UI cards and the filtering sliders respect the highest attempt
      let bestScore = athlete.talentScore?.overall || 0;
      if (athlete.testHistory && athlete.testHistory.length > 0) {
        const maxHistoryScore = Math.max(...athlete.testHistory.map(a => a.talentScore || 0));
        bestScore = Math.max(bestScore, maxHistoryScore);
      }
      
      if (!athlete.talentScore) athlete.talentScore = {};
      athlete.talentScore.overall = bestScore;

      athletesData.push(athlete);
    });

    renderAthletes(athletesData);
  } catch (error) {
    console.error("Error fetching athletes:", error);
    const grid = document.getElementById('athleteResultsGrid');
    if (grid) grid.innerHTML = '<p style="grid-column: 1/-1; color: red;">Failed to load data.</p>';
  }
}

// --- FILTER LOGIC WITH ANTI-NEGATIVE GUARDS ---
function applyFilters() {
  const searchTerm = (document.getElementById('scoutSearchInput')?.value || "").toLowerCase();
  const selectedState = document.getElementById('filterState')?.value || "";
  const selectedDistrict = document.getElementById('filterDistrict')?.value || "";
  
  const maleChecked = document.querySelector('#filterGender input[type="checkbox"]:nth-of-type(1)')?.checked ?? true;
  const femaleChecked = document.querySelector('#filterGender input[type="checkbox"]:nth-of-type(2)')?.checked ?? true;

  // Use Math.max(0, value) to prevent negative inputs
  const ageInputs = document.querySelectorAll('#filterAgeRange input');
  const minAge = Math.max(0, parseInt(ageInputs[0]?.value) || 0);
  const maxAge = Math.max(0, parseInt(ageInputs[1]?.value) || 100);

  const heightInputs = document.querySelectorAll('#filterHeightRange input');
  const minHeight = Math.max(0, parseFloat(heightInputs[0]?.value) || 0);
  const maxHeight = Math.max(0, parseFloat(heightInputs[1]?.value) || 300);

  const weightInputs = document.querySelectorAll('#filterWeightRange input');
  const minWeight = Math.max(0, parseFloat(weightInputs[0]?.value) || 0);
  const maxWeight = Math.max(0, parseFloat(weightInputs[1]?.value) || 300);

  const scoreInputs = document.querySelectorAll('#filterTalentScore input');
  const minScore = Math.max(0, parseInt(scoreInputs[0]?.value) || 0);
  const maxScore = Math.max(0, parseInt(scoreInputs[1]?.value) || 100);

  const activeChips = Array.from(document.querySelectorAll('.scout-chip.active')).map(c => c.textContent.trim());

  const filtered = athletesData.filter(athlete => {
    const pInfo = athlete.personalInfo || {};
    const stats = athlete.physicalStats || {};
    const loc = athlete.location || {};
<<<<<<< HEAD
    const score = athlete.talentScore || { overall: 0 };
    const ai = athlete.aiAnalysis || {};
=======
    const profile = athlete.athleticProfile || {};
    const score = athlete.talentScore || { overall: 0 };
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031

    const name = (pInfo.fullName || "").toLowerCase();
    const gender = pInfo.gender || "Male";
    const state = loc.state || "";
    const district = loc.district || "";
<<<<<<< HEAD
    // Athletes don't have a single manual "sportCategory" — sports are AI-recommended
    // per athlete from their test results (aiAnalysis.sportRecommendations).
    const recommendedSports = (ai.sportRecommendations || []).map(s => s.sport);
=======
    const sport = profile.sportCategory || "";
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
    
    const ageNum = parseInt(pInfo.ageDisplay) || 0;
    const heightNum = stats.heightCm || 0;
    const weightNum = stats.weightKg || 0;
    const overallScore = score.overall || 0;

    // Search condition
    if (searchTerm && !name.includes(searchTerm)) return false;

    // Location condition
    if (selectedState && state !== selectedState) return false;
    if (selectedDistrict && district !== selectedDistrict) return false;

    // Gender condition
    if (gender === 'Male' && !maleChecked) return false;
    if (gender === 'Female' && !femaleChecked) return false;

    // Range conditions
    if (ageNum > 0 && (ageNum < minAge || ageNum > maxAge)) return false;
    if (heightNum > 0 && (heightNum < minHeight || heightNum > maxHeight)) return false;
    if (weightNum > 0 && (weightNum < minWeight || weightNum > maxWeight)) return false;
    if (overallScore < minScore || overallScore > maxScore) return false;

<<<<<<< HEAD
    // Sport condition — match if ANY of the athlete's AI-recommended sports is an active chip
    if (activeChips.length > 0 && !activeChips.some(chip => recommendedSports.includes(chip))) return false;
=======
    // Sport condition
    if (activeChips.length > 0 && !activeChips.includes(sport)) return false;
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031

    return true;
  });

  renderAthletes(filtered);
}

function resetFilters() {
  document.getElementById('scoutSearchInput').value = '';
  document.getElementById('filterState').value = '';
  document.getElementById('filterDistrict').innerHTML = '<option value="">All Districts</option>';
  
  const ageInputs = document.querySelectorAll('#filterAgeRange input');
  if(ageInputs.length) { ageInputs[0].value = 14; ageInputs[1].value = 25; }

  const heightInputs = document.querySelectorAll('#filterHeightRange input');
  if(heightInputs.length) { heightInputs[0].value = 150; heightInputs[1].value = 200; }

  const weightInputs = document.querySelectorAll('#filterWeightRange input');
  if(weightInputs.length) { weightInputs[0].value = 45; weightInputs[1].value = 90; }

  const scoreInputs = document.querySelectorAll('#filterTalentScore input');
  if(scoreInputs.length) { scoreInputs[0].value = 70; scoreInputs[1].value = 100; }

  const genderBoxes = document.querySelectorAll('#filterGender input[type="checkbox"]');
  if(genderBoxes.length > 0) genderBoxes[0].checked = true;
  if(genderBoxes.length > 1) genderBoxes[1].checked = false;

  document.querySelectorAll('.scout-chip').forEach(c => c.classList.remove('active'));

  renderAthletes(athletesData);
}

// --- DYNAMIC RENDERING ---
function renderAthletes(athletes) {
  const grid = document.getElementById('athleteResultsGrid');
  const title = document.querySelector('.scout-results-title');
  if (!grid) return;

  grid.innerHTML = ''; 
  
  if (title) {
    title.textContent = `${athletes.length} Athlete${athletes.length !== 1 ? 's' : ''} Found`;
  }

  if (athletes.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-body); padding: 40px;">No athletes match your filters.</p>';
    return;
  }

  athletes.forEach(athlete => {
    const pInfo = athlete.personalInfo || {};
    const stats = athlete.physicalStats || {};
    const loc = athlete.location || {};
    const score = athlete.talentScore || { overall: 0 };

    const fullName = pInfo.fullName || "Unknown Athlete";
    const age = pInfo.ageDisplay || "N/A";
    const state = loc.state || "Unknown";
    const height = stats.heightCm ? `${stats.heightCm}cm` : "-";
    const weight = stats.weightKg ? `${stats.weightKg}kg` : "-";
    
    const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const cardHTML = `
      <article class="scout-athlete-card">
        <div class="scout-card-header">
          <div class="scout-card-avatar">${initials}</div>
          <div class="scout-card-meta">
            <h3>${fullName}</h3>
            <p>${age} • ${state}</p>
          </div>
          <div class="scout-score-badge">${score.overall}</div>
        </div>
        <div class="scout-card-body">
          <p><strong>Height:</strong> ${height} | <strong>Weight:</strong> ${weight}</p>
          <span class="scout-status-tag">● Verified</span>
        </div>
        <div class="scout-card-footer">
          <button class="scout-btn-secondary view-profile-btn" onclick="window.viewAthleteDetail('${athlete.id}')">
            View Profile
          </button>
        </div>
      </article>
    `;
    
    grid.insertAdjacentHTML('beforeend', cardHTML);
  });
}

// --- GLOBAL ROUTING EXPORT ---
window.viewAthleteDetail = function(athleteId) {
  if (typeof KhelSetu !== 'undefined') {
    KhelSetu.saveSession({ viewingAthleteId: athleteId });
  } else {
    localStorage.setItem('khelsetu_viewing_athlete', athleteId);
  }
  window.location.href = 'scout-athlete-detail.html';
};