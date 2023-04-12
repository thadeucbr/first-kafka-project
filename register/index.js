import express from 'express';
import { Kafka } from 'kafkajs';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const kafka = new Kafka({
  clientId: 'register-service',
  brokers: ['kafka:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'register-group' });
const eventEmitter = new EventEmitter();

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

const app = express();
app.use(express.json());

app.post('/user', async (req, res) => {
  try {
    const data = req.body;
    const id = uuidv4();

    // Send a message to the Kafka save-file topic
    await producer.connect();
    await producer.send({
      topic: 'save-file',
      messages: [{ key: id, value: JSON.stringify(data) }]
    });

    eventEmitter.once(`file-saved:${id}`, (responseData) => {
      res.status(201).json({ id });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/user/:id', async (req, res) => {
  const id = req.params.id;
  
  // Send a message to the Kafka get-file topic
  await producer.connect();
  await producer.send({
    topic: 'get-file',
    messages: [{ key: id, value: '' }] // Adicione um valor vazio ou string vazia aqui
  });

  eventEmitter.once(`file-retrieved:${id}`, (responseData) => {
    if (responseData.message === 'File not found.') {
      res.status(404).json({ message: 'File not found.' });
    } else {
      res.status(200).send(responseData);
    }
  });
});


app.listen(3001, () => console.log('Running on port 3001'));

// Consume the response from file-saved and file-retrieved topics
const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'file-saved', fromBeginning: true });
  await consumer.subscribe({ topic: 'file-retrieved', fromBeginning: true });

  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const responseId = message.key.toString();
      const responseData = JSON.parse(message.value.toString());

      if (topic === 'file-saved') {
        eventEmitter.emit(`file-saved:${responseId}`, responseData);
      } else if (topic === 'file-retrieved') {
        eventEmitter.emit(`file-retrieved:${responseId}`, responseData);
      }
    }
  });
};

runConsumer().catch(console.error);
