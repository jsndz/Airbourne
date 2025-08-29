const express = require('express');
const bodyParser = require('body-parser')
const {PORT,DB_SYNC} = require('./config/serverConfig');
const ApiRoutes = require('./routes/index');
const db = require('./models/index')
const {User,Role} = require('./models/index')

// const UserRepository = require('./repository/user-repository');
// const UserService = require('./service/user-service');
const app = express();

const prepareAndstartServer = () => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:true}));
    app.use('/api',ApiRoutes);
    app.listen(PORT, async () => {
        console.log(`server Started On Port :${PORT}`);
        if(process.env.DB_SYNC){
            db.sequelize.sync({alter:true});
        }
        // const u1 = await User.findByPk(2);
        // const r1= await Role.findByPk(3);
        // u1.addRole(r1);
    })
}

prepareAndstartServer();




// const repo = new UserRepository();
        // const response = await repo.getById(1)
        // console.log(response);
        // const serv = new UserService();

        // const nt = serv.createtoken({email:'jaison@admin.com',id:1})
        // console.log(nt);
        // const tkn='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImphaXNvbkBhZG1pbi5jb20iLCJpZCI6MSwiaWF0IjoxNjk1NTU5NzkyLCJleHAiOjE2OTU1NjMzOTJ9.RLYUPkgbUB7M0LQ5LmL7OixtRcdcw6CJuk4J5EFm6nk'
        // const response =serv.verifyToken(tkn);
        // console.log(response)