import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 }, 
    { duration: '1m', target: 100 },  
    { duration: '1m', target: 200 },   
    { duration: '1m', target: 0 },     
  ],
  thresholds: {
    http_req_duration: ['p(95)<50'],
    http_req_failed: ['rate<0.001'],
  },
};

export default function () {
    let res = http.get('http://api-gateway:3005/health');
  check(res, { 'status was 200': (r) => r.status === 200 });

  sleep(1);
}




// execution: local
//         script: script.js
//         output: -

//      scenarios: (100.00%) 1 scenario, 200 max VUs, 4m0s max duration (incl. graceful stop):
//               * default: Up to 200 looping VUs for 3m30s over 4 stages (gracefulRampDown: 30s, gracefulStop: 30s)



//   █ THRESHOLDS 

//     http_req_duration
//     ✓ 'p(95)<50' p(95)=1.47ms

//     http_req_failed
//     ✓ 'rate<0.001' rate=0.00%


//   █ TOTAL RESULTS 

//     checks_total.......: 20294   96.472373/s
//     checks_succeeded...: 100.00% 20294 out of 20294
//     checks_failed......: 0.00%   0 out of 20294

//     ✓ status was 200

//     HTTP
//     http_req_duration..............: avg=862.04µs min=156.39µs med=822.42µs max=5.19ms p(90)=1.31ms p(95)=1.47ms
//       { expected_response:true }...: avg=862.04µs min=156.39µs med=822.42µs max=5.19ms p(90)=1.31ms p(95)=1.47ms
//     http_req_failed................: 0.00%  0 out of 20294
//     http_reqs......................: 20294  96.472373/s

//     EXECUTION
//     iteration_duration.............: avg=1s       min=1s       med=1s       max=1.01s  p(90)=1s     p(95)=1s    
//     iterations.....................: 20294  96.472373/s
//     vus............................: 1      min=1          max=200
//     vus_max........................: 200    min=200        max=200

//     NETWORK
//     data_received..................: 6.9 MB 33 kB/s
//     data_sent......................: 1.5 MB 7.3 kB/s




// running (3m30.4s), 000/200 VUs, 20294 complete and 0 interrupted iterations
// default ✓ [======================================] 000/200 VUs  3m30s