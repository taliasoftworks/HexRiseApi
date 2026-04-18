import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import type { Ref } from '@typegoose/typegoose';
import { Area } from './area.db.model.js';

@modelOptions({ schemaOptions: { collection: 'players', timestamps: true } })
export class Player {
    @prop({ required: true, type: String, unique: true }) keycloakId!: string;
    @prop({ ref: () => Area }) currentArea?: Ref<Area>;
}

export const PlayerModel = getModelForClass(Player);
