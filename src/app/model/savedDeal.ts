import { Schema, model, Types, type Document } from 'mongoose';

export type SavedDealStatus = 'active' | 'removed' | 'unavailable';
export type SavedDealRemovedReason =
  | 'inactive'
  | 'expired'
  | 'sold_out'
  | 'deleted'
  | 'user_removed'
  | 'unavailable';

export interface ISavedDeal extends Document {
  user: Types.ObjectId;
  deal: Types.ObjectId;
  status: SavedDealStatus;
  removedReason?: SavedDealRemovedReason;
  createdAt: Date;
  updatedAt: Date;
}

const savedDealSchema = new Schema<ISavedDeal>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    deal: { type: Schema.Types.ObjectId, ref: 'deals', required: true },
    status: {
      type: String,
      enum: ['active', 'removed'],
      default: 'active',
    },
    removedReason: {
      type: String,
      trim: true,
      enum: ['inactive', 'expired', 'sold_out', 'deleted', 'user_removed', 'unavailable'],
    },
  },
  { timestamps: true, collection: 'saved_deals' },
);

// Allow multiple saves for the same deal over time (no unique constraint)
savedDealSchema.index({ user: 1, deal: 1, status: 1 });

const SavedDeal = model<ISavedDeal>('saved_deals', savedDealSchema);

export default SavedDeal;
