const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 8989;

// ✅ Enable CORS for your Flutter Firebase app
app.use(cors({
  origin: "https://leaf-and-lore.web.app"
}));

// Middleware
app.use(bodyParser.json());
app.use('/images', express.static('images')); // Serve static images

// Helper: Load data
const getData = () => {
  const rawData = fs.readFileSync("data.json");
  return JSON.parse(rawData);
};

// Helper: Save data
const saveData = (data) => {
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
};

// GET all products
app.get("/api/products", (req, res) => {
  const products = getData();
  const updatedProducts = products.map(product => ({
    ...product,
    coverImageUrl: `http://localhost:${PORT}/images/${encodeURIComponent(product.coverImage)}`
  }));
  res.json(updatedProducts);
});

// GET single product by ID (image)
app.get("/api/products/:id/image", (req, res) => {
  const id = parseInt(req.params.id);
  const products = getData();
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (!product.image) {
    return res.status(400).json({ error: "Image not specified for this product" });
  }

  const imagePath = path.join(__dirname, "images", product.image);

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: "Image file not found in images folder" });
  }

  res.sendFile(imagePath);
});

// POST new product
app.post("/api/products", (req, res) => {
  const products = getData();
  const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

  const newProduct = {
    id: newId,
    name: req.body.name,
    price: req.body.price,
    image: req.body.image // Just filename like "9.jpg"
  };

  products.push(newProduct);
  saveData(products);
  res.status(201).json(newProduct);
});

// PUT update product
app.put("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const products = getData();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) return res.status(404).send("Product not found");

  products[index] = { ...products[index], ...req.body };
  saveData(products);
  res.json(products[index]);
});

// DELETE product
app.delete("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const products = getData();
  const newProducts = products.filter(p => p.id !== id);

  if (products.length === newProducts.length)
    return res.status(404).send("Product not found");

  saveData(newProducts);
  res.send("Product deleted successfully");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}/api/products`);
  console.log(`🖼️  Images served from http://localhost:${PORT}/images/`);
});
