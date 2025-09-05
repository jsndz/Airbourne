const axioslib = require("axios");

const axios = {
  post: async (...args) => {
    try {
      const res = await axioslib.post(...args);
      return res;
    } catch (error) {
      return error.response;
    }
  },

  get: async (...args) => {
    try {
      const res = await axioslib.get(...args);
      return res;
    } catch (error) {
      return error.response;
    }
  },

  put: async (...args) => {
    try {
      const res = await axioslib.put(...args);
      return res;
    } catch (error) {
      return error.response;
    }
  },

  delete: async (...args) => {
    try {
      const res = await axioslib.delete(...args);
      return res;
    } catch (error) {
      return error.response;
    }
  },
  patch: async (...args) => {
    try {
      const res = await axioslib.patch(...args);
      return res;
    } catch (error) {
      return error.response;
    }
  },
};

const SERVER_URL = "http://localhost:3001";
const FLIGHTS_URL = "http://localhost:3002";
describe.skip("auth", () => {
  test("Signup succeeds ", async () => {
    const email = `admin${Math.random()}@test.com`;
    const password = "qwerty123";
    await axios.post(`${SERVER_URL}/api/v1/signup`, {
      email,
      password,
    });
    const res = await axios.post(`${SERVER_URL}/api/v1/signin`, {
      email,
      password,
    });

    expect(res.status).toBe(200);
  });

  test("User is able to signup only once", async () => {
    const email = `admin${Math.random()}@test.com`;
    const password = "qwerty123";
    const res = await axios.post(`${SERVER_URL}/api/v1/signup`, {
      email,
      password,
    });
    expect(res.status).toBe(201);
    const newRes = await axios.post(`${SERVER_URL}/api/v1/signup`, {
      email,
      password,
    });
    expect(newRes.status).toBe(500);
  });
  test("Signup request fails if the username is empty", async () => {
    const email = `admin${Math.random()}@test.com`;
    const password = "qwerty123";
    const res = await axios.post(`${SERVER_URL}/api/v1/signup`, {
      password,
    });

    expect(res.status).toBe(400);
  });
  test("Signin succeeds if the username and password are correct", async () => {
    const email = `admin${Math.random()}@test.com`;
    const password = "qwerty123";
    await axios.post(`${SERVER_URL}/api/v1/signup`, {
      email,
      password,
    });
    const res = await axios.post(`${SERVER_URL}/api/v1/signin`, {
      email,
      password,
    });
    expect(res.status).toBe(200);
    console.log(res.data);

    expect(res.data).toBeDefined();
  });
  test("Signin fails if the username and password are incorrect", async () => {
    const email = `admin${Math.random()}@test.com`;
    const password = "qwerty123";
    await axios.post(`${SERVER_URL}/api/v1/signup`, {
      email,
      password,
    });
    const res = await axios.post(`${SERVER_URL}/api/v1/signin`, {
      email,
      password: "wrongPassword",
    });
    expect(res.status).toBe(500);
  });
});

describe("cities", () => {
  const CityName = `City${Math.floor(Math.random() * 1000) % 100}`;
  let cityId = "";

  test(" Creating Cities", async () => {
    console.log(CityName);

    const res = await axios.post(`${FLIGHTS_URL}/api/v1/city`, {
      name: CityName,
    });
    cityId = res.data.data.id;
    expect(res.status).toBe(201);
  });

  test("to get the city", async () => {
    console.log(cityId);

    const res = await axios.get(`${FLIGHTS_URL}/api/v1/city/${cityId}`);
    expect(res.status).toBe(200);
  });
  test("to delete the city", async () => {
    const res = await axios.delete(`${FLIGHTS_URL}/api/v1/city/${cityId}`);
    expect(res.status).toBe(200);
  });
  test("to get all the city", async () => {
    const res = await axios.get(`${FLIGHTS_URL}/api/v1/city`);
    expect(res.status).toBe(200);
  });
});

describe("airplanes", () => {
  const modelNumber = `airplane${Math.floor(Math.random() * 1000) % 100}`;
  let airplaneId = "";

  test(" Creating airplane", async () => {
    const res = await axios.post(`${FLIGHTS_URL}/api/v1/airplane`, {
      modelNumber,
      capacity: 200,
    });
    airplaneId = res.data.data.id;
    expect(res.status).toBe(201);
  });

  test("to get the airplane", async () => {
    const res = await axios.get(`${FLIGHTS_URL}/api/v1/airplane/${airplaneId}`);
    expect(res.status).toBe(200);
  });
  test("to delete the airplane", async () => {
    const res = await axios.delete(
      `${FLIGHTS_URL}/api/v1/airplane/${airplaneId}`
    );
    expect(res.status).toBe(200);
  });
  test("to get all the airplane", async () => {
    const res = await axios.get(`${FLIGHTS_URL}/api/v1/airplane`);
    expect(res.status).toBe(200);
  });
});

