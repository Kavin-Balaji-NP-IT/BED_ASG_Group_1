const BASE_API_URL = 'http://localhost:3000/api';

let bloodSugarChartInstance = null;
let heartRateChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    const userId = 5;
    fetchFitnessData(userId);
});

/**
 * Fetches all fitness data for a given user ID from the backend.
 * @param {number} userId - The ID of the user.
 */
async function fetchFitnessData(userId) {
    try {
        const response = await fetch(`${BASE_API_URL}/fitness-tracker/${userId}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log("Fetched Fitness Data:", data);

        updateBloodSugarDisplay(data.bloodSugarData, data.bloodPressure);
        updateHeartRateDisplay(data.heartRate);
        updateBloodPressureDisplay(data.bloodPressure);

    } catch (error) {
        console.error("Error fetching fitness data:", error);
        document.querySelector('main').innerHTML = '<p style="color: red;">Failed to load fitness data. Please try again later.</p>';
    }
}

/**
 * Updates the Blood Sugar chart and latest reading display.
 * @param {Array} bloodSugarData
 * @param {Object} latestVitals
 */
function updateBloodSugarDisplay(bloodSugarData, latestVitals) {
    const dates = bloodSugarData.map(item => new Date(item.Date).toLocaleDateString());
    const levels = bloodSugarData.map(item => item.AvgBloodSugar);

    const latestDate = latestVitals.lastTakenDateTime ? new Date(latestVitals.lastTakenDateTime) : null;

    document.getElementById('latestBloodSugarDate').textContent = latestDate ? latestDate.toLocaleDateString() : 'N/A';
    document.getElementById('latestBloodSugarTime').textContent = latestDate ? latestDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
    document.getElementById('latestBloodSugarLevel').textContent = latestVitals.bloodSugar !== null ? latestVitals.bloodSugar.toFixed(1) : 'N/A'; // Assuming bloodSugar is directly in latestVitals

    let status = 'N/A';
    if (latestVitals.bloodSugar !== null) {
        if (latestVitals.bloodSugar >= 4.0 && latestVitals.bloodSugar <= 7.0) { 
            status = 'Acceptable';
            document.getElementById('bloodSugarRangeStatus').style.color = 'green';
        } else if (latestVitals.bloodSugar < 4.0) {
            status = 'Low';
            document.getElementById('bloodSugarRangeStatus').style.color = 'orange';
        } else {
            status = 'High';
            document.getElementById('bloodSugarRangeStatus').style.color = 'red';
        }
    }
    document.getElementById('bloodSugarRangeStatus').textContent = status;

    const ctx = document.getElementById('bloodSugarChart').getContext('2d');

    if (bloodSugarChartInstance) {
        bloodSugarChartInstance.destroy();
    }

    bloodSugarChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Avg Blood Sugar (mmol/L)',
                data: levels,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)', 
                    'rgba(199, 199, 199, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Blood Sugar (mmol/L)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(1) + ' mmol/L';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Updates the Heart Rate display and chart.
 * @param {Object} heartRateData 
 */
function updateHeartRateDisplay(heartRateData) {
    document.getElementById('latestHeartRate').textContent = heartRateData.latestValue || 'N/A';
    document.getElementById('minHeartRate').textContent = heartRateData.min || 'N/A';
    document.getElementById('maxHeartRate').textContent = heartRateData.max || 'N/A';
    document.getElementById('avgHeartRate').textContent = heartRateData.avg ? heartRateData.avg.toFixed(0) : 'N/A';

    const latestDateTime = heartRateData.latestDateTime ? new Date(heartRateData.latestDateTime) : null;
    document.getElementById('heartRateLastTaken').textContent = latestDateTime ? latestDateTime.toLocaleString() : 'N/A';

    const hrLabels = heartRateData.history.map(item => new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const hrValues = heartRateData.history.map(item => item.value);

    const ctx = document.getElementById('heartRateChart').getContext('2d');

    if (heartRateChartInstance) {
        heartRateChartInstance.destroy();
    }

    heartRateChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hrLabels,
            datasets: [{
                label: 'Heart Rate (bpm)',
                data: hrValues,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.3,
                fill: true,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Beats Per Minute (bpm)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 7
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + ' bpm';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Updates the Blood Pressure display.
 * @param {Object} bloodPressureData
 */
function updateBloodPressureDisplay(bloodPressureData) {
    document.getElementById('bpSys').textContent = bloodPressureData.sys || 'N/A';
    document.getElementById('bpDia').textContent = bloodPressureData.dia || 'N/A';
    document.getElementById('bpPulse').textContent = bloodPressureData.pulse || 'N/A';

    const lastTakenDateTime = bloodPressureData.lastTakenDateTime ? new Date(bloodPressureData.lastTakenDateTime) : null;
    document.getElementById('bpLastTaken').textContent = lastTakenDateTime ? lastTakenDateTime.toLocaleString() : 'N/A';

    let status = 'N/A';
    let statusColor = 'black';
    if (bloodPressureData.sys !== null && bloodPressureData.dia !== null) {
        if (bloodPressureData.sys < 120 && bloodPressureData.dia < 80) {
            status = 'Normal';
            statusColor = 'green';
        } else if ((bloodPressureData.sys >= 120 && bloodPressureData.sys <= 129) && bloodPressureData.dia < 80) {
            status = 'Elevated';
            statusColor = 'orange';
        } else if ((bloodPressureData.sys >= 130 && bloodPressureData.sys <= 139) || (bloodPressureData.dia >= 80 && bloodPressureData.dia <= 89)) {
            status = 'High Blood Pressure (Hypertension Stage 1)';
            statusColor = 'red';
        } else if (bloodPressureData.sys >= 140 || bloodPressureData.dia >= 90) {
            status = 'High Blood Pressure (Hypertension Stage 2)';
            statusColor = 'darkred';
        } else {
            status = 'Crisis (Seek medical attention!)';
            statusColor = 'purple';
        }
    }
    const bpStatusElement = document.getElementById('bpStatus');
    bpStatusElement.textContent = `Blood Pressure is ${status}`;
    bpStatusElement.style.color = statusColor;
}