const form = document.getElementById("createDietForm");
const messageDiv = document.getElementById("createMessage");
const apiBaseUrl = "http://localhost:3000";

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(form);
  const newDiet = {
    UserID: parseInt(formData.get("userId")),      // PascalCase here!
    MealName: formData.get("mealName"),
    Calories: parseInt(formData.get("calories")),
    MealType: formData.get("mealType"),
    MealDate: formData.get("mealDate"),
    Notes: formData.get("notes"),
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
