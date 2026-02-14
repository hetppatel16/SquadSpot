const places = require("../Data/places");

function getRecommendations(city, people, budget, category) {
  return places.filter(place => {
    const totalCost = place.costPerPerson * people;

    const matchesCity = place.city.toLowerCase() === city.toLowerCase();
    const matchesBudget = totalCost <= budget;
    const matchesCategory = category ? place.category === category : true;

    return matchesCity && matchesBudget && matchesCategory;
  });
}

module.exports = { getRecommendations };
