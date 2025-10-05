require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { rateLimit } = require("express-rate-limit");
const axios = require("axios");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const yaml = require("js-yaml");
const app = express();
const PORT = 3005;


const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000000, 
  message: { message: "Too many requests from this IP, please try again later" },
});


app.use(morgan("combined")); 
app.use(limiter);
const swaggerDocument = yaml.load(fs.readFileSync("./api-gateway-openapi.yaml", "utf8"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/health", (req, res) => {
  return res.json({ message: "OK" });
});

const authMiddleware = async (req, res, next) => {
  try {
    
    
    const token = req.headers["x-access-token"];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const response = await axios.get(`${process.env.AUTH_URL}/api/v1/isauthenticated`, {
      headers: { "x-access-token": token },
    });


    if (response.data) {
      next(); 
    } else {
      return res.status(401).json({ message: "Authorization error" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Authorization error" });
  } 
};

const bookingServiceProxy = createProxyMiddleware({
  target: `${process.env.BOOKING_URL}`,
  changeOrigin: true,
  pathRewrite: { "^/bookingservice": "" }, 
});
const flightsProxy = createProxyMiddleware({
  target: process.env.SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { "^/flights": "" },
});
const authProxy = createProxyMiddleware({
  target: process.env.AUTH_URL,
  changeOrigin: true,
  pathRewrite: { "^/auth": "" },
});


const reminderProxy = createProxyMiddleware({
  target: process.env.REMINDER_URL,
  changeOrigin: true,
  pathRewrite: { "^/reminder": "" },
});
app.use("/auth", authProxy);
app.use("/flights", authMiddleware, flightsProxy);
app.use("/reminder", authMiddleware, reminderProxy);
app.use("/bookingservice", authMiddleware, bookingServiceProxy);



app.listen(PORT, () => {
  console.log(`API Gateway started at http://localhost:${PORT}`);
});
