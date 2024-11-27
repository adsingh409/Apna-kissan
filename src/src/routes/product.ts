import express from "express";
import { singleUpload } from "../middlewares/multer.js";
import { allProducts, deleteProduct, getAdminProducts, getAllCategories, getSingleProduct, latestProducts, newProduct, updateProduct } from "../controllers/product.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

app.post('/new', adminOnly, singleUpload, newProduct);
app.get('/latest', latestProducts);
app.get('/all', allProducts); 
app.get('/categories', getAllCategories);
app.get('/admin-products', adminOnly, getAdminProducts);
app.get('/:id', getSingleProduct);
app.put('/:id', adminOnly, singleUpload, updateProduct);
app.delete('/:id', adminOnly, deleteProduct);                       //To get all Products with filters  - /api/v1/product/all                      //To get all Products with filters  - /api/v1/product/all

export default app;