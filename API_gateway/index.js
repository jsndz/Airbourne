const express = require("express");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { rateLimit } = require("express-rate-limit");
const axios = require("axios");

const app = express();
const PORT = 3005;


const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000000, 
  message: { message: "Too many requests from this IP, please try again later" },
});


app.use(morgan("combined")); 
app.use(limiter);

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

    if (response.data.success) {
      next(); 
    } else {
      return res.status(401).json({ message: "Authorization error" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Authorization error" });
  } 
};

const bookingServiceProxy = createProxyMiddleware({
  target: `${process.env.SERVICE_URL}`,
  changeOrigin: true,
  pathRewrite: { "^/bookingservice": "" }, 
});


app.use("/bookingservice", authMiddleware, bookingServiceProxy);



app.listen(PORT, () => {
  console.log(`API Gateway started at http://localhost:${PORT}`);
});
