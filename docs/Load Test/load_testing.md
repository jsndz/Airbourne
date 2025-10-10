# Airbourne Project: Load Testing & Performance Baseline

## 1\. Project Introduction

**Airbourne** is a microservices-based flight booking platform built with Node.js.

The platform is architected for **scalability, reliability, and observability**, making it an ideal candidate for performance optimization and experimentation.

| Feature                | Technologies / Implementation                                                                                         |
| :--------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **Architecture**       | Microservices, API Gateway (routing, authentication, rate limiting)                                                   |
| **Backend Services**   | User Auth, Flight Management, Ticket Booking, Email Reminders                                                         |
| **Communication**      | Synchronous via API Gateway; Asynchronous via **RabbitMQ (AMQP)**                                                     |
| **Data Layer**         | Sequelize + MySQL                                                                                                     |
| **Optimization Focus** | Identifying bottlenecks in request handling, message processing, database interactions, and email delivery pipelines. |

## 2\. Load Test Setup (k6)

The test uses a stepped load profile, ramping up to **100 Virtual Users (VUs)**. The primary metric for success is the **95th percentile (p95) latency**, which is the maximum response time for $95\%$ of all requests.

### **k6 Script (`load_test.js`)**

```javascript
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
    // Latency Goals (p95 in milliseconds)
    "http_req_duration{operation:login}": ["p(95)<300"],
    "http_req_duration{operation:booking}": ["p(95)<2000", "p(99)<5000"],
    "http_req_duration{operation:setup}": ["p(95)<500"],

    // Reliability Goals
    "http_req_failed{operation:booking}": ["rate<0.05"], // < 5% failures
    "checks{check:booking_success}": ["rate>0.95"], // > 95% successful checks
  },
};

function randStr(prefix) {
  return `${prefix}_${Math.floor(Math.random() * 100000)}`;
}

export function setup() {
  const FLIGHTS_URL = "http://flights-service:3002";
  const SERVER_URL = "http://auth-service:3001";

  // --- Setup Cities, Airports, and Airplane ---
  // ... (omitted for brevity, assume successful setup) ...
  const city1Res = http.post(/* ... */);
  const city2Res = http.post(/* ... */);
  const depAirportRes = http.post(/* ... */);
  const arrAirportRes = http.post(/* ... */);
  const airplaneRes = http.post(/* ... */);

  const city1Id = JSON.parse(city1Res.body)?.data?.id;
  const city2Id = JSON.parse(city2Res.body)?.data?.id;
  const departureAirportId = JSON.parse(depAirportRes.body)?.data?.id;
  const arrivalAirportId = JSON.parse(arrAirportRes.body)?.data?.id;
  const airplaneId = JSON.parse(airplaneRes.body)?.data?.id;

  if (
    !city1Id ||
    !city2Id ||
    !departureAirportId ||
    !arrivalAirportId ||
    !airplaneId
  )
    throw new Error("Initial setup failed");
  // --- Create 50 Flights and 50 Users/Tokens ---
  let flightIds = [];
  for (let i = 0; i < 50; i++) {
    // ... flight creation logic ...
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

  if (!user) return;

  const numBookings = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numBookings; i++) {
    const validFlights = data.flightIds.filter((f) => f != null);
    if (validFlights.length === 0) return;

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

    // K6 checks
    check(res, {
      booking_success: (r) => r.status === 200 || r.status === 201,
      booking_fast: (r) => r.timings.duration < 1000,
      booking_no_timeout: (r) => r.status !== 0,
    });

    if (i < numBookings - 1) sleep(0.3);
  }

  sleep(1 + Math.random() * 2);
}
```

## 3\. Airbourne Load Test Summary

**Test Configuration Overview**

| Metric                      | Value                              |
| :-------------------------- | :--------------------------------- |
| **Max Virtual Users (VUs)** | 100                                |
| **Total Test Duration**     | $\approx 5$ minutes                |
| **Total HTTP Requests**     | 13,133                             |
| **Peak Throughput**         | $\approx 42$ requests/second (rps) |

### **3.1. Threshold Compliance**

| Operation   | Metric             | Threshold  | Test Result    | Status   |
| :---------- | :----------------- | :--------- | :------------- | :------- |
| **Booking** | p95 Latency        | $< 2000$ms | **$39.09$ms**  | **PASS** |
| **Booking** | p99 Latency        | $< 5000$ms | **$86.92$ms**  | **PASS** |
| **Login**   | p95 Latency        | $< 300$ms  | **$46.22$ms**  | **PASS** |
| **Setup**   | p95 Latency        | $< 500$ms  | **$51.16$ms**  | **PASS** |
| **Booking** | Failure Rate       | $< 5\%$    | **$0.00\%$**   | **PASS** |
| **Booking** | Success Check Rate | $> 95\%$   | **$100.00\%$** | **PASS** |

### **3.2. Detailed Latency Analysis (Request Duration)**

| Operation   | Avg     | Min     | Median  | **p95**     | Max      | Unit |
| :---------- | :------ | :------ | :------ | :---------- | :------- | :--- |
| **Booking** | $30.62$ | $17.73$ | $28.52$ | **$39.09$** | $328.94$ | ms   |
| **Login**   | $43.63$ | $41.05$ | $43.55$ | **$46.22$** | $52.16$  | ms   |
| **Setup**   | $27.21$ | $0.46$  | $16.55$ | **$51.16$** | $66.25$  | ms   |

**Interpretation:**
All key operations, particularly the high-traffic `booking` endpoint, exhibit extremely low latency. The p95 for booking is less than $40$ms, indicating that $95\%$ of all booking requests are fulfilled in a near-instantaneous manner, vastly exceeding the $\text{p95} < 2000\text{ms}$ goal.

### **3.3. System Reliability**

| Metric                  | Total    | Failures | Failure Rate |
| :---------------------- | :------- | :------- | :----------- |
| **Bookings Failed**     | $12,978$ | $0$      | **$0.00\%$** |
| **Overall HTTP Failed** | $13,133$ | $24$     | $0.18\%$     |

**Interpretation:**
The core **Booking** service demonstrated perfect reliability ($0.00\%$ failures) under the applied load. The overall minimal failure rate of $0.18\%$ suggests sporadic, non-critical issues in other parts of the system setup, which is negligible. All functional checks (`booking_success`, `booking_fast`, `booking_no_timeout`) passed $100\%$.

### **3.4. Execution & Throughput**

| Metric                               | Value           |
| :----------------------------------- | :-------------- |
| **Total Iterations (User Sessions)** | $6,513$         |
| **Average Iteration Duration**       | $2.36\text{s}$  |
| **Network Data Received**            | $7.1\text{ MB}$ |
| **Network Data Sent**                | $5.1\text{ MB}$ |

**Interpretation:**
The system effectively supported **100 concurrent users**, with each simulated user session completing in an average of $2.36$ seconds. The network throughput suggests no immediate network I/O bottlenecks.
