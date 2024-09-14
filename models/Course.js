import mongoose from 'mongoose';
import Course from './models/Course.js'; // Import the Course model

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startHour: { type: String, required: true }, // You can use a different type if needed
  endHour: { type: String, required: true },
  days: { type: [String], required: true }, // Array of days, e.g., ["Monday", "Wednesday"]
  bbbContextName: { type: String, required: true },
  // Additional fields if necessary
}, {
  timestamps: true // Optional: adds createdAt and updatedAt timestamps
});

const Course = mongoose.model('Course', courseSchema);

export default Course;
