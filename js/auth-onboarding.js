import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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

// Local locations dictionary
const indiaLocations = {
  "Maharashtra": ["Jalgaon", "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  "Haryana": ["Rohtak", "Hisar", "Karnal", "Panipat", "Gurugram", "Faridabad"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "Dwarka"]
};

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  setupGenderToggle();
  setupDynamicDropdowns();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      // Fetch existing data if they are here to edit their profile
      await loadExistingProfileData(user.uid);
    } else {
      window.location.href = "auth-phone.html";
    }
  });

  const form = document.querySelector('.onboarding-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      await completeProfile();
    };
  }
});

function setupDynamicDropdowns() {
  const stateSelect = document.getElementById('stateSelect');
  const districtSelect = document.getElementById('districtSelect');

  if (stateSelect && districtSelect) {
    stateSelect.innerHTML = '<option value="" disabled selected>Select your state</option>';
    districtSelect.innerHTML = '<option value="" disabled selected>Select a state first</option>';

    Object.keys(indiaLocations).sort().forEach(state => {
      const option = document.createElement('option');
      option.value = state;
      option.textContent = state;
      stateSelect.appendChild(option);
    });

    stateSelect.addEventListener('change', (e) => {
      const selectedState = e.target.value;
      const districts = indiaLocations[selectedState] || [];

      districtSelect.innerHTML = '<option value="" disabled selected>Select your district</option>';
      districts.sort().forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
      });
    });
  }
}

function setupGenderToggle() {
  const toggle = document.getElementById('genderToggle');
  if (!toggle) return;
  const buttons = toggle.querySelectorAll('.gender-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// --- Pre-fill data if editing ---
async function loadExistingProfileData(uid) {
  try {
    const docRef = doc(db, "athletes", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      const btn = document.getElementById('btnCompleteProfile');
      if (btn) btn.textContent = "UPDATE PROFILE";

      if (data.personalInfo) {
        document.getElementById('fullNameInput').value = data.personalInfo.fullName || "";
        document.getElementById('dobInput').value = data.personalInfo.dateOfBirth || "";
        document.getElementById('ageDisplay').value = data.personalInfo.ageDisplay || "";
        
        const btns = document.querySelectorAll('#genderToggle .gender-btn');
        btns.forEach(b => {
          b.classList.remove('active');
          if (b.dataset.gender === data.personalInfo.gender) b.classList.add('active');
        });
      }

      if (data.physicalStats) {
        document.getElementById('heightInput').value = data.physicalStats.heightCm || "";
        document.getElementById('weightInput').value = data.physicalStats.weightKg || "";
      }

      if (data.location) {
        const stateSelect = document.getElementById('stateSelect');
        const districtSelect = document.getElementById('districtSelect');
        
        if(stateSelect && data.location.state) {
          stateSelect.value = data.location.state;
          stateSelect.dispatchEvent(new Event('change')); // Trigger district population
          
          if(districtSelect && data.location.district) {
            setTimeout(() => {
              districtSelect.value = data.location.district;
            }, 50);
          }
        }
      }

      // ONLY load previous experience, ignore the removed sport dropdowns
      if (data.athleticProfile) {
        if(document.getElementById('prevExperienceInput')) {
           document.getElementById('prevExperienceInput').value = data.athleticProfile.previousExperience || "";
        }
      }
    }
  } catch (error) {
    console.error("Error pre-filling existing profile data:", error);
  }
}

async function completeProfile() {
  if (!currentUser) {
    alert("Authentication error. Please log in again.");
    return;
  }

  const stateVal = document.getElementById('stateSelect').value;
  const districtVal = document.getElementById('districtSelect').value;
  if (!stateVal || !districtVal) {
    alert("Please select both your State and District.");
    return;
  }

  const btn = document.getElementById('btnCompleteProfile');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "SAVING...";

  try {
    const activeGenderBtn = document.querySelector('#genderToggle .gender-btn.active');
    const genderValue = activeGenderBtn ? activeGenderBtn.dataset.gender : 'Male';

    const heightCm = Number(document.getElementById('heightInput').value);
    const weightKg = Number(document.getElementById('weightInput').value);
    let bmiDisplay = "";
    if (heightCm > 0 && weightKg > 0) {
      const bmi = (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
      bmiDisplay = `${bmi} (Calculated)`;
    }

    const fullName = document.getElementById('fullNameInput').value;
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2563EB&color=fff&size=256`;

    // Clean payload without sportCategory
    const athleteData = {
      uid: currentUser.uid,
      personalInfo: {
        fullName: fullName,
        dateOfBirth: document.getElementById('dobInput').value,
        gender: genderValue,
        ageDisplay: document.getElementById('ageDisplay').value,
        profilePhotoUrl: avatarUrl
      },
      physicalStats: {
        heightCm: heightCm,
        weightKg: weightKg,
        bmi: bmiDisplay
      },
      location: {
        state: stateVal,
        district: districtVal
      },
      athleticProfile: {
        previousExperience: document.getElementById('prevExperienceInput') ? document.getElementById('prevExperienceInput').value : ""
      },
      metadata: {
        updatedAt: new Date().toISOString(),
        authMethod: currentUser.email ? 'email' : 'phone',
        phone: currentUser.phoneNumber || "",
        email: currentUser.email || "",
        profileComplete: true
      }
    };

    const athleteDocRef = doc(db, "athletes", currentUser.uid);
    await setDoc(athleteDocRef, athleteData, { merge: true });

    if (typeof KhelSetu !== 'undefined') {
      const session = KhelSetu.getSession();
      KhelSetu.saveSession({
        profileComplete: true,
        user: { ...session.user, ...athleteData.personalInfo }
      });
      KhelSetu.navigate('athlete-dashboard.html');
    } else {
      window.location.href = "athlete-dashboard.html";
    }

  } catch (error) {
    console.error("Firestore Save Error:", error);
    alert("Failed to save profile.");
    btn.disabled = false;
    btn.textContent = originalText;
  }
}