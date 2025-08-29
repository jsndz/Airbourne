const express = require('express');

const router = express.Router();

const {BookingController} = require('../../controllers/index')
const { createChannel } = require('../../utils/messagequeue')

// const channel = await createChannel();
// const BookingController = new BookingController(channel);
const bookingController = new BookingController();

router.get('/info',(req,res)=>{
    return res.json({message:'Response from routes'})
})
router.post('/bookings', bookingController.create);
router.post('/publish',bookingController.sendMessageToqueue)

module.exports =  router;