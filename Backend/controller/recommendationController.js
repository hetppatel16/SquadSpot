const { getRecommendations } = require("../algorithms/recommendationAlgorithm");

function recommendPlaces(req, res) {
  const { city, people, budget, category } = req.body;

  // Validation
  if (!city || !people || !budget) {
    return res.status(400).json({
      error: "city, people and budget are required"
    });
  }

  if (people <= 0 || budget <= 0) {
    return res.status(400).json({
      error: "people and budget must be positive numbers"
    });
  }

  const results = getRecommendations(city, people, budget, category);

  return res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
}

module.exports = { recommendPlaces };
