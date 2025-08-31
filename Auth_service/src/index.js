const express = require("express");
const bodyParser = require("body-parser");
const { PORT, DB_SYNC } = require("./config/serverConfig");
const ApiRoutes = require("./routes/index");
const db = require("./models/index");
const { User, Role } = require("./models/index");

const app = express();

const prepareAndstartServer = () => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use("/api", ApiRoutes);
  app.get("/health", (req, res) => {
    res.send({
      message: "working",
      success: true,
    });
  });
  app.listen(PORT, async () => {
    console.log(`server Started On Port :${PORT}`);
    if (process.env.DB_SYNC) {
      db.sequelize.sync({ alter: true });
    }
  });
};

prepareAndstartServer();
