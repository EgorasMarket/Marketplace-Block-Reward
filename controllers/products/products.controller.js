const db = require("../../config/sequelize");
const { Op } = require("sequelize");
const imgur = require("imgur");
const path = require("path");

const uuid = require("uuid").v4;

var fs = require("fs");

const {
  Product,
  User,
  Bidding,
  Membership,
  MintNFT,
  ProductCategories,
  Stake,
} = require("../../models");
const {
  successResponse,
  errorResponse,
  uniqueId,
  success,
} = require("../../helpers");
// const { validationResult } = require("express-validator");

exports.allProducts = async (req, res) => {
  try {
    const page = req.params.page || 1;
    const limit = 10;
    const users = await Product.findAndCountAll({
      order: [["createdAt", "DESC"]],
      offset: (page - 1) * limit,
      limit,
    });
    return successResponse(req, res, { users });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.allBrands = async (req, res) => {
  try {
    const allBrands = await Product.findAll({
      attributes: ["product_brand"],
      group: "product_brand",
    });

    return successResponse(req, res, { allBrands });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.allCategories = async (req, res) => {
  try {
    // const allCategories = await Product.findAll({
    //   attributes: ["product_category"],
    //   group: "product_category",
    //   where: {
    //     product_category: {
    //       [Op.ne]: "", // retrieve users whose age is not equal to 18
    //     },
    //   },
    // });

    let allCategories = await ProductCategories.findAll({
      attributes: ["product_category"],
    });

    return successResponse(req, res, { allCategories });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.initialAdd = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  console.log(req.files, "kkkkkkkk");
  try {
    if (req.files == null) {
      throw new Error("Please supply all product images");
    }

    if (
      req.files.product_image == null ||
      req.files.product_image2 == null ||
      req.files.product_image3 == null
    ) {
      throw new Error("Please supply all product images");
    }

    const { product_image, product_image2, product_image3 } = req.files;

    const {
      product_name,
      product_brand,
      product_condition,
      amount,
      userAddress,
      productType,
      productQuantity,
      // product_uuid,
    } = req.body;
    let product_id = uuid();

    const user = await User.findOne({ where: { wallet: userAddress } });
    const membership = await Membership.findOne({
      where: { address: userAddress },
    });

    if (!user) {
      throw new Error("User does not exists");
    }

    if (!membership) {
      throw new Error(
        "You do not have an active subscription for this service"
      );
    }

    // console.log(product_image, product_image2, product_image3);
    // console.log(product_name, product_brand, product_condition, amount);

    const more_img = [];

    const fileName =
      new Date().getTime().toString() + "Q" + path.extname(product_image.name);
    const savePath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "products",
      fileName
    );
    const fileName2 =
      new Date().getTime().toString() + "A" + path.extname(product_image2.name);
    const savePath2 = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "products",
      fileName2
    );
    const fileName3 =
      new Date().getTime().toString() + "P" + path.extname(product_image3.name);
    const savePath3 = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "products",
      fileName3
    );

    await product_image.mv(savePath);
    await product_image2.mv(savePath2);
    await product_image3.mv(savePath3);

    const contents = fs.readFileSync("./src/public/products/" + fileName, {
      encoding: "base64",
    });

    const contents2 = fs.readFileSync("./src/public/products/" + fileName2, {
      encoding: "base64",
    });

    const contents3 = fs.readFileSync("./src/public/products/" + fileName3, {
      encoding: "base64",
    });

    imgur.setClientId("2387cc44f4144f7");
    imgur.setAPIUrl("https://api.imgur.com/3/");

    var logo = contents.replace(/^data:image\/[a-z]+;base64,/, "");
    var logo2 = contents2.replace(/^data:image\/[a-z]+;base64,/, "");
    var logo3 = contents3.replace(/^data:image\/[a-z]+;base64,/, "");

    const rs_json = await imgur.uploadBase64(logo);
    const rs_json2 = await imgur.uploadBase64(logo2);
    const rs_json3 = await imgur.uploadBase64(logo3);

    console.log(rs_json.link, rs_json2.link, rs_json3.link, "ffff");

    if (rs_json.link) {
      more_img.push(rs_json.link);
    }

    if (rs_json2.link) {
      more_img.push(rs_json2.link);
    }

    if (rs_json3.link) {
      more_img.push(rs_json3.link);
    }

    var filePath = "./src/public/products/" + fileName;
    fs.unlinkSync(filePath);

    var filePath2 = "./src/public/products/" + fileName2;
    fs.unlinkSync(filePath2);

    var filePath3 = "./src/public/products/" + fileName3;
    fs.unlinkSync(filePath3);

    console.log(more_img);

    const payload = {
      product_id,
      // product_image: rs_json.link,
      user_images: JSON.stringify(more_img),
      product_name,
      product_brand,
      product_condition,
      user_wallet: userAddress,
      quantity: productQuantity,
      productType: productType,
      user_amount: parseFloat(amount),
    };

    const newProduct = await Product.create(payload, {
      transaction,
    });
    (await transaction).commit();
    return successResponse(req, res, {
      product_id: product_id,
      message: "Product uploaded successfully",
    });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.initialAddDirect = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  console.log(req.body, "kkkkkkkk");

  try {
    if (req.files == null) {
      throw new Error("Please supply all product images");
    }

    if (
      req.files.product_image == null ||
      req.files.product_image2 == null ||
      req.files.product_image3 == null
    ) {
      throw new Error("Please supply all product images");
    }

    const { product_image, product_image2, product_image3 } = req.files;

    const {
      product_name,
      product_brand,
      userAddress,
      productType,
      productQuantity,
      product_category,
      product_details,
      prod_spec,
      product_state,
      product_amount,
      // productType,
    } = req.body;
    let product_id = uuid();

    const user = await User.findOne({ where: { wallet: userAddress } });
    const membership = await Membership.findOne({
      where: { address: userAddress },
    });

    if (!user) {
      throw new Error("User does not exists");
    }

    if (!membership) {
      throw new Error(
        "You do not have an active subscription for this service"
      );
    }

    const more_img = [];

    const fileName =
      new Date().getTime().toString() + "Q" + path.extname(product_image.name);
    const savePath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "products",
      fileName
    );
    const fileName2 =
      new Date().getTime().toString() + "A" + path.extname(product_image2.name);
    const savePath2 = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "products",
      fileName2
    );
    const fileName3 =
      new Date().getTime().toString() + "P" + path.extname(product_image3.name);
    const savePath3 = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "products",
      fileName3
    );

    await product_image.mv(savePath);
    await product_image2.mv(savePath2);
    await product_image3.mv(savePath3);

    const contents = fs.readFileSync("./src/public/products/" + fileName, {
      encoding: "base64",
    });

    const contents2 = fs.readFileSync("./src/public/products/" + fileName2, {
      encoding: "base64",
    });

    const contents3 = fs.readFileSync("./src/public/products/" + fileName3, {
      encoding: "base64",
    });

    imgur.setClientId("2387cc44f4144f7");
    imgur.setAPIUrl("https://api.imgur.com/3/");

    var logo = contents.replace(/^data:image\/[a-z]+;base64,/, "");
    var logo2 = contents2.replace(/^data:image\/[a-z]+;base64,/, "");
    var logo3 = contents3.replace(/^data:image\/[a-z]+;base64,/, "");

    const rs_json = await imgur.uploadBase64(logo);
    const rs_json2 = await imgur.uploadBase64(logo2);
    const rs_json3 = await imgur.uploadBase64(logo3);

    console.log(rs_json.link, rs_json2.link, rs_json3.link, "ffff");

    if (rs_json.link) {
      more_img.push(rs_json.link);
    }

    if (rs_json2.link) {
      more_img.push(rs_json2.link);
    }

    if (rs_json3.link) {
      more_img.push(rs_json3.link);
    }

    var filePath = "./src/public/products/" + fileName;
    fs.unlinkSync(filePath);

    var filePath2 = "./src/public/products/" + fileName2;
    fs.unlinkSync(filePath2);

    var filePath3 = "./src/public/products/" + fileName3;
    fs.unlinkSync(filePath3);

    console.log(more_img);

    const payload = {
      product_id,
      product_images: JSON.stringify(more_img),
      product_name,
      product_brand,
      product_category,
      product_details,
      product_state: parseInt(product_state),
      user_wallet: userAddress,
      quantity: productQuantity,
      product_specifications: prod_spec,
      isFeatured: 0,
      //   user_amount: parseFloat(product_amount),
      amount: parseFloat(product_amount),
    };

    const newProduct = await Product.create(payload, {
      transaction,
    });
    (await transaction).commit();
    return successResponse(req, res, {
      product_id: product_id,
      message: "Product uploaded successfully",
    });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.updateProduct = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  // console.log(req.files, "kkkkkkkk");
  try {
    // let product_id = uuid();
    if (req.files == null) {
      throw new Error("Please supply all product images");
    }

    if (
      req.files.product_image == null ||
      req.files.product_image2 == null ||
      req.files.product_image3 == null
    ) {
      throw new Error("Please supply all product images");
    }

    const { product_image, product_image2, product_image3 } = req.files;

    const {
      product_id,
      product_name,
      product_brand,
      product_category,
      product_spec,
      product_details,
      // amount,
      adminAddr,
    } = req.body;

    // const user = await User.findOne({ where: { wallet: userAddress } });

    // if (!user) {
    //   throw new Error("User does not exists");
    // }

    // console.log(product_image, product_image2, product_image3);
    // console.log(
    //   product_id,
    //   product_name,
    //   product_brand,
    //   product_category,
    //   product_spec,
    //   product_details,
    //   amount,
    //   adminAddr
    // );

    const more_img = [];

    const fileName =
      new Date().getTime().toString() + "Q" + path.extname(product_image.name);
    const savePath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "products",
      fileName
    );
    const fileName2 =
      new Date().getTime().toString() + "A" + path.extname(product_image2.name);
    const savePath2 = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "products",
      fileName2
    );
    const fileName3 =
      new Date().getTime().toString() + "P" + path.extname(product_image3.name);
    const savePath3 = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "products",
      fileName3
    );

    await product_image.mv(savePath);
    await product_image2.mv(savePath2);
    await product_image3.mv(savePath3);

    const contents = fs.readFileSync("./src/public/products/" + fileName, {
      encoding: "base64",
    });

    const contents2 = fs.readFileSync("./src/public/products/" + fileName2, {
      encoding: "base64",
    });

    const contents3 = fs.readFileSync("./src/public/products/" + fileName3, {
      encoding: "base64",
    });

    imgur.setClientId("2387cc44f4144f7");
    imgur.setAPIUrl("https://api.imgur.com/3/");

    var logo = contents.replace(/^data:image\/[a-z]+;base64,/, "");
    var logo2 = contents2.replace(/^data:image\/[a-z]+;base64,/, "");
    var logo3 = contents3.replace(/^data:image\/[a-z]+;base64,/, "");

    const rs_json = await imgur.uploadBase64(logo);
    const rs_json2 = await imgur.uploadBase64(logo2);
    const rs_json3 = await imgur.uploadBase64(logo3);

    console.log(rs_json.link, rs_json2.link, rs_json3.link, "ffff");

    if (rs_json.link) {
      more_img.push(rs_json.link);
    }

    if (rs_json2.link) {
      more_img.push(rs_json2.link);
    }

    if (rs_json3.link) {
      more_img.push(rs_json3.link);
    }

    var filePath = "./src/public/products/" + fileName;
    fs.unlinkSync(filePath);

    var filePath2 = "./src/public/products/" + fileName2;
    fs.unlinkSync(filePath2);

    var filePath3 = "./src/public/products/" + fileName3;
    fs.unlinkSync(filePath3);

    console.log(more_img);

    // product_id,
    // product_name,
    // product_brand,
    // product_category,
    // product_spec,
    // product_details,
    // amount,
    // adminAddr

    const payload = {
      // product_id,
      // product_image: rs_json.link,
      product_images: JSON.stringify(more_img),
      status: 3,
      product_name,
      product_brand,
      product_category,
      product_specifications: product_spec,
      product_details,
      personnel: adminAddr,
      // final_amount: parseInt(amount),
    };

    const updateProduct = await Product.update(
      payload,
      {
        where: {
          product_id,
        },
      },
      {
        transaction,
      }
    );
    (await transaction).commit();
    return successResponse(req, res, {
      // product_id: product_id,
      message: "Product updated successfully",
    });
  } catch (error) {
    return errorResponse(req, res, error.message);
  }
};

