import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'kafka-service',
  brokers: ['zookeeper:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'files-group' });

const run = async () => {
  // Producing
  await producer.connect();

  // Consuming
  await consumer.connect();
  await consumer.subscribe({ topic: 'save-file', fromBeginning: true });

  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const id = message.key.toString();
      const data = JSON.parse(message.value.toString());

      if (topic === 'save-file') {
        try {
          const response = await axios.post(`http://localhost:3000/save/file/${id}`, data);
          const result = {
            status: response.status,
            data: response.data
          };
          await producer.send({
            topic: 'file-saved',
            messages: [{ key: id, value: JSON.stringify(result) }]
          });
        } catch (error) {
          console.error('Error saving file:', error.message);
        }
      }
    }
  });
};

run().catch(console.error);
