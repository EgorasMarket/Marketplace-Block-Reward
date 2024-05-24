import express from "express";
import validate from "express-validation";
import { check } from "express-validator";

import * as productController from "../controllers/products/products.controller";
import * as productValidator from "../controllers/products/products.validator";

const router = express.Router();

router.use("/bid", require("./bid"));
router.use("/qrdata", require("./qrdata"));

router.post(
  "/initialize/add/product",
  validate(productValidator.initialAdd),
  productController.initialAdd
);

router.post(
  "/initialize/add/product/direct",
  validate(productValidator.initialAddDirect),
  productController.initialAddDirect
);

router.put(
  "/update/new/product",
  validate(productValidator.updateProduct),
  productController.updateProduct
);

router.put(
  "/update",
  check("product_id").notEmpty().withMessage("Must not be empty"),
  productController.UpdateAsSold
);

// get requests
router.get("/all", productController.AllProducts);
router.get("/all-brands", productController.allBrands);
router.get("/all-categories", productController.allCategories);

router.get("/sold", productController.SoldProductsRecord);
router.get("/approved", productController.ApprovedProduct);


router.get(
  "/category/:category",
  check("category").notEmpty().withMessage("Please provide a category"),

  productController.FetchProductByCategory
);



module.exports = router;