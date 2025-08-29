// const express = require('express');
// const morgan = require('morgan')
// const app = express();
// const { createProxyMiddleware } = require('http-proxy-middleware');
// const { rateLimit } = require('express-rate-limit');
// const axios = require('axios')

// const PORT = 3005;

// const limiter = rateLimit({
// 	windowMs: 2 * 60 * 1000, 
// 	max: 5,
// })

// app.use(morgan('combined'));
// app.use(limiter);
// app.use('/bookingservice',async(req,res,next)=>{
//     console.log(req.headers['x-access-token']);
//     try {
//         const response = await axios.get('http://localhost:3001/api/v1/isauthenticated',{
//         headers:{
//             'x-access-token': req.headers['x-access-token']
//         }
//     });
//     console.log(response.data);
//     if(response.data.sucess){
//         next();
//     }
//     else{
//         return res.status(401).json({
//             message:'authorization error'
//     })
//     }
//     } catch (error) {
//         return res.status(401).json({
//             message:'authorization error'
//     })
//     }
    
//     next();
// });
// app.use('/bookingservice',createProxyMiddleware({ 
//     target: 'http://localhost:3002/',
//     changeOrigin:true
// }));
// app.get('/home',(req,res)=>
// {
//     return res.json({message:'OK'});
// })


// app.listen(PORT, () =>
// {
//     console.log(`Server started at ${PORT}`)
// })

const express = require('express');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();

const PORT = 3005;

const limiter = rateLimit({
	windowMs: 2 * 60 * 1000,
	max: 5, 
})

app.use(morgan('combined'));
app.use(limiter);
app.use('/bookingservice', async (req, res, next) => {
    console.log(req.headers['x-access-token']);
    try {
        const response = await axios.get('http://localhost:3001/api/v1/isauthenticated', {
            headers: {
                'x-access-token': req.headers['x-access-token']
            }
        });
        console.log(response.data);
        if(response.data.sucess) {
            next();
        } else {
            return res.status(401).json({
                message: 'Unauthoriseddd'
            })
        }
    } catch (error) {
        return res.status(401).json({
            message: 'Unauthorisedin'
        })
    }
})
app.use('/bookingservice', createProxyMiddleware({ target: 'http://localhost:3002/', changeOrigin: true}));
app.get('/home', (req, res) => {
    return res.json({message: 'OK'});
})

app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
});