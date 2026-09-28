import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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
let shortlistedAthletes = [];

document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('btnBackToDashboard');
  if (backBtn) {
    backBtn.addEventListener('click', () => window.location.href = 'scout-dashboard.html');
  }

  document.getElementById('btnClearAllShortlist')?.addEventListener('click', clearShortlist);

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentScoutUid = user.uid;
      await loadShortlist();
    } else {
      window.location.href = "scout-login.html";
    }
  });
});

async function loadShortlist() {
  try {
    const grid = document.getElementById('shortlistGrid');
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Loading shortlist...</p>';

    const scoutRef = doc(db, "scouts", currentScoutUid);
    const scoutSnap = await getDoc(scoutRef);
    
    if (scoutSnap.exists()) {
      const athleteIds = scoutSnap.data().shortlist || [];
      
      if (athleteIds.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-body);">Your shortlist is empty.</p>';
        document.getElementById('shortlistCount').textContent = '(0 athletes)';
        return;
      }

      document.getElementById('shortlistCount').textContent = `(${athleteIds.length} athletes)`;
      
      // Fetch all shortlisted athlete documents
      const athletePromises = athleteIds.map(id => getDoc(doc(db, "athletes", id)));
      const athleteSnaps = await Promise.all(athletePromises);
      
      shortlistedAthletes = athleteSnaps.map(snap => ({ id: snap.id, ...snap.data() }));
      renderShortlist();
    }
  } catch (error) {
    console.error("Error loading shortlist:", error);
  }
}

function renderShortlist() {
  const grid = document.getElementById('shortlistGrid');
  grid.innerHTML = '';

  shortlistedAthletes.forEach(athlete => {
    const pInfo = athlete.personalInfo || {};
    const loc = athlete.location || {};
    const score = athlete.talentScore || { overall: 0 };
    const requests = athlete.contactRequests || [];

    const fullName = pInfo.fullName || "Unknown Athlete";
    const age = pInfo.ageDisplay || "N/A";
    const state = loc.state || "Unknown";
    const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // SMART CONTACT LOGIC: Check if this scout has requested contact, and if it's approved
    let contactUI = '';
    const myRequest = requests.find(r => r.scoutUid === currentScoutUid);

    if (myRequest && myRequest.status === 'approved') {
      const phone = athlete.metadata?.phone || "No phone listed";
      const email = athlete.metadata?.email || "No email listed";
      
      contactUI = `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border);">
          <span style="display: inline-block; background: #CCFBF1; color: var(--accent-teal); font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; margin-bottom: 8px;">✓ CONTACT APPROVED</span>
          <div style="font-size: 13px; color: var(--text-heading); font-weight: 600;">📞 ${phone}</div>
          <div style="font-size: 13px; color: var(--text-heading); font-weight: 600; margin-top: 4px;">✉️ ${email}</div>
        </div>
      `;
    } else if (myRequest && myRequest.status === 'pending') {
      contactUI = `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border);">
          <span style="display: inline-block; background: #FEF3C7; color: #D97706; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px;">⏳ PENDING ATHLETE APPROVAL</span>
        </div>
      `;
    } else {
      contactUI = `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border);">
          <button class="scout-shortlist-btn-secondary btn-req-contact" data-id="${athlete.id}" style="width: 100%; padding: 8px 12px; font-size: 12px;">Request Contact Info</button>
        </div>
      `;
    }

    const cardHTML = `
      <article class="scout-shortlist-card" style="display: flex; flex-direction: column;">
        <div class="scout-shortlist-card-content" style="cursor: pointer;" onclick="window.location.href='scout-athlete-detail.html'" onmousedown="localStorage.setItem('khelsetu_viewing_athlete', '${athlete.id}')">
          <div class="scout-shortlist-avatar">${initials}</div>
          <div class="scout-shortlist-meta">
            <h3 class="scout-shortlist-name">${fullName}</h3>
            <p class="scout-shortlist-detail">${age} • ${state}</p>
          </div>
          <div class="scout-shortlist-score">${score.overall}</div>
        </div>
        ${contactUI}
      </article>
    `;
    grid.insertAdjacentHTML('beforeend', cardHTML);
  });

  // Attach dynamic listeners for the "Request Contact Info" button directly from the shortlist
  document.querySelectorAll('.btn-req-contact').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const athleteId = e.target.dataset.id;
      e.target.disabled = true;
      e.target.textContent = "Sending...";
      
      try {
        const scoutSnap = await getDoc(doc(db, "scouts", currentScoutUid));
        const scoutOrg = scoutSnap.exists() ? scoutSnap.data().organization : "A Verified Scout";

        await updateDoc(doc(db, "athletes", athleteId), {
          contactRequests: arrayUnion({
            scoutUid: currentScoutUid,
            scoutOrg: scoutOrg,
            status: "pending",
            timestamp: new Date().toISOString()
          })
        });
        
        // Reload to instantly show the "⏳ PENDING" state
        await loadShortlist();
      } catch (error) {
        console.error("Failed to request contact:", error);
        e.target.disabled = false;
        e.target.textContent = "Request Contact Info";
      }
    });
  });
}

async function clearShortlist() {
  if (!confirm("Are you sure you want to clear your entire shortlist?")) return;
  
  try {
    await updateDoc(doc(db, "scouts", currentScoutUid), {
      shortlist: []
    });
    shortlistedAthletes = [];
    renderShortlist();
    document.getElementById('shortlistCount').textContent = '(0 athletes)';
  } catch (error) {
    console.error("Failed to clear shortlist:", error);
  }
}