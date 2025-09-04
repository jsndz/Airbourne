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
  test(" Creating Cities", async () => {
    const res = await axios.post(`${FLIGHTS_URL}/api/v1/city`, {
      name: "Mumbai",
    });
    console.log(res);

    expect(res.status).toBe(201);
  });
  test("city is unique ", async () => {
    const res = await axios.post(`${FLIGHTS_URL}/api/v1/city`, {
      name: "Mumbai",
    });
    console.log(res);

    expect(res.status).toBe(500);
  });
});

describe.skip("flights", () => {
  test(" Creating flights", async () => {});
});
