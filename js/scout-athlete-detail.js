import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
<<<<<<< HEAD
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
=======
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031

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

let currentScoutUid = null;
let currentAthleteId = null;
let athleteData = null; 
let scoutData = null;
let spiderChartInstance = null; 

<<<<<<< HEAD
// This page is shared by two viewers: a scout browsing candidates, and an
// athlete browsing the leaderboard. Session role decides which actions/labels show.
const viewerSession = (typeof KhelSetu !== 'undefined') ? KhelSetu.getSession() : null;
const viewerRole = viewerSession?.role === 'athlete' ? 'athlete' : 'scout';
const dashboardPage = viewerRole === 'athlete' ? 'athlete-dashboard.html' : 'scout-dashboard.html';

=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
document.addEventListener('DOMContentLoaded', () => {
  currentAthleteId = localStorage.getItem('khelsetu_viewing_athlete');
  if (typeof KhelSetu !== 'undefined' && KhelSetu.getSession()?.viewingAthleteId) {
    currentAthleteId = KhelSetu.getSession().viewingAthleteId;
  }

<<<<<<< HEAD
  const titleLabel = document.getElementById('detailTitleLabel');
  if (titleLabel) titleLabel.textContent = viewerRole === 'athlete' ? 'Athlete Profile: ' : 'Athlete Dossier: ';

  if (viewerRole === 'athlete') {
    // Shortlisting/contact/flag are scout tools — an athlete viewing a peer's
    // profile from the leaderboard only needs to look and optionally export.
    ['btnAddToShortlist', 'btnRequestContact', 'btnFlagReview'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  const backBtn = document.getElementById('btnBackToDashboard');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = dashboardPage;
=======
  const backBtn = document.getElementById('btnBackToDashboard');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'scout-dashboard.html';
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (user && currentAthleteId) {
      currentScoutUid = user.uid;
      await fetchInitialData();
      populateUI(athleteData);
      setupActionButtons();
<<<<<<< HEAD
      loadAthleteRank();
    } else {
      console.warn("[KhelSetu] Missing Auth or Athlete ID. Routing back.");
      window.location.href = dashboardPage;
=======
    } else {
      console.warn("[KhelSetu] Missing Auth or Athlete ID. Routing back.");
      window.location.href = "scout-dashboard.html";
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
    }
  });
});

