import express from 'express'

import userRoutes from './routes/user.js';
import productRoutes from './routes/product.js'
import orderRoutes from './routes/order.js'
import paymentRoutes from './routes/payment.js'
import dashboardRoute from "./routes/stats.js";

import { connectDB } from './config/feature.js';
import { Error } from 'mongoose';
import { errorMiddleware } from './middlewares/error.js';
import NodeCache from "node-cache";
import { config } from 'dotenv'
import morgan from 'morgan';
import Stripe from 'stripe';
import cors from 'cors';

config();

const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";

// connecting DB
connectDB(uri);

//creating Instace of stripe
export const stripe = new Stripe(stripeKey);

const myCache = new NodeCache();
export default myCache;

const app = express();


// middlewares
app.use(express.json());    
app.use(morgan("dev"));             // convert any req or res into json format
app.use(cors());

// using routes

app.get('/', (req, res) => {
    res.send("Welcome To Our Sharad Commerce Website")
})

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/product', productRoutes);
app.use('/api/v1/order', orderRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/dashboard', dashboardRoute);


app.use('/uploads', express.static("uploads"));
app.use(errorMiddleware);

app.listen(port, () => {
    console.log("Server is Working on localhost", port);
    
})