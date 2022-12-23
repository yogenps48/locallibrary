const mongoose=require("mongoose");

const Schema=mongoose.Schema;

const BookSchema=new Schema({
    title:{type:String,required:true},
    author:{type:Schema.Types.ObjectId,ref:"Author",required:true},
    summary:{type:String,required:true},
    isbn:{type:String,required:true},
    genre:[{type:Schema.Types.ObjectId,ref:"Genre"}],
});

//Virtualfir book's URL
BookSchema.virtual("url").get(function(){
    //we dont use arrow function because we need this object
    return `/catalog/book/${this._id}`;
});

//Wxport model
module.exports=mongoose.model("Book",BookSchema);