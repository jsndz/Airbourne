const UserService = require('../service/user-service');

const {response} = require('express');

const userService = new UserService();

const create = async (req,res) => {
    try {
        const response = await userService.create({
            email:req.body.email,
            password:req.body.password
        });
        return res.status(201).json({
            data: response,
            error:{},
            sucess:true,
            message:"created the User"
        })
    } catch (error) {
        // console.log(error);
        return res.status(error.statusCode).json({
            data: {},
            err: error.explanation,
            sucess:false,
            message:error.message,
            
        })
    }
}

const isAuthenticated = async (req,res) => {
    try {
        const token = await req.headers['x-access-token'];
        const response = await userService.isAuthenticated(token);
        return res.status(201).json({
            data: response,
            error:{},
            sucess:true,
            message:" authentication is successful"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            error:{error},
            sucess:false,
            message:"authentication is unsuccessful"
        })
    }
}

const signin = async (req,res) => {
    try {
        const response = await userService.signin(req.body.email,req.body.password);
        return res.status(200).json({
            data: response,
            error:{},
            sucess:true,
            message:" sign in successful"
        })
    } catch (error) {
        // console.log(error);
        // console.log(error.statusCode)
        // return res.status(error.statusCode).json({
        //     data: {},
        //     err: error.explanation,
        //     sucess:false,
        //     message:error.message
        // })
        return res.status(500).json({
            data: {},
            error:{error},
            sucess:false,
            message:"signin is unsuccessful"
        })
    }
   

}

const isAdmin = async (req,res) => {
    try {
        
        const response = await userService.isAdmin(req.body.id);
        return res.status(201).json({
            data: response,
            error:{},
            sucess:true,
            message:"  is admin"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            error:{error},
            sucess:false,
            message:"isnt admin"
        })
    }
}

module.exports = {
    create,
    signin,
    isAuthenticated,
    isAdmin
}