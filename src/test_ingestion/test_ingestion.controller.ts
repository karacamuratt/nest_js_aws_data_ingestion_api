import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

class IngestionRequestDto {
    s3Url: string;
}

@Controller('ingestion')
export class TestIngestionController {
    constructor(@InjectQueue('aws-data-ingestion') private ingestionQueue: Queue) {}

    @Post('trigger')
    async triggerIngestion(@Body() body: IngestionRequestDto) {
        if (!body.s3Url) {
            throw new BadRequestException('S3 URL is missing.');
        }

        /**
         * Avoiding the time-consuming (which can take hours) 
         * Delegating S3 file processing task to the background queue in Bull.
         */
        await this.ingestionQueue.add('process-file', {
            s3Url: body.s3Url,
        }, {
            attempts: 3, // Error management options for next try
            backoff: 10000 // Waiting time between the attemptions
        });

        return { 
            status: 'Job added to queue', 
            s3Url: body.s3Url 
        };
    }
}
