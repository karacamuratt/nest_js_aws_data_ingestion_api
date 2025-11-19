import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IngestionProcessor } from './aws-ingestion.processor/aws-ingestion.processor';
import { S3Module } from 'src/s3/s3.module';
import { AwsDataModule } from 'src/aws_data/aws_data.module';

@Module({
    imports: [
        // Decoupling the time-consuming tasks (reading files from S3 bucket, bulk writing into MongoDB) 
        // Separating the process from the main API flow and doing it in the background
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                redis: {
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue({
            name: 'aws-data-ingestion', // Queue name for ingestion flow.
        }),
        S3Module,
        AwsDataModule
    ],
    providers: [IngestionProcessor],
    exports: [BullModule],
})

export class QueueModule {}
