
const savedDate = localStorage.getItem("selectedDate");

document.getElementById("back-button").addEventListener("click", function() {
    window.location.href = "../HTML files/expandedCalendar.html";
    savedDate.remove();
});

// Display the date by creating and displaying div, retrieval from the local storage
function displayDate() {
    const dateDiv = document.createElement("div");
    dateDiv.className = "date-display"
    const dateContainer = document.getElementById("date-display");
    
    dateContainer.innerHTML = ""; // Clear previous content
    const date = savedDate ? savedDate : "No date selected";
    dateDiv.textContent = date;
    dateContainer.appendChild(dateDiv);
}

function formatTime(time) {
  if (!time) return '';
  if (typeof time === 'string' && /^\d{2}:\d{2}/.test(time)) {
    return time.slice(0, 5);
  }
  const date = new Date(time);
  if (isNaN(date)) return ''; 
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Fetch the notification through the date
async function fetchAndDisplayNotifications() {
    if (!savedDate) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/medications?date=${savedDate}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const medication = await response.json();
        const savedNotification = document.getElementById("saved-notification");
        savedNotification.innerHTML = ""; // Clear previous content

        if(medication.length === 0) {
            savedNotification.textContent = "No notifications saved for this date.";
        }
        medication.forEach(med => {
            const createDiv = document.createElement("div");
            createDiv.className = "notification-item";
            item.innerHTML = `
                <span class="medication-name">${med.name}</span>
                <span class="schedule-hour">${med.schedule_hour}</span>
                <span class="schedule-minute">${med.schedule_minute}</span>
                <span class="dosage">${med.dosage}</span>
            `;
        });  
        savedNotification.appendChild(createDiv);
    } catch (err) {
        console.error("Error fetching notifications:", err);
    }
}

document.addEventListener("DOMContentLoaded", fetchAndDisplayNotifications);


// Validate the medication
function validateMedicationInput(data) {
    if (!data.name || data.name.trim() === "") {
        alert("Name is required.");
        return false;
    }

    if (
        !Number.isFinite(data.repeat_times) ||
        !Number.isInteger(data.repeat_times) ||
        data.repeat_times < 1
    ) {
        alert("Repeat times must be a positive whole number.");
        return false;
    }

    if (
        !Number.isFinite(data.repeat_duration) ||
        !Number.isInteger(data.repeat_duration) ||
        data.repeat_duration < 1
    ) {
        alert("Duration must be a positive whole number.");
        return false;
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!timeRegex.test(data.start_hour)) {
        alert("Start hour must be in HH:mm format (e.g., 09:00).");
        return false;
    }

    if (!timeRegex.test(data.end_hour)) {
        alert("End hour must be in HH:mm format (e.g., 17:30).");
        return false;
    }

    if (!data.frequency_type || typeof data.frequency_type !== 'string') {
        alert("Frequency type is required.");
        return false;
    }

    return true;
}


