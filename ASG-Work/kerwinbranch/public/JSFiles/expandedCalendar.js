

const times = [
  "12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am", "8am",
  "9am", "10am", "11am",
  "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"
];

let startTimeIndex = times.indexOf("9am");
let endTimeIndex = times.indexOf("9pm");


// Change the start time using the up arrow
function increaseStart() {
  if (startTimeIndex < times.length - 1) {
    startTimeIndex++;
    document.getElementById("start-time").innerText = times[startTimeIndex];
    fetchMedications();
  }
}


// Decrease the end time using the down arrow 
function decreaseStart() {
  if (startTimeIndex > 0) {
    startTimeIndex--;
    document.getElementById("start-time").innerText = times[startTimeIndex];
    fetchMedications();
  }
}

// Changes the end time using the up arrow
function increaseEnd() {
  if (endTimeIndex < times.length - 1) {
    endTimeIndex++;
    document.getElementById("end-time").innerText = times[endTimeIndex];
    fetchMedications();
  }
}


// Changes the end time using the down arrow
function decreaseEnd() {
  if (endTimeIndex > 0) {
    endTimeIndex--;
    document.getElementById("end-time").innerText = times[endTimeIndex];
    fetchMedications();
  }
}

// changes the timing to 24-hour time string formatted for the start and end timing
function indexToTimeString(index) {
  const hour = index % 12 === 0 ? 12 : index % 12;
  const ampm = index < 12 ? "AM" : "PM";
  const hour24 = index === 0 ? 0 : index < 12 ? index : index;
  return `${hour24.toString().padStart(2, '0')}:00`;
}


// Redirect to another page when clicked on the play-ringtone
document.getElementById("play-ringtone").addEventListener("click", function(){
   window.location.href = "../HTML files/ringtoneSelection.html";
});


// Fetch the medications using the date and start time to end time
async function fetchMedications() {
  const date = document.getElementById("date").value;
  if (!date) {
    console.log("No date selected in calendar input");
    return;
  } 
  
  try {

    const formattedStart = indexToTimeString(startTimeIndex);
    const formattedEnd = indexToTimeString(endTimeIndex);

    const response = await fetch(`http://localhost:3000/medications?date=${date}&start=${formattedStart}&end=${formattedEnd}`);

    if (!response.ok) { 
      throw new Error('Network response was not ok in script.js');
    }

    console.log(response);
    const medications = await response.json();

    const occurenceResponse = await fetch("http://localhost:3000/medication-occurrences");
    
    if (!occurenceResponse.ok) {
      throw new Error('Network response was not ok in expandedCalendar.js');
    }
    
    const medicationOccurrence = await occurenceResponse.json();

    displayMedications(medications, medicationOccurrence); // if medication is fine calls display medication

  } catch (error) { 
    console.error("Error fetching medications:", error);
  }
}

// Redirect to another page when clicked on the play-ringtone
document.getElementById("play-ringtone").addEventListener("click", function(){
   window.location.href = "../HTML files/ringtoneSelection.html";
});


