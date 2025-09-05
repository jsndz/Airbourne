const CrudService = require("./crud-service");
const { AirplaneRespository } = require("../repository/index");

class AirplaneService extends CrudService {
  constructor() {
    const airplaneRespository = new AirplaneRespository();
    super(airplaneRespository);
  }
}

module.exports = AirplaneService;
