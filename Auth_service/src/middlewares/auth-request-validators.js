const validateAuthUser = (req,res,next) => {
    if(!req.body.email || !req.body.password){
        return res.status(400).json({
            data: {},
            err:'email or password is missing',
            sucess:false,
            message:'something went wrong'
        })
    }
    next();
}

const validateIsAdminRequest = (req,res,next)=>{
    if(!req.body.id){
        return res.status(400).json({
            data: {},
            error:'userId is not given',
            sucess:false,
            message:"something went wrong"
        })
    }
    next();
}

module.exports = {
    validateAuthUser,
    validateIsAdminRequest
};