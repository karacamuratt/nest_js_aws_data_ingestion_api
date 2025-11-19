import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const serverAdapter = new ExpressAdapter();

    serverAdapter.setBasePath('/bull-board');

    const queueName = 'aws-data-ingestion';

    const awsDataIngestionQueue = app.get(getQueueToken(queueName)); 

    createBullBoard({
        queues: [new BullAdapter(awsDataIngestionQueue)], 
        serverAdapter,
    });

    app.use('/bull-board', serverAdapter.getRouter());

    await app.listen(3000);
    console.log(`Bull Board : http://localhost:3000/bull-board`);
}

bootstrap();
