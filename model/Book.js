const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  owner: {
    // user in the database
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
    required: true,
  },
  tags: {
    type: [mongoose.Types.ObjectId],
  },
  blog: {
    type: String,
  },
});

mongoose.model('Blog', blogSchema);
