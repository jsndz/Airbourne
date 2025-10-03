import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  vus: 50, 
  duration: "1m", 
  thresholds: {
    http_req_duration: ["p(95)<500"], 
    http_req_failed: ["rate<0.01"],   
  },
};

export function setup() {
  const SERVER_URL = "http://localhost:3001";
  const FLIGHTS_URL = "http://localhost:3002";

  let city1 = http.post(`${FLIGHTS_URL}/api/v1/city`, JSON.stringify({ name: "CityA" }), {
    headers: { "Content-Type": "application/json" },
  });
  let city1Id = JSON.parse(city1.body).data.id;

  let city2 = http.post(`${FLIGHTS_URL}/api/v1/city`, JSON.stringify({ name: "CityB" }), {
    headers: { "Content-Type": "application/json" },
  });
  let city2Id = JSON.parse(city2.body).data.id;

  let depAirport = http.post(`${FLIGHTS_URL}/api/v1/airports`, JSON.stringify({
    name: "DepAirport",
    address: "Somewhere",
    cityId: city1Id,
  }), { headers: { "Content-Type": "application/json" } });
  let depAirportId = JSON.parse(depAirport.body).data.id;

  let arrAirport = http.post(`${FLIGHTS_URL}/api/v1/airports`, JSON.stringify({
    name: "ArrAirport",
    address: "Elsewhere",
    cityId: city2Id,
  }), { headers: { "Content-Type": "application/json" } });
  let arrAirportId = JSON.parse(arrAirport.body).data.id;

  let airplane = http.post(`${FLIGHTS_URL}/api/v1/airplane`, JSON.stringify({
    modelNumber: "Boeing777",
    capacity: 200,
  }), { headers: { "Content-Type": "application/json" } });
  let airplaneId = JSON.parse(airplane.body).data.id;

  let flight = http.post(`${FLIGHTS_URL}/api/v1/flights`, JSON.stringify({
    flightNumber: `FN${Math.floor(Math.random() * 1000)}`,
    airplaneId,
    departureAirportID: depAirportId,
    arrivalAirportId: arrAirportId,
    departureTime: "2025-10-10T10:00:00Z",
    arrivalTime: "2025-10-10T12:00:00Z",
    price: 5000,
  }), { headers: { "Content-Type": "application/json" } });
  let flightId = JSON.parse(flight.body).data.id;

  let email = `user${Math.floor(Math.random() * 1000)}@test.com`;
  let password = "password123";

  http.post(`${SERVER_URL}/api/v1/signup`, JSON.stringify({ email, password }), {
    headers: { "Content-Type": "application/json" },
  });
  let login = http.post(`${SERVER_URL}/api/v1/signin`, JSON.stringify({ email, password }), {
    headers: { "Content-Type": "application/json" },
  });
  let token = JSON.parse(login.body).data.token;
  let userId = JSON.parse(login.body).data.id;

  return { flightId, token, userId };
}

export default function (data) {
  const API_GATEWAY = "http://localhost:3005";
  let bookingPayload = {
    flightId: data.flightId,
    userId: data.userId,
    NoOfSeats: 2,
    totalCost: 10000,
    status: "InProcess",
  };

  let res = http.post(`${API_GATEWAY}/bookingservice/api/v1/bookings`, JSON.stringify(bookingPayload), {
    headers: {
      "Content-Type": "application/json",
      "x-access-token": data.token,
    },
  });

  check(res, {
    "booking created successfully": (r) => r.status === 200,
  });

  sleep(1); 
}
