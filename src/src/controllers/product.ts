import { NextFunction, Request, Response } from "express";
import { rm } from "fs";
import myCache from "../app.js";
import { invalidateCache } from "../config/feature.js";
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";



//1. For Adding New Product
export const newProduct = TryCatch(async(req : Request<{}, {}, NewProductRequestBody>,    // its fine if you dont use after request it will work as same
                                         res : Response,next : NextFunction) =>
{

    const {name, category, price, stock} = req.body;
    const photo = req.file;

    if(!photo) return next(new ErrorHandler("Please Add Photo", 400));

    if (!name || !price || !stock || !category) {
        rm(photo.path, () => {
          console.log("Deleted");
        });
  
        return next(new ErrorHandler("Please enter All Fields", 400));
      }

    await Product.create({
        name,
        category : category.toLowerCase(),
        price,
        stock,
        photo : photo?.path,
    });

    invalidateCache({ product: true, admin: true });             // After update cache will be restored

    return res.status(201).json({
        success : true,
        message : "Product Created Successfully"
    })

})


//2. For Fetching Top 5 Latest Products
export const latestProducts = TryCatch(async (req, res, next) => {

  let products;

  if (myCache.has("latest-products"))
    products = JSON.parse(myCache.get("latest-products") as string);
  else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    myCache.set("latest-products", JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
    })
})


//3. For getting categorys name
export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;

  if (myCache.has("categories"))
    categories = JSON.parse(myCache.get("categories") as string);
  else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

    return res.status(200).json({
        message : "All Categories Fetched",
        categories
    })
})

//4. For admin-products
export const getAdminProducts = TryCatch(async (req, res, next) => {

  let products;
  if (myCache.has("all-products"))
    products = JSON.parse(myCache.get("all-products") as string);
  else {
    products = await Product.find({});
    myCache.set("all-products", JSON.stringify(products));
  }

    return res.status(200).json({
        message : "Admin Product Fetched",
        products
    })
})

//5. Get Single Product
export const getSingleProduct = TryCatch(async (req, res, next) => {

  let product;
  const id = req.params.id;
  if (myCache.has(`product-${id}`))
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  else {
    product = await Product.findById(id);

    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    myCache.set(`product-${id}`, JSON.stringify(product));
  }

    return res.status(200).json({
        message : "Admin Product Fetched",
        product
    })
})

//6. Update Single product
export const updateProduct = TryCatch(async(req,res,next) =>
{

    const { id } = req.params;
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    const product = await Product.findById(id);
  
    if (!product) return next(new ErrorHandler("Product Not Found", 404));
  
    if (photo) {
      rm(product.photo!, () => {
        console.log("Old Photo Deleted");
      });
      product.photo = photo.path;
    }

    if(name) product.name = name;
    if(price) product.price = price;
    if(stock) product.stock = stock;
    if(category) product.category = category;


    await product.save();

    // After update cache will be restored
    invalidateCache({
      product: true,
      productId: String(product._id),
      admin: true,
    });

    return res.status(200).json({
        success : true,
        message : "Product Updated Successfully"
    })

})

//7. Delete Product
export const deleteProduct = TryCatch(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    rm(product.photo!, () => {
        console.log("Product Photo Deleted");
      });
    
    const deletedProduct = await product.deleteOne();

    // After update cache will be restored
    invalidateCache({
      product: true,
      productId: String(product._id),
      admin: true,
    });

    return res.status(200).json({
        message : "Product Deleted",
        deletedProduct
    })
})

//7. Getting Products According To Filter Applied

export const allProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;
    // 1,2,3,4,5,6,7,8
    // 9,10,11,12,13,14,15,16
    // 17,18,19,20,21,22,23,24
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredOnlyProduct] = await Promise.all([
      productsPromise,
      Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);
