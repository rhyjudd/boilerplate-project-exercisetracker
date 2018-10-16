const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema



const UserSchema = new Schema({
   _id:{ type: String},
  username:{ type: String}
  
    
});

//create collection and add Schema
mongoose.model('users', UserSchema);


