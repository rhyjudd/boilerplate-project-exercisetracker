const express      = require('express');
const app          = express();
const bodyParser   = require('body-parser');
const mongoose     = require('mongoose');
const cors         = require('cors');


//Load model
require('./users.js');
require('./exercise.js');
const User     = mongoose.model('users');
const Exercise = mongoose.model('exercise');

//connecting to database
let mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true });

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log(`Connected to database on ${new Date().toISOString().slice(0,10)}`);
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/timestamp', (req, res)=>{
  var currentEpoch = Math.round(new Date().getTime());
  var currentDate = new Date().toUTCString();
  console.log(typeof currentEpoch);
  res.json({'unix': currentEpoch, 'utc': currentDate});
});

app.post('/api/exercise/new-user', (req, res)=>{
    
  /********************************************************************************
  /  http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
  /*********************************************************************************/
    
  const newUser = {
    username  : req.body.username,
    _id       : Math.random().toString(36).substring(2,11),
    
  };
  
  User.find({username: req.body.username}, (err, user)=>{
    if(err) return console.error(err);
    if(!user.length){
      new User(newUser).save().then(()=>{
        console.log(newUser);
        res.json(newUser);
      });    
    } else {
      console.log(user);
      res.json({username: user[0].username, _id: user[0]._id})
    }
  });     
});

app.get('/api/exercise/users', (req, res)=>{
  User.find({}).then( (users)=>{ res.send(users) });
});


app.post('/api/exercise/add', (req, res)=>{
  console.log(req.body);
  
  
  let logDescription  = req.body.description; 
  let logDuration     = req.body.duration;
  let userDate         = req.body.date;
  let currentEpoch;
  let currentDate;
   
  
  if(userDate == ''|| typeof userDate === 'undefined'){
    currentEpoch = Math.round(new Date().getTime());
    currentDate = new Date().toUTCString();
  } else {
    currentEpoch = Math.round(new Date(userDate).getTime());
    currentDate = new Date(userDate).toUTCString();
  };
  
  const logDate = {
    unix: currentEpoch,
    utc: currentDate
  };
  
  
  User.find({_id: req.body.userId}, (err, user)=>{
    if(err) return console.error(err);
    if(!user.length){
      res.send('That Id is not found');
    }else {
      console.log(user);
       
      const newExercise ={
        _id:        user[0]._id, 
        username:   user[0].username,
        count:      1, 
        log:[{
          description:  logDescription,
          duration:     logDuration, 
          date:         {
            unix: currentEpoch,
            utc: currentDate
          }
        }]
      };
      console.log(user[0]);
      console.log(req.body);
      Exercise.find({_id: req.body.userId},(err, exercise)=>{
        if(err) return console.error(err);
        if(!exercise.length){
          new Exercise(newExercise).save().then(()=>{
            console.log(newExercise);
            res.json({
              username: newExercise.username, 
              description: newExercise.log[0].description, 
              duration: newExercise.log[0].duration, 
              _id: newExercise._id,
              date: newExercise.log[0].date.utc
            });
          });
        } else {
          //console.log(exercise[0]);
          
          let update = {description: logDescription, duration: logDuration, date: logDate};
          let updatedExercise = exercise[0];
                    
          updatedExercise.log.push(update);
          updatedExercise.count = updatedExercise.log.length;
          updatedExercise.save();
          res.json({
              username: newExercise.username, 
              description: newExercise.log[newExercise.log.length-1].description, 
              duration: newExercise.log[newExercise.log.length-1].duration, 
              _id: newExercise._id,
              date: newExercise.log[newExercise.log.length-1].date.utc
            });
        };
      });
    }; 
  });
  
  
});

app.get('/api/exercise/:log', (req, res)=>{
  console.log(req.query);
  
  let userIdentity = req.query.userId;
  let limiterInt   = Number(req.query.limit);
  let toDate       = req.query.to;
  let fromDate     = req.query.from;
  
  let convertedToDate   = Math.round(new Date(req.query.to).getTime());
  console.log('Converting the dates');
  console.log(`The to date converted to unix timestamp ${convertedToDate}`);
  let convertedFromDate = Math.round(new Date(req.query.from).getTime());
  console.log(`The from date converted to unix timestamp ${convertedFromDate}`);
    
  //Since every query for an exercise log requires a _id it must be checked to test if it is even a valid userId structure.
  //ie: must be a string and 9 characters long
  if(typeof userIdentity !== 'string'|| userIdentity.length !==9){
      res.send('that is not a valid userId');      
    } else {
       if(!isNaN(limiterInt)){
         if(Date.parse(fromDate) && Date.parse(toDate)){
           //That is a valid _id, limit and range
           
         } else {
           //that is a valid _id and limit argument only;
           Exercise.find({_id: userIdentity},{log: {$slice: limiterInt}} ,(err, exerciseLog)=>{
             console.log(exerciseLog);
             res.json({_id: exerciseLog[0]._id, username: exerciseLog[0].username, count:limiterInt, log:exerciseLog[0].log});
           })
         }         
       } else if(Date.parse(fromDate) && Date.parse(toDate)){
          //both value were valid dates and valid _id;
          //The from and to dates supplied by the user need to be converted to Epoch-Time for proper searcing of the database
           console.log(`Valid _id: ${userIdentity}`);
           console.log(`Valid from date: ${fromDate}`);
           console.log(`Valid to date: ${toDate}`);
           Exercise.find({_id: userIdentity}, (err, resolve)=>{
             if(err) console.error(err);
             //console.log('userId  with dates');
             //console.log(resolve[0].log);
             let logResults = resolve[0].log;
             const filteredResults = logResults.filter(date => date.date.unix >= fromDate && date.date.unix <= toDate);
             console.log(filteredResults);
             res.json(filteredResults);
          
         });
         
         
         
       } else {
         //Valid _id only;
         console.log(`Valid _id only: ${userIdentity}`);
         Exercise.find({_id: userIdentity}, (err, exerciseLog)=>{
           if(err){ 
             console.error(err);
             res.json({error: 'invalid user _id'})
           }else{
             res.json(exerciseLog[0]);
           }
         })
       }
    }
  
  //
      
});
 



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port) 
;});
