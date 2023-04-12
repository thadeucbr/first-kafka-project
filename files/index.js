import fs from 'fs';
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'files-service',
  brokers: ['kafka:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'files-group' });

const run = async () => {
  // Producing
  await producer.connect();

  // Consuming
  await consumer.connect();
  await consumer.subscribe({ topic: 'save-file', fromBeginning: false });
  await consumer.subscribe({ topic: 'get-file', fromBeginning: false });

  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const id = message.key.toString();

      if (topic === 'save-file') {
        const data = JSON.parse(message.value.toString());
        let storedData;

        try {
          storedData = JSON.parse(fs.readFileSync(`./data/${id}`));
        } catch (err) {
          fs.writeFileSync(`./data/${id}`, '[]');
          storedData = [];
        }

        storedData.push(data);
        fs.writeFileSync(`./data/${id}`, JSON.stringify(storedData));

        // Enviar a confirmação de que o arquivo foi salvo
        await producer.send({
          topic: 'file-saved',
          messages: [{ key: id, value: JSON.stringify({ message: 'Created' }) }]
        });
      } else if (topic === 'get-file') {
        let files;
        try {
          files = JSON.parse(fs.readFileSync(`./data/${id}`, 'utf-8'));

          // Enviar a resposta do arquivo encontrado
          await producer.send({
            topic: 'file-retrieved',
            messages: [{ key: id, value: JSON.stringify(files) }]
          });
        } catch (error) {
          // Enviar a resposta de arquivo não encontrado
          await producer.send({
            topic: 'file-retrieved',
            messages: [{ key: id, value: JSON.stringify({ message: 'File not found.' }) }]
          });
        }
      }
    }
  });
};

run().catch(console.error);