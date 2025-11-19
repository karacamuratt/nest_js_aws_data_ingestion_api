import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AWSDataSchema, DataDocument } from './schemas/aws_data.schema';
import { AnyBulkWriteOperation } from 'mongoose';

@Injectable()
export class AWSDataService {
    constructor(@InjectModel(AWSDataSchema.name) private dataModel: Model<DataDocument>) {}

    async bulkUpsert(data: any[]): Promise<any> {
        /**
         * Avoiding the duplicated data by connecting to AWS S3 Bucket and retriving the same data
         * Executing a bulk upsert operation (update or insert)
         * Using the 'unifiedId' as the unique identifier.
         * This method ensures efficient data ingestion by combining multiple database operations
         * into a single network request.
         */
        const operations: AnyBulkWriteOperation[] = data.map(item => ({
                updateOne: {
                filter: { unifiedId: item.unifiedId }, 
                update: { $set: item }, 
                upsert: true, 
                },
        }));

        try {
            // Sending the operation list to MongoDB.
            const result = await this.dataModel.bulkWrite(operations);

            return result;
        } catch (error) {
            console.error('Error during bulk upsert:', error);
            throw error;
        }
    }

    /**
     * This method is not called from anywhere. It's added as an improvement point.
     * This can be used when the coming s3 bucket contains only new data.
     */
    async bulkInsert(records: Partial<AWSDataSchema>[]): Promise<void> {
        if (records.length === 0) {
            return;
        }

        try {
            /**
             * "ordered=false" It allows MongoDB to continue adding other records to the stack
             */
            await this.dataModel.insertMany(records, { ordered: false });
        } catch (error) {
            console.error('There are errors while bulk insert processing... :', error.message);
        }
    }

    /** Query method for API */
    // There can be an improvement point also here for specific fields 
    // with select() use-case instead of full object return
    // .select(fields.join(' ')) // e.g: '.select("unifiedId unifiedCity unifiedPrice")'
    async findByFilter(
        filter: any, 
        limit: number, 
        skip: number,
        sort: any = { createdAt: -1 }
        ): Promise<DataDocument[]> {
        return this.dataModel
            .find(filter) // finding the matched records
            .sort(sort) // sorting the matched records
            .limit(limit) // increasing the performance and speed
            .skip(skip) // retrieving only the records required for the current page from db.
            .exec(); // async query result as a Promise
    }

    /**
     * Provides the pagination data (totalCount) in the API response 
     * This is required to calculate the page numbers.
     */
    async count(filter: any): Promise<number> {
        return this.dataModel.countDocuments(filter).exec();
    }
}
