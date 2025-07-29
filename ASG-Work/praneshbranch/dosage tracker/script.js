// Dark Mode Switch
const toggle = document.getElementById('darkToggle');

if (toggle) {
  // Load saved preference
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark');
    toggle.checked = true;
  }

  toggle.addEventListener('change', () => {
    document.body.classList.toggle('dark', toggle.checked);
    localStorage.setItem('darkMode', toggle.checked);
  });
}


// Dummy data for testing before backend
const dummyMeds = [
  { name: "Panadol", dosage: "1 pill every 6 hours", time: "08:00" },
  { name: "Ibuprofen", dosage: "1 pill after meals", time: "13:00" }
];

// Load data into index.html
if (window.location.pathname.includes('index.html')) {
  const container = document.getElementById('medicineList');
  dummyMeds.forEach((med, index) => {
    const card = `
      <div class="medicine-card">
        <h2>${med.name}</h2>
        <p>${med.dosage}</p>
        <a href="details.html?id=${index}">View</a>
      </div>
    `;
    container.innerHTML += card;
  });
}

// Add form logic
if (window.location.pathname.includes('add.html')) {
  document.getElementById('addForm').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('✅ Medicine added! (This will be saved for you!)');
    window.location.href = "index.html";
  });
}

// Detail logic
if (window.location.pathname.includes('details.html')) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const med = dummyMeds[id];

  if (med) {
    document.getElementById('dosageDetail').textContent = med.dosage;
  }

  const checkbox = document.getElementById('takenCheckbox');
  const status = document.getElementById('statusMessage');

  checkbox.addEventListener('change', () => {
    status.textContent = checkbox.checked ? "✅ Marked as taken!" : "";
  });
}

if (window.location.pathname.includes('add.html')) {
  document.getElementById('addForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const newMed = {
      name: document.getElementById('med-name').value,
      dosage: document.getElementById('dosage').value,
      time: document.getElementById('time').value
    };

    fetch('/api/medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMed)
    })
      .then(res => res.json())
      .then(data => {
        alert('✅ Medicine added!');
        window.location.href = "index.html";
      });
  });
}
