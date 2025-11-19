import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { AWSDataService } from './aws_data.service';
import { QueryParserService } from 'src/query/query-parser/query-parser.service';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Controller('data')
export class AWSDataController {
    private readonly defaultLimit: number;
    private readonly maxLimit: number;

    constructor(
        private readonly dataService: AWSDataService,
        private readonly queryParserService: QueryParserService,
        private readonly configService: ConfigService,
    ) {
        this.defaultLimit = this.configService.get<number>('QUERY_DEFAULT_LIMIT', 20);
        this.maxLimit = this.configService.get<number>('QUERY_MAX_LIMIT', 100);
    }

    @UseInterceptors(CacheInterceptor) // Caching the GET response on Redis, if not existing then call the data from DB.
    @CacheTTL(300) // 5 minutes cache TTL
    @Get()
    async findAll(@Query() query: Record<string, any>) {
        // Avoiding to pull the entire dataset at once. Reducing the network traffic and increases application responsiveness.
        const limit = Math.min(
            parseInt(query._limit || this.defaultLimit), 
            this.maxLimit
        );

        // Pagination adjustment
        const skip = parseInt(query._skip || 0);

        // MongoDB is waiting for "asc" as 1 and "desc" as -1 value.
        const sort = query._sort ? { [query._sort]: query._order === 'desc' ? -1 : 1 } : null;

        // Converting general HTTP query parameters to parameters in MongoDB format here
        const mongoFilter = this.queryParserService.parse(query);

        // Providing total count info in the GET response
        const totalCount = await this.dataService.count(mongoFilter);

        // (Filtering - limiting - Skipping - Sorting) and receiving the response for current API request here.
        const records = await this.dataService.findByFilter(
            mongoFilter, 
            limit, 
            skip, 
            sort
        );

        return {
            totalCount,
            limit,
            skip,
            data: records.map(data => data.toObject()), // Converting the clean JS object format here instead of Document object.
        };
    }
}