async function fetchInitialData() {
  try {
<<<<<<< HEAD
    const athletePromise = getDoc(doc(db, "athletes", currentAthleteId));
    // Scout-profile lookups (for shortlist/contact state) only matter for scout viewers.
    const scoutPromise = viewerRole === 'scout' ? getDoc(doc(db, "scouts", currentScoutUid)) : Promise.resolve(null);

    const [athleteSnap, scoutSnap] = await Promise.all([athletePromise, scoutPromise]);

    if (athleteSnap.exists()) athleteData = athleteSnap.data();
    if (scoutSnap && scoutSnap.exists()) scoutData = scoutSnap.data();
=======
    const [athleteSnap, scoutSnap] = await Promise.all([
      getDoc(doc(db, "athletes", currentAthleteId)),
      getDoc(doc(db, "scouts", currentScoutUid))
    ]);

    if (athleteSnap.exists()) athleteData = athleteSnap.data();
    if (scoutSnap.exists()) scoutData = scoutSnap.data();
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function populateUI(athlete) {
  if (!athlete) {
    document.getElementById('headerAthleteName').textContent = "Athlete Not Found";
    return;
  }

  const pInfo = athlete.personalInfo || {};
  const stats = athlete.physicalStats || {};
  const loc = athlete.location || {};
<<<<<<< HEAD
=======
  const profile = athlete.athleticProfile || {};
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
  const score = athlete.talentScore || {};
  const ai = athlete.aiAnalysis || {};
  const history = athlete.testHistory || [];

  // Best Score Logic mapped from Athlete Profile
  let bestScore = score.overall || 0;
  if (history.length > 0) {
    const maxHistoryScore = Math.max(...history.map(attempt => attempt.talentScore || 0));
    bestScore = Math.max(bestScore, maxHistoryScore);
  }

  document.getElementById('headerAthleteName').textContent = pInfo.fullName || "Unknown";
  document.getElementById('dossierScoreBadge').textContent = bestScore > 0 ? bestScore : "--";
  
  const photoEl = document.getElementById('dossierProfilePhoto');
  if (pInfo.profilePhotoUrl) {
    photoEl.src = pInfo.profilePhotoUrl;
    photoEl.style.opacity = '1';
  }

  document.getElementById('dtlName').textContent = pInfo.fullName || "--";
<<<<<<< HEAD
  const dobFormatted = pInfo.dateOfBirth ? KhelSetu.formatDateIN(pInfo.dateOfBirth) : "--";
  document.getElementById('dtlAgeDob').textContent = `${pInfo.ageDisplay || "--"} (${dobFormatted})`;
=======
  document.getElementById('dtlAgeDob').textContent = `${pInfo.ageDisplay || "--"} (${pInfo.dateOfBirth || "--"})`;
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
  document.getElementById('dtlGender').textContent = pInfo.gender || "--";
  document.getElementById('dtlLocation').textContent = `${loc.district || "--"}, ${loc.state || "--"}`;
  document.getElementById('dtlHeight').textContent = stats.heightCm ? `${stats.heightCm} cm` : "--";
  document.getElementById('dtlWeight').textContent = stats.weightKg ? `${stats.weightKg} kg` : "--";
<<<<<<< HEAD
  // Sports aren't manually picked — show the athlete's top AI-recommended sport instead
  const topSport = (ai.sportRecommendations && ai.sportRecommendations.length > 0)
    ? [...ai.sportRecommendations].sort((a, b) => b.matchPercent - a.matchPercent)[0].sport
    : "--";
  document.getElementById('dtlSport').textContent = topSport;
=======
  document.getElementById('dtlSport').textContent = profile.sportCategory || "--";
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031

  if (ai.analysisText) {
    document.getElementById('dossierAiAnalysisText').textContent = ai.analysisText;
  }

  // 1. SPIDER CHART 
  if (ai.spiderChart && Object.keys(ai.spiderChart).length > 0) {
    const container = document.getElementById('dossierSpiderChart');
    if (container && !document.getElementById('spiderChartCanvas')) {
        container.innerHTML = '<canvas id="spiderChartCanvas"></canvas>';
    }
    renderSpiderChart(ai.spiderChart);
  }

  // 2. TEST RESULTS TABLE (Mapped from AI Analysis metrics)
  const resultsTable = document.getElementById('dossierTestResultsTableBody');
  if (resultsTable) {
    let rows = '';
    if (ai.verticalJump) {
        rows += `<tr><td>Vertical Jump</td><td>${ai.verticalJump.maxHeightCm} cm</td><td>${ai.verticalJump.percentile || '--'}th</td></tr>`;
    }
    if (ai.situps) {
        rows += `<tr><td>Sit-ups</td><td>${ai.situps.reps} reps</td><td>${ai.situps.percentile || '--'}th</td></tr>`;
    }
    if (ai.agilityTTest) {
        rows += `<tr><td>Agility T-Test</td><td>${ai.agilityTTest.timeSeconds} sec</td><td>${ai.agilityTTest.percentile || '--'}th</td></tr>`;
    }
    if (rows !== '') {
        resultsTable.innerHTML = rows;
    }
  }

  // 3. AI RECOMMENDED GAMES
  const gamesContainer = document.getElementById('dossierGamesSuggestion');
  if (gamesContainer && ai.sportRecommendations && ai.sportRecommendations.length > 0) {
    const top3 = [...ai.sportRecommendations].sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 3);
    gamesContainer.innerHTML = top3.map(s => `
      <div style="background: var(--bg-secondary); padding: 10px; border-radius: 8px; text-align: center; border: 1px solid var(--border);">
        <strong style="display: block; margin-bottom: 4px; font-size: 14px;">${s.sport}</strong>
<<<<<<< HEAD
        ${s.environment ? `<span style="display:inline-block; margin-bottom:4px; font-size:10px; font-weight:700; text-transform:uppercase; padding:2px 6px; border-radius:8px; border:1px solid var(--border); color: var(--text-body);">${s.environment}</span><br>` : ''}
=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
        <span style="color: var(--primary); font-weight: 700; font-size: 13px;">${s.matchPercent}% Match</span>
      </div>
    `).join('');
  } else if (gamesContainer) {
    gamesContainer.innerHTML = '<p style="color: var(--text-body); grid-column: 1 / -1; text-align: center; font-size: 14px;">No AI game recommendations yet.</p>';
  }

  // 4. RECENT ATTEMPTS
  const historyList = document.getElementById('dossierPreviousTests');
  if (historyList && history.length > 0) {
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    historyList.innerHTML = sortedHistory.map(attempt => `
      <li style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border);">
<<<<<<< HEAD
        <span style="font-weight: 500;">${attempt.date ? KhelSetu.formatDateIN(attempt.date) : 'Recent'}</span>
=======
        <span style="font-weight: 500;">${attempt.date || 'Recent'}</span>
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
        <strong>Score: ${attempt.talentScore}</strong>
        <span style="font-size: 12px; padding: 2px 8px; border-radius: 12px; background: var(--bg-secondary); text-transform: capitalize;">${attempt.status || 'completed'}</span>
      </li>
    `).join('');
  }
}

<<<<<<< HEAD
// Leaderboard rank for this athlete — same "best score" ranking logic used
// on the athlete dashboard / leaderboard page.
async function loadAthleteRank() {
  const rankBadge = document.getElementById('dossierRankBadge');
  if (!rankBadge || !currentAthleteId) return;

  try {
    const querySnapshot = await getDocs(collection(db, "athletes"));
    const athletes = [];

    querySnapshot.forEach((docSnap) => {
      const a = docSnap.data();
      let bestScore = a.talentScore?.overall || 0;
      if (a.testHistory && a.testHistory.length > 0) {
        const maxHistoryScore = Math.max(...a.testHistory.map(t => t.talentScore || 0));
        bestScore = Math.max(bestScore, maxHistoryScore);
      }
      athletes.push({ id: docSnap.id, score: bestScore });
    });

    athletes.sort((a, b) => b.score - a.score);

    const myIndex = athletes.findIndex(a => a.id === currentAthleteId);
    const rank = myIndex >= 0 ? myIndex + 1 : null;

    if (rank) {
      rankBadge.textContent = `\u{1F3C6} Rank #${rank} of ${athletes.length}`;
      rankBadge.style.display = 'inline-block';
    } else {
      rankBadge.style.display = 'none';
    }
  } catch (error) {
    console.error("Failed to load athlete rank:", error);
  }
}

=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
function renderSpiderChart(chartData) {
  const ctx = document.getElementById('spiderChartCanvas');
  if (!ctx) return;

  if (spiderChartInstance) {
    spiderChartInstance.destroy();
  }

  spiderChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Explosive', 'Agility', 'Strength', 'Speed', 'Endurance'],
      datasets: [{
        label: 'Physical Profile',
        data: [
          chartData.explosive || 0,
          chartData.agility || 0,
          chartData.strength || 0,
          chartData.speed || 0,
          chartData.endurance || 0
        ],
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        pointBackgroundColor: 'rgba(52, 152, 219, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(52, 152, 219, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20, display: false }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function setupActionButtons() {
<<<<<<< HEAD
  const btnPdf = document.getElementById('btnExportPdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => window.print());
  }

  // Shortlist/contact are scout-only actions; already hidden for athletes, skip wiring too.
  if (viewerRole !== 'scout') return;

=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
  const btnAdd = document.getElementById('btnAddToShortlist');
  const btnContact = document.getElementById('btnRequestContact');

  const shortlist = scoutData?.shortlist || [];
  if (shortlist.includes(currentAthleteId)) {
    setShortlistButtonAdded(btnAdd);
  }

  const requests = athleteData?.contactRequests || [];
  const existingReq = requests.find(r => r.scoutUid === currentScoutUid);
  if (existingReq) {
    setContactButtonState(btnContact, existingReq.status);
  }

  if (btnAdd && !shortlist.includes(currentAthleteId)) {
    btnAdd.addEventListener('click', async () => {
      btnAdd.disabled = true;
      btnAdd.textContent = "Adding...";
      try {
        await updateDoc(doc(db, "scouts", currentScoutUid), {
          shortlist: arrayUnion(currentAthleteId)
        });
        setShortlistButtonAdded(btnAdd);
        shortlist.push(currentAthleteId); 
      } catch (error) {
        console.error("Failed to shortlist:", error);
        btnAdd.disabled = false;
        btnAdd.textContent = "Add to Shortlist";
      }
    });
  }

  if (btnContact && !existingReq) {
    btnContact.addEventListener('click', async () => {
      btnContact.disabled = true;
      btnContact.textContent = "Sending...";
      try {
        const scoutOrg = scoutData?.organization || "A Verified Scout";

        await updateDoc(doc(db, "athletes", currentAthleteId), {
          contactRequests: arrayUnion({
            scoutUid: currentScoutUid,
            scoutOrg: scoutOrg,
            status: "pending",
            timestamp: new Date().toISOString()
          })
        });

        if (!shortlist.includes(currentAthleteId)) {
          await updateDoc(doc(db, "scouts", currentScoutUid), {
            shortlist: arrayUnion(currentAthleteId)
          });
          setShortlistButtonAdded(btnAdd);
        }

        setContactButtonState(btnContact, "pending");
      } catch (error) {
        console.error("Failed to request contact:", error);
        btnContact.disabled = false;
        btnContact.textContent = "Request Contact";
      }
    });
  }
<<<<<<< HEAD
=======

  const btnPdf = document.getElementById('btnExportPdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      window.print();
    });
  }
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
}

function setShortlistButtonAdded(btn) {
  if (!btn) return;
  btn.textContent = 'Added to Shortlist';
  btn.style.backgroundColor = 'var(--accent-teal)';
  btn.style.borderColor = 'var(--accent-teal)';
  btn.style.color = '#fff';
  btn.disabled = true;
}

function setContactButtonState(btn, status) {
  if (!btn) return;
  btn.disabled = true;
  
  if (status === 'approved') {
    btn.textContent = 'Contact Approved ✓';
    btn.style.backgroundColor = 'var(--accent-teal)';
    btn.style.borderColor = 'var(--accent-teal)';
    btn.style.color = '#fff';
  } else if (status === 'pending') {
    btn.textContent = 'Request Pending ⏳';
    btn.style.backgroundColor = 'var(--bg-main)';
    btn.style.color = 'var(--text-body)';
    btn.style.border = '1px solid var(--border)';
  } else if (status === 'denied') {
    btn.textContent = 'Request Denied ❌';
    btn.style.backgroundColor = 'var(--danger-bg)';
    btn.style.color = 'var(--danger)';
    btn.style.border = '1px solid var(--danger)';
  }
}