exports.AllProducts = async (req, res) => {
  try {
    const getProduct = await Product.findAll({
      where: {
        index_id: {
          [Op.ne]: "", // retrieve users whose age is not equal to 18
        },
      },
    });

    return successResponse(req, res, getProduct, 200);
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

exports.FindOneProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const getProduct = await Product.findOne({
      where: {
        id,
      },
    });

    return successResponse(req, res, getProduct, 200);
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

exports.GenerateProductNFT = async (req, res) => {
  try {
    console.log(req.params);
    const { token_id } = req.params;
    const getMintNFT = await MintNFT.findOne({
      where: {
        token_id: token_id,
      },
    });
    if (getMintNFT) {
      const getProduct = await Product.findOne({
        where: {
          index_id: getMintNFT.product_id,
        },
      });

      if (getProduct == null) {
        const payload = {
          name: "N/A",
          description: "N/A",
          image: "JSON.parse(getProduct.user_images)[0]",
        };

        return res.status(200).json(payload);
      }

      const payload = {
        name: getProduct.product_name,
        description: getProduct.product_specifications,
        image: JSON.parse(getProduct.user_images)[0],
      };

      return res.status(200).json(payload);
    } else {
      const payload = {
        name: "N/A",
        description: "N/A",
        image: "JSON.parse(getProduct.user_images)[0]",
      };

      return res.status(200).json(payload);
    }
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

exports.NewProducts = async (req, res) => {
  try {
    // const getProduct = await Product.findAll({
    //   where: {
    //     status: "NEW",
    //     tradable: 0,
    //   },
    // });

    const [results, metadata] = await db.sequelize.query(
      `SELECT Biddings.amount AS bidAmount, Biddings.bidder AS adminBidder, Biddings.status AS bidStatus, Users.fullName, Users.phoneNumber, Users.userAddress, Users.wallet, Products.* FROM Products LEFT JOIN Biddings ON Products.index_id = Biddings.productID LEFT JOIN Users ON Products.user_wallet = Users.wallet WHERE Products.status = 'NEW' AND Products.tradable = 0 AND Products.index_id >= 0 GROUP BY Products.index_id`
    );

    return successResponse(req, res, results, 200);
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

exports.ApprovedProducts = async (req, res) => {
  try {
    // const getProduct = await Product.findAll({
    //   where: {
    //     status: "APPROVED",
    //     tradable: 1,
    //   },
    // });

    const [results, metadata] = await db.sequelize.query(
      "SELECT * FROM Products LEFT JOIN Users ON Products.user_wallet = Users.wallet WHERE Products.status='APPROVED' AND Products.tradable=1 GROUP BY Products.index_id"
    );
    return successResponse(req, res, results, 200);
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

exports.SoldProductsRecord = async (req, res) => {
  try {
    const getProduct = await Product.findAll({
      where: {
        status: "SOLD",
      },
    });
    return successResponse(req, res, getProduct, 200);
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

exports.ApprovedProduct = async (req, res) => {
  try {
    const getProduct = await Product.findAll({
      where: {
        status: "APPROVED",
      },
    });
    return successResponse(req, res, getProduct, 200);
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

exports.UpdateAsSold = async (req, res) => {
  // const error = validationResult(req);
  // if (!error.isEmpty()) {
  //   return errorResponse(req, res, error.array(), 400);
  // }
  const { product_id } = req.body;
  try {
    //fetch product
    const product = await Product.findOne({
      where: {
        product_id,
      },
    });

    if (!product) throw new Error("Can't resolve product");

    //update product

    const updateProduct = await Product.update(
      {
        status: "APPROVED",
      },
      {
        where: {
          product_id,
        },
      }
    );
    return successResponse(req, res, getProduct, 200);
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

exports.FetchProductByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const fetchProduct = await Product.findAll({
      where: {
        product_category: category,
      },
    });

    return res.status(200).json({
      success: true,
      data: fetchProduct,
    });
  } catch (err) {
    return errorResponse(req, res, err.message, 500, err);
  }
};

//add comment
