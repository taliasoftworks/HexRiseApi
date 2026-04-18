import { prop, getModelForClass, modelOptions, index } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'areas', timestamps: true } })
@index({ worldX: 1, worldY: 1 }, { unique: true })
export class Area {
    @prop({ required: true, type: Number }) worldX!: number;
    @prop({ required: true, type: Number }) worldY!: number;
    @prop({ required: true, type: Number }) biome!: number;
    @prop({ type: Buffer }) hexData?: Buffer;
    @prop({ default: 0, type: Number }) hexCount!: number;
}

export const AreaModel = getModelForClass(Area);
