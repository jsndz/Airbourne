import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 20 },
    { duration: "30s", target: 50 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    "http_req_duration{operation:login}": ["p(95)<300"],
    "http_req_duration{operation:booking}": ["p(95)<2000", "p(99)<5000"],
    "http_req_duration{operation:setup}": ["p(95)<500"],
    "http_req_failed{operation:booking}": ["rate<0.05"],
    "checks{check:booking_success}": ["rate>0.95"],
  },
};

function randStr(prefix) {
  return `${prefix}_${Math.floor(Math.random() * 100000)}`;
}

export function setup() {
  const FLIGHTS_URL = "http://flights-service:3002";
  const SERVER_URL = "http://auth-service:3001";

  console.log("Creating cities...");
  const city1 = http.post(
    `${FLIGHTS_URL}/api/v1/city`,
    JSON.stringify({ name: randStr("City") }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { operation: "setup" },
    }
  );
  const city2 = http.post(
    `${FLIGHTS_URL}/api/v1/city`,
    JSON.stringify({ name: randStr("City") }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { operation: "setup" },
    }
  );

  const city1Id = JSON.parse(city1.body)?.data?.id;
  const city2Id = JSON.parse(city2.body)?.data?.id;
  console.log(`City IDs: ${city1Id}, ${city2Id}`);

  console.log("Creating airports...");
  const depAirport = http.post(
    `${FLIGHTS_URL}/api/v1/airports`,
    JSON.stringify({
      name: randStr("DepAirport"),
      address: randStr("Address"),
      cityId: city1Id,
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { operation: "setup" },
    }
  );
  const departureAirportId = JSON.parse(depAirport.body)?.data?.id;
  console.log(`Departure Airport ID: ${departureAirportId}`);

  const arrAirport = http.post(
    `${FLIGHTS_URL}/api/v1/airports`,
    JSON.stringify({
      name: randStr("ArrAirport"),
      address: randStr("Address"),
      cityId: city2Id,
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { operation: "setup" },
    }
  );
  const arrivalAirportId = JSON.parse(arrAirport.body)?.data?.id;
  console.log(`Arrival Airport ID: ${arrivalAirportId}`);

  console.log("Creating airplane...");
  const airplane = http.post(
    `${FLIGHTS_URL}/api/v1/airplane`,
    JSON.stringify({
      modelNumber: randStr("Boeing"),
      capacity: 100000,
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { operation: "setup" },
    }
  );
  const airplaneId = JSON.parse(airplane.body)?.data?.id;
  console.log(`Airplane ID: ${airplaneId}`);

  let flightIds = [];
  console.log("Creating flights...");
  for (let i = 0; i < 50; i++) {
    const flightBody = {
      flightNumber: randStr("FN"),
      airplaneId,
      departureAirportID: departureAirportId,
      arrivalAirportId,
      departureTime: `2025-10-${10 + Math.floor(i / 24)}T${i % 24}:00:00Z`,
      arrivalTime: `2025-10-${10 + Math.floor(i / 24)}T${(i % 24) + 2}:00:00Z`,
      price: 5000,
      boardingGate: randStr("Gate"),
    };
    const flight = http.post(
      `${FLIGHTS_URL}/api/v1/flights`,
      JSON.stringify(flightBody),
      {
        headers: { "Content-Type": "application/json" },
        tags: { operation: "setup" },
      }
    );
    const flightId = JSON.parse(flight.body)?.data?.id;
    console.log(`Flight ${i} ID: ${flightId}`);
    flightIds.push(flightId);
  }

  let userData = [];
  console.log("Creating test users...");
  for (let i = 0; i < 50; i++) {
    const email = `${randStr("user")}@test.com`;
    const password = "password123";
    const signupRes = http.post(
      `${SERVER_URL}/api/v1/signup`,
      JSON.stringify({ email, password }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { operation: "setup" },
      }
    );

    const loginRes = http.post(
      `${SERVER_URL}/api/v1/signin`,
      JSON.stringify({
        email: email,
        password: "password123",
      }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { operation: "login" },
      }
    );
    let parsed;
    try {
      parsed = JSON.parse(loginRes.body);
    } catch (e) {
      console.error("Login JSON parse failed", loginRes.body);
      return;
    }

    const token = parsed.data?.token;
    const userId = parsed.data?.id;
    userData.push({ token, userId });
  }

  return { flightIds, userData };
}

export default function (data) {
  const API_GATEWAY = "http://api-gateway:3005";
  const user = data.userData[Math.floor(Math.random() * data.userData.length)];

  const numBookings = 1 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numBookings; i++) {
    const bookingPayload = {
      flightId:
        data.flightIds[Math.floor(Math.random() * data.flightIds.length)],
      userId: user.userId,
      NoOfSeats: 1 + Math.floor(Math.random() * 4),
    };

    const res = http.post(
      `${API_GATEWAY}/bookingservice/api/v1/bookings`,
      JSON.stringify(bookingPayload),
      {
        headers: {
          "Content-Type": "application/json",
          "x-access-token": user.token,
        },
        tags: { operation: "booking" },
      }
    );

    check(
      res,
      {
        booking_success: (r) => r.status === 200 || r.status === 201,
        booking_fast: (r) => r.timings.duration < 1000,
        booking_no_timeout: (r) => r.status !== 0,
      },
      { check: "booking_success" }
    );

    if (i < numBookings - 1) {
      sleep(0.3);
    }
  }
  sleep(1 + Math.random() * 2);
}
