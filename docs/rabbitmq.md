RabbitMQ is asychrounous
It has a server
Build as a pub-sub model
There is a rabbit MQ server which handles all the communication
      channels                      channels
pub <----------> rabbitMQ (server) <-----------> sub

Its a two way communication
Uses AMQP as a protocol for communication
There a channels inside the each connection 