// Main function to display the medications in the frontend UI
function displayMedications(medications, medicationOccurrences) {
  console.log("📦 Medications:", medications);
  console.log("📦 Occurrences:", medicationOccurrences);

  const selectedDate = document.getElementById("date").value;
  if (!selectedDate) {
    console.warn("No date selected");
    return;
  }

  const selectedDateStr = new Date(selectedDate).toISOString().split("T")[0];
  const scheduleDiv = document.querySelector(".schedule");

  // Reset section
  scheduleDiv.innerHTML = `
    <div class="select-all">
      <input type="checkbox" id="selectAll" onclick="toggleAll()">
      <label for="selectAll">Select all</label>
    </div>
  `;

  const medicationMap = {};

  // Load medications for the selected date
  medications.forEach(med => {
    if (!med.start_hour || !med.schedule_date) return;

    const medDateStr = new Date(med.schedule_date).toISOString().split("T")[0];
    if (medDateStr !== selectedDateStr) return;

    try {
      const time = new Date(med.start_hour);
      if (isNaN(time.getTime())) throw new Error("Invalid time");

      const hourKey = time.getHours();

      if (!medicationMap[hourKey]) medicationMap[hourKey] = [];

      medicationMap[hourKey].push({
        id: med.id,
        name: med.name,
        start: time.toISOString(),
        source: "base"
      });
    } catch (err) {
      console.warn("Invalid start_hour:", med.start_hour, med);
    }
  });

  // Load occurrences for the selected date using schedule_hour
  medicationOccurrences.forEach(occ => {
    const occDateStr = new Date(occ.schedule_date).toISOString().split("T")[0];
    if (occDateStr !== selectedDateStr) return;

    const time = new Date(occ.occurrence_time);
      if (isNaN(time.getTime())) throw new Error("Invalid time");

      const hourKey = time.getHours();

      if (!medicationMap[hourKey]) medicationMap[hourKey] = [];

    medicationMap[hourKey].push({
      id: occ.medication_id,
      name: occ.name,
      start: time.toISOString(),
      source: "occurrence"
    });
  });

  // Render from start to end hour
  for (let i = startTimeIndex; i <= endTimeIndex; i++) {
    const hourLabel = times[i];
    const medsAtHour = medicationMap[i];

    const entry = document.createElement("div");
    entry.className = "time-entry";

    if (medsAtHour && medsAtHour.length > 0) {
      entry.innerHTML = `<span>${hourLabel}</span>`;
      const medGroup = document.createElement("div");
      medGroup.className = "medication-group";

      medsAtHour.forEach(med => {
        const medBox = document.createElement("div");
        medBox.className = "med-box";

        const timeLabel = formatTo12HourTimeLocal(med.start);
        const tag = med.source === "occurrence" ? "🔁" : "🕒";

        medBox.innerHTML = `
          <input type="text" value="${tag} ${med.name} (${timeLabel})" disabled>
          <input type="checkbox" class="calendar-checkbox" data-medication-id="${med.id}">
        `;

        medGroup.appendChild(medBox);
      });

      entry.appendChild(medGroup);
    } else {
      entry.innerHTML = `
        <span>${hourLabel}</span>
        <input type="text" value="" disabled>
      `;
    }

    scheduleDiv.appendChild(entry);
  }
}

// format the timing to become 12 hours
function formatTo12HourTimeLocal(isoTimeString) {
  const date = new Date(isoTimeString); // Uses local timezone by default
  let hours = date.getHours();
  const minutes = date.getMinutes();

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  const minutesStr = minutes.toString().padStart(2, '0');

  return `${hours}:${minutesStr} ${ampm}`;
}

// Redirect to another page when clicked on the play-ringtone
document.getElementById("play-ringtone").addEventListener("click", function(){
   window.location.href = "../HTML files/ringtoneSelection.html";
});


// Detect if the dynamic checkbox is selected
document.addEventListener("change", function(event) {
  if (event.target.classList.contains("calendar-checkbox")) {
    const medId = event.target.dataset.medicationId;
    let selectedIds = JSON.parse(localStorage.getItem("selectedMedicationIds") || "[]");

    if (event.target.checked) {
       if (!selectedIds.includes(medId)) {
        selectedIds.push(medId);
      }
    } else {
        selectedIds = selectedIds.filter(id => id !== medId);
    }
    localStorage.setItem("selectedMedicationIds", JSON.stringify(selectedIds));
    console.log("Updated selected IDs:", selectedIds);
  }
});


// Select all button
function toggleAll() { 
    const selectAllCheckbox = document.getElementById("selectAll");
    const checkboxes = document.querySelectorAll(".schedule input[type='checkbox']");

    checkboxes.forEach((checkbox) => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

document.getElementById("notification-page").addEventListener("click", function() {
    window.location.href = "../HTML files/notificationCustomization.html";
});

document.getElementById("notification-page").addEventListener("click", function () {
  const selectedDate = document.getElementById("date").value;
  if (!selectedDate) {
      localStorage.removeItem("selectedDate"); // overwrite local storage when no date is selected
  } else {
    localStorage.setItem("selectedDate", selectedDate);
  }

  localStorage.setItem("selectedDate", selectedDate); // Store in localStorage
    window.location.href = "../HTML files/notificationCustomization.html";
  
});

document.getElementById("date").addEventListener("change", fetchMedications);