const express = require("express");
const cors = require("cors");
const dataService = require("./data-service.js");
const userService = require("./user-service.js");
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const passport = require('passport');//middleware for node js
const passportJWT = require('passport-jwt');

const app = express();

//config the strategy, JSON web token setup
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

//config options
var jwtOptions = {};

jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");

//defining the secret key...64 char long and unguessable string
jwtOptions.secretOrKey = 'jYy0e1c$9NXcy!CrU62fCfZua%g^!n7a8AZx*JgoMGuNgdvbP^&gMj^BEH$bk6MR';


//define strategy
var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
    console.log('payload received', jwt_payload);

    if(jwt_payload){
        next(null, {
            _id: jwt_payload._id,
            userName: jwt_payload.userName,
            fullName: jwt_payload.fullName,
            role: jwt_payload.role 
        });
    } else {
        next(null, false);
    }
});

//telling passport to use our strategy
passport.use(strategy);

//initialize passport using our famouse app.use();
app.use(passport.initialize());

app.use(bodyParser.json());
app.use(cors());

const HTTP_PORT = process.env.PORT || 8080;

const token = jwt.sign({ userName: 'bob' }, 'secret', { expiresIn: 60 * 60 });

//use authenticate method to secure our route
app.get("/api/vehicles", passport.authenticate('jwt', { session: false}), (req,res)=>{
    dataService.getAllVehicles().then((data)=>{
        res.json(data);
    }).catch(()=>{
        res.status(500).end();
    });
});



app.post("/api/register", (req, res) => {
    userService.registerUser(req.body)
        .then((msg) => {
            res.json({ "message": msg });
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});



app.post("/api/login", (req, res) => {
    userService.checkUser(req.body)
        .then((user) => {

            var payload = {
                _id: user._id,
                userName: user.userName,
                fullName: user.fullName,
                role: user.role
            };

            var token = jwt.sign(payload, jwtOptions.secretOrKey);

            res.json({ "message": "login successful" , "token": token });
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});


app.use((req, res) => {
    res.status(404).end();
});

userService.connect().then(()=>{
    app.listen(HTTP_PORT, ()=>{console.log("API listening on: " + HTTP_PORT)});
})
.catch((err)=>{
    console.log("unable to start the server: " + err);
    process.exit();
});