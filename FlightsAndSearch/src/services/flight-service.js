const {
  FlightRespository,
  AirplaneRespository,
} = require("../repository/index");
const { compareTime } = require("../utils/helper");

class FlightService {
  constructor() {
    this.airplaneRespository = new AirplaneRespository();
    this.flightrespository = new FlightRespository();
  }

  async createFlight(data) {
    try {
      if (!compareTime(data.arrivalTime, data.departureTime)) {
        throw { error: "Arrival cannot be less than departue time" };
      }

      const airplane = await this.airplaneRespository.getAirplane(
        data.airplaneId
      );
      const flight = await this.flightrespository.createFlight({
        ...data,
        totalSeats: airplane.capacity,
      });
      return flight;
    } catch (error) {
      console.log("Something went wrong at service layer");
      throw { error };
    }
  }

  async getAllflightData(data) {
    try {
      const flights = await this.flightrespository.getAllFlight(data);
      return flights;
    } catch (error) {
      console.log("Something went wrong at service layer");
      throw { error };
    }
  }

  async getFlight(flightId) {
    try {
      const flight = await this.flightrespository.getFlight(flightId);
      return flight;
    } catch (error) {
      console.log("Something went wrong at service layer");
      throw { error };
    }
  }

  async updateFlight(flightId, data) {
    try {
      const response = await this.flightrespository.updateFlight(
        flightId,
        data
      );
      return response;
    } catch (error) {
      console.log("Something went wrong at service layer");
      throw { error };
    }
  }
}

module.exports = FlightService;
