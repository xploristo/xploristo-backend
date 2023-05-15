import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    teacherIds: [{ type: ObjectId, ref: 'User' }],
    studentIds: [{ type: ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

groupSchema.virtual('teachers', {
  ref: 'User',
  localField: 'teacherIds',
  foreignField: '_id',
});

groupSchema.virtual('students', {
  ref: 'User',
  localField: 'studentIds',
  foreignField: '_id',
});

const Group = new mongoose.model('Group', groupSchema, 'groups');

export { Group };
