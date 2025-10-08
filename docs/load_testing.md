Well I am optimising system, I will start with introducting the project,

Airbourne is a microservices-based flight booking platform built with Node.js. It provides services for user authentication, flight management, ticket booking, and email reminders. The platform uses an API Gateway to handle routing, authentication, and rate limiting, while backend services communicate asynchronously via RabbitMQ, ensuring decoupled and scalable workflows. Data is managed with Sequelize + MySQL, and notifications are handled by a dedicated Reminder Service using AMQP queues.

The system’s architecture emphasizes scalability, reliability, and observability, making it ideal for performance optimization experiments. With multiple independently deployable services, load testing can help identify bottlenecks in request handling, message processing, database interactions, and email delivery pipelines.

This is the project
First let me setup a rudamentory load test for this project.
Using p95 latency metrics: The 95th percentile (p95) is the value below which 95% of the observed data points fall.

This test is done with k6 \_ InfluxDB + Grafana,

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

  const city1 = http.post(
    `${FLIGHTS_URL}/api/v1/city`,
    JSON.stringify({ name: randStr("City") }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  const city2 = http.post(
    `${FLIGHTS_URL}/api/v1/city`,
    JSON.stringify({ name: randStr("City") }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  const city1Id = JSON.parse(city1.body)?.data?.id;
  const city2Id = JSON.parse(city2.body)?.data?.id;

  const depAirport = http.post(
    `${FLIGHTS_URL}/api/v1/airports`,
    JSON.stringify({
      name: randStr("DepAirport"),
      address: randStr("Address"),
      cityId: city1Id,
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  const departureAirportId = JSON.parse(depAirport.body)?.data?.id;

  const arrAirport = http.post(
    `${FLIGHTS_URL}/api/v1/airports`,
    JSON.stringify({
      name: randStr("ArrAirport"),
      address: randStr("Address"),
      cityId: city2Id,
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  const arrivalAirportId = JSON.parse(arrAirport.body)?.data?.id;

  const airplane = http.post(
    `${FLIGHTS_URL}/api/v1/airplane`,
    JSON.stringify({
      modelNumber: randStr("Boeing"),
      capacity: 150 + Math.floor(Math.random() * 100),
    }),
    { headers: { "Content-Type": "application/json" } }
  );

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
  };

  const flight = http.post(
    `${FLIGHTS_URL}/api/v1/flights`,
    JSON.stringify(flightBody),
    { headers: { "Content-Type": "application/json" } }
  );
  const flightId = JSON.parse(flight.body)?.data?.id;
  return { flightId };
}
export default function (data) {
  const API_GATEWAY = "http://api-gateway:3005";
  const SERVER_URL = "http://auth-service:3001";

  const email = `${randStr("user")}@test.com`;
  const password = "password123";

  const signupRes = http.post(
    `${SERVER_URL}/api/v1/signup`,
    JSON.stringify({ email, password }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  const loginRes = http.post(
    `${SERVER_URL}/api/v1/signin`,
    JSON.stringify({ email, password }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
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

  const res = http.post(
    `${API_GATEWAY}/bookingservice/api/v1/bookings`,
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

## **1 Single Flight for 100 VUs → Avoid Overbooking**

**Problem:**
All VUs are booking the same flight. If the airplane has 150–250 seats, many bookings may fail.

**Solution:**

- **Create multiple flights in `setup`**, e.g., 5–10 flights.
- Assign each VU a **random flight** during booking:

```js
const flightId =
  data.flightIds[Math.floor(Math.random() * data.flightIds.length)];
```

- This spreads the load and reduces failures.

---

## **Signup + Login for Each VU → Auth Bottleneck**

**Problem:**
100 VUs creating users simultaneously can overload Auth Service.

**Solutions (choose one):**

- **Pre-create users**: Use a script to create 100–200 users before the test.

  - During test, VUs only **login**, not signup.

- **Or use shared credentials** for demo purposes (less realistic).

This reduces failed requests caused by Auth Service.

---

## ** DB Write Load → High Latency**

**Problem:**
CRUD operations and bookings cause DB write contention.

**Solutions:**

- **Use multiple flights/airplanes** (see #1).
- **Avoid creating cities/airports/airplanes in setup repeatedly** — create once and reuse.
- **Optional**: Use `sequelize.sync({ alter: false })` to prevent schema operations during test.

---

## **Thresholds Too Strict**

**Problem:**
`p95 < 500ms` and `failed < 1%` are unrealistic for 100 VUs on single instances.

**Solution:**

- Adjust thresholds for demo on single instances:

```js
thresholds: {
  http_req_duration: ["p(95)<2000"], // allow 2s latency
  http_req_failed: ["rate<0.05"],    // allow up to 5% failed requests
}
```

- You can tighten thresholds later when scaling horizontally.

---

## **Gradual Ramp-Up → Show System Stability**

**Problem:**
Instant 100 VUs spike can cause lots of failures.

**Solution:**

- Use **stages** in k6:

```js
export let options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "30s", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
  },
};
```

New test code:

```js
import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  vus: 100,
  stages: [
    { duration: "30s", target: 20 },
    { duration: "30s", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
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
    { headers: { "Content-Type": "application/json" } }
  );
  const city2 = http.post(
    `${FLIGHTS_URL}/api/v1/city`,
    JSON.stringify({ name: randStr("City") }),
    { headers: { "Content-Type": "application/json" } }
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
    { headers: { "Content-Type": "application/json" } }
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
    { headers: { "Content-Type": "application/json" } }
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
    { headers: { "Content-Type": "application/json" } }
  );
  const airplaneId = JSON.parse(airplane.body)?.data?.id;
  console.log(`Airplane ID: ${airplaneId}`);

  let flightIds = [];
  console.log("Creating flights...");
  for (let i = 0; i < 10; i++) {
    const flightBody = {
      flightNumber: randStr("FN"),
      airplaneId,
      departureAirportID: departureAirportId,
      arrivalAirportId,
      departureTime: `2025-10-10T${10 + i}:00:00Z`,
      arrivalTime: `2025-10-10T${12 + i}:00:00Z`,
      price: 5000 + i * 100,
      boardingGate: randStr("Gate"),
    };
    const flight = http.post(
      `${FLIGHTS_URL}/api/v1/flights`,
      JSON.stringify(flightBody),
      { headers: { "Content-Type": "application/json" } }
    );
    const flightId = JSON.parse(flight.body)?.data?.id;
    console.log(`Flight ${i} ID: ${flightId}`);
    flightIds.push(flightId);
  }

  let emails = [];
  console.log("Creating test users...");
  for (let i = 0; i < 10; i++) {
    const email = `${randStr("user")}@test.com`;
    const password = "password123";
    const signupRes = http.post(
      `${SERVER_URL}/api/v1/signup`,
      JSON.stringify({ email, password }),
      { headers: { "Content-Type": "application/json" } }
    );
    console.log(`Signup ${i}: ${email}, status: ${signupRes.status}`);
    emails.push(email);
  }

  return { flightIds, emails };
}

export default function (data) {
  const API_GATEWAY = "http://api-gateway:3005";
  const SERVER_URL = "http://auth-service:3001";

  console.log(`Logging in user: `);

  const loginRes = http.post(
    `${SERVER_URL}/api/v1/signin`,
    JSON.stringify({
      email: data.emails[Math.floor(Math.random() * data.emails.length)],
      password: "password123",
    }),
    { headers: { "Content-Type": "application/json" } }
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

  if (!token) {
    console.error("Login failed for user", loginRes.body);
    return;
  }

  console.log(`User logged in: , ID: ${userId}`);

  for (let i = 0; i < 10; i++) {
    const bookingPayload = {
      flightId:
        data.flightIds[Math.floor(Math.random() * data.flightIds.length)],
      userId: userId,
      NoOfSeats: 1 + Math.floor(Math.random() * 5),
    };

    const res = http.post(
      `${API_GATEWAY}/bookingservice/api/v1/bookings`,
      JSON.stringify(bookingPayload),
      {
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      }
    );

    console.log(`Booking ${i} status: ${res.status}`);
    check(res, {
      "booking response received": (r) => r.status === 200,
    });
  }
  sleep(1);
}
```

The results were kind of good for 100 VU:

![dashboard](./public/k6_test_2.png)

2025-10-08 00:20:43 █ THRESHOLDS
2025-10-08 00:20:43
2025-10-08 00:20:43 http_req_duration
2025-10-08 00:20:43 ✓ 'p(95)<2000' p(95)=1.44s
2025-10-08 00:20:43
2025-10-08 00:20:43 http_req_failed
2025-10-08 00:20:43 ✓ 'rate<0.05' rate=0.14%
2025-10-08 00:20:43
2025-10-08 00:20:43
2025-10-08 00:20:43 █ TOTAL RESULTS
2025-10-08 00:20:43
2025-10-08 00:20:43 checks_total.......: 11410 93.49208/s
2025-10-08 00:20:43 checks_succeeded...: 100.00% 11410 out of 11410
2025-10-08 00:20:43 checks_failed......: 0.00% 0 out of 11410
2025-10-08 00:20:43
2025-10-08 00:20:43 ✓ booking response received
2025-10-08 00:20:43
2025-10-08 00:20:43 HTTP
2025-10-08 00:20:43 http_req_duration..............: avg=479.16ms min=4.01ms med=382.58ms max=4.59s p(90)=831.79ms p(95)=1.44s
2025-10-08 00:20:43 { expected_response:true }...: avg=479.75ms min=9.76ms med=383.11ms max=4.59s p(90)=832.61ms p(95)=1.44s
2025-10-08 00:20:43 http_req_failed................: 0.14% 18 out of 12594
2025-10-08 00:20:43 http_reqs......................: 12594 103.193625/s
2025-10-08 00:20:43
2025-10-08 00:20:43 EXECUTION
2025-10-08 00:20:43 iteration_duration.............: avg=6.19s min=4.22ms med=5.69s max=12.17s p(90)=9.46s p(95)=11.83s
2025-10-08 00:20:43 iterations.....................: 1159 9.496698/s
2025-10-08 00:20:43 vus............................: 1 min=1 max=100
2025-10-08 00:20:43 vus_max........................: 100 min=100 max=100
2025-10-08 00:20:43
2025-10-08 00:20:43 NETWORK
2025-10-08 00:20:43 data_received..................: 6.7 MB 55 kB/s
2025-10-08 00:20:43 data_sent......................: 4.7 MB 38 kB/s

But for the 500 VU:

█ THRESHOLDS
2025-10-08 21:36:57
2025-10-08 21:36:57 http_req_duration
2025-10-08 21:36:57 ✗ 'p(95)<2000' p(95)=8.89s
2025-10-08 21:36:57
2025-10-08 21:36:57 http_req_failed
2025-10-08 21:36:57 ✓ 'rate<0.05' rate=0.09%
2025-10-08 21:36:57
2025-10-08 21:36:57
2025-10-08 21:36:57 █ TOTAL RESULTS
2025-10-08 21:36:57
2025-10-08 21:36:57 checks_total.......: 11758 96.518503/s
2025-10-08 21:36:57 checks_succeeded...: 100.00% 11758 out of 11758
2025-10-08 21:36:57 checks_failed......: 0.00% 0 out of 11758
2025-10-08 21:36:57
2025-10-08 21:36:57 ✓ booking response received
2025-10-08 21:36:57
2025-10-08 21:36:57 HTTP
2025-10-08 21:36:57 http_req_duration..............: avg=1.84s min=5.84ms med=507.4ms max=21.85s p(90)=3.04s p(95)=8.89s
2025-10-08 21:36:57 { expected_response:true }...: avg=1.84s min=9.39ms med=508.26ms max=21.85s p(90)=3.04s p(95)=8.91s
2025-10-08 21:36:57 http_req_failed................: 0.09% 13 out of 13078
2025-10-08 21:36:57 http_reqs......................: 13078 107.354056/s
2025-10-08 21:36:57
2025-10-08 21:36:57 EXECUTION
2025-10-08 21:36:57 iteration_duration.............: avg=15.15s min=6.1ms med=7.06s max=46.53s p(90)=45.91s p(95)=46.18s
2025-10-08 21:36:57 iterations.....................: 1038 8.520684/s
2025-10-08 21:36:57 vus............................: 1 min=1 max=500
2025-10-08 21:36:57 vus_max........................: 500 min=500 max=500
2025-10-08 21:36:57
2025-10-08 21:36:57 NETWORK
2025-10-08 21:36:57 data_received..................: 7.0 MB 57 kB/s
2025-10-08 21:36:57 data_sent......................: 4.9 MB 41 kB/s

the system has degraded:

| Metric          | First Test (100 VUs) | Second Test (500 VUs) | Change                         |
| --------------- | -------------------- | --------------------- | ------------------------------ |
| **p95 latency** | 1.44s                | **8.89s **            | **+517%**                      |
| **p50 latency** | 383ms                | **507ms**             | +32%                           |
| **Max latency** | 4.59s                | **21.85s**            | +376%                          |
| **Throughput**  | 103 RPS              | **107 RPS**           | +4% (basically no improvement) |
| **Avg latency** | 479ms                | **1.84s**             | +284%                          |

Lets make some changes to metrics in test:

| Issue                  | Current    | Should Be                        |
| ---------------------- | ---------- | -------------------------------- |
| Stages                 | Only ramps | **Add 1min holds** at each level |
| Booking p95 threshold  | <1000ms    | **<2000ms** (loosen initially)   |
| Error rate threshold   | <1%        | **<5%** (loosen initially)       |
| Success rate threshold | >99%       | **>95%** (loosen initially)      |
| Number of flights      | 10         | **50** (prevent exhaustion)      |

```js
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

      price: 5000 + i * 100,
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
```
