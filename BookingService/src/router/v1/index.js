const express = require('express');
const router = express.Router();
const { BookingController } = require('../../controllers/index');
const { createChannel } = require('../../utils/messagequeue');

let bookingController;

(async () => {
    const channel = await createChannel();
    bookingController = new BookingController(channel);
})();

router.get('/info', (req, res) => {
    return res.json({ message: 'Response from routes' });
});

router.post('/bookings', (req, res, next) => {
    if (!bookingController) return res.status(503).json({ message: 'Service unavailable' });
    return bookingController.create(req, res);
});
router.post('/publish', (req, res, next) => {
    if (!bookingController) return res.status(503).json({ message: 'Service unavailable' });
    return bookingController.sendMessageToqueue(req, res);
});

module.exports = router;
