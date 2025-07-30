const form = document.getElementById("editDietForm");
const messageDiv = document.getElementById("editMessage");
const apiBaseUrl = "http://localhost:3000";

function goBack() {
  window.location.href = "index.html";
}

// Pre-fill form from URL params
window.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mealId = urlParams.get("mealId");

  if (!mealId) {
    messageDiv.textContent = "❌ Meal ID not provided.";
    return;
  }

  try {
    const res = await fetch(`${apiBaseUrl}/dietplan/${mealId}`);
    if (!res.ok) throw new Error("Meal not found");

    const data = await res.json();
    document.getElementById("mealId").value = data.MealID;
    document.getElementById("userId").value = data.UserID;
    document.getElementById("mealName").value = data.MealName;
    document.getElementById("calories").value = data.Calories;
    document.getElementById("mealType").value = data.MealType;
    document.getElementById("mealDate").value = data.MealDate.split("T")[0]; // Date only
    document.getElementById("notes").value = data.Notes || "";
  } catch (err) {
    console.error("Load error:", err);
    messageDiv.textContent = `❌ Error loading data: ${err.message}`;
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const updatedDiet = {
    userId: parseInt(form.userId.value),
    mealName: form.mealName.value,
    calories: parseInt(form.calories.value),
    mealType: form.mealType.value,
    mealDate: form.mealDate.value,
    notes: form.notes.value,
  };

  const mealId = parseInt(form.mealId.value);

  try {
    const res = await fetch(`${apiBaseUrl}/dietplan/${mealId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedDiet),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to update meal");
    }

    messageDiv.textContent = "✅ Updated successfully!";
    messageDiv.style.color = "green";
  } catch (err) {
    console.error("Update error:", err);
    messageDiv.textContent = `❌ Error: ${err.message}`;
    messageDiv.style.color = "red";
  }
});
