const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mySecret = process.env['MONGO_URI'];
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

mongoose.connect(mySecret, {userNewUrlParser: true, useUnifiedTopology: true});

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {type: String, required: true}
});


const User = mongoose.model("User", userSchema);

const createUser = async username =>{
  const user = await User.create({username});
  return  user;
};

const getAllUsers = async () =>{
  const users = await User.find({});
  return users;
}

const getUser = async id =>{
  const user = await User.findById(id, (err, data)=>{
    if(err) return false;
    else return data;
  });
  return user;
}
const exerciseSchema = new Schema({
  username: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: String, required: true},
  userId: {type: String, required: true}
})
const Exercise = mongoose.model("Exercise", exerciseSchema);

const createExercise = async (username, description, duration, date, userId)=>{
  exercise = await Exercise.create({username, description, duration, date, userId});
  return exercise;
}
const deleteExercises = async () => {
  await Exercise.deleteMany({});
}

const getAllExercises = async (userId) =>{
  exercises = await Exercise.find({userId});
  return exercises;
}

app.use(cors());
app.use(bodyParser.urlencoded({extended: "false"}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post("/api/users", async (req, res)=>{
  const {username} = req.body;
  if(!username) return res.json({error: "write a valid user name"});
  const user = await createUser(username);
  res.json({username, "_id": user.id });
});

app.get("/api/users", async (req, res) =>{
  const users = await getAllUsers();
  res.json(users);
});

app.get("/delete", async (req, res) =>{
  const deleteExercise = await deleteExercises();
  res.json({status: "all deleted"});
})
app.post("/api/users/:_id/exercises", async (req, res) =>{
  const _id = req.params["_id"];
  const user = await getUser(_id);
  if(!user) res.json({error: "you did not enter a valid id"});
  let {description, duration, date}= req.body;
  if(!date) date = new Date().toDateString();
  else date = new Date(date).toDateString();
  let exercise = await createExercise(user.username, description, duration, date, user["_id"]);
  exercise["_id"] = user["_id"];
  res.json({username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
      "_id": user["_id"]})
});

app.get("/api/users/:_id/logs", async (req, res) =>{
  const _id = req.params["_id"];
  const user = await getUser(_id);
  const fromQuery = req.query["from"];
  const toQuery = req.query["to"];
  const limitQuery = req.query["limit"];

  if(!user) return res.json({error: "you did not enter a valid id"});
  const exercises = await getAllExercises(user["_id"]);
  let log = exercises.map(exercise=> {
    return{description: exercise.description, duration: exercise.duration, date: exercise.date}});
  
  
  if(fromQuery){
    log = log.filter((exercise => new Date(exercise.date) >= new Date(fromQuery)));
  }
  if(toQuery){
    log = log.filter(exercise => new Date(exercise.date) <= new Date(toQuery));
  }
  if(limitQuery){
    log = log.filter((exercise, index) => index < parseInt(limitQuery));
  } 
  const response = {
    username: user.username,
    count: log.length,
    "_id": user["_id"],
    log,
  };
  res.json(response);
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
