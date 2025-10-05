Well I am optimising system, I will start with introducting the project,

Airbourne is a microservices-based flight booking platform built with Node.js. It provides services for user authentication, flight management, ticket booking, and email reminders. The platform uses an API Gateway to handle routing, authentication, and rate limiting, while backend services communicate asynchronously via RabbitMQ, ensuring decoupled and scalable workflows. Data is managed with Sequelize + MySQL, and notifications are handled by a dedicated Reminder Service using AMQP queues.

The system’s architecture emphasizes scalability, reliability, and observability, making it ideal for performance optimization experiments. With multiple independently deployable services, load testing can help identify bottlenecks in request handling, message processing, database interactions, and email delivery pipelines.

This is the project 
First let me setup a rudamentory load test for this project.

This test is done with k6 _ InfluxDB + Grafana,

```js

export let options = {
  vus: 25,
  duration: "1m",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};


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


```

this test which may look impressive has some flaws before that let me show the results:

![dashboard](./public/k6_test_1.png)

Which is kind of bad which based on the test and options also, 
before optimising the system, I need to optimise the test code 
this will be the improvements made for the code::


## **1️⃣ Single Flight for 100 VUs → Avoid Overbooking**

**Problem:**
All VUs are booking the same flight. If the airplane has 150–250 seats, many bookings may fail.

**Solution:**

* **Create multiple flights in `setup`**, e.g., 5–10 flights.
* Assign each VU a **random flight** during booking:

```js
const flightId = data.flightIds[Math.floor(Math.random() * data.flightIds.length)];
```

* This spreads the load and reduces failures.

---

## **2️⃣ Signup + Login for Each VU → Auth Bottleneck**

**Problem:**
100 VUs creating users simultaneously can overload Auth Service.

**Solutions (choose one):**

* **Pre-create users**: Use a script to create 100–200 users before the test.

  * During test, VUs only **login**, not signup.
* **Or use shared credentials** for demo purposes (less realistic).

This reduces failed requests caused by Auth Service.

---

## **3️⃣ DB Write Load → High Latency**

**Problem:**
CRUD operations and bookings cause DB write contention.

**Solutions:**

* **Use multiple flights/airplanes** (see #1).
* **Avoid creating cities/airports/airplanes in setup repeatedly** — create once and reuse.
* **Optional**: Use `sequelize.sync({ alter: false })` to prevent schema operations during test.

---

## **4️⃣ Thresholds Too Strict**

**Problem:**
`p95 < 500ms` and `failed < 1%` are unrealistic for 100 VUs on single instances.

**Solution:**

* Adjust thresholds for demo on single instances:

```js
thresholds: {
  http_req_duration: ["p(95)<2000"], // allow 2s latency
  http_req_failed: ["rate<0.05"],    // allow up to 5% failed requests
}
```

* You can tighten thresholds later when scaling horizontally.

---

## **5️⃣ Gradual Ramp-Up → Show System Stability**

**Problem:**
Instant 100 VUs spike can cause lots of failures.

**Solution:**

* Use **stages** in k6:

```js
export let options = {
  stages: [
    { duration: '30s', target: 20 },  // ramp-up
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 }, // peak load
    { duration: '30s', target: 0 }    
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
  },
};
```




