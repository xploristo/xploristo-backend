import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

const resultsSchema = new mongoose.Schema(
  {
    assignmentId: { type: ObjectId, required: true },
    groupId: { type: ObjectId, required: true },
    userId: { type: ObjectId, required: true },
    questions: { type: Object },
    score: { type: Number },
    correctAnswersCount: { type: Number },
  },
  {
    timestamps: true,
  }
);

const Result = new mongoose.model('Result', resultsSchema, 'results');

export { Result };
