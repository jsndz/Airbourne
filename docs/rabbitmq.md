# RabbitMQ Integration in Node.js

## Table of Contents

1. [Introduction](#introduction)
2. [Key RabbitMQ Concepts](#key-rabbitmq-concepts)
3. [Setting up RabbitMQ Channel](#setting-up-rabbitmq-channel)
4. [Publishing Messages](#publishing-messages)
5. [Subscribing/Consuming Messages](#subscribingconsuming-messages)
6. [Consumer Binding to Queues](#consumer-binding-to-queues)
6. [Example: Booking Service Integration](#example-booking-service-integration)
7. [References](#references)

---

## Introduction

RabbitMQ is a **message broker** that allows different parts of a system to communicate asynchronously. It is widely used for **decoupling services**, **scaling**, and **ensuring reliable message delivery**.

Key points about RabbitMQ:

* **Asynchronous**: Producers and consumers do not block each other; messages are queued and delivered independently.
* **Server-based**: RabbitMQ runs as a standalone server that handles all messaging.
* **Pub-Sub Model**: Supports publish-subscribe pattern; producers publish messages to exchanges, and consumers subscribe to queues.
* **Channels**: Each connection can have multiple channels, which are lightweight virtual connections for communication.
* **Two-way communication**: Producers and consumers can both send and receive messages.
* **Protocol**: Uses AMQP (Advanced Message Queuing Protocol) for standardized messaging.

**Flow diagram**:

```
      channels                      channels
pub <----------> RabbitMQ (server) <-----------> sub
```

In this project, RabbitMQ is used to **publish booking notifications** after a successful flight booking.

---


## Key RabbitMQ Concepts

1. **Producer** – A service that sends messages to RabbitMQ.
2. **Consumer** – A service that receives messages from RabbitMQ.
3. **Exchange** – Routes messages to one or more queues based on a routing key.

   * Types: `direct`, `topic`, `fanout`, `headers`
4. **Queue** – Holds messages until they are processed by consumers.
5. **Binding** – A connection between an exchange and a queue, using a **binding key**.
6. **Routing Key** – Used by the exchange to determine which queue(s) a message should go to.

---

## Setting up RabbitMQ Channel

You need a **channel** to communicate with RabbitMQ. You also declare an **exchange** to route messages.

```js
const amqplib = require('amqplib');
const { MESSAGE_BROKER_URL, EXCHANGE_NAME } = require('../config/serverConfig');

const createChannel = async () => {
    try {
        const connection = await amqplib.connect(MESSAGE_BROKER_URL);
        const channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'direct', false); // direct exchange
        return channel;
    } catch (error) {
        throw error;
    }
};

module.exports = { createChannel };
```

**Explanation**:

* `assertExchange` ensures the exchange exists before publishing.
* `'direct'` type routes messages to queues **based on exact matching of the routing key**.

---

## Publishing Messages

To send a message, you publish it to an exchange with a **binding key**:

```js
const publishMessage = async (channel, binding_key, message) => {
    try {
        await channel.publish(EXCHANGE_NAME, binding_key, Buffer.from(message));
        console.log("Message published:", message);
    } catch (error) {
        throw error;
    }
};
```

**Notes**:

* You **don’t need to assert the queue** when publishing if you only care about routing through the exchange.
* The consumer will bind queues dynamically based on the routing key.

---

## Subscribing / Consuming Messages

Consumers **bind a queue to an exchange** and listen for messages:

```js
const subscribeMessage = async (channel, QUEUE_NAME, binding_key) => {
    try {
        const applicationQueue = await channel.assertQueue(QUEUE_NAME);
        channel.bindQueue(applicationQueue.queue, EXCHANGE_NAME, binding_key);

        channel.consume(applicationQueue.queue, (msg) => {
            console.log('Received data:', msg.content.toString());
            channel.ack(msg); // Acknowledge message
        });
    } catch (error) {
        throw error;
    }
};
```

**Explanation**:

1. `assertQueue` ensures the queue exists.
2. `bindQueue` connects the queue to the exchange with a routing key.
3. `consume` registers a handler to process messages.
4. `ack` confirms message delivery so RabbitMQ can remove it from the queue.

---


## Consumer Binding to Queues

Consumers **do not need to know about the producer’s queue**. They can:

* Create their own queue with any name.
* Bind that queue to an existing **exchange**.
* Specify a **binding key** to receive only messages relevant to them.

```js
const subscribeMessage = async (channel, QUEUE_NAME, binding_key) => {
    const applicationQueue = await channel.assertQueue(QUEUE_NAME); // consumer queue
    channel.bindQueue(applicationQueue.queue, EXCHANGE_NAME, binding_key); // bind to exchange

    channel.consume(applicationQueue.queue, (msg) => {
        console.log('Received:', msg.content.toString());
        channel.ack(msg);
    });
};
```

**Explanation**:

* The **exchange** routes messages to all bound queues that match the **binding key**.
* This allows multiple consumers to bind **different queues** to the same exchange and selectively receive messages.
* The producer does not need to know or manage the queues — it only publishes to the exchange with a routing key.

---




## Example: Booking Service Integration

In a flight booking system:

* **Producer** – BookingService publishes a notification after successful booking.
* **Consumer** – Notification service listens to the queue and sends emails.

```js
// BookingController
class BookingController {
    constructor(channel) {
        this.channel = channel;
    }

    async sendMessageToQueue(req, res) {
        const payload = {
            data: {
                subject: 'Booking Confirmation',
                content: 'Your booking is confirmed!',
                recepientEmail: req.body.recepientEmail,
                notificationTime: new Date().toISOString()
            },
            service: 'CREATE_TICKET'
        };

        await publishMessage(this.channel, REMINDER_BINDING_KEY, JSON.stringify(payload));

        return res.status(201).json({ message: 'Successfully published message' });
    }
}
```

* `REMINDER_BINDING_KEY` is used to route the message to the correct queue.
* Consumers can **bind any queue** with the exchange using the same binding key.

---
## RabbitMQ Flow Summary

```
BookingController (Producer)
         │
         ▼
      Exchange (direct)
     ┌───────────┐
     │ Binding   │
     ▼           ▼
Queue1       Queue2 (Consumers)
     │           │
     ▼           ▼
 Email       SMS / Notification
 Service      Service
```

* Multiple queues can bind to the same exchange with the **same or different routing keys**.
* Consumers can process messages independently.

---

## References

1. [RabbitMQ Official Documentation](https://www.rabbitmq.com/documentation.html)
2. [AMQP Protocol Basics](https://www.rabbitmq.com/tutorials/amqp-concepts.html)

---
