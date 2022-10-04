import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacherIds: { type: [ObjectId] },
}, {
  timestamps: true
});

const Group = new mongoose.model('Group', groupSchema, 'groups');

export { Group };
