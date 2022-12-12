const mongoose = require('mongoose');
const { clearKey } = require('../services/cache');
const Book = mongoose.model('Book');

module.exports = (app) => {
  app.get('/api/books', async (req, res) => {
    let books;
    if (req.query.author) {
      books = await Book.find({ author: req.query.author }).cache();
    } else {
      books = await Book.find().cache({
        time: 10,
      });
    }

    res.status(200).json(books);
  });

  app.get('/api/info',(req,res)=>{
    res.status(200).end('Server1');
  })
  
  app.post('/api/books', async (req, res) => {
    const { title, content, author } = req.body;

    const book = new Book({
      title,
      content,
      author,
    });

    try {
      await book.save();
      clearKey(Book.collection.collectionName);
      res.status(200).json(book);
    } catch (err) {
      res.status(400).json(err);
    }
  });
  app.delete('/api/books', async (req, res) => {
    try {
      const deleteduser = await Book.deleteOne({ _id: req.query.id });
      res.status(200).json(deleteduser);
    } catch (error) {
      res.status(400).json(error);
    }
  });
};
