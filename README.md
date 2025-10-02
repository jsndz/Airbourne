# Airbourne

## Overview
Airbourne is a microservices-based flight booking platform composed of independently deployable Node.js services. It supports flight search and management, user authentication and authorization, ticket booking, and email reminders/notifications. An API Gateway provides rate limiting and routing to backend services.

## Architecture
- **API Gateway (`API_gateway`)**
  - Express reverse proxy with rate limiting via `express-rate-limit`
  - Proxies `/bookingservice` to Booking Service (localhost:3002)
  - Auth check via `Auth_service` `GET /api/v1/isAuthenticated` before forwarding
  - Port: `3005`
- **Auth Service (`Auth_service`)**
  - User signup/signin, JWT auth, role-based checks
  - Sequelize + MySQL; Swagger UI at `/api-docs`
  - Port: from `PORT` env (commonly `3001`)
- **Flights and Search (`FlightsAndSearch`)**
  - CRUD for `City`, `Airport`, `Airplane`, `Flight`
  - Input validation middleware for creating flights
  - Sequelize + MySQL
  - Port: from `PORT` env
- **Reminder Service (`reminderService`)**
  - Consumes AMQP messages for notifications and schedules email jobs
  - Nodemailer for email; Sequelize + MySQL
  - Port: from `PORT` env
- **Air Ticket Booking Service (`AirTicketBookingService`)**
  - Booking workflows (entrypoint present, source not fully scanned here)
  - Port: from `PORT` env (commonly `3002`)

### Data Flow
1. Client authenticates against `Auth_service` and receives a JWT.
2. Requests to `/bookingservice/**` go through `API_gateway` where the JWT is verified by `Auth_service`.
3. Gateway proxies authorized requests to Booking Service.
4. Booking/flight changes may emit AMQP events; `reminderService` consumes and sends emails.

## RabbitMQ (AMQP) Usage
### Why RabbitMQ
- Decouples services so producers (e.g., Booking) and consumers (Reminder) can scale independently.
- Improves reliability and user experience by handling asynchronous work (emails, notifications) off the critical request path.
- Adds resilience via queueing and retries; transient failures in consumers do not impact producers immediately.
- Enables fan-out and selective routing using exchanges and binding keys.

### Where It’s Used
- **Reminder Service** subscribes to messages to create and send notifications.
  - Queue: `notification_queue`
  - Binding key (from env): `EXCHANGE_BINDING_KEY` (exposed as `REMINDER_BINDING_KEY` in code)
  - Exchange: `EXCHANGE_NAME`
  - Consumer setup: `subscribeMessage(channel, 'notification_queue', EmailService.subscribeEvents, REMINDER_BINDING_KEY)`
- **Producers** (e.g., Booking Service and/or Flights Service) publish events such as ticket creation, payment success, or flight updates. These events are routed to the `notification_queue` for downstream processing by the Reminder Service.

### Message Handling
- The Reminder Service’s `EmailService.subscribeEvents(payload)` switches on `payload.service` to trigger actions:
  - `CREATE_TICKET`: persists a notification ticket for later sending
  - `SEND_BASIC_MAIL`: sends a basic email via Nodemailer
- A scheduled job scans for `PENDING` tickets and dispatches emails, updating ticket status afterward.

### RabbitMQ Environment
Add to `.env` in `reminderService` (and to producers where applicable):
- `MESSAGE_BROKER_URL` (e.g., `amqp://localhost`)
- `EXCHANGE_NAME`
- `EXCHANGE_BINDING_KEY` (used as `REMINDER_BINDING_KEY` in code)

## Technologies
- Node.js, Express, Sequelize (MySQL)
- JWT for auth (`jsonwebtoken`), password hashing (`bcrypt`)
- Reverse proxy (`http-proxy-middleware`), logging (`morgan`)
- Rate limiting (`express-rate-limit`)
- Messaging via AMQP (`amqplib`)
- Email via `nodemailer`
- Dev tooling: `nodemon`, Swagger (`swagger-jsdoc`, `swagger-ui-express`)

## Environment Variables
Create a `.env` file in each service with the following (adjust as needed):

- Auth Service (`Auth_service`)
  - `PORT` (e.g., 3001)
  - `JWT_key` (secret for signing tokens)
  - `DB_SYNC` (optional; truthy to run `sequelize.sync({ alter: true })`)
  - Standard Sequelize environment via `src/config/config.json`

- Flights and Search (`FlightsAndSearch`)
  - `PORT`
  - `SYNC` (truthy to run `sequelize.sync({ force: true })`)
  - Standard Sequelize environment via `src/config/config.json`

