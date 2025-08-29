const { StatusCodes } = require('http-status-codes');
const {User,Role} = require('../models/index');
const ClientError = require('../utils/validation-error');
const ValidationError = require('../utils/validation-error')

class UserRepository {

    async create(data) {
        try {
            const user = await User.create(data);
            return user;
        } catch (error) {
            // console.log(error.errors)
            if(error.name == 'SequelizeValidationError') {
                // let validationError = new ValidationError(error);
                
                // throw validationError;
                throw new ValidationError(error);

            }
            console.log("Something went wrong on repository layer");
            throw error;
        } 
    } 

    async destroy(userId){
        try { 
            const response = await User.destroy({
                where:{
                    id:userId
                }
            
            });
            return response;
        } catch (error) {
            console.log("something went wrong in repository layer");
            throw error; 
        }
    }


    async getById(userId){
        try {
            const user = await User.findByPk(userId,{
                attributes:['email','id']
            });
            return user;
        } catch (error) {
            console.log("something went wrong in repository layer");
            throw error; 
        }
    }

    async getByEmail(userEmail){
        try {
            const user = await User.findOne({where:{
                email:userEmail
            }});
            // console.log(user)
            // if(!user){
            //     throw new ClientError(
            //          'AttributeNotFound',
            //          'Invalid email sent in the request',
            //          'Please check the email, as there is no record of the email',
            //          StatusCodes.NOT_FOUND
            //     )

            // }
            // console.log("the client")
            // console.log(ClientError)
            return user;
        } catch (error) {
            // throw error;
            console.log("something went wrong in getting email");
            throw error; 
        }
    }

    async isAdmin(userId){
        try {
            const user = await User.findByPk(userId)
            const adminRole = await Role.findOne({
                where:{
                    name:'ADMIN'
                }
            
            });
            return user.hasRole(adminRole);
        } catch (error) {
            console.log("something went wrong in repository layer");
            throw error; 
        }
    }

}
 module.exports = UserRepository;