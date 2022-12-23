const Book=require("../models/book");
const Author=require('../models/author');
const Genre=require("../models/genre");
const BookInstance=require("../models/bookinstance");
const {body,validationResult}=require("express-validator");
const async=require("async");
// const mongoose=require("mongoose");
exports.index=(req,res)=>{
    async.parallel(
        {
            book_count(callback){
                Book.countDocuments({},callback);
            },
            book_instance_count(callback){
                BookInstance.countDocuments({},callback);
            },
            book_instance_available_count(callback){
                BookInstance.countDocuments({status:"Avilable"},callback);
            },
            author_count(callback){
                Author.countDocuments({},callback);
            },
            genre_count(callback){
                Genre.countDocuments({},callback);
            },
        },
        (err,results)=>{
            res.render("index",{
                title:"Local Library Home",
                error:err,
                data:results,
            });
        }
    );
};

//Display Book list
exports.book_list=(req,res,next)=>{
    Book.find({},"title author")
        .sort({title:1})
        .populate("author")
        .exec(function (err,list_books){
            if(err){
                return next(err);
            }
            //Successful,so render
            res.render("book_list",{title:"Book List",book_list:list_books});
        });
};

//Display Book details 1
exports.book_detail=(req,res,next)=>{
    async.parallel(
        {
            book(callback){
                Book.findById(req.params.id)
                    .populate("author")
                    .populate("genre")
                    .exec(callback);
            },
            book_instance(callback){
                BookInstance.find({book:req.params.id}).exec(callback);
            },
        },
        (err,results)=>{
            if(err){
                return next(err);
            }
            if(results.book==null){
                //no results
                const err=new Error("Book not found");
                err.status=404;
                return next(err);
            }
            //Successfull, so render
            res.render("book_detail",{
                title:results.book.title,
                book:results.book,
                book_instances:results.book_instance,
            });
        }
        
    );
};

//Display Book create on GET
exports.book_create_get=(req,res)=>{
    async.parallel(
        {
            authors(callback){
                Author.find(callback);
            },
            genres(callback){
                Genre.find(callback);
            },
        },
        (err,results)=>{
            if(err){
                return next(err);

            }
            res.render("book_form",{
                title:"Create Book",
                authors: results.authors,
                genres:results.genres,
            });
        }
    );
};

//Handle Book create on POST
exports.book_create_post=[
    //Convert the genre to an array.
    (req,res,next)=>{
        if(!Array.isArray(req.body.genre)){
            req.body.genre=typeof req.body.genre==="undefined"?[]:[req.body.genre];
        }
        next();
    },
    //Validate and sanitize fields.
    body("title","Title must not be empty.")
        .trim()
        .isLength({min:1})
        .escape(),
    body("author","Author must not be empty.")
        .trim()
        .isLength({min:1})
        .escape(),
    body("summary","Summary must not be empty.")
        .trim()
        .isLength({min:1})
        .escape(),
    body("isbn","ISBN must not be empty.")
        .trim()
        .isLength({min:1})
        .escape(),
    body("genre.*").escape(),

    //Process request after validation and sanitization.
    (req,res,next)=>{
        //Extract the validation errors from a request.
        const errors=validationResult(req);

        //Create a Book object with escaped and rtimmed data
        const book=new Book({
            title:req.body.title,
            author:req.body.author,
            summary:req.body.author,
            isbn:req.body.isbn,
            genre:req.body.genre,
        });

        if(!errors.isEmpty()){
            //There are errors. Render form again with sanitized values/errors messages

            //Get all authors and genres for form
            async.parallel(
                {
                    authors(callback){
                        Author.find(callback);
                    },
                    genres(callback){
                        Genre.find(callback);
                    },

                },
                (err,results)=>{
                    if(err){
                        return next(err);
                    }
                    //Mark our selexcted genrese as checked
                    for(const genre of results.genres){
                        if(book.genre.includes(genre._id)){
                            genre.checked='true';
                        }
                    }
                    res.render("book_form",{
                        title:"Create Book",
                        authors:results.authors,
                        genres:results.genres,
                        book,
                        errors:errors.array(),
                    });
                }
            );
            return;
        }
        //Data from form is valid . Save book.
        book.save((err)=>{
            if(err){
                return next(err);
            }
            //Successfull, redirect to new book record.
            res.redirect(book.url);
        });
    },
];

