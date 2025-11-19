import { Module } from '@nestjs/common';
import { QueryParserService } from './query-parser.service';

/**
 * Parse the query and present it to other modules of the app.
 * "QueryParserService" is responsible for converting HTTP query parameters 
 * (e.g., ?price=gt:100) into filters that MongoDB understands
 */
@Module({
    providers: [QueryParserService],
    exports: [QueryParserService], 
})

export class QueryParserModule {}
