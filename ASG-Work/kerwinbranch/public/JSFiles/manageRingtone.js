

// Play the ringtone for the medications retrieved from the database through the date
// and then matching the date and timing for the current -> the database startTiming and the date
async function playRingtone() { 
  const selectedDate = localStorage.getItem("selectedDate");
  if (!selectedDate) return;

  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  console.log(`Today date: ${formattedDate}`);

  // Get current time (HH:MM)
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeSimple = `${currentHours}:${currentMinutes}`;

  // Fetch medications for selectedDate
  try {
    const response = await fetch(`http://localhost:3000/medications/by-date?date=${selectedDate}`);
    if (!response.ok) throw new Error('Network response was not ok in script.js');

    const medications = await response.json();

    medications.forEach(meds => {
      if (!meds.start_hour || !meds.schedule_date || !meds.audio_link) return;

      const medDate = new Date(meds.schedule_date).toISOString().split('T')[0];
      const medTime = new Date(meds.start_hour);
      const medHours = String(medTime.getHours()).padStart(2, '0');
      const medMinutes = String(medTime.getMinutes()).padStart(2, '0');
      const startTimeSimple = `${medHours}:${medMinutes}`;

      console.log(`Medication date: ${medDate}`);
      console.log(`Start time: ${startTimeSimple}`);
      console.log(`Current time: ${currentTimeSimple}`);

      if (formattedDate === medDate && currentTimeSimple === startTimeSimple) {
        const audio = new Audio(meds.audio_link);
        audio.play().catch(err => console.error("Audio play failed:", err));
        showMedicationPopup(meds.name, audio);

      }
    });

  } catch (err) {
    console.error("Error fetching medications:", err);
  }
}

function isTimeWithinOneMinute(timeA, timeB) {
  const [h1, m1] = timeA.split(":").map(Number);
  const [h2, m2] = timeB.split(":").map(Number);
  const totalMinA = h1 * 60 + m1;
  const totalMinB = h2 * 60 + m2;
  return Math.abs(totalMinA - totalMinB) <= 1;
}



// Attach to DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  playRingtone(); // run once on load
  setInterval(playRingtone, 60000); // run every 1 minute
});

let currentAudio = null; // global reference

// Show what medication to take today, then allow muting of the alarm
function showMedicationPopup(name, audio) {
  currentAudio = audio;

  const popup = document.createElement("div");
  popup.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #f5f5f5;
      padding: 20px;
      border: 2px solid #007bff;
      border-radius: 10px;
      z-index: 9999;
      font-family: sans-serif;
      text-align: center;
    ">
      It's time to take: <strong>${name}</strong><br><br>
      <button id="mute-btn" style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
        Mute
      </button>
    </div>
  `;
  document.body.appendChild(popup);

  const muteBtn = popup.querySelector('#mute-btn');
  muteBtn.addEventListener('click', () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    popup.remove();
  });

  setTimeout(() => {
    popup.remove();
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
  }, 10000);
}
