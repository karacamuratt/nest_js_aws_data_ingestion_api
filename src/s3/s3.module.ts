import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';

/**
 * S3 Service module definition
 * Exporting S3Service to use it by another modules
 */
@Module({
    providers: [S3Service],
    exports: [S3Service],
})

export class S3Module {}
