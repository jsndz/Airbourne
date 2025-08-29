const express = require('express');
const bodyParser = require('body-parser');
const setUpJobs = require('./utils/jobs');

const {PORT,REMINDER_BINDING_KEY} = require('./config/serverconfig');
const {createChannel,subscribeMessage} = require('./utils/messagequeue')
const EmailService = require('./services/email-service')

const TicketController = require('./controller/ticket-controller')


const setUpServer = async () => {
    const app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:true}));

    const channel = await createChannel();
    subscribeMessage(channel,EmailService.subscribeEvents,REMINDER_BINDING_KEY)

    app.use('/api/v1/tickets',TicketController.create);

    app.listen(PORT,() => {
        console.log(`Server started at ${PORT}`);
        // setUpJobs();
    })
}

setUpServer();




// sendBasicEmail(
//     'helloJaison@gmail.com',
//     'jaisondz9360@gmail.com',
//     'testing mail',
//     'hello'
// );
// cron.schedule('* * * * *', () => {
//     console.log('running a task every minute');
//   });