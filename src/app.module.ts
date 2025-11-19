import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AwsDataModule } from './aws_data/aws_data.module';
import { QueueModule } from './queue/queue.module';
import { S3Module } from './s3/s3.module';
import { QueryParserService } from './query/query-parser/query-parser.service';
import { TestIngestionController } from './test_ingestion/test_ingestion.controller';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        /**
         * Cache library in general cache interface in NestJS and Redis as a cache store.
         * Adding a fast, out-of-memory caching layer 
         * Improving the performance of API queries and reduce database load
         */
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                store: redisStore, 
                host: configService.get<string>('REDIS_HOST') || 'localhost',
                port: configService.get<number>('REDIS_PORT') || 6379,
                ttl: 60,
            }),
            inject: [ConfigService],
            isGlobal: true,
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGO_URI'),
            }),
            inject: [ConfigService],
        }),
        AwsDataModule,
        QueueModule,
        S3Module,
    ],
    controllers: [AppController, TestIngestionController],
    providers: [AppService, QueryParserService],
})

export class AppModule {}
