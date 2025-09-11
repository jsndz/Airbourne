const {BookingService} = require('../services/index');
const {StatusCodes} = require('http-status-codes');
const { AppError } = require('../utils/error');
const bookingService = new BookingService();

const {createChannel,publishMessage}= require('../utils/messagequeue')
const {REMINDER_BINDING_KEY} = require('../config/serverConfig')

class BookingController {

    constructor(){
        
    }

    async sendMessageToqueue(req,res) {
        const channel = await createChannel();
        const payload= {
            data:{
                subject:'this is notification from queue',
                content:'for some queue',
                recepientEmail:'jaisondz9741@gmail.com',
                notificationTime:'2023-10-14 9:49:00'
            },
            service:'CREATE_TICKET'
        };
        publishMessage(channel,REMINDER_BINDING_KEY,JSON.stringify(payload));
        return res.status(201).json({
            message: 'Successfully completed  publishing'
        })
        
    }
    async create (req,res) {
        try {
            const response  = await bookingService.createBooking(req.body);
            console.log("from controller ",response)
            return res.status(StatusCodes.OK).json({
                data: response,
                success: true,
                err: {},
                message: 'Successfully completed  booking'
            });
        } catch (error) { 
            console.log("from err book controler",error)
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