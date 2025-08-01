const form = document.getElementById("createDietForm");
const message = document.getElementById("createMessage");
const apiBaseUrl = "http://localhost:3000";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newDiet = {
    UserID: parseInt(form.elements["userId"].value),
    MealName: form.elements["mealName"].value.trim(),
    Calories: parseInt(form.elements["calories"].value),
    MealType: form.elements["mealType"].value,
    MealDate: form.elements["mealDate"].value,
    Notes: form.elements["notes"].value.trim(),
  };

  try {
    const response = await fetch(`${apiBaseUrl}/dietplan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDiet),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to create diet plan");
    }

    const createdDiet = await response.json();

    message.textContent = `✅ Created successfully! MealID: ${createdDiet.MealID}`;
    message.style.color = "green";
    form.reset();

  } catch (error) {
    message.textContent = `❌ Error: ${error.message}`;
    message.style.color = "red";
  }


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
