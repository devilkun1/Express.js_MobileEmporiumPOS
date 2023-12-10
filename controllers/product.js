const mongoose = require('mongoose');
const Product = require('../models/product');
const Category = require('../models/category');
const Variant = require('../models/variant');

const create = async (req, res) => {
    const { categoryId, name, specs } = req.body;

    try {
        const existingCategory = await Category.findOne({ _id: categoryId });
        if (!existingCategory) {
            return res.status(400).json({ success: false, message: 'Category not found.' });
        }

        const newProduct = new Product({
            category: new mongoose.Types.ObjectId(categoryId),
            name: name,
            specs: specs,
            created: {
                Id: req.user.Id,
                name: req.user.name
            }
        });

        await newProduct.save();

        return res.status(201).json({ success: true, title: 'Created!', message: 'Product created successfully.', product: newProduct });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const getAll = async (req, res) => {
    try {
        const products = await Product.find();

        res.status(200).json({ success: true, products: products });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const getByID = async (req, res) => {
    const { productId } = req.body;

    try {
        const product = await Product.findOne({ _id: productId });
        if (!product) {
            return res.status(400).json({ success: false, message: 'Product not found.' });
        }

        return res.status(200).json({ success: true, product: product });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const update = async (req, res) => {
    let { productId, categoryId, name, specs, actived } = req.body;

    try {
        const updatedProduct = await Product.findOne({ _id: productId });
        if (!updatedProduct) {
            return res.status(400).json({ success: false, message: 'Product not found.' });
        }

        const removeIdsFromSpecs = (specs) => {
            return specs.map(spec => {
                const { _id, name, option } = spec;
                return { name, option };
            });
        };

        let diff = false;
        if (categoryId !== undefined && categoryId !== updatedProduct.category.toString()) {
            const existingCategory = await Category.findOne({ _id: categoryId });
            if (!existingCategory) {
                return res.status(400).json({ success: false, message: 'Category not found.' });
            }

            updatedProduct.category = new mongoose.Types.ObjectId(categoryId);
            diff = true;
        }
        if (name !== undefined && name !== updatedProduct.name) {
            updatedProduct.name = name;
            diff = true;
        }
        if (specs !== undefined && JSON.stringify(specs) !== JSON.stringify(removeIdsFromSpecs(updatedProduct.specs))) {
            updatedProduct.specs = specs;
            diff = true;
        }
        if (actived !== undefined && actived !== updatedProduct.actived) {
            updatedProduct.actived = actived;
            diff = true;
        }

        if (!diff) {
            return res.status(400).json({ success: false, message: 'Nothing to update.' });
        }

        updatedProduct.updated.push({
            Id: req.user.Id,
            name: req.user.name,
            datetime: Date.now(),
        });

        await updatedProduct.save();

        return res.status(200).json({ success: true, title: 'Updated!', message: 'Product updated successfully.', product: updatedProduct });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const remove = async (req, res) => {
    const { productId } = req.body;

    try {
        const deletedProduct = await Product.findOneAndDelete({ _id: productId });

        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        return res.status(200).json({ success: true, title: 'Deleted!', product: deletedProduct });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const goHandleView = async (req, res, next) => {
    const doAction = req.query.do;

    try {
        const listCategories = await Category.find();

        const categories = listCategories.map(category => ({
            id: category._id.toString().trim(),
            name: category.name,
            specs: category.specs.map(spec => ({
                name: spec.name,
                options: spec.options.map(option => option.toString())
            }))
        }))

        if (doAction === 'add') {
            res.render('product-handle', { title: 'Products', subTitle: 'New Product', categories: categories });
        } else if (doAction === 'edit') {
            const productId = req.query.id;

            const editProduct = await Product.findOne({ _id: productId });
            if (!editProduct) {
                return next();
            }

            const product = {
                id: editProduct._id.toString().trim(),
                category: editProduct.category.toString().trim(),
                name: editProduct.name,
                specs: editProduct.specs.map(spec => ({
                    name: spec.name,
                    option: spec.option,
                    id: spec._id.toString().trim()
                }))
            };

            let variants = await Variant.find({ product: productId });
            if (variants.length !== 0) {
                variants = variants.map((variant) => ({
                    barcode: variant.barcode,
                    img: variant.img,
                    color: variant.color,
                    quantity: variant.quantity,
                    cost: variant.cost,
                    price: variant.price,
                    warn: variant.warn,
                    actived: variant.actived
                }))
            }

            res.render('product-handle', { title: 'Products', subTitle: 'Edit Product', categories: categories, product: product, variants: variants });
        } else {
            res.render('product-handle', { title: 'Products', subTitle: 'New Product', categories: categories });
        }
    } catch (error) {
        return next();
    }
}

module.exports = { goHandleView, getAll, getByID, create, update, remove };