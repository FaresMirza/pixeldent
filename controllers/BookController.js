const shortid = require("shortid");
const BookModel = require("../models/BookModel");
const Joi = require("joi");

// Joi schema for book validation
const bookSchema = Joi.object({
  book_name: Joi.string().min(1).required(),
  book_description: Joi.string().optional(),
  book_price: Joi.number().integer().positive().optional(),
  book_cover: Joi.string().optional(),
  book_link: Joi.string().uri().optional(),
});

module.exports = {
  async registerBook(req, res) {
    try {
      const { book_name, book_description, book_price, book_cover, book_link } = req.body;

      // Validate input using Joi
      const { error } = bookSchema.validate({ book_name, book_description, book_price, book_cover, book_link });
      if (error) return res.status(400).json({ error: error.details.map((detail) => detail.message) });

      const book_id = shortid.generate();
      const newBook = { book_id, book_name, book_description, book_price, book_cover, book_link };

      await BookModel.createBook(newBook);
      res.status(201).json({ message: "Book added successfully!", book: newBook });
    } catch (error) {
      console.error("Error registering book:", error);
      res.status(500).json({ error: "Error registering book", details: error.message });
    }
  },

  async getAllBooks(req, res) {
    try {
      const books = await BookModel.getAllBooks();
      res.status(200).json({ books });
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ error: "Error fetching books", details: error.message });
    }
  },

  async getBookById(req, res) {
    try {
      const { book_id } = req.params;
      const book = await BookModel.getBookById(book_id);
      if (!book) return res.status(404).json({ error: "Book not found" });

      res.status(200).json({ book });
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ error: "Error fetching book", details: error.message });
    }
  },

  async updateBookById(req, res) {
    try {
      const { book_id } = req.params;
      const { book_name, book_description, book_price, book_cover, book_link } = req.body;

      const updatedFields = Object.fromEntries(
        Object.entries({ book_name, book_description, book_price, book_cover, book_link }).filter(([, value]) => value !== undefined)
      );

      // Validate updated fields using Joi
      const { error } = bookSchema.validate(updatedFields);
      if (error) return res.status(400).json({ error: error.details.map((detail) => detail.message) });

      const updatedBook = await BookModel.updateBookById(book_id, updatedFields);
      if (!updatedBook) return res.status(404).json({ error: "Book not found" });

      res.status(200).json({ message: "Book updated successfully!", book: updatedBook });
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).json({ error: "Error updating book", details: error.message });
    }
  },

  async deleteBookById(req, res) {
    try {
      const { book_id } = req.params;

      const deleted = await BookModel.deleteBookById(book_id);
      if (!deleted) return res.status(404).json({ error: "Book not found" });

      res.status(200).json({ message: "Book deleted successfully!" });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ error: "Error deleting book", details: error.message });
    }
  },
};