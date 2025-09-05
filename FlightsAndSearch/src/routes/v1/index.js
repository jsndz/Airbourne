const express = require("express");
const CityController = require("../../controllers/city-controller");
const FlightController = require("../../controllers/flight-controller");
const AirportController = require("../../controllers/airport-controller");
const AirplaneController = require("../../controllers/airplane-controller");

const { flightMiddleware } = require("../../middlewares/index");

const router = express.Router();

// City
router.post("/city", CityController.create);
router.delete("/city/:id", CityController.destroy);
router.get("/city/:id", CityController.get);
router.patch("/city/:id", CityController.update);
router.get("/city/", CityController.getAll);

// Airplane
router.post("/airplane", AirplaneController.create);
router.delete("/airplane/:id", AirplaneController.destroy);
router.get("/airplane/:id", AirplaneController.get);
router.patch("/airplane/:id", AirplaneController.update);
router.get("/airplane/", AirplaneController.getAll);

// Flights
router.post(
  "/flights",
  flightMiddleware.validateCreateFlight,
  FlightController.create
);
router.get("/flights", FlightController.getAll);
router.get("/flights/:id", FlightController.get);
router.patch("/flights/:id", FlightController.update);
router.delete("/flights/:id", FlightController.destroy);

// Airports
router.post("/airports", AirportController.create);
router.delete("/airports/:id", AirportController.destroy);
router.get("/airports/:id", AirportController.get);
router.patch("/airports/:id", AirportController.update);
router.get("/airports", AirportController.getAll);

module.exports = router;
