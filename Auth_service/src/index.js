const express = require("express");
const bodyParser = require("body-parser");
const { PORT, DB_SYNC } = require("./config/serverConfig");
const ApiRoutes = require("./routes/index");
const db = require("./models/index");
const { User, Role } = require("./models/index");
const { swaggerUi, swaggerSpec } = require("./config/swagger");

const app = express();

const prepareAndstartServer = () => {

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));


  app.use("/api", ApiRoutes);

  

  // app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.listen(PORT, async () => {
    console.log(`Server started on port: ${PORT}`);

    try {
      await db.sequelize.authenticate();

      if (DB_SYNC) {
        await db.sequelize.sync({ force: true });
      }
    } catch (err) {
      console.error("Database connection failed:", err.message);
      console.error(err); 
      process.exit(1); 
    }
  });
};

prepareAndstartServer();
