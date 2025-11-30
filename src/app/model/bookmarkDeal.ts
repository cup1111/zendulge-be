import { Schema, model, Types, type Document } from 'mongoose';

export interface IBookmarkDeal extends Document {
  user: Types.ObjectId;
  deal: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bookmarkDealSchema = new Schema<IBookmarkDeal>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    deal: { type: Schema.Types.ObjectId, ref: 'deals', required: true },
  },
  { timestamps: true, collection: 'bookmarkDeal' },
);

bookmarkDealSchema.index({ user: 1, deal: 1 });

const BookmarkDeal = model<IBookmarkDeal>('bookmarkDeal', bookmarkDealSchema);

export default BookmarkDeal;
