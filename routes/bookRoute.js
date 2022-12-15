const mongoose = require('mongoose');
const { clearKey } = require('../services/cache');
const Book = mongoose.model('Book');
const { faker } = require('@faker-js/faker');

module.exports = (app) => {
  app.get('/api/info', async (req, res) => {
    res.status(200).end('ServerX');
  });
  
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
  
  app.get('/api/generate', async (req, res) => {
    const total = req.query.total;
    for (let i = 0; i < total; i++) {
      const book = new Book({
        title: faker.hacker.phrase(),
        content: faker.lorem.paragraph(),
        author: faker.name.fullName,
      });
      try {
        await book.save();
      } catch (err) {
        res.status(400).json(err);
      }
    }
    clearKey(Book.collection.collectionName);

    res.status(200).end('Success generate 100 books!!!');
  });
  
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
