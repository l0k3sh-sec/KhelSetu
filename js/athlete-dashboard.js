import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
<<<<<<< HEAD
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
=======
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
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

let currentAthleteUid = null;
let spiderChartInstance = null;
let trendChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentAthleteUid = user.uid;
      await loadDashboardData(user.uid);
      await loadNotificationBadge(user.uid);
<<<<<<< HEAD
      await loadLeaderboard(user.uid);
=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
    } else {
      window.location.href = "auth-phone.html";
    }
  });

  const btnEditProfile = document.getElementById('btnEditProfile');
  if (btnEditProfile) btnEditProfile.addEventListener('click', () => window.location.href = "auth-onboarding.html");

  const notificationBtn = document.getElementById('notificationBtn');
  if (notificationBtn) notificationBtn.addEventListener('click', () => window.location.href = "notification-panel.html");

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      if (typeof KhelSetu !== 'undefined') KhelSetu.clearSession();
      window.location.href = "../index.html";
    });
  }
<<<<<<< HEAD

  const btnViewFullLeaderboard = document.getElementById('btnViewFullLeaderboard');
  if (btnViewFullLeaderboard) btnViewFullLeaderboard.addEventListener('click', () => window.location.href = "leaderboard.html");
=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
});

async function loadDashboardData(uid) {
  try {
    const docRef = doc(db, "athletes", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const pInfo = data.personalInfo || {};
      const stats = data.physicalStats || {};
      const loc = data.location || {};
      const score = data.talentScore || {};
      const history = data.testHistory || [];
      const ai = data.aiAnalysis || {};

      // 1. BEST SCORE LOGIC
      let bestScore = score.overall || 0;
      if (history.length > 0) {
        const maxHistoryScore = Math.max(...history.map(attempt => attempt.talentScore || 0));
        bestScore = Math.max(bestScore, maxHistoryScore);
      }

      document.getElementById('athleteName').textContent = pInfo.fullName || 'Athlete';
      document.getElementById('athleteAge').textContent = pInfo.ageDisplay || '-';
      document.getElementById('athleteGender').textContent = pInfo.gender || '-';
      document.getElementById('athleteHeight').textContent = stats.heightCm ? `${stats.heightCm} cm` : '-';
      document.getElementById('athleteWeight').textContent = stats.weightKg ? `${stats.weightKg} kg` : '-';
      document.getElementById('athleteBmi').textContent = stats.bmi || '-';
      document.getElementById('athleteLocation').textContent = `${loc.district || '-'}, ${loc.state || '-'}`;
      document.getElementById('talentScoreValue').textContent = bestScore > 0 ? bestScore : '--';
      
      const photoEl = document.getElementById('profilePhoto');
      if (photoEl && pInfo.profilePhotoUrl) photoEl.src = pInfo.profilePhotoUrl;

      // 2. RECENT ATTEMPTS
      const attemptsList = document.getElementById('recentAttemptsList');
      if (attemptsList && history.length > 0) {
        const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
        attemptsList.innerHTML = sortedHistory.map(attempt => `
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

      // 3. AI RECOMMENDATIONS (Fixed Data Mapping)
      const aiList = document.getElementById('aiRecommendationsList');
      if (aiList && ai.sportRecommendations && ai.sportRecommendations.length > 0) {
        // Normalize keys to handle both backend schema and frontend generation formats
        const normalizedRecs = ai.sportRecommendations.map(s => ({
            sportName: s.sport || s.name || 'Unknown',
<<<<<<< HEAD
            scoreVal: s.matchPercent || s.score || 0,
            environment: s.environment || ''
=======
            scoreVal: s.matchPercent || s.score || 0
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
        }));
        const top3 = normalizedRecs.sort((a, b) => b.scoreVal - a.scoreVal).slice(0, 3);
        
        aiList.innerHTML = top3.map(s => `
<<<<<<< HEAD
          <li style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--border);">
            <span>
              <strong>${s.sportName}</strong>
              ${s.environment ? `<span style="margin-left:6px; font-size:10px; font-weight:700; text-transform:uppercase; padding:2px 6px; border-radius:8px; border:1px solid var(--border); color: var(--text-body);">${s.environment}</span>` : ''}
            </span>
=======
          <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border);">
            <strong>${s.sportName}</strong>
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
            <span style="color: var(--primary); font-weight: 600;">${s.scoreVal}% Match</span>
          </li>
        `).join('');
      }

      // 4. SPIDER CHART 
      const radarData = ai.spiderChart || ai.physicalProfile; // Fallback mapping
      if (radarData && Object.keys(radarData).length > 0) {
        const container = document.getElementById('spiderChartContainer');
        if (container && !document.getElementById('spiderChartCanvas')) {
            container.innerHTML = '<canvas id="spiderChartCanvas"></canvas>';
        }
        renderSpiderChart(radarData);
      } else {
        const chartContainer = document.getElementById('spiderChartContainer');
        if (chartContainer) chartContainer.innerHTML = '<div class="placeholder-chart-text">Take a test to generate your performance radar</div>';
      }

      // 5. PERFORMANCE TREND 
      if (history && history.length > 0) {
        const trendContainer = document.getElementById('improvementChartContainer');
        if (trendContainer && !document.getElementById('improvementChartCanvas')) {
            trendContainer.innerHTML = '<canvas id="improvementChartCanvas"></canvas>';
        }
        const chronologicalHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
        const trendLabels = chronologicalHistory.map((_, index) => `Test ${index + 1}`);
        const trendDataPoints = chronologicalHistory.map(attempt => attempt.talentScore || 0);
        renderTrendChart(trendLabels, trendDataPoints);
      } else {
        const trendContainer = document.getElementById('improvementChartContainer');
        if (trendContainer) trendContainer.innerHTML = '<div class="placeholder-chart-text">Awaiting test data...</div>';
      }

    } else {
      window.location.href = "auth-onboarding.html";
    }
  } catch (error) {
    console.error("Error fetching live profile data:", error);
  }
}

// Fixed mapping to handle both Schema keys and test-results keys
function renderSpiderChart(chartData) {
  const ctx = document.getElementById('spiderChartCanvas');
  if (!ctx) return;
  if (spiderChartInstance) spiderChartInstance.destroy();

  spiderChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Explosive', 'Agility', 'Strength', 'Speed', 'Endurance'],
      datasets: [{
        label: 'Physical Profile',
        data: [
          chartData.explosive || chartData.power || 0,
          chartData.agility || chartData.agility || 0,
          chartData.strength || chartData.upper || 0,
          chartData.speed || chartData.speed || 0,
          chartData.endurance || chartData.lower || 0
        ],
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        pointBackgroundColor: 'rgba(52, 152, 219, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { r: { min: 0, max: 100, ticks: { display: false } } },
      plugins: { legend: { display: false } }
    }
  });
}

function renderTrendChart(labels, dataPoints) {
  const ctx = document.getElementById('improvementChartCanvas');
  if (!ctx) return;
  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Talent Score',
        data: dataPoints,
        borderColor: 'rgba(46, 204, 113, 1)',
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        fill: true, tension: 0.3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { min: 0, max: 100 }, x: { grid: { display: false } } },
      plugins: { legend: { display: false } }
    }
  });
}

async function loadNotificationBadge(uid) {
  const badge = document.getElementById('notificationBadgeCount');
  if (!badge) return;
  try {
    const docSnap = await getDoc(doc(db, "athletes", uid));
    if (docSnap.exists() && docSnap.data().contactRequests) {
      const pendingCount = docSnap.data().contactRequests.filter(r => r.status === 'pending').length;
      if (pendingCount > 0) {
        badge.textContent = pendingCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (error) {}
}

<<<<<<< HEAD
// --- LEADERBOARD ---
async function loadLeaderboard(currentUid) {
  const list = document.getElementById('leaderboardList');
  if (!list) return;

  try {
    const querySnapshot = await getDocs(collection(db, "athletes"));
    const athletes = [];

    querySnapshot.forEach((docSnap) => {
      const athlete = { id: docSnap.id, ...docSnap.data() };

      // Same "best score" logic used across the app: highest of current + history
      let bestScore = athlete.talentScore?.overall || 0;
      if (athlete.testHistory && athlete.testHistory.length > 0) {
        const maxHistoryScore = Math.max(...athlete.testHistory.map(a => a.talentScore || 0));
        bestScore = Math.max(bestScore, maxHistoryScore);
      }

      athletes.push({
        id: athlete.id,
        name: athlete.personalInfo?.fullName || 'Athlete',
        sport: athlete.athleticProfile?.sportCategory || '',
        state: athlete.location?.state || '',
        photo: athlete.personalInfo?.profilePhotoUrl || '',
        score: bestScore
      });
    });

    athletes.sort((a, b) => b.score - a.score);

    if (athletes.length === 0) {
      list.innerHTML = '<li style="color: var(--text-body); font-size: 14px; text-align: center; padding: 16px 0;">No athletes on the leaderboard yet.</li>';
      return;
    }

    // Athlete's own rank within the full leaderboard (1-based)
    const myIndex = athletes.findIndex(a => a.id === currentUid);
    const myRank = myIndex >= 0 ? myIndex + 1 : null;

    const rankChip = document.getElementById('myRankChip');
    if (rankChip) rankChip.textContent = myRank ? `Rank #${myRank}` : 'Unranked';

    const profileRankBadge = document.getElementById('profileRankBadge');
    if (profileRankBadge) {
      if (myRank) {
        profileRankBadge.textContent = `\u{1F3C6} Rank #${myRank} of ${athletes.length}`;
        profileRankBadge.style.display = 'inline-block';
      } else {
        profileRankBadge.style.display = 'none';
      }
    }

    // Dashboard only shows the top 3; the full list lives on its own page.
    const topAthletes = athletes.slice(0, 3);

    list.innerHTML = topAthletes.map((athlete, index) => {
      const rank = index + 1;
      const isCurrentUser = athlete.id === currentUid;
      const initials = athlete.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const rankClass = rank <= 3 ? `top-${rank}` : '';
      const meta = [athlete.sport, athlete.state].filter(Boolean).join(' • ') || '--';

      const avatarInner = athlete.photo
        ? `<img src="${athlete.photo}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
        : initials;

      return `
        <li class="leaderboard-row${isCurrentUser ? ' is-current-user' : ''}">
          <span class="leaderboard-rank ${rankClass}">${rank}</span>
          <span class="leaderboard-avatar">${avatarInner}</span>
          <span class="leaderboard-info">
            <span class="leaderboard-name">${athlete.name}${isCurrentUser ? ' (You)' : ''}</span>
            <span class="leaderboard-meta">${meta}</span>
          </span>
          <span class="leaderboard-score">${athlete.score}</span>
          <button class="leaderboard-view-btn" onclick="window.viewAthleteDetail('${athlete.id}')">View Profile</button>
        </li>
      `;
    }).join('');
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    list.innerHTML = '<li style="color: var(--danger); font-size: 14px; text-align: center; padding: 16px 0;">Failed to load leaderboard.</li>';
  }
}

window.viewAthleteDetail = function(athleteId) {
  if (typeof KhelSetu !== 'undefined') {
    KhelSetu.saveSession({ viewingAthleteId: athleteId });
  } else {
    localStorage.setItem('khelsetu_viewing_athlete', athleteId);
  }
  window.location.href = 'scout-athlete-detail.html';
};

=======
>>>>>>> e9199e180df81b64a67cf8fe8546304c2c846031
window.exportProfileCard = function() { window.print(); };
window.startTest = function(testId) {
  if (typeof KhelSetu !== 'undefined') KhelSetu.saveSession({ currentTest: testId });
  window.location.href = "test-prepare.html";
};