
const dietListDiv = document.getElementById("dietPlansList"); 
const fetchDietBtn = document.getElementById("fetchDietBtn");
const messageDiv = document.getElementById("message");
const apiBaseUrl = "http://localhost:3000";

// Function to fetch diet plans from the API and display them
async function fetchDietPlans() {
  try {
    dietListDiv.innerHTML = "Loading diet plans...";
    messageDiv.textContent = "";

    // GET request to API
    const response = await fetch(`${apiBaseUrl}/dietplan`);

    if (!response.ok) {
      const errorBody = response.headers
        .get("content-type")
        ?.includes("application/json")
        ? await response.json()
        : { message: response.statusText };
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorBody.message || errorBody.message}`
      );
    }

    const diets = await response.json();

    // Clear and display results
    dietListDiv.innerHTML = "";
    if (diets.length === 0) {
      dietListDiv.innerHTML = "<p>No diet plans found.</p>";
    } else {
      diets.forEach((diet) => {
        const dietElement = document.createElement("div");
        dietElement.classList.add("diet-item");
        dietElement.setAttribute("data-diet-id", diet.ID || diet.id || diet.DietPlanID || "unknown"); 

        dietElement.innerHTML = `
          <h3>${diet.MealName} (${diet.MealType})</h3>
          <p>User ID: ${diet.UserID}</p>
          <p>Calories: ${diet.Calories}</p>
          <p>Date: ${new Date(diet.MealDate).toLocaleDateString()}</p>
          <p>Notes: ${diet.Notes || "None"}</p>
          <button onclick="viewDietDetails('${diet.ID || diet.id || diet.DietPlanID}')">View Details</button>
          <button onclick="editDiet('${diet.ID || diet.id || diet.DietPlanID}')">Edit</button>
          <button class="delete-btn" data-id="${diet.ID || diet.id || diet.DietPlanID}">Delete</button>
        `;
        dietListDiv.appendChild(dietElement);
      });

      // Attach delete event handlers
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleDeleteClick);
      });
    }
  } catch (error) {
    console.error("Error fetching diet plans:", error);
    dietListDiv.innerHTML = `<p style="color: red;">Failed to load diet plans: ${error.message}</p>`;
  }
}

// Placeholder functions
function viewDietDetails(dietId) {
  alert(`View details for DietPlan ID: ${dietId} (Not implemented yet)`);
}
function editDiet(dietId) {
  window.location.href = `edit.html?id=${dietId}`;
}
function handleDeleteClick(event) {
  const dietId = event.target.getAttribute("data-id");
  alert(`Attempting to delete DietPlan with ID: ${dietId} (Not implemented yet)`);
}

// Trigger fetch on button click
fetchDietBtn.addEventListener("click", fetchDietPlans);

// Fetch diets on page load
window.addEventListener("load", fetchDietPlans);
