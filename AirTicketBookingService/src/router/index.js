const express = require('express');

const router = express.Router();

const v1APiRoute = require('./v1/index');

router.use('/v1', v1APiRoute);

module.exports = router;