import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "10s", target: 0 },
    { duration: "10s", target: 100 },
    { duration: "10s", target: 0 },
    { duration: "10s", target: 200 },
    { duration: "10s", target: 0 },
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

  const city1Res = http.post(
    `${FLIGHTS_URL}/api/v1/city`,
    JSON.stringify({ name: randStr("City") }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { operation: "setup" },
    }
  );
  const city2Res = http.post(
    `${FLIGHTS_URL}/api/v1/city`,
    JSON.stringify({ name: randStr("City") }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { operation: "setup" },
    }
  );

  const city1Id = JSON.parse(city1Res.body)?.data?.id;
  const city2Id = JSON.parse(city2Res.body)?.data?.id;

  if (!city1Id || !city2Id) throw new Error("City creation failed");

  const depAirportRes = http.post(
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
  const arrAirportRes = http.post(
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

  const departureAirportId = JSON.parse(depAirportRes.body)?.data?.id;
  const arrivalAirportId = JSON.parse(arrAirportRes.body)?.data?.id;

  if (!departureAirportId || !arrivalAirportId)
    throw new Error("Airport creation failed");

  const airplaneRes = http.post(
    `${FLIGHTS_URL}/api/v1/airplane`,
    JSON.stringify({ modelNumber: randStr("Boeing"), capacity: 100000 }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { operation: "setup" },
    }
  );
  const airplaneId = JSON.parse(airplaneRes.body)?.data?.id;
  if (!airplaneId) throw new Error("Airplane creation failed");

  let flightIds = [];
  for (let i = 0; i < 50; i++) {
    const baseDay = 10 + Math.floor(i / 24);
    const baseHour = i % 24;
    const arrivalHour = (baseHour + 2) % 24;
    const arrivalDay = baseDay + Math.floor((baseHour + 2) / 24);

    const flightBody = {
      flightNumber: randStr("FN"),
      airplaneId,
      departureAirportID: departureAirportId,
      arrivalAirportId,
      departureTime: `2025-10-${baseDay}T${String(baseHour).padStart(
        2,
        "0"
      )}:00:00Z`,
      arrivalTime: `2025-10-${arrivalDay}T${String(arrivalHour).padStart(
        2,
        "0"
      )}:00:00Z`,
      price: 5000,
      boardingGate: randStr("Gate"),
    };
    const flightRes = http.post(
      `${FLIGHTS_URL}/api/v1/flights`,
      JSON.stringify(flightBody),
      {
        headers: { "Content-Type": "application/json" },
        tags: { operation: "setup" },
      }
    );
    const flightId = JSON.parse(flightRes.body)?.data?.id;

    if (flightId) {
      flightIds.push(flightId);
    } else {
      console.error(
        `Flight ${i} creation failed -> Response: ${flightRes.body}`
      );
    }
  }
  if (flightIds.length === 0)
    throw new Error("No flights created successfully");

  let userData = [];
  for (let i = 0; i < 50; i++) {
    const email = `${randStr("user")}@test.com`;
    const password = "password123";

    http.post(
      `${SERVER_URL}/api/v1/signup`,
      JSON.stringify({ email, password }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { operation: "setup" },
      }
    );
    const loginRes = http.post(
      `${SERVER_URL}/api/v1/signin`,
      JSON.stringify({ email, password }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { operation: "login" },
      }
    );

    let parsed;
    try {
      parsed = JSON.parse(loginRes.body);
    } catch (e) {
      console.error(
        `User login failed for ${email} -> Response: ${loginRes.body}`
      );
      continue;
    }

    const token = parsed.data?.token;
    const userId = parsed.data?.id;
    if (token && userId) {
      userData.push({ token, userId });
    }
  }
  if (userData.length === 0) throw new Error("No users created successfully");

  return { flightIds, userData };
}

export default function (data) {
  const API_GATEWAY = "http://api-gateway:3005";
  const user = data.userData[Math.floor(Math.random() * data.userData.length)];

  if (!user) {
    console.error("No valid user available for booking");
    return;
  }

  const numBookings = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numBookings; i++) {
    const validFlights = data.flightIds.filter((f) => f != null);
    if (validFlights.length === 0) {
      console.error("No valid flights available for booking");
      return;
    }

    const flightId =
      validFlights[Math.floor(Math.random() * validFlights.length)];
    const bookingPayload = {
      flightId,
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

    check(res, {
      booking_success: (r) => r.status === 200 || r.status === 201,
      booking_fast: (r) => r.timings.duration < 1000,
      booking_no_timeout: (r) => r.status !== 0,
    });

    if (i < numBookings - 1) sleep(0.3);
  }

  sleep(1 + Math.random() * 2);
}
