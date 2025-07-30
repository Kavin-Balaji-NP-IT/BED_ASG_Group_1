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