// Add medication container 
async function addMedicationContainer() {
  const addBtn = document.getElementById('add-container-button');
  const mainContainer = document.querySelector('.main-container');

  let addBoxContainer = null;

  addBtn.addEventListener('click', (event) => {
    event.preventDefault();
    // Create box if it doesn't exist
    if (!addBoxContainer) {
      addBoxContainer = document.createElement("div");
      addBoxContainer.className = 'add-box-container';
      addBoxContainer.style.display = 'none';

      addBoxContainer.innerHTML = `
        <div class="title">
          <button type="button" id="close-add-window">X</button>
          <h3>Add Features</h3>
        </div>
        <div class="add-features">
          <h3>To do item</h3>
          <input type="text" placeholder="To do item" id="to-do-item" class="general-info">
          <h3>Day on repeat</h3>
          <div class="day-on-repeat">
            <input type="text" placeholder="repeat-per-day" id="repeat-times" class="general-info">
            <span class="arrow">→</span>
            <input type="text" placeholder="duration (per hour)" id="duration-of-reminder" class="general-info">
          </div>
          <h3>Hour range</h3>
          <div class="hour-range-container">
            <input type="time" id="first-hour-range" class="general-info">
            <span class="arrow">→</span>
            <input type="time" id="second-hour-range" class="general-info">
          </div>
          <h3>Repeat</h3>
          <div class="routine_option-and-schedule">
            <select class="general-info" id="repeat-select">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button type="submit" id="submit-add-info">Submit</button>
          </div>
        </div>
      `;

      mainContainer.appendChild(addBoxContainer);

      // Close logic
      addBoxContainer.querySelector('#close-add-window').addEventListener('click', () => {
        addBoxContainer.style.display = 'none';
      });

      // Submit logic
      addBoxContainer.querySelector('#submit-add-info').addEventListener('click', async (event) => {
        event.preventDefault();

        if (!savedDate) {
          alert("Please select a date first.");
          return;
        }

        const item = addBoxContainer.querySelector("#to-do-item").value.trim();
        const repeat_times = parseInt(addBoxContainer.querySelector("#repeat-times").value.trim(), 10);
        const repeat_duration = parseInt(addBoxContainer.querySelector("#duration-of-reminder").value.trim(), 10);
        const start_hour = addBoxContainer.querySelector("#first-hour-range").value;
        const end_hour = addBoxContainer.querySelector("#second-hour-range").value;
        const frequency_type = addBoxContainer.querySelector("#repeat-select").value;
        const schedule_hour = parseInt(start_hour.split(':')[0], 10);

        const medicationData = {
          name: item,
          repeat_times,
          repeat_duration,
          start_hour,
          end_hour,
          frequency_type,
          schedule_date: savedDate,
          schedule_hour
        };

        if(!validateDurationAndRepeat(medicationData)) return;

        try {
          const response = await fetch('http://localhost:3000/medications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(medicationData)
          });

          const result = await response.json();

          if (response.ok) {
            // Clear inputs
            addBoxContainer.querySelectorAll('input, select').forEach(el => {
              if (el.tagName === 'SELECT') el.selectedIndex = 0;
              else el.value = '';
            });

            addBoxContainer.style.display = 'none';
            ModifyMedicationContainer();
          } else {
            alert(result.message || "Failed to add medication.");
          }
        } catch (err) {
          console.error("Error adding medication:", err);
          alert("Server error. Could not add medication.");
        }
      });
    }

    document.querySelectorAll('.edit-box-container').forEach(editBox => {
        editBox.style.display = 'none';
        document.querySelectorAll('.saved-notification-container').forEach(container => {
            container.style.display = 'flex';
        });
        });

    // Toggle show/hide
        addBoxContainer.style.display = (addBoxContainer.style.display === 'none') ? 'flex' : 'none';
  });
}


document.addEventListener('DOMContentLoaded', addMedicationContainer);

function parseToMinutes(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  return hour * 60 + minute;
}


function validateDurationAndRepeat(medications) {
    console.log(`medications: ${JSON.stringify(medications)}`);
    const startMin = parseToMinutes(medications.start_hour);
    const endMin = parseToMinutes(medications.end_hour);

    console.log(`startHour: ${medications.start_hour}, endHour: ${medications.end_hour}`);

    let durationInBetween;
    if (endMin >= startMin) {
        durationInBetween = endMin - startMin;
    } else {
        // 1:00 < 23:00 
        durationInBetween = (1440 - startMin) + endMin; 
    }

    console.log(`Duration in between: ${durationInBetween}, repeat times: ${medications.repeat_times}`);

    const durationSelected = medications.repeat_times * medications.repeat_duration * 60;

    console.log(`Duration needed: ${durationSelected}`);
    if (durationInBetween < durationSelected) {
        alert("Cannot add medication box — repeat time × duration exceeds time interval.");
        return false;
    }

    return true;
}


