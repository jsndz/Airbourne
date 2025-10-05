const {BookingService} = require('../services/index');
const {StatusCodes} = require('http-status-codes');
const bookingService = new BookingService();

const {publishMessage}= require('../utils/messagequeue')
const {REMINDER_BINDING_KEY} = require('../config/serverConfig')

class BookingController {
    constructor(channel){
        this.channel = channel;
    }
    async sendMessageToqueue(req,res) {
        const payload= {
            data:{
                subject:'this is notification from queue',
                content:'for booking queue',
                recepientEmail:'jaisondz9741@gmail.com',
                notificationTime:'2023-10-14 9:49:00'
            },
            service:'CREATE_TICKET'
        };
        publishMessage(this.channel,REMINDER_BINDING_KEY,JSON.stringify(payload));
        return res.status(201).json({
            message: 'Successfully completed  publishing'
        })
        
    }
    async create (req,res) {
        try {
            const response  = await bookingService.createBooking(req.body);
            return res.status(StatusCodes.OK).json({
                data: response,
                success: true,
                err: {},
                message: 'Successfully completed  booking'
            });
        } catch (error) { 
            return res.status(error.statusCode).json({
                data: {},
                sucess: false,
                message: error.message,
                err:error.explanation
        })
        }
    }
}
module.exports = BookingController;