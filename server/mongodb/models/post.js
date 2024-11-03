import mongoose from 'mongoose';

const Post = new mongoose.Schema({
  name: { type: String, required: true },
  prompt: { type: String, required: true },
  photo: { type: String, required: true },
  thumbnail: { type: String, default: '' }, // Allow empty string
  lowRes: { type: String, default: '' }, // Allow empty string
});

const PostSchema = mongoose.model('Post', Post);

export default PostSchema;