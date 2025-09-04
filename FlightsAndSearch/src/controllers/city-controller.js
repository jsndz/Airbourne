const { CityService } = require("../services/index");

const cityService = new CityService();

const create = async (req, res) => {
  try {
    const city = await cityService.createCity(req.body);
    console.log("HELLO");

    return res.status(201).json({
      data: city,
      sucess: true,
      message: "Successfully created a city",
      err: {},
    });
  } catch (error) {
    console.log(error);
    return req.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt create a city",
      err: { error },
    });
  }
};

const destroy = async (req, res) => {
  try {
    const response = await cityService.deleteCity(req.params.id);
    return res.status(200).json({
      data: response,
      sucess: true,
      message: "successfully deleted a city",
      err: {},
    });
  } catch (error) {
    console.log(error);

    return req.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt delete a city",
      err: { error },
    });
  }
};

const update = async (req, res) => {
  try {
    const response = await cityService.updateCity(req.params.id, req.body);
    return res.status(200).json({
      data: response,
      sucess: true,
      message: "successfully updated a city",
      err: {},
    });
  } catch (error) {
    console.log(error);
    return req.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt update a city",
      err: { error },
    });
  }
};

const get = async (req, res) => {
  try {
    const response = await cityService.getCity(req.params.id);
    return res.status(200).json({
      data: response,
      sucess: true,
      message: "successfully got a city",
      err: {},
    });
  } catch (error) {
    console.log(error);

    return req.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt get a city",
      err: { error },
    });
  }
};
const getAll = async (req, res) => {
  try {
    const cities = await cityService.getAllCities(req.query);
    return res.status(200).json({
      data: cities,
      sucess: true,
      message: "successfully got a city",
      err: {},
    });
  } catch (error) {
    console.log(error);

    return req.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt get a city",
      err: { error },
    });
  }
};

module.exports = {
  create,
  destroy,
  get,
  update,
  getAll,
};
