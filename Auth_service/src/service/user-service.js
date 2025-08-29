const { JWT_key } = require('../config/serverConfig');
const UserRepository = require('../repository/user-repository');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const AppErrors = require('../utils/error-handler');


class UserService {
    constructor(){
        this.userRepository = new UserRepository();
    }

    async create(data){
        try {
            const user = await this.userRepository.create(data);
            return user;
        } catch (error) {
            if(error.name == 'SequelizeValidationError'){
                throw error;
           }
            console.log("something went wrong in service layer");
            // throw new AppErrors(
            //     'serverError',
            //     'something went wrong in service ',
            //     'logical issues found ',
            //     500
            // ); 
            throw error;
        }
    }

    async signin(email,plainPassword){
        try {
            const user = await this.userRepository.getByEmail(email);
            const passwordMatch = this.checkPassword(plainPassword,user.password);

            if(!passwordMatch){
                console.log("password doesnt match");
                throw {error:'password doesnt match'}
            }

            const newJWT = this.createtoken({email:user.email,id:user.id});
            return newJWT;
        } catch (error) {
            // if(error.name == 'AttributeNotFound'){
            //     throw error;
            // }
            console.log("something went wrong in service layer for sign in process");
            throw error; 
        } 
    }

    async isAuthenticated(token){
        try {
            const response = await this.verifyToken(token);
            

            if(!response){
                
                throw {error:'invalid token'}
            }
            const user = await this.userRepository.getById(response.id);

            if(!user){
                
                throw {error:'invalid user'}
            }
            return user.id;
        } catch (error) {
            console.log("something went wrong in service layer for auth process");
            throw error; 
        }
    }
    
   isAdmin(userId){
        try {
            return this.userRepository.isAdmin(userId);
        } catch (error) {
            console.log("something went wrong in service layer for auth process");
            throw error; 
    }
   }

    createtoken(user){
        try {
            const result = jwt.sign(user,JWT_key,{expiresIn:'1h'});
            return result;
        } catch (error) {
            console.log("something went wrong in service layer in token creation");
            throw error; 
        }
    }

    verifyToken(token){
        try {
            const result = jwt.verify(token,JWT_key);
            return result;
        } catch (error) {
            console.log("something went wrong in service layer in token verification");
            throw error; 
        }
    }

    checkPassword(userinputPlainpassword,encryptedpassword){
        try {
            return bcrypt.compareSync(userinputPlainpassword,encryptedpassword);
        } catch (error) {
            console.log("something went wrong in service layer in checking password");
            throw error; 
        }
    }




}

module.exports = UserService;