describe("flights", () => {
  let flightId = "";
  let airplaneId = "";
  let departureAirportId = "";
  let arrivalAirportId = "";
  let city1Id = "";
  let city2Id = "";

  beforeAll(async () => {
    const city1 = await axios.post(`${FLIGHTS_URL}/api/v1/city`, {
      name: `City${Math.floor(Math.random() * 1000)}`,
    });
    city1Id = city1.data.data.id;

    const city2 = await axios.post(`${FLIGHTS_URL}/api/v1/city`, {
      name: `City${Math.floor(Math.random() * 1000)}`,
    });
    city2Id = city2.data.data.id;

    const depAirport = await axios.post(`${FLIGHTS_URL}/api/v1/airports`, {
      name: `DepAirport${Math.floor(Math.random() * 1000)}`,
      address: "Dep Address",
      cityId: city1Id,
    });
    departureAirportId = depAirport.data.data.id;

    const arrAirport = await axios.post(`${FLIGHTS_URL}/api/v1/airports`, {
      name: `ArrAirport${Math.floor(Math.random() * 1000)}`,
      address: "Arr Address",
      cityId: city2Id,
    });
    arrivalAirportId = arrAirport.data.data.id;

    const airplane = await axios.post(`${FLIGHTS_URL}/api/v1/airplane`, {
      modelNumber: `Boeing${Math.floor(Math.random() * 1000)}`,
      capacity: 180,
    });
    airplaneId = airplane.data.data.id;
  });

  test("Create flight", async () => {
    const flightRequestBody = {
      flightNumber: `FN${Math.floor(Math.random() * 1000)}`,
      airplaneId: airplaneId,
      departureAirportID: departureAirportId,
      arrivalAirportId: arrivalAirportId,
      departureTime: "2025-09-06T10:00:00Z",
      arrivalTime: "2025-09-06T12:00:00Z",
      price: 5000,
    };

    const res = await axios.post(
      `${FLIGHTS_URL}/api/v1/flights`,
      flightRequestBody
    );
    flightId = res.data.data.id;
    console.log(res.data);

    expect(res.status).toBe(201);
    expect(res.data.data.flightNumber).toBe(flightRequestBody.flightNumber);
  });

  test("Get flight by id", async () => {
    const res = await axios.get(`${FLIGHTS_URL}/api/v1/flights/${flightId}`);
    expect(res.status).toBe(200);
    expect(res.data.data.id).toBe(flightId);
  });

  test("Get all flights", async () => {
    const res = await axios.get(`${FLIGHTS_URL}/api/v1/flights`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test("Delete flight", async () => {
    const res = await axios.delete(`${FLIGHTS_URL}/api/v1/flights/${flightId}`);
    console.log(res.data);

    expect(res.status).toBe(200);
  });
});

describe("airports", () => {
  let cityId = "";
  let airportId = "";

  const CityName = `City${Math.floor(Math.random() * 1000)}`;

  beforeAll(async () => {
    const res = await axios.post(`${FLIGHTS_URL}/api/v1/city`, {
      name: CityName,
    });
    cityId = res.data.data.id;
    expect(res.status).toBe(201);
  });

  test("Create airport", async () => {
    const airportBody = {
      name: `Airport${Math.floor(Math.random() * 1000)}`,
      address: "Some address",
      cityId: cityId,
    };

    const res = await axios.post(`${FLIGHTS_URL}/api/v1/airports`, airportBody);
    airportId = res.data.data.id;

    expect(res.status).toBe(201);
    expect(res.data.data.name).toBe(airportBody.name);
    expect(res.data.data.cityId).toBe(cityId);
  });

  test("Get airport by id", async () => {
    const res = await axios.get(`${FLIGHTS_URL}/api/v1/airports/${airportId}`);
    expect(res.status).toBe(200);
    expect(res.data.data.id).toBe(airportId);
  });

  test("Update airport", async () => {
    const updatedBody = { address: "Updated address" };

    const res = await axios.patch(
      `${FLIGHTS_URL}/api/v1/airports/${airportId}`,
      updatedBody
    );

    expect(res.status).toBe(200);
  });

  test("Get all airports", async () => {
    const res = await axios.get(`${FLIGHTS_URL}/api/v1/airports`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test("Delete airport", async () => {
    const res = await axios.delete(
      `${FLIGHTS_URL}/api/v1/airports/${airportId}`
    );
    console.log(res.data);

    expect(res.status).toBe(200);
  });
});
