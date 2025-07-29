
document.getElementById('recordForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const diagnosis = document.getElementById('diagnosis').value;
  const allergies = document.getElementById('allergies').value;
  const treatments = document.getElementById('treatments').value;

  const response = await fetch('/api/medical-records', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ diagnosis, allergies, treatments })
  });

  if (response.ok) {
    loadRecords();
    document.getElementById('recordForm').reset();
  }
});

async function loadRecords() {
  const res = await fetch('/api/medical-records');
  const records = await res.json();

  const recordsList = document.getElementById('recordsList');
  recordsList.innerHTML = '';

  records.forEach(record => {
    const card = document.createElement('div');
    card.className = 'record-card';
    card.innerHTML = `
      <strong>Diagnosis:</strong> ${record.diagnosis}<br>
      <strong>Allergies:</strong> ${record.allergies}<br>
      <strong>Treatments:</strong> ${record.treatments}
    `;
    recordsList.appendChild(card);
  });
}

loadRecords();
