# Airbourne Project: Soak Test Analysis

Soak testing is a long-duration performance test that applies a moderate, steady load over an extended period (often 30 minutes to several hours).
Its goal is not to break the system with high traffic, but to see how the system behaves under sustained normal load over time.

## 1\. Test Configuration

The soak test was designed to evaluate the Airbourne platform's stability and performance under a sustained, moderate load over an extended duration.

### **k6 Stages Configuration (Soak Test)**

The load profile ramped up to a steady state of **50 Virtual Users (VUs)** for **30 minutes**.

```javascript
stages: [
  { duration: "2m", target: 30 },  // Ramp-up to moderate load
  { duration: "5m", target: 50 },  // Reach target load
  { duration: "30m", target: 50 }, // Sustained load (Soak period)
  { duration: "3m", target: 30 },  // Gradual ramp-down
  { duration: "1m", target: 0 },   // Final ramp-down
],
```

**Test Execution Summary**

| Metric                        | Value                              |
| :---------------------------- | :--------------------------------- |
| **Max Virtual Users (VUs)**   | 50                                 |
| **Sustained Duration (Soak)** | 30 minutes                         |
| **Total Test Duration**       | $\approx 41$ minutes               |
| **Total HTTP Requests**       | 93,841                             |
| **Average Throughput**        | $\approx 38$ requests/second (rps) |

## 2\. Soak Test Results

### **2.1. Threshold Compliance**

The system successfully maintained performance metrics within all defined service level objectives (SLOs) for the entire duration of the soak test.

| Operation   | Metric       | Threshold  | Test Result   | Status   |
| :---------- | :----------- | :--------- | :------------ | :------- |
| **Booking** | p95 Latency  | $< 2000$ms | **$66.69$ms** | **PASS** |
| **Booking** | p99 Latency  | $< 5000$ms | **$83.37$ms** | **PASS** |
| **Login**   | p95 Latency  | $< 300$ms  | **$43.72$ms** | **PASS** |
| **Setup**   | p95 Latency  | $< 500$ms  | **$49.29$ms** | **PASS** |
| **Booking** | Failure Rate | $< 5\%$    | **$0.00\%$**  | **PASS** |

### **2.2. Detailed Latency Analysis (Request Duration)**

| Operation   | Avg     | Min     | Median  | **p95**     | Max     | Unit |
| :---------- | :------ | :------ | :------ | :---------- | :------ | :--- |
| **Booking** | $44.27$ | $16.92$ | $46.44$ | **$66.69$** | $445.9$ | ms   |
| **Overall** | $44.25$ | $6.92$  | $46.43$ | $66.68$     | $445.9$ | ms   |

**Interpretation:**
The p95 latency for the critical `booking` operation stabilized at **$66.69\text{ms}$** over the 30-minute soak period. This is a slight increase from the previous short-duration test ($\approx 39\text{ms}$), which is expected due to sustained load, but it remains exceptionally fast and less than $3.4\%$ of the $2000\text{ms}$ threshold. This confirms there are no immediate latency "drifts."

### **2.3. Stability and Reliability**

| Metric                  | Total     | Failures   | Failure Rate |
| :---------------------- | :-------- | :--------- | :----------- |
| **Bookings Failed**     | $93,686$  | $0$        | **$0.00\%$** |
| **Overall HTTP Failed** | $93,841$  | $0$        | **$0.00\%$** |
| **Checks Succeeded**    | $281,058$ | $100.00\%$ |              |

**Interpretation:**
The Airbourne system demonstrated **perfect reliability ($0.00\%$ failure rate)** for all $93,841$ HTTP requests over the entire test duration. This is a critical result for a soak test, as it indicates the system is resilient to resource exhaustion (e.g., connection pools, memory leaks) under sustained load.

### **2.4. Resource Metrics (Execution & Network)**

| Metric                                        | Value          |
| :-------------------------------------------- | :------------- |
| **Total Iterations**                          | $46,819$       |
| **Average Iteration Duration (User Session)** | $2.39\text{s}$ |
| **Data Received**                             | $51\text{ MB}$ |
| **Data Sent**                                 | $37\text{ MB}$ |

## 3\. Conclusion

The Airbourne microservices platform successfully passed the soak test, exhibiting **high stability and consistent performance** over a 30-minute sustained load period (50 VUs).

1.  **No Performance Degradation:** While latency increased slightly from the baseline, it remained highly stable and very fast ($\text{p95} < 67\text{ms}$), indicating a complete absence of _performance drift_ or the slow accumulation of bottlenecks.
2.  **Perfect Reliability:** The $0.00\%$ failure rate and $100.00\%$ check success rate are strong indicators that the system has no critical memory leaks, connection pool exhaustion issues, or database locking problems under this load.

**Recommendation:** The current architecture is robust and stable. The next logical step would be to increase the duration of the soak test (e.g., to 4 hours or 24 hours) to confirm stability against very long-term resource issues, or proceed to **Stress Testing** to find the system's absolute capacity limit.
