const express = require('express');
const bodyParser = require('body-parser');
const setUpJobs = require('./utils/jobs');

const {PORT,REMINDER_BINDING_KEY} = require('./config/serverconfig');
const {createChannel,subscribeMessage} = require('./utils/messagequeue')
const EmailService = require('./services/email-service')
const db = require('./models/index')

const TicketController = require('./controller/ticket-controller')


const setUpServer = async () => {
    const app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:true}));

    const channel = await createChannel();
    subscribeMessage(channel,'notification_queue',EmailService.subscribeEvents,REMINDER_BINDING_KEY);
  
    app.use('/api/v1/tickets',TicketController.create);

    app.listen(PORT,() => {
        console.log(`Server started at ${PORT}`);
        if(process.env.DB_SYNC){
            db.sequelize.sync({force: true });
        }
        setUpJobs();
    })
}

setUpServer();