// Add the container and the edit box 
async function ModifyMedicationContainer() {
    if (!savedDate) return;

    try {
        const response = await fetch(`http://localhost:3000/medications/by-date?date=${savedDate}`);
        const medications = await response.json(); // Retrieve the medication json

        const parentContainer = document.getElementById("saved-notification-container");
        parentContainer.innerHTML = "";

        for (const med of medications) { // iterate the medication list of json 
            const mainDiv = document.createElement('div');
            mainDiv.className = 'saved-notification-container';

            const deleteNotificationContainer = document.createElement("button");
            deleteNotificationContainer.textContent = 'X';
            deleteNotificationContainer.type = 'button';
            deleteNotificationContainer.className = 'delete-notification-container';

            // Layer 1: Medication Name + Edit Button
            const layer1 = document.createElement("div");
            layer1.className = 'layer1-container';

            // Add the notification container
            const medName = document.createElement('div');
            medName.className = 'medicine-name';
            medName.textContent = med.name; // Add a specific column of the Json "name"

            const editButton = document.createElement("button");
            editButton.type = 'button';
            editButton.className = 'edit-button';
            editButton.textContent = 'Edit';

            layer1.appendChild(medName);
            layer1.appendChild(editButton);

            const hr = document.createElement("hr");
            hr.style.cssText = "width: 100%; height: 0; margin: 0; padding: 0";

            // Layer 2: Notes and Add Button
            const layer2 = document.createElement("div");
            layer2.className = 'layer2-container';  

            const notesWrapper = document.createElement("div");
            notesWrapper.className = 'notes-wrapper';

            const addButton = document.createElement("button");
            addButton.type = 'button';
            addButton.className = 'add-button';
            addButton.textContent = '+';

         // Retrieve text data for the notes
          try {
            const noteRes = await fetch(`http://localhost:3000/medications/${med.id}/notes/auto`);
            const notes = await noteRes.json();

            notesWrapper.innerHTML = '';

            notes.forEach(noteText => {
             let modifiedText = noteText;

            if (typeof noteText !== 'string') {
                console.warn('Skipping non-string note:', noteText);
                return;
            }

            if (noteText.startsWith("Start Hour:")) {
                const raw = noteText.split("Start Hour:")[1].trim();
                const dateObj = new Date(raw);
                const hours = dateObj.getHours();
                const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                const suffix = hours >= 12 ? 'PM' : 'AM';
                const hour12 = ((hours + 11) % 12 + 1).toString().padStart(2, '0');
                modifiedText = `Start Hour: ${hour12}:${minutes} ${suffix}`;
            }

            if (noteText.startsWith("End Hour:")) {
                const raw = noteText.split("End Hour:")[1].trim();
                const dateObj = new Date(raw);
                const hours = dateObj.getHours();
                const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                const suffix = hours >= 12 ? 'PM' : 'AM';
                const hour12 = ((hours + 11) % 12 + 1).toString().padStart(2, '0');
                modifiedText = `End Hour: ${hour12}:${minutes} ${suffix}`;
            }
            
            // Create note delete button
            const noteDivDelete = document.createElement('button');
            noteDivDelete.className = 'note-div-delete';
            noteDivDelete.type = 'button';
            noteDivDelete.textContent = 'X';
            notesWrapper.appendChild(noteDivDelete);

            // Create notes
            const noteDiv = document.createElement('div');
            noteDiv.className = 'prompt-info';
            
            noteDiv.textContent = modifiedText;
            notesWrapper.appendChild(noteDiv); // Append notes first

            console.log(`medication id: ${med.id}`);
            noteDivDelete.addEventListener('click', function(){
                deleteSpecificNoteById(med.id, noteText.split(":")[0], noteDiv, noteDivDelete);
            });

            });
        } catch (err) {
            console.error(`Failed to load notes for med ${med.id}`, err);
        }
        await loadManualNotes(med.id, notesWrapper);
        
        
        layer2.appendChild(notesWrapper);
        layer2.appendChild(addButton); 

        // Add new note through + button 

        addButton.addEventListener('click', () => {

            let inputBox = layer2.querySelector('input.prompt-info');
            if (!inputBox) {
                inputBox = document.createElement("input");
                inputBox.className = 'prompt-info';
                notesWrapper.appendChild(inputBox);
                inputBox.focus();

                let entered = false;

                inputBox.addEventListener('keydown', async function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = inputBox.value.trim();
                        if (value === '') {
                            inputBox.remove();
                        } else {
                            entered = true;
                            await postNotes(med.id, value); 
                            
                            const noteDivDelete = document.createElement('button');
                            noteDivDelete.className = 'note-div-delete';
                            noteDivDelete.type = 'button';
                            noteDivDelete.textContent = 'X';

                            const textBox = document.createElement('div');
                            textBox.className = 'prompt-info';
                            textBox.textContent = value;

                            noteDivDelete.addEventListener('click', function () {
                                deleteSpecificNoteById(med.id, value.split(":")[0], textBox, noteDivDelete);
                            });

                            inputBox.replaceWith(textBox);
                            notesWrapper.appendChild(noteDivDelete);
                            notesWrapper.appendChild(textBox);

                        }
                    }
                });

                inputBox.addEventListener('blur', async function () {
                    const value = inputBox.value.trim();
                    if (!entered && value === '') {
                        inputBox.remove();
                    } else if (!entered && value !== '') {
                        entered = true;
                        await postNotes(med.id, value);
                        const textBox = document.createElement('div');
                        textBox.className = 'prompt-info';
                        textBox.textContent = value;
                        inputBox.replaceWith(textBox);
                        notesWrapper.appendChild(textBox);
                    }
                });
                }
            });


            // Edit Box
            const editBoxContainer = document.createElement("div");
            editBoxContainer.className = 'edit-box-container';
            editBoxContainer.style.display = 'none';
            editBoxContainer.innerHTML = `
                <div class="title">
                    <button type="button" class="close-edit-window">X</button>
                    <h3>Edit Notification</h3>
                </div>
                <div class="edit-features">
                    <h3>To do item</h3>
                    <input type="text" placeholder="To do item" id="to-do-items" class="general-info to-do-item" value="${med.name || ''}">
                    <h3>Day on repeat</h3>
                    <div class="day-on-repeat">
                        <input type="text" placeholder="Duration (Every hour)" id="repeat-times" class="general-info every-hour-item" value="${med.repeat_times || ''}">
                        <span class="arrow">→</span>
                        <input type="text" placeholder="Repeat reminder count" id="duration-of-reminder" class="general-info frequency-item" value="${med.repeat_duration || ''}">
                    </div>
                    <h3>Hour range</h3>
                    <div class="hour-range-container">
                        <input type="time" class="general-info first-hour-range" id="startHour" value="${formatTime(med.start_hour) || ''}">
                        <span class="arrow">→</span>
                        <input type="time" class="general-info second-hour-range" id="endHour" value="${formatTime(med.end_hour) || ''}">
                    </div>
                    <h3>Repeat</h3>
                    <div class="routine_option-and-schedule">
                        <select class="general-info" id="repeat-select">
                            <option value="daily" ${med.frequency_type === 'daily' ? 'selected' : ''}>Daily</option>
                            <option value="weekly" ${med.frequency_type === 'weekly' ? 'selected' : ''}>Weekly</option>
                            <option value="monthly" ${med.frequency_type === 'monthly' ? 'selected' : ''}>Monthly</option>
                            <option value="yearly" ${med.frequency_type === 'yearly' ? 'selected' : ''}>Yearly</option>
                        </select>
                        <button type="submit" class="submit-edit-info">Save</button>
                    </div>
                </div>
            `;

            // Delete object Container
          deleteNotificationContainer.addEventListener("click", async function() {
            try {
                const response = await fetch(`http://localhost:3000/medications/${med.id}`, {
                    method: 'DELETE'
                });

                const result = await response.json();

                if (response.ok) {
                    mainDiv.remove();
                } else {
                    console.err("Failed to delete: ", result.message);
                }
            } catch (err) {
                console.error("Error deleting medication:", err);
            }
        });

            // Append everything
            mainDiv.appendChild(deleteNotificationContainer);
            mainDiv.appendChild(layer1);
            mainDiv.appendChild(hr);
            mainDiv.appendChild(layer2);
            parentContainer.appendChild(mainDiv);
            parentContainer.appendChild(editBoxContainer);

            // Edit button click
           editButton.addEventListener('click', () => {
  // Hide other saved containers
            document.querySelectorAll(".saved-notification-container").forEach(container => {
                if (container !== mainDiv) {
                container.style.display = 'none';
                }
            });

            // Hide add container if it's open
            const openAddBox = document.querySelector('.add-box-container');
            if (openAddBox && openAddBox.style.display !== 'none') {
                openAddBox.style.display = 'none';
            }

            // Toggle edit box
            if (editBoxContainer.style.display == 'none') {
                editBoxContainer.style.display = 'flex';
            } else {
                editBoxContainer.style.display = 'none';
                document.querySelectorAll(".saved-notification-container").forEach(container => {
                container.style.display = 'flex';
                });
            }
});


        // Close button click
        const closeBtn = editBoxContainer.querySelector('.close-edit-window');
        closeBtn.addEventListener('click', () => {
            editBoxContainer.style.display = 'none';
            document.querySelectorAll(".saved-notification-container").forEach(container => {
                container.style.display = 'flex';
            });
        });

        // Submit for edit container click 

        editBoxContainer.querySelector('.submit-edit-info').addEventListener('click', async function(event) {
        event.preventDefault();

        // Use editBoxContainer.querySelector to get the correct input values
        const item = editBoxContainer.querySelector('.to-do-item').value;
        const day_on_repeat = parseInt(editBoxContainer.querySelector('.every-hour-item').value, 10);
        const duration_of_reminder = parseInt(editBoxContainer.querySelector('.frequency-item').value, 10);
        const startHour = editBoxContainer.querySelector('.first-hour-range').value;
        const endHour = editBoxContainer.querySelector('.second-hour-range').value;
        const repeatSelect = editBoxContainer.querySelector('select').value;
        const scheduleHour = parseInt(startHour.split(':')[0], 10);

        const medicationData = {
            name: item,
            repeat_times: day_on_repeat,
            repeat_duration: duration_of_reminder,
            start_hour: startHour,
            end_hour: endHour,
            frequency_type: repeatSelect,
            schedule_date: savedDate,
            schedule_hour: scheduleHour 
        };

    if (!validateMedicationInput(medicationData) || !validateDurationAndRepeat(medicationData)) return;

    // validateDurationAndRepeat(medicationData)
    try {
        const response = await fetch(`http://localhost:3000/medications/${med.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(medicationData)
        });

        const result = await response.json();

        if (response.ok) {
            editBoxContainer.style.display = 'none';
            console.log(medicationData['name']);
            
            ModifyMedicationContainer(); // Refresh list

               if (typeof fetchMedications === 'function') {
                    fetchMedications();
               }
            alert("Medication updated successfully!");
        } else {
            alert(result.message || "Failed to edit medication.");
        }
    } catch (err) {
        console.error("Error editing medication:", err);
        alert("Server error. Could not edit medication.");
    }
});
        }

    } catch (err) {
        console.error("Error loading medications:", err);
    }
}

document.addEventListener('DOMContentLoaded', ModifyMedicationContainer);


// Post notes into the sql

async function postNotes(medicationId, value) {

    try {
        const response = await fetch("http://localhost:3000/medication-notes", {
            method: 'POST',
            headers: {
                'Content-type' : 'application/json'
            },
            body: JSON.stringify({
                medicationId: medicationId,
                note_text: value,
                note_type: 'manual'
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log("Note saved to DB", result.message);
        } else {
            console.error("Failed to save note", result.message);
        }
    } catch (err) {
        console.error("Error during fetch", err);
    }
}

// Load manual notes
async function loadManualNotes(medId, notesWrapper) {
    try {
        const manualNoteRes = await fetch(`http://localhost:3000/medication-notes?medicationId=${medId}`);
        const manualNotes = await manualNoteRes.json();

        manualNotes.forEach(note => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'prompt-info';
            noteDiv.textContent = note.note_text;

            const noteDivDelete = document.createElement('button');
            noteDivDelete.className = 'note-div-delete';
            noteDivDelete.type = 'button';
            noteDivDelete.textContent = 'X';

            notesWrapper.appendChild(noteDivDelete);
            notesWrapper.appendChild(noteDiv);

            noteDivDelete.addEventListener('click', function () {
                deleteSpecificNoteById(medId, note.note_text.split(":")[0], noteDiv, noteDivDelete);
            });
        });
    } catch (err) {
        console.error(`Failed to load manual notes for med ${medId}`, err);
    }
}



// Delete specific notes
async function deleteSpecificNoteById(medId, noteText, noteDiv, deleteButton) {
    try {
        const res = await fetch(`http://localhost:3000/medications/delete/notes/by-details`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                medication_id: medId,
                note_text: noteText
            })
        });

        const result = await res.json();

        if (res.ok) {
            noteDiv.remove();
            deleteButton.remove();
        } else {
            alert("Failed to delete note: " + result.message);
        }
    } catch (err) {
        console.error("Delete error:", err);
        alert("Server error");
    }
}


// Fetch medications
async function fetchMedications() {
  const dateInput = document.getElementById("date");
  if (!dateInput || !dateInput.value) {
    console.warn("No date selected in calendar input");
    return;
  }

  const selectedDate = dateInput.value;

  try {
    // 1. Fetch medications by date
    const medRes = await fetch(`http://localhost:3000/medications?date=${selectedDate}`);
    if (!medRes.ok) throw new Error("Failed to fetch medications");

    const medications = await medRes.json();

    // 2. Fetch all occurrences
    const occRes = await fetch(`http://localhost:3000/medication-occurrences`);
    if (!occRes.ok) throw new Error("Failed to fetch occurrences");

    const medicationOccurrences = await occRes.json();

    // 3. Display medications
    displayMedications(medications, medicationOccurrences);

  } catch (err) {
    console.error("Error in fetchMedications:", err);
  }
}



window.addEventListener("DOMContentLoaded", displayDate);