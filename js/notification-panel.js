import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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
let requestsData = [];

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. GUARANTEE THE BACK BUTTON WORKS INSTANTLY
  const backBtn = document.getElementById('btnBack');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'athlete-dashboard.html';
    });
  }

  // 2. SHOW INITIAL LOADING STATE
  const list = document.getElementById('contactRequestsList');
  if (list) {
    list.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-body);">Checking for notifications...</p>';
  }

  // 3. AUTHENTICATE AND FETCH DATA
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentAthleteUid = user.uid;
      await loadNotifications();
    } else {
      window.location.href = "auth-phone.html";
    }
  });
});

// --- FIREBASE FETCHING ---
async function loadNotifications() {
  const list = document.getElementById('contactRequestsList');
  if (!list) return;

  try {
    const docRef = doc(db, "athletes", currentAthleteUid);
    const docSnap = await getDoc(docRef);

    // Bulletproof check: Does the profile exist? Does the array exist?
    if (docSnap.exists() && docSnap.data().contactRequests) {
      requestsData = docSnap.data().contactRequests;
    } else {
      requestsData = []; // Default to empty if missing
    }
    
    renderNotifications();

  } catch (error) {
    console.error("Error loading notifications:", error);
    list.innerHTML = '<p style="text-align: center; color: var(--danger); padding: 40px;">Failed to load notifications. Please check your connection.</p>';
  }
}

// --- DYNAMIC RENDERING ---
function renderNotifications() {
  const list = document.getElementById('contactRequestsList');
  if (!list) return;

  list.innerHTML = '';

  // Filter out 'denied' requests so they disappear from the UI
  const visibleRequests = requestsData.filter(r => r.status !== 'denied');

  // POLISHED EMPTY STATE
  if (visibleRequests.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 64px 24px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px;">
        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
        <h3 style="color: var(--text-heading); margin-bottom: 8px; font-size: 18px;">No Notifications</h3>
        <p style="color: var(--text-body); font-size: 14px;">You don't have any contact requests from scouts right now.</p>
      </div>
    `;
    return;
  }

  // RENDER CARDS
  visibleRequests.forEach((request) => {
    const isApproved = request.status === 'approved';
    
    // We need the original index from the main array to update Firestore accurately
    const originalIndex = requestsData.indexOf(request);

    const actionButtons = isApproved 
      ? `<button class="notification-btn-primary" disabled style="background-color: var(--accent-teal);">Approved</button>`
      : `<button class="btn-approve-contact notification-btn-primary" data-index="${originalIndex}">Approve</button>
         <button class="btn-deny-contact notification-btn-ghost" data-index="${originalIndex}">Deny</button>`;

    const cardHTML = `
      <article class="contact-request-card">
        <p class="notification-message">
          <strong>${request.scoutOrg || 'A Scout'}</strong> requested your contact details.
        </p>
        <div class="notification-actions">
          ${actionButtons}
        </div>
      </article>
    `;
    list.insertAdjacentHTML('beforeend', cardHTML);
  });

  // ATTACH BUTTON LISTENERS
  document.querySelectorAll('.btn-approve-contact').forEach(btn => {
    btn.addEventListener('click', (e) => updateRequestStatus(e.target.dataset.index, 'approved'));
  });

  document.querySelectorAll('.btn-deny-contact').forEach(btn => {
    btn.addEventListener('click', (e) => updateRequestStatus(e.target.dataset.index, 'denied'));
  });
}

// --- FIREBASE UPDATING ---
async function updateRequestStatus(index, newStatus) {
  try {
    requestsData[index].status = newStatus;
    
    // Push the newly updated array back to Firestore
    await updateDoc(doc(db, "athletes", currentAthleteUid), {
      contactRequests: requestsData
    });

    renderNotifications(); 
  } catch (error) {
    console.error("Failed to update status:", error);
    alert("Could not update request. Please try again.");
  }
}