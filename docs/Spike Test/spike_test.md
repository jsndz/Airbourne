# Airbourne Project: Spike Test Analysis

## 1\. Test Configuration

The spike test was designed to evaluate the Airbourne platform's ability to handle **sudden, extreme bursts of traffic** and recover quickly, simulating scenarios like flash sales or unexpected demand surges.

### **k6 Stages Configuration (Spike Test)**

The load profile aggressively spikes from 0 VUs to 100 VUs, drops back to 0, then spikes again to 200 VUs, all within a short 10-second window per stage.

```javascript
stages: [
  { duration: "10s", target: 0 },
  { duration: "10s", target: 100 },
  { duration: "10s", target: 0 },
  { duration: "10s", target: 200 }, // Peak Spike Load
  { duration: "10s", target: 0 },
],
```

**Test Execution Summary**

| Metric                       | Value                                |
| :--------------------------- | :----------------------------------- |
| **Peak Virtual Users (VUs)** | 200                                  |
| **Total Test Duration**      | $\approx 50$ seconds                 |
| **Total HTTP Requests**      | 2,975                                |
| **Average Throughput**       | $\approx 51.6$ requests/second (rps) |

## 2\. Spike Test Results

### **2.1. Threshold Compliance**

The system successfully handled the rapid load changes and met all defined performance thresholds.

| Operation   | Metric       | Threshold  | Test Result    | Status   |
| :---------- | :----------- | :--------- | :------------- | :------- |
| **Booking** | p95 Latency  | $< 2000$ms | **$58.02$ms**  | **PASS** |
| **Booking** | p99 Latency  | $< 5000$ms | **$119.16$ms** | **PASS** |
| **Booking** | Failure Rate | $< 5\%$    | **$0.00\%$**   | **PASS** |
| **Login**   | p95 Latency  | $< 300$ms  | **$44.11$ms**  | **PASS** |
| **Setup**   | p95 Latency  | $< 500$ms  | **$49.92$ms**  | **PASS** |
| **Checks**  | Success Rate | $> 95\%$   | **$100.00\%$** | **PASS** |

### **2.2. Detailed Latency Analysis (Request Duration)**

| Operation   | Avg     | Min     | Median  | **p95**     | Max      | Unit |
| :---------- | :------ | :------ | :------ | :---------- | :------- | :--- |
| **Booking** | $34.80$ | $19.55$ | $30.28$ | **$58.02$** | $425.71$ | ms   |
| **Overall** | $34.67$ | $7.23$  | $30.39$ | $57.54$     | $425.71$ | ms   |

**Interpretation:**
The system demonstrated remarkable stability. The p95 latency for bookings remained exceptionally low at **$58.02\text{ms}$**, only a minimal increase from the baseline test, and is far below the $2000\text{ms}$ threshold. This indicates that the system's connection pooling, thread management, and load balancing mechanisms react quickly and effectively to sudden traffic bursts without noticeable overhead or congestion.

### **2.3. Checks and Reliability**

| Metric                  | Total Executed | Failures   | Failure Rate |
| :---------------------- | :------------- | :--------- | :----------- |
| **Bookings Failed**     | $2,820$        | $0$        | **$0.00\%$** |
| **Overall HTTP Failed** | $2,975$        | $0$        | **$0.00\%$** |
| **Checks Succeeded**    | $8,460$        | $100.00\%$ |              |

**Interpretation:**
The system maintained **perfect reliability** throughout the rapid load fluctuations, with $0.00\%$ HTTP request failures and $100.00\%$ check success rate (including the internal `booking_fast` check). This confirms that neither the sudden ramp-up nor the rapid drop-off in load caused any resource exhaustion or connection errors.

### **2.4. Execution & Throughput**

| Metric                                        | Value          |
| :-------------------------------------------- | :------------- |
| **Total Iterations (User Sessions)**          | $1,443$        |
| **Average Iteration Duration (User Session)** | $2.33\text{s}$ |
| **VUs Active (Peak)**                         | $199$          |

## 3\. Conclusion

The Airbourne microservices platform exhibits **outstanding elasticity and resilience** under sudden, aggressive load spikes.

1.  **Excellent Response to Spikes:** The system successfully handled immediate transitions from 0 VUs up to 200 VUs, and back down, with **no evidence of latency spikes** or performance degradation during the transition phases.
2.  **Highly Reliable:** The $\mathbf{0.00\%}$ failure rate and $\mathbf{100\%}$ check success rate prove the microservices and their underlying infrastructure (API Gateway, RabbitMQ) are configured to handle rapid connection churn and concurrent requests seamlessly.
3.  **Low Latency:** Latency figures remained close to the initial baseline, confirming that the system is not bottlenecked by auto-scaling delays or cold-start issues.

**Overall:** The Airbourne platform is highly suitable for environments with unpredictable traffic, demonstrating that it can handle promotional spikes and unexpected surges without impacting the user experience.
