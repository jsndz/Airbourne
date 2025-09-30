const {Booking} = require('../models/index');
const {ValidationError,AppError} =require('../utils/error/index');
const {StatusCodes} = require('http-status-codes');

class BookingRepository{


    async create(data,t){
        try {
            const booking = await Booking.create(data,{transaction:t})
            return booking;
        } catch (error) {
            if(error.name=='SequelizeValidationError'){
                throw new ValidationError(error);
            }
            throw new AppError(
                'repository ERROR',
                'Cannot create Booking',
                'there was issue in booking',
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }

    async update(bookingId, data,t){
        try {
            const booking = await Booking.findByPk(bookingId,{transaction:t});
            if(data.status){
                booking.status = data.status;
            }
            await booking.save({transaction:t});
            return booking;
        } catch (error) {
            throw new AppError(
                'repositoryERROR',
                'Cannot update Booking',
                'there was issue in booking',
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
}

module.exports = BookingRepository;