import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { AWSDataService } from '../../aws_data/aws_data.service';
import { S3Service } from '../../s3/s3.service';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const JsonStream = require('jsonstream');

// Bull Queue Processor
@Processor('aws-data-ingestion')
export class IngestionProcessor {
    private readonly BATCH_SIZE = 5000; // Batch size for bulk insertion into MongoDB

    constructor(
        private readonly s3Service: S3Service,
        private readonly dataService: AWSDataService,
        private readonly configService: ConfigService
    ) {}

    // The processor will only process jobs with this name (process-file) in the queue.
    @Process('process-file')
    async handleIngestion(job: Job<{ s3Url: string }>): Promise<void> {
        const { s3Url } = job.data;
        
        const { bucketName, key } = this.parseS3Url(s3Url); 
        console.log(`Processing started: Bucket=${bucketName}, Key=${key}`);

        let recordCount = 0;
        let batch: any[] = [];
        
        // Starting the stream using the S3 Service
        // To initiate reading of large files in chunks structure without loading the entire file into memory. 
        // This reduces memory consumption.
        const stream = await this.s3Service.getFileStream(s3Url);
        const jsonStream = JsonStream.parse([true]); // [true] -> each element must be streamed separately.
        
        return new Promise<void>((resolve, reject) => {
            // Creating pipeline
            stream.pipe(jsonStream)
            .on('data', async (item) => {
                // Transforming JSON data with unified fields + original data.
                const transformedRecord = this.transformData(item, key);
                batch.push(transformedRecord);
                recordCount++;

                if (batch.length >= this.BATCH_SIZE) {
                    // Pause the stream to avoid buffer overflow and throttling
                    jsonStream.pause(); 
                    try {
                        // if it's a new data, save it, if it exists in MongoDB, then update it.
                        await this.dataService.bulkUpsert(batch);
                        batch = []; // Reset the batch
                    } catch (e) {
                        console.error('Error during bulk insertion, continuing:', e.message);
                    } finally {
                        jsonStream.resume(); // Resume the stream
                    }
                }
            })
            .on('end', async () => {
                // Save the remaining final batch
                if (batch.length > 0) {
                    await this.dataService.bulkUpsert(batch);
                }
                console.log(`File successfully processed: ${key}. Total records: ${recordCount}`);
                resolve();
            })
            .on('error', (error) => {
                console.error(`JSON Stream/Parsing Error: ${key}`, error);
                reject(error);
            });

            // S3 reading errors
            stream.on('error', (error) => {
                console.error(`S3 Reading Error: ${key}`, error);
                reject(error);
            });
        });
    }
  
    /**
     * Parses the S3 URL into Bucket name and Key.
     * In a complex production environment, this should be done with more robust configuration.
     */
    private parseS3Url(url: string): { bucketName: string; key: string } {
        try {
            // Parses a simple and common URL format
            const urlObj = new URL(url);

            // Example: my-bucket.s3.eu-central-1.amazonaws.com
            const bucketName = this.configService.get<string>('S3_BUCKET_NAME')!;
            const key = urlObj.pathname.substring(1); // Skip the initial '/' character

            if (!key) {
                throw new Error(`Could not extract key from S3 URL: ${url}`);
            }

            return { bucketName, key };
        } catch (e) {
            throw new InternalServerErrorException(`Invalid S3 URL format: ${url}`);
        }
    }

    /**
     * Transforms raw JSON into the Unified Data Structure, handling format differences.
     */
    private transformData(raw: any, s3Key: string) {
        // Determine availability status
        const availability = 
            raw.availability !== undefined ? raw.availability : 
            raw.isAvailable !== undefined ? raw.isAvailable : 
            null;

        // Determine price
        const price = 
            raw.pricePerNight !== undefined ? Number(raw.pricePerNight) : 
            raw.priceForNight !== undefined ? Number(raw.priceForNight) : 
            null;

        // Determine city (handling nested address object in Source 2)
        const city = 
            raw.city !== undefined ? raw.city : 
            (raw.address && raw.address.city) ? raw.address.city : 
            null;

        return {
            sourceFile: s3Key,
            unifiedId: raw.id || 'N/A',
            unifiedCity: city,
            unifiedIsAvailable: availability,
            unifiedPrice: price,
            unifiedName: raw.name || null,
            unifiedSegment: raw.priceSegment || null,
            originalData: raw, 
        };
    }
}
