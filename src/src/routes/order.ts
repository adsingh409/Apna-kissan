import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, processOrder } from "../controllers/order.js";

const app = express.Router();

app.post('/new', newOrder);
app.get('/my', myOrders);
app.get('/all', adminOnly, allOrders);
app.get('/:id', getSingleOrder);
app.put('/:id', processOrder);
app.delete('/:id', deleteOrder);

export default app;