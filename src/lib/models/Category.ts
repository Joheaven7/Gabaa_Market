import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  amharicName?: string;
  slug: string;
  parentId?: mongoose.Types.ObjectId;
  status: "ACTIVE" | "INACTIVE";
  sortOrder: number;
  icon?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    amharicName: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    sortOrder: { type: Number, default: 0 },
    icon: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
