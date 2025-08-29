const { ClientErrorCodes} = require('../utils/error-codes')

const validateCreateFlight = (req,res,next) => {
    if(req.body.flightNumber || 
        req.body.airplaneId ||
        req.body.departureAirportID ||
        req.body.arrivalAirportId ||
        req.body.arrivalTime ||
        req.body.departureTime ||
        req.body.price 
        )
        {
            return res.status(ClientErrorCodes.Bad_Request).json({
                data: {},
                sucess: false,
                message: 'Invalid request body for create flight',
                err: 'Missing mandatory properties to create a flight'
            });
        }

        next();
}

module.exports = {
    validateCreateFlight
}