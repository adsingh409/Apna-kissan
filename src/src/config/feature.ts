import mongoose, { Document } from "mongoose";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import myCache from "../app.js";
import { Product } from "../models/product.js";

export const connectDB = (uri : string) => {
    mongoose.connect(uri, {
        dbName : "Sharad_Ecommerce",
    }).then((c) => console.log(`DB is connected to ${c.connection.host}`))
    .catch((e) => console.log(e))
}


// This is needed because we use caching for faster response i.e. storing data in local cache
export const invalidateCache = ({
    product,
    order,
    admin,
    userId,
    orderId,
    productId,
  }: InvalidateCacheProps) => {
    if (product) {
      const productKeys: string[] = [
        "latest-products",
        "categories",
        "all-products",
      ];
  
      if (typeof productId === "string") productKeys.push(`product-${productId}`);
  
      if (typeof productId === "object")
        productId.forEach((i) => productKeys.push(`product-${i}`));
  
      myCache.del(productKeys);
    }
    if (order) {
      const ordersKeys: string[] = [
        "all-orders",
        `my-orders-${userId}`,
        `order-${orderId}`,
      ];
  
      myCache.del(ordersKeys);
    }
    if (admin) {
      myCache.del([
        "admin-stats",
        "admin-pie-charts",
        "admin-bar-charts",
        "admin-line-charts",
      ]);
    }
  };

  // Reduce stock of products that is ordered
  export const reduceStock = async (orderItems: OrderItemType[]) => {
    for (let i = 0; i < orderItems.length; i++) {                       // order can be multiple like 2mobiles, 1shirtetc
      const order = orderItems[i];                                      // taking each item from cart
      const product = await Product.findById(order.productId);          // finding product id
      if (!product) throw new Error("Product Not Found");              
      product.stock -= order.quantity;                                 // decreasing stock by no of product ordered
      await product.save();
    }
  };
 
// Calculating Percentage For Dashboard stats like user%, product% etc based on this and last month
  export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
    if (lastMonth === 0) return thisMonth * 100;
    const percent = (thisMonth / lastMonth) * 100;
    return Number(percent.toFixed(0));
  };


  export const getInventories = async ({
    categories,
    productsCount,
  }: {
    categories: string[];
    productsCount: number;
  }) => {
    const categoriesCountPromise = categories.map((category) =>
      Product.countDocuments({ category })
    );
  
    const categoriesCount = await Promise.all(categoriesCountPromise);
  
    const categoryCount: Record<string, number>[] = [];
  
    categories.forEach((category, i) => {
      categoryCount.push({
        [category]: Math.round((categoriesCount[i] / productsCount) * 100),
      });
    });
  
    return categoryCount;
  };

  interface MyDocument extends Document {
    createdAt: Date;
    discount?: number;
    total?: number;
  }

  type FuncProps = {
    length: number;
    docArr: MyDocument[];
    today: Date;
    property?: "discount" | "total";
  };

  export const getChartData = ({
    length,
    docArr,
    today,
    property,
  }: FuncProps) => {
    const data: number[] = new Array(length).fill(0);
  
    docArr.forEach((i) => {
      const creationDate = i.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
  
      if (monthDiff < length) {
        if (property) {
          data[length - monthDiff - 1] += i[property]!;
        } else {
          data[length - monthDiff - 1] += 1;
        }
      }
    });
  
    return data;
  };
  
