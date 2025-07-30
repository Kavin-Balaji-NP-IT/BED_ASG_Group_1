const form = document.getElementById("createDietForm");
const messageDiv = document.getElementById("createMessage");
const apiBaseUrl = "http://localhost:3000";

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(form);
  const newDiet = {
    userId: parseInt(formData.get("userId")),
    mealName: formData.get("mealName"),
    calories: parseInt(formData.get("calories")),
    mealType: formData.get("mealType"),
    mealDate: formData.get("mealDate"),
    notes: formData.get("notes"),
  };

  try {
    const response = await fetch(`${apiBaseUrl}/dietplan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDiet),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create diet plan");
    }

    const result = await response.json();
    messageDiv.textContent = `✅ Created successfully with MealID: ${result.MealID || "N/A"}`;
    messageDiv.style.color = "green";
    form.reset();
  } catch (err) {
    console.error("Create error:", err);
    messageDiv.textContent = `❌ Error: ${err.message}`;
    messageDiv.style.color = "red";
  }
});
