const { AirplaneService } = require("../services/index");

const airplaneService = new AirplaneService();

const create = async (req, res) => {
  try {
    const airplane = await airplaneService.create(req.body);

    return res.status(201).json({
      data: airplane,
      sucess: true,
      message: "Successfully created a airplane",
      err: {},
    });
  } catch (error) {
    console.log(error);
    return req.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt create a airplane",
      err: { error },
    });
  }
};

const destroy = async (req, res) => {
  try {
    const response = await airplaneService.destroy(req.params.id);
    return res.status(200).json({
      data: response,
      sucess: true,
      message: "successfully deleted a airplane",
      err: {},
    });
  } catch (error) {
    console.log(error);

    return req.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt delete a airplane",
      err: { error },
    });
  }
};

const update = async (req, res) => {
  try {
    const response = await airplaneService.update(req.params.id, req.body);
    return res.status(200).json({
      data: response,
      sucess: true,
      message: "successfully updated a airplane",
      err: {},
    });
  } catch (error) {
    console.log(error);
    return req.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt update a airplane",
      err: { error },
    });
  }
};

const get = async (req, res) => {
  try {
    const response = await airplaneService.get(req.params.id);
    return res.status(200).json({
      data: response,
      sucess: true,
      message: "successfully got a airplane",
      err: {},
    });
  } catch (error) {
    console.log(error);

    return req.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt get a airplane",
      err: { error },
    });
  }
};
const getAll = async (req, res) => {
  try {
    const cities = await airplaneService.getAll(req.query);
    return res.status(200).json({
      data: cities,
      sucess: true,
      message: "successfully got a airplane",
      err: {},
    });
  } catch (error) {
    console.log(error);

    return req.status(500).json({
      data: {},
      sucess: false,
      message: "couldnt get a airplane",
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
