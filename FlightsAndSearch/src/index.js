const express = require("express");
const bodyParser = require("body-parser");
const { PORT, SYNC } = require("./config/serverconfig");
const Apiroutes = require("./routes/index");
const db = require("./models/index");

const setupAndstartserver = async () => {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
  app.use("/api", Apiroutes);
  app.listen(PORT, async () => {
    console.log(`server started at ${PORT}`);
    console.log(SYNC);

    if (SYNC) {
      db.sequelize.sync({ force: true });
    }
  });
};
setupAndstartserver();
