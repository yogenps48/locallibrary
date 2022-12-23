const mongoose=require("mongoose");

const Schema=mongoose.Schema;

const GenreSchema=new Schema({
    // book:{type:Schema.Types.ObjectId,required:true},
    name:{type:String,required:true,minLength:3,maxLength:100}
});
GenreSchema.virtual("url").get(function(){
    return `/catalog/genre/${this._id}`
})
//export model
module.exports=mongoose.model("Genre",GenreSchema);