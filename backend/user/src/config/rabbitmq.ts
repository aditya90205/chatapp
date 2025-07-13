import amqp from "amqplib";

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.RABBITMQ_HOST,
      port: 5672,
      username: process.env.RABBITMQ_USERNAME,
      password: process.env.RABBITMQ_PASSWORD,
    });
    channel = await connection.createChannel();
    console.log("RabbitMQ connected successfully");
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
    process.exit(1);
  }
};

export const publishToQueue = async (queueName: string, message: any) => {
  try {
    if (!channel) {
      console.log("Channel is not initialized. Cannot publish message.");
      return;
    }

    await channel.assertQueue(queueName, {
      durable: true,
    });

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    console.log(`Message sent to queue ${queueName}:`, message);
  } catch (error: any) {
    throw new Error(
      `Failed to publish message to queue ${queueName}: ${error.message}`
    );
  }
};
