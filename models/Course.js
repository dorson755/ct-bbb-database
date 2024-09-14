import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: String,
  startHour: String,
  endHour: String,
  days: [String],
  bbbContextName: String,
});

const Course = mongoose.model('Course', courseSchema);

export default Course;
