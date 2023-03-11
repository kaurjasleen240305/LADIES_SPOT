const user = require('../model/user');
const bcryptjs = require('bcryptjs');
var localStrategy = require('passport-local').Strategy;

module.exports = function (passport) {
    passport.use(new localStrategy({ usernameField: 'email' }, (email, password, done) => {
        user.findOne({ email: email }).then((founduser)=>{
            if (!founduser) {
                return done(null, false, { message: "User Doesn't Exist !" });
            }
            bcryptjs.compare(password, founduser.password, (err, match) => {
                if (err) {
                    return done(null, false);
                }
                if (!match) {
                    return done(null, false, { message: "Password Doesn't match !" });
                }
                if (match) {
                    return done(null, founduser);
                }
            })
        }).catch((error)=>{
            console.log(error);
        })
    }));
    passport.serializeUser(function (user, done) {
        done(null, user.id);
        
    });

    passport.deserializeUser(async function (id, done) {
        try{
            const fuser=await user.findById(id)
            console.log(fuser)
            done(null,fuser);
        }
        catch(err){
            console.log(err)
        }
    });

    

}