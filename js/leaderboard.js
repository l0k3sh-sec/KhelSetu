import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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
  const backBtn = document.getElementById('btnBack');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'athlete-dashboard.html';
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await loadFullLeaderboard(user.uid);
    } else {
      window.location.href = "auth-phone.html";
    }
  });
});

// Same "best score" + ranking logic used on the athlete dashboard, just
// rendered in full here instead of being truncated to the top 3.
async function loadFullLeaderboard(currentUid) {
  const list = document.getElementById('leaderboardFullList');
  if (!list) return;

  try {
    const querySnapshot = await getDocs(collection(db, "athletes"));
    const athletes = [];

    querySnapshot.forEach((docSnap) => {
      const athlete = { id: docSnap.id, ...docSnap.data() };

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

    const myIndex = athletes.findIndex(a => a.id === currentUid);
    renderMyRankCard(athletes, myIndex);

    list.innerHTML = athletes.map((athlete, index) => {
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

function renderMyRankCard(athletes, myIndex) {
  const card = document.getElementById('myRankCard');
  if (!card || myIndex < 0) return;

  const me = athletes[myIndex];
  const rank = myIndex + 1;
  const initials = me.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const avatarEl = document.getElementById('myRankAvatar');
  if (avatarEl) {
    avatarEl.innerHTML = me.photo
      ? `<img src="${me.photo}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
      : initials;
  }

  const nameEl = document.getElementById('myRankName');
  if (nameEl) nameEl.textContent = `${me.name} (You)`;

  const positionEl = document.getElementById('myRankPosition');
  if (positionEl) positionEl.textContent = `#${rank}`;

  const scoreEl = document.getElementById('myRankScore');
  if (scoreEl) scoreEl.textContent = `${me.score} pts`;

  card.style.display = 'flex';
}

// Reused by the "View Profile" buttons — same behavior as the dashboard's
// leaderboard, so scout-athlete-detail.html keeps working exactly as before.
window.viewAthleteDetail = function(athleteId) {
  if (typeof KhelSetu !== 'undefined') {
    KhelSetu.saveSession({ viewingAthleteId: athleteId });
  } else {
    localStorage.setItem('khelsetu_viewing_athlete', athleteId);
  }
  window.location.href = 'scout-athlete-detail.html';
};
