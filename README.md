# Airbourne

## This combines multiple micro-services

1. [https://github.com/jsndz/FlightsAndSearch.git](https://github.com/jsndz/FlightsAndSearch.git)
2. [https://github.com/jsndz/reminderService.git](https://github.com/jsndz/reminderService.git)
3. [https://github.com/jsndz/AirTicketBookingService.git](https://github.com/jsndz/AirTicketBookingService.git)
4. [https://github.com/jsndz/API_gateway.git](https://github.com/jsndz/API_gateway.git)
5. [https://github.com/jsndz/Auth_service.git](https://github.com/jsndz/Auth_service.git)

## Project Description

Airbourne is a microservices-based application for flight booking and management. It consists of several services including an API Gateway, Authentication Service, Air Ticket Booking Service, Reminder Service, and Flights and Search Service.

## Technologies Used

- **Node.js**: Backend runtime
- **Express**: Web framework
- **MySQL**: Database
- **Sequelize**: ORM for database interactions
- **JWT**: Authentication
- **AMQP**: Message queuing (e.g., RabbitMQ)
- **Nodemailer**: Email notifications
- **Nodemon**: Development server

## Setup Instructions

1. Clone the repository.
2. Navigate to each service directory (e.g., `Auth_service`, `API_gateway`, etc.) and run:
   ```bash
   npm install
   ```
3. For the Flights and Search service, create a `config.json` file in `src/config` with the following structure:
   ```json
   {
     "development": {
       "username": "root",
       "password": "<password>",
       "database": "<name of DB>",
       "host": "127.0.0.1",
       "dialect": "mysql"
     }
   }
   ```
4. Create the database using:
   ```bash
   npx sequelize db:create
   ```

## Running the Project

- Start each service using:
  ```bash
  npm start
  ```

## Database Design

- **City**: cityname, id, created_at, updated_at
- **Airport**: name, cityId, address, id, created_at, updated_at
- **Airplane**: (details to be added)
- **Flight**: (details to be added)

## Additional Notes

- Ensure all environment variables are set up correctly in each service.
- For more details, refer to the individual service READMEs.

## License

ISC
