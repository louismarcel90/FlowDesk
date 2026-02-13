import { Kafka } from 'kafkajs';

const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID ?? 'flowdesk-workers',
  brokers
});
