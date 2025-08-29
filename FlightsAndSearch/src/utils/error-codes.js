const  ClientErrorCodes = Object.freeze({
    Bad_Request :400,
    Unauthorized :401,
    Not_Found :404 
});

const serverErrorCodes = Object.freeze({
    Internal_Server_Error:500,
    Not_Implemented:501 
});

const successCodes = Object.freeze({
    OK:200,
    created:201
})

module.exports = {
    ClientErrorCodes,
    serverErrorCodes,
    successCodes
}