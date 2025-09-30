const axios = require('axios');

const {BookingRepository} = require('../repository/index');
const {FLIGHT_SERVICE_PATH} = require('../config/serverConfig');
const {ServiceError} = require('../utils/error/index');
class BookingService {
    constructor(){
        this.bookingRepository = new BookingRepository();
    }

    async createBooking(data){
        const t = await sequelize.transaction();
        try {

            const flightId = data.flightId;
            let getFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`;
            const response = await axios.get(getFlightRequestURL);
            let flightData =response.data.data;
            let priceOfTheFlight = flightData.price;
            if (data.NoOfSeats > flightData.totalSeats){
                throw new ServiceError('something went wrong in booking process','insufficient seats')
            }
            const totalCost = priceOfTheFlight * data.NoOfSeats;
            const bookingPayload = {...data,totalCost};
            const booking = await this.bookingRepository.create(bookingPayload,t);
            const updateflightrequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
            await axios.patch(updateflightrequestURL,{totalSeats: flightData.totalSeats- booking.NoOfSeats});
            const finalBooking = await this.bookingRepository.update(booking.id,{status : "Booked"},t)
            await t.commit();

            return finalBooking;

        } catch (error) {
            await t.rollback();
            if(error.name == 'ValidationError' || error.name == 'repositoryERROR'){
                throw error;
            }
            throw new ServiceError();
        }
        
    }
}

module.exports = BookingService; 