const amqplib = require('amqplib');
const {MESSAGE_BROKER_URL,EXCHANGE_NAME} = require('../config/serverconfig')

const createChannel = async () => {
    try {
        const connection = await amqplib.connect(MESSAGE_BROKER_URL);
        const channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME,'direct',false);
        return channel;
    } catch (error) {
        throw error;
    }
}

const subscribeMessage = async (channel,QUEUE_NAME, service, binding_key) => {
    try {
        const applicationQueue = await channel.assertQueue(QUEUE_NAME);

        channel.bindQueue(applicationQueue.queue, EXCHANGE_NAME,binding_key);

        channel.consume(applicationQueue.queue,msg =>{
            const payload = JSON.parse(msg.content.toString());
            service(payload);
            channel.ack(msg);
        });
    } catch (error) {
        throw error;
    }

}
module.exports = {
    createChannel,
    subscribeMessage
}