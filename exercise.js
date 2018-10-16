const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dateSchema = new Schema(
  {
    unix: {type: Number},
    utc:  {type: String}
  },
  {
    _id:  false
  }
);

const logSchema = new Schema(
  {
    description:{ type: String},
    duration:{ type: String},
    date:{
      unix: {type: Number},
      utc:  {type: String}
  }
  },
  {
     _id : false 
  }
);

const ExerciseSchema = new Schema(
  {
   _id:{ type: String},
  username:{ type: String},
  count:{ type: Number},
  log:[logSchema] 
    
  }
);

//create collection and add Schema
mongoose.model('exercise', ExerciseSchema);
