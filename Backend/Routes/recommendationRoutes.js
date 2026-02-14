const express = require('express');
const router = express.Router();

// router.get('/', (req, res) => {
//     res.json({ message: "Recommendation route working" });
// });


const { recommendPlaces } = require("../controller/recommendationController");

router.post("/getRecommendations", recommendPlaces);


module.exports = router;
