import { Module } from '@nestjs/common';
import { AWSDataService } from './aws_data.service';
import { AWSDataController } from './aws_data.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DataSchema, AWSDataSchema } from './schemas/aws_data.schema';
import { QueryParserModule } from 'src/query/query-parser/query-parser.module';

/** 
 * Processing the data stream from AWS (Service),
 * Providing access to this data via MongoDB (CRUD operations) (Module)
 * Defining API endpoints (Controller)
 */  
@Module({
    imports: [
        MongooseModule.forFeature([
            { 
                name: AWSDataSchema.name, // Model name
                schema: DataSchema // Schema reference
            }, 
        ]),
        QueryParserModule
    ],
    providers: [AWSDataService],
    controllers: [AWSDataController],
    exports: [AWSDataService] // Allowing to use "AWSDataService" by another modules.
})

export class AwsDataModule {}
