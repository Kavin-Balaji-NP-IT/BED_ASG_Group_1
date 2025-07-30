const form = document.getElementById("editDietForm");
const editMessage = document.getElementById("editMessage");
const apiBaseUrl = "http://localhost:3000";

// Helper: get query param from URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Load diet plan data by MealID and fill the form
async function loadDietPlan() {
  const mealId = getQueryParam("id");
  if (!mealId) {
    editMessage.textContent = "No MealID provided in URL.";
    editMessage.style.color = "red";
    form.style.display = "none";
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/dietplan/${mealId}`);
    if (!response.ok) {
      throw new Error(`Failed to load diet plan. Status: ${response.status}`);
    }
    const diet = await response.json();

    // Fill form inputs
    form.mealId.value = diet.MealID || "";
    form.userId.value = diet.UserID || "";
    form.mealName.value = diet.MealName || "";
    form.calories.value = diet.Calories || "";
    form.mealType.value = diet.MealType || "";
    // Format date as yyyy-mm-dd for input[type=date]
    form.mealDate.value = diet.MealDate ? new Date(diet.MealDate).toISOString().slice(0,10) : "";
    form.notes.value = diet.Notes || "";

  } catch (error) {
    editMessage.textContent = `❌ ${error.message}`;
    editMessage.style.color = "red";
    form.style.display = "none";
  }
}

// Handle form submission for update
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const mealId = form.mealId.value;
  const updatedDiet = {
    UserID: parseInt(form.userId.value),
    MealName: form.mealName.value.trim(),
    Calories: parseInt(form.calories.value),
    MealType: form.mealType.value,
    MealDate: form.mealDate.value,
    Notes: form.notes.value.trim(),
  };

  try {
    const response = await fetch(`${apiBaseUrl}/dietplan/${mealId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedDiet),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to update diet plan");
    }

    editMessage.textContent = `✅ Updated successfully!`;
    editMessage.style.color = "green";
  } catch (error) {
    editMessage.textContent = `❌ Error: ${error.message}`;
    editMessage.style.color = "red";
  }
});

// Load data on page load
window.addEventListener("load", loadDietPlan);
