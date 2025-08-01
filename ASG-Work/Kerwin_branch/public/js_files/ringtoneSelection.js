
const selectedIdsRaw = localStorage.getItem("selectedMedicationIds");
const selectedMedicationIds = selectedIdsRaw ? JSON.parse(selectedIdsRaw) : [];

const selectedDate = localStorage.getItem("selectedDate");

console.log('selected Dates lol: ', localStorage.getItem("selectedDate"));
console.log('Selected id lol: ', localStorage.getItem("selectedMedicationIds"));


// Back button
const backBtn = document.getElementById("back-button");
if (backBtn) {
  backBtn.addEventListener("click", function() {
    window.location.href = "../HTML files/expandedCalendar.html";
  });
}


// select ringtones

function audioTrackSelections() {
 const audioTracks = [
      { name: "Audio sample 1", url: "../../resources/audio1.mp3" },
      { name: "Audio sample 2", url: "../../resources/audio2.mp3" }
    ];

    const audioListDiv = document.getElementById("audio-list");

    audioTracks.forEach(track => {
      const item = document.createElement("div");
      item.className = "audio-item";

      item.innerHTML = `
        <h4>${track.name}</h4>
        <audio controls>
          <source src="${track.url}" type="audio/mpeg"/>
          Your browser does not support the audio element.
        </audio>
        <button type="button" class="select-ringtone inter" id="select-ringtone">Select this ringtone</button>
      `;

      const selectRingtoneButton = item.querySelector('.select-ringtone');

      selectRingtoneButton.addEventListener('click', async () => {
          for (const id of selectedMedicationIds) {
            await addSelectedRingtone(id, track.url);
          }
        window.location.href = "../HTML files/expandedCalendar.html";
      });
      
      audioListDiv.appendChild(item);
    });
  }

  document.addEventListener('DOMContentLoaded', audioTrackSelections);

  // Select ringtone button activated and post into database id="select-ringtone" from audioTrackSelection
  async function addSelectedRingtone(id, audioLink) {
    try {
      const response = await fetch(`http://localhost:3000/medications/${id}/ringtone`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
        body: JSON.stringify({ audio_link: audioLink })

      });
      if (!response.ok) throw new Error("Failed to add ringtone");
      console.log(`Audio added for medication ${id}`);
    } catch (err) {
        console.error(`Server error: ${err}`);
    }
  }
