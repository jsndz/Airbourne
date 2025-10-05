import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  vus: 100,
  duration: "1m",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

function randStr(prefix) {
  return `${prefix}_${Math.floor(Math.random() * 100000)}`;
}

export function setup() {
  const FLIGHTS_URL = "http://flights-service:3002";


  const city1 = http.post(`${FLIGHTS_URL}/api/v1/city`, JSON.stringify({ name: randStr("City") }), {
    headers: { "Content-Type": "application/json" },
  });
  const city2 = http.post(`${FLIGHTS_URL}/api/v1/city`, JSON.stringify({ name: randStr("City") }), {
    headers: { "Content-Type": "application/json" },
  });


  const city1Id = JSON.parse(city1.body)?.data?.id;
  const city2Id = JSON.parse(city2.body)?.data?.id;



  const depAirport = http.post(`${FLIGHTS_URL}/api/v1/airports`, JSON.stringify({
    name: randStr("DepAirport"),
    address: randStr("Address"),
    cityId: city1Id,
  }), { headers: { "Content-Type": "application/json" } });


  const departureAirportId = JSON.parse(depAirport.body)?.data?.id;

  const arrAirport = http.post(`${FLIGHTS_URL}/api/v1/airports`, JSON.stringify({
    name: randStr("ArrAirport"),
    address: randStr("Address"),
    cityId: city2Id,
  }), { headers: { "Content-Type": "application/json" } });


  const arrivalAirportId = JSON.parse(arrAirport.body)?.data?.id;

  const airplane = http.post(`${FLIGHTS_URL}/api/v1/airplane`, JSON.stringify({
    modelNumber: randStr("Boeing"),
    capacity: 150 + Math.floor(Math.random() * 100),
  }), { headers: { "Content-Type": "application/json" } });


  const airplaneId = JSON.parse(airplane.body)?.data?.id;

  let flightBody = {
    flightNumber: randStr("FN"),
    airplaneId: airplaneId,
    departureAirportID: departureAirportId,
    arrivalAirportId: arrivalAirportId,
    departureTime: "2025-10-10T10:00:00Z",
    arrivalTime: "2025-10-10T12:00:00Z",
    price: 5000,
    boardingGate: randStr("Gate"),
  }
  
  const flight = http.post(`${FLIGHTS_URL}/api/v1/flights`, JSON.stringify(flightBody), { headers: { "Content-Type": "application/json" } });
  const flightId = JSON.parse(flight.body)?.data?.id;
 return {flightId}

}
export default function (data) {
  const API_GATEWAY = "http://api-gateway:3005";
const SERVER_URL = "http://auth-service:3001";

const email = `${randStr("user")}@test.com`;
  const password = "password123";

  const signupRes = http.post(`${SERVER_URL}/api/v1/signup`, JSON.stringify({ email, password }), {
    headers: { "Content-Type": "application/json" },
  });

  const loginRes = http.post(`${SERVER_URL}/api/v1/signin`, JSON.stringify({ email, password }), {
    headers: { "Content-Type": "application/json" },
  });
  let parsed;
  try {
    parsed = JSON.parse(loginRes.body);
  } catch (e) {
    parsed = {};
  }
   const token = parsed.data?.token;
  const userId = parsed.data?.id;
  const bookingPayload = {
    flightId: data.flightId,
    userId: userId,
    NoOfSeats: 1 + Math.floor(Math.random() * 5),
  };


  const res = http.post(`${API_GATEWAY}/bookingservice/api/v1/bookings`,
    JSON.stringify(bookingPayload),
    {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    }
  );
  


  check(res, {
    "booking response received": (r) => r.status === 200,
  });

  sleep(1);
}
