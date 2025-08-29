const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {PORT} = require('./config/serverConfig');
const ApiRoutes = require('./router/index');
const db = require('./models/index')

const setupandstart = () =>{
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:true}));
    // app.get('/bookingservice/api/v1/home',(req,res) =>{
    //     return res.json({message:'Hitting the bokking service'})
    // })
    app.use('/bookingservice/api',ApiRoutes)
    
    app.listen(PORT,()=>{
        console.log(`Server started  at ${PORT}`);

        if(process.env.DB_SYNC){
            db.sequelize.sync({alter:true});
        }
    })
}
setupandstart(); 