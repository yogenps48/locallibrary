const async = require("async");
const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const { body, validationResult } = require('express-validator');
//Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
    BookInstance.find()
        .populate("book")
        .exec(function (err, list_bookinstances) {
            if (err) {
                return next(err);
            }
            //Succesful, so render
            res.render("bookinstance_list", {
                title: "Book Instance List",
                bookinstance_list: list_bookinstances,
            });
        });
};

//Display detail of specific bookinstance.
exports.bookinstance_detail = (req, res, next) => {
    BookInstance.findById(req.params.id)
        .populate("book")
        .exec((err, bookinstance) => {
            if (err) {
                //Error page
                return next(err);
            }
            if (bookinstance == null) {
                //no result
                const err = new Error("BokkInstance not found");
                err.status = 404;
                return next(err);
            }
            //Succecssfull, so render
            res.render("bookinstance_detail", {
                tittle: `Copy: ${bookinstance.book.title}`,
                bookinstance: bookinstance,
            });
        });
};

//Dispaly bookInstance create form on get
exports.bookinstance_create_get = (req, res, next) => {
    Book.find({}, "title").exec((err, books) => {
        if (err) {
            return (next);

        }
        //Successfull, so render
        res.render("bookinstance_form", {
            title: "Create Book Instance",
            book_list: books,
        });
    });
};

//handle bokkinstance create on post;
exports.bookinstance_create_post = [
    body("book", "Book must me specified")
        .trim()
        .isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified")
        .trim()
        .isLength({ min: 1 }).escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    //Process request after validation and sanitization.
    (req, res, next) => {
        //Extract te vaidation errors from a request.
        const errors = validationResult(req);
        //Create a BookInstance object with escaped and trimmed data.
        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            //There are errors. Render form again with saanitised values and error messages.
            Book.find({}, "title").exec(function (err, books) {
                if (err) {
                    return next(err);
                }
                //Successfull, so render
                res.render("bookinstance_form", {
                    title: "Create BookInstance",
                    book_list: books,
                    erros: errors.array(),
                    bookinstance,
                });
            });
            return;
        }
        //Data from form is valid.
        bookinstance.save((err) => {
            if (err) {
                return next(err);
            }
            //Successfull , so render
            res.redirect(bookinstance.url);
        });
    }
];

//display BookInstance delete form on get
exports.bookinstance_delete_get = (req, res, next) => {
    BookInstance.findById(req.params.id)
        .populate("book")
        .exec((err, bookinstance) => {
            if (err) {
                return next(err);
            }
            //Success , so render
            res.render("bookinstance_delete", {
                title: "BookInstance Delete",
                bookinstance,
            });
        });
};

//handle ookinstance delete on post
exports.bookinstance_delete_post = (req, res, next) => {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
        if (err) {
            return next(err);
        }
        //success
        res.redirect("/catalog/bookinstances");
    });
};

//display BookIstance update form on get
exports.bookinstance_update_get = (req, res) => {
    async.parallel(
        {
            bookinstance(callback) {
                BookInstance.findById(req.params.id)
                    .populate("book")
                    .exec(callback);
            },
            books(callback){
                Book.find({},"title").exec(callback);
            },
        },
        (err,results)=>{
            if(err){
                return next(err);
            }
            if(results.bookinstance==null){
                //no results
                const err=new Error("bookinstance not found");
                err.status=404;
                return next(err);
            }
            //successfull so, render
            res.render("bookinstance_form",{
                title:"Update BookInstance",
                book_list:results.books,
                bookinstance:results.bookinstance,
            });
        }
    );
};

//hande bookInstance update on post
exports.bookinstance_update_post = [
    body("book", "Book must me specified")
        .trim()
        .isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified")
        .trim()
        .isLength({ min: 1 }).escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    //Process request after validation and sanitization.
    (req, res, next) => {
        //Extract te vaidation errors from a request.
        const errors = validationResult(req);
        //Create a BookInstance object with escaped and trimmed data.
        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id:req.params.id,
        });

        if (!errors.isEmpty()) {
            //There are errors. Render form again with saanitised values and error messages.
            Book.find({}, "title").exec(function (err, books) {
                if (err) {
                    return next(err);
                }
                //Successfull, so render
                res.render("bookinstance_form", {
                    title: "Create BookInstance",
                    book_list: books,
                    erros: errors.array(),
                    bookinstance,
                });
            });
            return;
        }
        //data is valid
        BookInstance.findByIdAndUpdate(req.params.id,bookinstance,{},(err,thebookinstance)=>{
            if(err){
                return next(err);
            }
            //else redirect to bookinstance detail page
            res.redirect("/catalog/bookinstances");
        });
    }
]