- Reminder Service (`reminderService`)
  - `PORT`
  - `EMAIL_ID`, `EMAIL_PASS`
  - `MESSAGE_BROKER_URL` (e.g., `amqp://localhost`)
  - `EXCHANGE_NAME`
  - `EXCHANGE_BINDING_KEY` (used as `REMINDER_BINDING_KEY` in code)
  - Standard Sequelize environment via `src/config/config.json`

- API Gateway (`API_gateway`)
  - Typically no `.env` needed; update target URLs in `index.js` if changed

- Air Ticket Booking Service (`AirTicketBookingService`)
  - `PORT`
  - Database and any AMQP config (follow the pattern from other services)

## Database Configuration
For services using Sequelize, create `src/config/config.json`:
```json
{
  "development": {
    "username": "root",
    "password": "<password>",
    "database": "<db_name>",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```
Initialize databases per service:
```bash
npx sequelize db:create
# Optional during development
DB_SYNC=true node src/index.js
```

## Services: Endpoints and Ports

### API Gateway (3005)
- `GET /home` → health check
- Proxies `/bookingservice/**` to `http://localhost:3002/**` after calling `Auth_service` `GET http://localhost:3001/api/v1/isAuthenticated` with header `x-access-token`
- Rate limit: 5 requests per 2 minutes per IP

### Auth Service (PORT, default 3001)
- Base path: `/api/v1`
- `POST /signup` → body: `{ email, password }`
- `POST /signin` → body: `{ email, password }` → returns token
- `GET /isAuthenticated` → header: `x-access-token`
- `GET /dummy` → quick OK
- `GET /isAdmin` → body: `{ id }`
- `GET /health` → service health
- `GET /api-docs` → Swagger UI

### Flights and Search (PORT)
- Base path: `/api/v1`
- Cities
  - `POST /city`
  - `GET /city/:id`
  - `GET /city`
  - `PATCH /city/:id`
  - `DELETE /city/:id`
- Airplanes
  - `POST /airplane`
  - `GET /airplane/:id`
  - `GET /airplane`
  - `PATCH /airplane/:id`
  - `DELETE /airplane/:id`
- Airports
  - `POST /airports`
  - `GET /airports/:id`
  - `GET /airports`
  - `PATCH /airports/:id`
  - `DELETE /airports/:id`
- Flights
  - `POST /flights` (requires body: `flightNumber, airplaneId, departureAirportID, arrivalAirportId, arrivalTime, departureTime, price`)
  - `GET /flights`
  - `GET /flights/:id`
  - `PATCH /flights/:id`
  - `DELETE /flights/:id`

### Reminder Service (PORT)
- Subscribes to AMQP queue `notification_queue` with binding key `EXCHANGE_BINDING_KEY`
- `POST /api/v1/tickets` → create notification ticket
- Scheduled job runner triggers email sends for `PENDING` tickets

### Air Ticket Booking Service (PORT, default 3002)
- Exposed via API Gateway at `/bookingservice/**`
- Health: `GET /health`
- Additional routes depend on implementation (follow existing service patterns)

## Running Locally
Open four terminals and start each service after installing dependencies.

Install dependencies:
```bash
# In each service directory
npm install
```

Start services:
```bash
# API Gateway
node index.js

# Auth Service
npm start  # runs nodemon src/index.js

# Flights and Search
node src/index.js

# Reminder Service
node src/index.js

# Air Ticket Booking Service
npm start  # if nodemon config present; otherwise node src/index.js
```

Set headers when calling protected routes via Gateway:
```bash
# Example: calling booking service via gateway after signin
curl -H "x-access-token: <JWT_TOKEN>" http://localhost:3005/bookingservice/health
```

## Development Notes & Expertise Highlights
- **Security**: JWT-based auth; input validation for critical endpoints; role-check endpoint (`/isAdmin`).
- **Reliability**: Rate limiting in gateway; structured error codes; health endpoints.
- **Scalability**: Microservices with independent ports; AMQP-based decoupling for async tasks.
- **Observability**: Request logging via `morgan` in gateway; Swagger documentation in Auth Service.
- **Database**: Sequelize models and migrations for core domain entities; optional `DB_SYNC`/`SYNC` modes for iterative dev.
- **Messaging**: Centralized message queue consumption in Reminder Service with pluggable handlers (`subscribeEvents`).

## Contributing
- Use feature branches and conventional commits.
- Add/adjust Swagger docs when changing `Auth_service` routes.
- Ensure migrations are created for DB schema changes.

## License
ISC
