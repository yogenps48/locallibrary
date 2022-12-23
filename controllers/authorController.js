const Author=require("../models/author");
const Book=require("../models/book");
const async=require("async");
const {body,validationResult}=require("express-validator");

const debug=require("debug")("author");
//display list of all author
exports.author_list=(req,res,next)=>{
    Author.find()
        .sort([["family_name","ascending"]])
        .exec(function(err,list_authors){
            if(err){
                return next(err);
            }
            //Successful, so render
            res.render("author_list",{
                title:"Author List",
                author_list:list_authors
            });
        });
};

//display detail page for a specific Author
exports.author_detail=(req,res,next)=>{
     async.parallel(
        {
            author(callback){
                Author.findById(req.params.id).exec(callback);
            },
            authors_books(callback){
                Book.find({author:req.params.id},"title summary").exec(callback);
            },
        },
        (err,results)=>{
            if(err){
                //Error page
                return next(err);
            }
            if(results.author==null){
                //no results
                const err=new Error("Author not found");
                err.status=404;
                return next(err);
            }
            //Successsfull, so render

            res.render("author_detail",{
                title:"Author Detail",
                author:results.author,
                author_books:results.authors_books,
            });
        }
     );
};

//Display author create form on GET
exports.author_create_get=(req,res)=>{
    res.render("author_form",{title:"Create Author"});
};

//handle Author create on POST
exports.author_create_post=[
    //Validate and sanitize fields
    body("first_name")
        .trim()
        .isLength({min:1})
        .escape()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric character."),
    body("family_name")
        .trim()
        .isLength({min:1})
        .escape()
        .withMessage("Family name must be specified.")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth","Invalid date of birth")
        .optional({checkFalsy:true})
        .isISO8601()
        .toDate(),
    //Process request after validation and sanitization.
    (req,res,next)=>{
        //Extract the validation erros from a request
        const errors=validationResult(req);

        if(!errors.isEmpty()){
            //Therre are errors. Render form again with sanitized values/errors messages.
            res.render("author_form",{
                title:"Create Author",
                author:req.body,
                errors:errors.array(),
            });
            return;
        }
        //Data from form is valid.

        //Create an Author object with escaped and trimmed
        const author=new Author({
            first_name:req.body.first_name,
            family_name:req.body.family_name,
            date_of_birth:req.body.date_of_birth,
            date_of_death:req.body.date_of_death,
        });
        author.save((err)=>{
            if(err){
                return next(err);
            }
            //Successfull, redirect to new author record
            res.redirect(author.url);

        });
    },
];


//display Author delete form on get.
exports.author_delete_get=(req,res,next)=>{
    async.parallel(
        {
            author(callback){
                Author.findById(req.params.id).exec(callback);
            },
            authors_books(callback){
                Book.find({author:req.params.id}).exec(callback);
            },
        },
        (err,results)=>{
            if(err){
                return next(err);
            }
            if(results.author==null){
                //No results
                res.redirect("/catalog/authors");

            }
            //Successfull, so render
            res.render("author_delete",{
                title:"Delete Author",
                author:results.author,
                author_books:results.authors_books,
            });
        }
    );
};

//Handle Author delete on post
exports.author_delete_post=(req,res,next)=>{
    async.parallel(
        {
            author(callback){
                Author.findById(req.body.authorid).exec(callback);
            },
            authors_books(callback){
                Book.find({author:req.body.authorid}).exec(callback);
            },
        },
        (err,results)=>{
            if(err){
                return next(err);
            }
            //Success
            if(results.authors_books.length>0){
                //Author has books. Render in same way as for GET route.
                res.render("author_delete",{
                    title:"Delete Author",
                    author:results.author,
                    author_books:results.authors_books,
                });
                return;
            }
            //Author has no books. Delete object and redirect to the list of authors.
            Author.findByIdAndRemove(req.body.authorid,(err)=>{
                if(err){
                    return next(err);
                }
                //Success - go to author list
                res.redirect("/catalog/authors");
            });
        }
    );
};
 
//Display Author update on GET
exports.author_update_get=(req,res,next)=>{
    Author.findById(req.params.id).exec((err,author)=>{
        if(err){
            debug(`update error: ${err}`);
            return next(err);
        }
        res.render("author_form",{
            title:"Update Author",
            author,
        });
    });
};

//Handle Author Update on POST
exports.author_update_post=[
    body("first_name","First name must be specified")
        .trim()
        .isLength({min:1})
        .escape(),
    body("family_name","Family name must be specified")
        .trim()
        .isLength({min:1})
        .escape(),
    body("date_of_birth","Date of birth must be specified")
        .optional({checkFalsy:true})
        .isISO8601()
        .toDate(),
    (req,res,next)=>{
        //get errors
        const errors=validationResult(req);

        if(!errors.isEmpty()){
            //there are errors, render escaped data values/errors
            res.render("author_form",{
                title:"Update Author",
                author:req.body,
                errors:errors.array(),
            });
            return;
        }
        //No errors
        const author=new Author({
            first_name:req.body.first_name,
            family_name:req.body.family_name,
            date_of_birth:req.body.date_of_birth,
            date_of_death:req.body.date_of_death,
            _id:req.params.id,
        });
        Author.findByIdAndUpdate(req.params.id,author,{},(err,theauthor)=>{
            if(err){
                return next(err);
            }
            res.redirect("/catalog/authors");
        });
    }
];

