const async = require("async");
const Genre = require("../models/genre");
const Book = require("../models/book");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
//display list of all genre.
exports.genre_list = (req, res, next) => {
    Genre.find()
        .sort({ name: 1 })
        .exec(function (err, list_genre) {
            if (err) {
                return next(err);
            }
            //Successfull, so render
            res.render("genre_list", {
                title: "Genre List",
                genre_list: list_genre,
            });
        });
};

//display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    async.parallel(
        {
            genre(callback) {
                Genre.findById(id).exec(callback);
            },
            genre_books(callback) {
                Book.find({ genre: id }).exec(callback);
            },
        },
        (err, results) => {
            if (err) {
                return next(err);
            }
            if (results.genre == null) {
                //no results
                const err = new Error("Genre not found");
                err.status = 404;
                return next(err);
            }
            //Successfull, so render
            res.render("genre_detail", {
                title: "Genre Detail",
                genre: results.genre,
                genre_books: results.genre_books,
            });
        }
    );
};

//displlay Genre create form on Get
exports.genre_create_get = (req, res) => {
    res.render("genre_form", { title: "Create Genre" });
};

//handle Genre create form on POST
exports.genre_create_post = [
    //Validate and sanitize the name field.
    body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

    //Process request after validation and sanitization.
    (req, res, next) => {
        //Extracr the validation erros from a request.
        const errors = validationResult(req);

        //Create a genre object with escaped and trimed sata.
        const genre = new Genre({ name: req.body.name });

        if (!errors.isEmpty()) {
            //There are errors. Render the form again with sanitized values/error messages.
            res.render("genre_form", {
                title: "Create Genre",
                genre,
                errors: errors.array(),
            });
            return;
        } else {
            //Data from form is valid.
            //Check if Genre with the same name already exists.
            Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
                if (err) {
                    return next(err);

                }

                if (found_genre) {
                    //Genre exists, redirect to its detail page.
                    res.redirect(found_genre.url);
                } else {
                    genre.save((err) => {
                        if (err) {
                            return next(err);
                        }
                        //Genre saved. Redirect to genre detail page.
                        res.redirect(genre.url);
                    });
                }
            });
        }
    },
];

//Display Genre delete form on GET
exports.genre_delete_get = (req, res, next) => {
    async.parallel(
        {
            genre(callback) {
                Genre.findById(req.params.id).exec(callback);
            },
            books(callback) {
                Book.find({ genre: { $all: [req.params.id] } }).exec(callback);
            },
        },
        (err, results) => {
            if (err) {
                return next(err);
            }
            if (results.genre == null) {
                //no results
                res.redirect("/catalog/genres");
            }
            //found
            res.render("genre_delete", {
                title: "Delete Genre",
                genre: results.genre,
                books: results.books,
            });
        }
    );
}

//handle Genre delete on POST
exports.genre_delete_post = (req, res, next) => {
    async.parallel(
        {
            genre(callback) {
                Genre.findById(req.body.genreid).exec(callback);
            },
            books(callback) {
                Book.find({ genre: { $all: [req.body.genreid] } }).exec(callback);
            },
        },
        (err,results)=>{
            if(err){
                return next(err);
            }
            if(results.genre==null){
                //no results
                res.redirect("/catalog/genres");
            }
            //convert to array
            if(results.books==null){
                results.books=[];
            }

            if(results.books.length>0){
                //genre has books, so render genre delete page
                res.render("genre_delete", {
                    title: "Delete Genre",
                    genre: results.genre,
                    books: results.books,
                });
                return;
            }
            //genre has no books, so delete
            Genre.findByIdAndRemove(req.body.genreid,(err)=>{
                if(err){
                    return next(err);
                }
                //success, so redirect to genre list
                res.redirect("/catalog/genres");
            });
        }
    );
}

//Display Genre update form on GET
exports.genre_update_get = (req, res) => {
    Genre.findById(req.params.id).exec((err,genre)=>{
        if(err){
            return next(err);
        }
        res.render("genre_form",{
            title:"Update Genre",
            genre,
        });
    });
};

//Handle Genre update o POST
exports.genre_update_post =[
    body("name","Genre name must be specified").trim().isLength({min:1}).escape(),
    (req,res,next)=>{
        const errors=validationResult(req);
        const genre=new Genre({name:req.body.name,_id:req.params.id})
        if(!errors.isEmpty()){
            //there are errors
            res.render("genre_form",{
                title:"Update Genre",
                genre,
                errors:errors.array(),
            });
            return;
        }
        //data is valid
        Genre.findByIdAndUpdate(req.params.id,genre,{},(err,thegenre)=>{
            if(err){
                next(err);
            }
            //success
            res.redirect("/catalog/genres");
        });
    },
];