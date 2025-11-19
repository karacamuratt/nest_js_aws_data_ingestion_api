import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Readable } from 'stream';
import axios from 'axios';

@Injectable()
export class S3Service {
    constructor() {}

    public async getFileStream(url: string): Promise<Readable> {
        try {
            /**
             * Instead of loading the entire file into memory at once
             * "responseType:stream" a stream object is returned that can process the data in chunks. 
             * This prevents memory overflows and optimizes performance.
             */
            const response = await axios.get(url, {
                responseType: 'stream',
            });

            return response.data as Readable;
        } catch (error) {
            console.error(`Axios get file error: ${url}`, error);
            throw new InternalServerErrorException('Failed to retrieve file stream.');
        }
    }
}
