const { FlightService } = require("../services/index");
const { successCodes } = require("../utils/error-codes");

const flightService = new FlightService();

const create = async (req, res) => {
  try {
    const flightRequestBody = {
      flightNumber: req.body.flightNumber,
      airplaneId: req.body.airplaneId,
      departureAirportID: req.body.departureAirportID,
      arrivalAirportId: req.body.arrivalAirportId,
      arrivalTime: req.body.arrivalTime,
      departureTime: req.body.departureTime,
      price: req.body.price,
    };
    const flight = await flightService.createFlight(flightRequestBody);
    return res.status(successCodes.created).json({
      data: flight,
      success: true,
      err: {},
      message: "Successfully created a flight",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt create a flight",
      err: { error },
    });
  }
};

const getAll = async (req, res) => {
  try {
    const flights = await flightService.getAllflightData(req.query);
    return res.status(successCodes.OK).json({
      data: flights,
      success: true,
      err: {},
      message: "Successfully got flights",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt get flights",
      err: { error },
    });
  }
};

const get = async (req, res) => {
  try {
    const response = await flightService.getFlight(req.params.id);
    console.log(response);
    
    return res.status(successCodes.OK).json({
      data: response,
      success: true,
      err: {},
      message: "Successfully got flight",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt get flight",
      err: { error },
    });
  }
};

const update = async (req, res) => {
  try {
    const response = await flightService.updateFlight(req.params.id, req.body);
    return res.status(successCodes.OK).json({
      data: response,
      success: true,
      err: {},
      message: "Successfully updated flight",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt updated flight",
      err: { error },
    });
  }
};
const destroy = async (req, res) => {
  try {
    const response = await flightService.deleteFlight(req.params.id);
    console.log(response);

    return res.status(successCodes.OK).json({
      data: response,
      success: true,
      err: {},
      message: "Successfully deleted flight",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt deleted flight",
      err: { error },
    });
  }
};

module.exports = {
  create,
  getAll,
  get,
  update,
  destroy,
};
