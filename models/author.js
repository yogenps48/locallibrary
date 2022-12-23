const mongoose=require("mongoose");
const {DateTime}=require("luxon");
const Schema=mongoose.Schema;

const AuthorSchema=new Schema({
    first_name:{type:String,required:true,maxlength:100},
    family_name:{type:String,required:true,maxlength:100},
    date_of_birth:Date,
    date_of_death:Date,
});

//irtual for author's full n
AuthorSchema.virtual("name").get(function(){
    // to avoid errors in cases where an author does not have either a family name or first name
    //we want to make sure we handle the exception by returning an empty string for that case
    let fullname="";
    if(this.first_name&&this.family_name){
        fullname=`${this.first_name}, ${this.family_name}`;
    }
    return fullname;
});

//Virtual for author's URL
AuthorSchema.virtual("url").get(function(){
    //we dont use an arrow function as we'll need the this object
    return `/catalog/author/${this._id}`;
});

//format date birth
AuthorSchema.virtual("date_of_birth_formatted").get(function(){
    return DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED);
})

//format date death
AuthorSchema.virtual("date_of_death_formatted").get(function(){
    return DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED);
})

//lifespan
AuthorSchema.virtual("lifespan").get(function(){
    return `${this.date_of_birth_formatted} - ${this.date_of_death_formatted}`;
})
//export model
module.exports=mongoose.model("Author",AuthorSchema);

