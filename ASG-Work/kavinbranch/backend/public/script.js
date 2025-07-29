const dietListDiv = document.getElementById("dietPlansList");
const fetchDietBtn = document.getElementById("fetchDietBtn");
const messageDiv = document.getElementById("message");
const apiBaseUrl = "http://localhost:3000";

// Fetch diet plans from API and display
async function fetchDietPlans() {
  try {
    dietListDiv.innerHTML = "Loading diet plans...";
    messageDiv.textContent = "";

    const response = await fetch(`${apiBaseUrl}/dietplan`, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorBody = {};

      if (contentType && contentType.includes("application/json")) {
        errorBody = await response.json();
      } else {
        errorBody.message = response.statusText;
      }

      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorBody.message}`
      );
    }

    const diets = await response.json();
    console.log("Fetched diets:", diets);

    dietListDiv.innerHTML = "";

    if (!Array.isArray(diets) || diets.length === 0) {
      dietListDiv.innerHTML = "<p>No diet plans found.</p>";
      return;
    }

    diets.forEach((diet) => {
      const id = diet.MealID; // ✅ Use MealID directly
      const dietElement = document.createElement("div");
      dietElement.classList.add("diet-item");
      dietElement.setAttribute("data-diet-id", id);

      dietElement.innerHTML = `
        <h3>${diet.MealName || "Unnamed"} (${diet.MealType || "Type N/A"})</h3>
        <p>User ID: ${diet.UserID || "N/A"}</p>
        <p>Calories: ${diet.Calories || "N/A"}</p>
        <p>Date: ${diet.MealDate ? new Date(diet.MealDate).toLocaleDateString() : "Unknown"}</p>
        <p>Notes: ${diet.Notes || "None"}</p>
        <button onclick="viewDietDetails('${id}')">View Details</button>
        <button onclick="editDiet('${id}')">Edit</button>
        <button class="delete-btn" data-id="${id}">Delete</button>
      `;
      dietListDiv.appendChild(dietElement);
    });

    // Attach delete event handlers
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleDeleteClick);
    });

  } catch (error) {
    console.error("Error fetching diet plans:", error);
    dietListDiv.innerHTML = `<p style="color: red;">Failed to load diet plans: ${error.message}</p>`;
  }
}

// Placeholder actions
function viewDietDetails(dietId) {
  alert(`View details for DietPlan ID: ${dietId} (Not implemented yet)`);
}

function editDiet(dietId) {
  window.location.href = `edit.html?id=${dietId}`;
}

// ✅ DELETE functionality
async function handleDeleteClick(event) {
  const dietId = event.target.getAttribute("data-id");

  const confirmDelete = confirm(`Are you sure you want to delete DietPlan ID: ${dietId}?`);
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${apiBaseUrl}/dietplan/${dietId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete diet plan");
    }

    messageDiv.textContent = `✅ DietPlan ID ${dietId} deleted successfully.`;
    messageDiv.style.color = "green";

    // Refresh the list after deletion
    fetchDietPlans();

  } catch (error) {
    console.error("Delete error:", error);
    messageDiv.textContent = `❌ Error deleting: ${error.message}`;
    messageDiv.style.color = "red";
  }
}

// Event listeners
fetchDietBtn.addEventListener("click", fetchDietPlans);
window.addEventListener("load", fetchDietPlans);