//Display Book delete on GET
exports.book_delete_get=(req,res,next)=>{
    async.parallel(
        {
            book(callback){
                Book.findById(req.params.id).exec(callback);
            },
            bookinstances(callback){
                BookInstance.find({book:req.params.id}).exec(callback);
            },
        },
        (err,results)=>{
            if(err){
                return next(err);
            }
            if(results.book==null){
                //no results
                res.redirect("/catalog/books")
            }
            //Successfull, so render
            res.render("book_delete",{
                title:"Delete Book",
                book:results.book,
                bookinstances:results.bookinstances,
            });
        }
    );
};

//Handle Book delete on POST
exports.book_delete_post=(req,res,next)=>{
    async.parallel(
        {
            book(callback){
                Book.findById(req.body.bookid).exec(callback);
            },
            bookintances(callback){
                BookInstance.find({book:req.body.bookid}).exec(callback);
            },
        },
        (err,results)=>{
            if(err){
                return next(err);
            }
            //Success
            if(!Array.isArray(results.bookinstances)){
                results.bookinstances=typeof results.bookinstances==="undefined"?[]:[results.bookinstances];
            }
            if(results.bookinstances.length>0){
                //Book has bookinstances
                res.render("book_delete",{
                    title:"Delete Book",
                    book:results.book,
                    bookinstances:results.bookinstances,
                });
            }
            //Book has no bookinstances, so delete
            Book.findByIdAndRemove(req.body.bookid,(err)=>{
                if(err){
                    return next(err);
                }
                //Success, go to book list
                res.redirect("/catalog/books");
            });
        }
    );
};

//Desplay Book update on GET
exports.book_update_get=(req,res,next)=>{
    //Get book, authors and genes for form.
    async.parallel(
        {
            book(callback){
                Book.findById(req.params.id)
                    .populate("author")
                    .populate("genre")
                    .exec(callback);

            },
            authors(callback){
                Author.find(callback);
            },
            genres(callback){
                Genre.find(callback);
            },
        },
        (err,results)=>{
            if(err){
                return next(err);
            }
            if(results.book==null){
                //no results
                const err=new Error("Book not found");
                err.status=404;
                return next(err);
            }
            //success
            //Mark out selected genes as checked
            for(const genre of results.genres){
                for (const bookGenre of results.book.genre){
                    if(genre._id.toString()===bookGenre._id.toString()){
                        genre.checked='true';
                    }
                }
            }
            res.render("book_form",{
                title:"Update Book",
                authors:results.authors,
                genres:results.genres,
                book:results.book,
            });
        }
    );
};

//Handle BOOk update on POST
exports.book_update_post=[
    //Convert the genre to an array
    (req,res,next)=>{
        if(!Array.isArray(req.body.genre)){
            req.body.genre=typeof req.body.genre==="undefined"?[]:[req.body.genre];
        }
        next();
    },
    //validate and sanitize fields.
    body("title","Title must not be empty.")
        .trim()
        .isLength({min:1})
        .escape(),
    body("author","Author must not be empty.")
        .trim()
        .isLength({min:1})
        .escape(),
    body("summary","Summary must not be empty.")
        .trim()
        .isLength({min:1})
        .escape(),
    body("isbn","ISBN must not be empty").trim().isLength({min:1}).escape(),
    body("genre.*").escape(),
    
    //Process request after after validation and sanitization.
    (req,res,next)=>{
        //Extract the validation errors from a request .
        const errors=validationResult(req);

        //Create a Book object with escaped/trimmed data and old id
        const book=new Book({
            title:req.body.title,
            author:req.body.author,
            summary:req.body.summary,
            isbn:req.body.isbn,
            genre:typeof req.body.genre==='undefined'?[]:req.body.genre,
            _id:req.params.id,//This is required, or a new ID will be assigned!
        });

        if(!errors.isEmpty()){
            //there are errors. Render form again with sanitized values/error messages.

            //Get all authoprs and genres for form.
            async.parallel(
                {
                    authors(callback){
                        Author.find(callback);
                    },
                    genres(callback){
                        Genre.find(callback);
                    },
                },
                (err,results)=>{
                    if(err){
                        return next(err);

                    }
                    //Mark our selected genres as checked.
                    for(const genre of results.genres){
                        if(book.genre.includes(genre._id)){
                            genre.checked="true";
                        }
                    }
                    res.render("book_form",{
                        title:"Update Book",
                        authors:results.authors,
                        genres:results.genres,
                        book,
                        errors:errors.array(),
                    });
                }
            );
            return;
        }
        //Data from form is valid. Update the record
        Book.findByIdAndUpdate(req.params.id,book,{},(err,thebook)=>{
            if(err){
                return next(err);
            }
            //Successful: redirect to book detail page.
            res.redirect("/catalog/books");
        });
    },
];
