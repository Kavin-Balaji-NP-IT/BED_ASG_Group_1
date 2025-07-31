const form = document.getElementById("editDietForm");
const messageDiv = document.getElementById("editMessage");
const apiBaseUrl = "http://localhost:3000";

// Pre-fill form from URL params
window.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded");  // <-- check if script runs

  const urlParams = new URLSearchParams(window.location.search);
  const mealId = urlParams.get("id");
  console.log("Meal ID from URL:", mealId);  // <-- check URL param

  if (!mealId) {
    messageDiv.textContent = "❌ Meal ID not provided.";
    messageDiv.style.color = "red";
    return;
  }

  try {
    const res = await fetch(`${apiBaseUrl}/dietplan/${mealId}`);
    console.log("Fetch response status:", res.status); // <-- check fetch status

    if (!res.ok) throw new Error("Meal not found");

    const data = await res.json();
    console.log("Data received:", data);  // <-- check returned data

    document.getElementById("mealId").value = data.MealID;
    document.getElementById("userId").value = data.UserID;
    document.getElementById("mealName").value = data.MealName;
    document.getElementById("calories").value = data.Calories;
    document.getElementById("mealType").value = data.MealType;
    document.getElementById("mealDate").value = data.MealDate.split("T")[0];
    document.getElementById("notes").value = data.Notes || "";
  } catch (err) {
    console.error("Load error:", err);
    messageDiv.textContent = `❌ Error loading data: ${err.message}`;
    messageDiv.style.color = "red";
  }
});

// Handle form submission to update diet plan
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const updatedDiet = {
    UserID: parseInt(document.getElementById("userId").value),
    MealName: document.getElementById("mealName").value.trim(),
    Calories: parseInt(document.getElementById("calories").value),
    MealType: document.getElementById("mealType").value,
    MealDate: document.getElementById("mealDate").value,
    Notes: document.getElementById("notes").value.trim(),
  };

  try {
    const mealId = document.getElementById("mealId").value;
    const res = await fetch(`${apiBaseUrl}/dietplan/${mealId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedDiet),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to update diet plan");
    }

    messageDiv.textContent = "✅ Updated successfully!";
    messageDiv.style.color = "green";
  } catch (err) {
    messageDiv.textContent = `❌ Error updating diet plan: ${err.message}`;
    messageDiv.style.color = "red";
  }
});
