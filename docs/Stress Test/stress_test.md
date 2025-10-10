# Airbourne Project: Stress Test Analysis

## 1\. Test Configuration

The stress test was designed to push the Airbourne platform beyond normal operating conditions to identify its **breaking point** or maximum sustainable throughput. The load ramped up aggressively to **500 Virtual Users (VUs)**.

### **k6 Stages Configuration (Stress Test)**

```javascript
stages: [
  { duration: "1m", target: 50 },
  { duration: "1m", target: 100 },
  { duration: "1m", target: 200 },
  { duration: "1m", target: 300 },
  { duration: "1m", target: 500 }, // Peak Stress Load
  { duration: "1m", target: 0 },
],
```

**Test Execution Summary**

| Metric                      | Value                               |
| :-------------------------- | :---------------------------------- |
| **Max Virtual Users (VUs)** | 500                                 |
| **Test Duration**           | $\approx 6$ minutes                 |
| **Total HTTP Requests**     | 45,465                              |
| **Peak Throughput**         | $\approx 124$ requests/second (rps) |

## 2\. Stress Test Results

### **2.1. Threshold Compliance**

The system successfully met all critical thresholds designed for high-load performance and reliability.

| Operation   | Metric       | Threshold  | Test Result   | Status   |
| :---------- | :----------- | :--------- | :------------ | :------- |
| **Booking** | p95 Latency  | $< 2000$ms | **$1.25$s**   | **PASS** |
| **Booking** | p99 Latency  | $< 5000$ms | **$1.38$s**   | **PASS** |
| **Booking** | Failure Rate | $< 5\%$    | **$0.00\%$**  | **PASS** |
| **Login**   | p95 Latency  | $< 300$ms  | **$43.63$ms** | **PASS** |
| **Setup**   | p95 Latency  | $< 500$ms  | **$48.4$ms**  | **PASS** |

### **2.2. Detailed Latency Analysis (Request Duration)**

| Operation   | Avg      | Min     | Median   | **p95**    | Max    | Unit |
| :---------- | :------- | :------ | :------- | :--------- | :----- | :--- |
| **Booking** | $386.03$ | $18.32$ | $157.53$ | **$1.25$** | $1.45$ | ms/s |
| **Overall** | $384.83$ | $7.49$  | $155.34$ | $1.25$     | $1.45$ | ms/s |

**Interpretation:**
Under the extreme load of 500 VUs, the median response time for bookings increased to $157\text{ms}$, and the p95 latency rose to **$1.25$ seconds**. While a significant increase from the baseline ($\approx 40\text{ms}$), this is still well within the acceptable threshold of $2000\text{ms}$, confirming that the system is stable and functional up to this level of concurrency.

### **2.3. Checks and Reliability**

| Check / Metric                                     | Total Succeeded | Total Failed | Success Rate | SLO Met? |
| :------------------------------------------------- | :-------------- | :----------- | :----------- | :------- |
| **`booking_success`**                              | $100\%$         | $0\%$        | $100.00\%$   | **PASS** |
| **`booking_no_timeout`**                           | $100\%$         | $0\%$        | $100.00\%$   | **PASS** |
| **`booking_fast`** ($\text{Duration} < 1\text{s}$) | $38,893$        | $6,417$      | $85.85\%$    | **FAIL** |
| **HTTP Request Failures**                          | $45,465$        | $0$          | $0.00\%$     | **PASS** |

**Interpretation:**
The system maintained **perfect functional reliability** with a $0.00\%$ failure rate for all HTTP requests, and every booking was successfully processed without timeout errors.

The only metric not met was the internal "booking_fast" check, which requires latency to be under $1000\text{ms}$. Since the p95 latency was $1.25\text{s}$ ($> 1\text{s}$), this is the expected result and indicates where the system transitions from "fast" to "acceptable/congested." **This point—between 300 VUs and 500 VUs—is the performance saturation point.**

### **2.4. Execution & Throughput**

| Metric                                        | Value                      |
| :-------------------------------------------- | :------------------------- |
| **Total Iterations (User Sessions)**          | $22,692$                   |
| **Average Iteration Duration (User Session)** | $3.07\text{s}$             |
| **Network Throughput (Requests)**             | $\approx 124\text{ req/s}$ |

## 3\. Conclusion

The Airbourne microservices platform demonstrated **exceptional fault tolerance and scalability** in the stress test:

1.  **High Resilience:** The system successfully handled a peak load of **500 concurrent users**, processing $\approx 124$ requests per second with $0.00\%$ request failures and $100\%$ booking success.
2.  **Performance Tapering:** The performance saturation point was identified where **$15\%$ of transactions exceeded $1\text{ second}$**, pushing the p95 latency to $1.25\text{ seconds}$. This is the point at which the system is nearing its practical operational limit before more resources are needed.
3.  **No Catastrophic Failure:** The system did not break, time out, or reject requests, proving its architecture (especially the asynchronous RabbitMQ communication) is highly robust under high pressure.
