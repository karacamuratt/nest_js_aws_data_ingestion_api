import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryParserService {
    public parse(query: Record<string, any>): Record<string, any> {
        const mongoFilter: Record<string, any> = {};

        for (const key in query) {
            // Skipping the key which contains underline "_" as it's a parameter in query.
            if (key.startsWith('_')) {
                continue;
            }

            const value = query[key];
            const parts = key.split('__'); // Example: unifiedPrice__gt=500

            if (parts.length === 1) { // Example: unifiedCity=cityName
                mongoFilter[key] = this.castValue(value);
            } else {
                const [field, operator] = parts;

                // To create filters suitable for MongoDB's query language instead of HTTP format.
                const mongoOp = this.getMongoOperator(operator);

                if (mongoOp) {
                    // Creates the MongoDB filter object.
                    mongoFilter[field] = { 
                        ...mongoFilter[field],
                        [mongoOp]: this.getOperatorValue(operator, value) 
                    };
                } else {
                    console.warn(`Unsupported operator: ${operator}`);
                }
            }
        }
        return mongoFilter;
    }

    private getMongoOperator(op: string): string | null {
        const operatorMap = {
        eq: '$eq', // Equals
        ne: '$ne', // Not equals
        gt: '$gt', // Greater than
        gte: '$gte', // Greater Than or Equals
        lt: '$lt', // Less Than
        lte: '$lte', // Less Than or Equals
        in: '$in', // In Array
        nin: '$nin', // Not In Array
        contains: '$regex', // Regular expressions
        };

        return operatorMap[op] || null;
    }
  
    private castValue(value: any): any {
        // Casting the value as number type if needed
        if (!isNaN(Number(value)) && typeof value !== 'boolean') {
            return Number(value);
        }

        return value;
    }

    private getOperatorValue(operator: string, value: any): any {
        // Converts the incoming single string value (e.g. "Paris,Amsterdam,Tokyo") into an array separated by commas.
        if (operator === 'in' || operator === 'nin') {
            return value.split(',').map(v => this.castValue(v.trim()));
        }

        // The $regex operator is used to perform a LIKE (like '%value%' in SQL). 
        // This format is necessary to provide efficient and flexible string searches.
        if (operator === 'contains') {
            return new RegExp(value, 'i');
        }

        return this.castValue(value);
    }
}
