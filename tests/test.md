docker run -d --name influxdb -p 8086:8086 influxdb:2.7

docker run -d --name grafana -p 3000:3000 grafana/grafana

k6 run --out influxdb=http://localhost:8086/k6 booking_load_test.js
