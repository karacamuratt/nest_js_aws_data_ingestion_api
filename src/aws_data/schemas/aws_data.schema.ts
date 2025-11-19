import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DataDocument = AWSDataSchema & Document;

@Schema({ timestamps: true })
export class AWSDataSchema {
    @Prop({ required: true })
    sourceFile: string;

    @Prop({ required: true, index: true })
    unifiedId: string; //INDEX = true ["id" field on both AWS s3 buckets]

    @Prop({ index: true })
    unifiedCity: string; //INDEX = true ["address.city" & "city"]

    @Prop({ required: true })
    unifiedPrice: number; // ["priceForNight" & "pricePerNight"]

    @Prop({ required: true })
    unifiedIsAvailable: boolean; // ["isAvailable" & "availability"]

    @Prop()
    unifiedName: string;

    @Prop()
    unifiedSegment: string;

    @Prop({ type: Object, required: true })
    originalData: Record<string, any>;
}

export const DataSchema = SchemaFactory.createForClass(AWSDataSchema);

// INDEXING STRUCTURE (MIGHT BE IMPROVED BASED ON BUSINESS INPUTS)
DataSchema.index({ unifiedId: 1 }, { unique: true });
DataSchema.index({ unifiedCity: 1 });
DataSchema.index({ unifiedIsAvailable: 1, unifiedPrice: 1 });
DataSchema.index({ unifiedCity: 1, unifiedIsAvailable: 1, unifiedPrice: 1 });
