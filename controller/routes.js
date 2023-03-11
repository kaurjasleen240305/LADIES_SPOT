const express = require('express');
const app=express()
const multer=require('multer')
const router = express.Router();
const user = require('../model/user');
const date = require('../model/date');
const requi = require('../model/requi');
const kitty = require('../model/kitty');
const question = require('../model/question');
const bcryptjs = require('bcryptjs');
const passport = require('passport');
const fs=require('fs')
require('./passportLocal')(passport);
require('./googleAuth')(passport);
const path=require('path');
const { default: mongoose } = require('mongoose');
app.use('/',express.static(path.join(__dirname, 'public')));

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})
var upload = multer({ storage: storage })

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        next();
    } else {
        req.flash('error_messages', "Please Login to continue !");
        res.redirect('/login');
    }
}
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render("index", { logged: true });
    } else {
        res.render("index", { logged: false });
    }
});


router.get('/login', (req, res) => {
    res.render("login", { csrfToken: req.csrfToken() });
});

router.get('/signup', (req, res) => {
    res.render("signup", { csrfToken: req.csrfToken() });
});

router.post('/signup' ,(req, res) => {

    

    // get all the values 
    const {email, username, password, confirmpassword } = req.body;
    // check if the are empty 
    if (!email || !username || !password || !confirmpassword) {
        res.render("signup", { err: "All Fields Required !", csrfToken: req.csrfToken() });
    } else if (password != confirmpassword) {
        res.render("signup", { err: "Password Don't Match !", csrfToken: req.csrfToken() });
    } else {

        // validate email and username and password 
        // skipping validation
        // check if a user exists
         user.findOne({ $or: [{ email: email }, { username: username }] }).then((founduser)=> {
            
            if (founduser) {
                res.render("signup", { err: "User Exists, Try Logging In !", csrfToken: req.csrfToken() });
            } 
            else {
                // generate a salt
                bcryptjs.genSalt(12, (err, salt) => {
                    if (err) throw err;
                    // hash the password
                    bcryptjs.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        // save user in db
                
                        user({
                            
                            username: username,
                            email: email,
                            password: hash,
                            googleId: null,
                            provider: 'email',
                        }).save().then(result=> {
                            console.log(result);
                            // login the user
                            // use req.login
                            // redirect , if you don't want to login
                            res.redirect('/login');
                        });
                    })
                });
            }
        }).catch((error)=>{
            console.log(err);
            res.send(400, "Bad Request");
        
        });
    }

});



router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/dashboard',
        failureFlash: true,
    })(req, res, next);

});

router.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
    });
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});



router.get('/dashboard',checkAuth, async(req, res) => {
    // adding a new parameter for checking verification
    username=req.user.username;
    let kittys=await kitty.find({members:{$elemMatch:{$eq:username}}});
    res.render('dashboard', { username: req.user.username, verified : req.user.isVerified ,kittys,csrfToken: req.csrfToken()});
    
});

router.get('/kitty',(req,res)=>{
    res.render('kitty',{ csrfToken: req.csrfToken() })

})
router.get('/member',(req,res)=>{
    res.render('member',{ csrfToken: req.csrfToken() })

})

router.post('/member',async(req,res)=>{
    const {kittyname,member}=req.body;
    await kitty.updateOne({
        kittyname:kittyname,
    },{$push:{
         members:member
    }})
    res.redirect('dashboard')
})


router.post('/kitty',(req,res)=>{
     const {kittyname}=req.body;
     kitty({
        kittyname:kittyname,
    }).save().then(result=> {
        console.log(result);
        // login the user
        // use req.login
        // redirect , if you don't want to login
    
    });
    res.redirect('dashboard');

})

router.post('/dashboard',async(req,res)=>{
    var kittyname=req.body.kittyname;
    req.session.kittyname=kittyname;
    const opts=await question.find({kittyname:kittyname})
    const users=await kitty.find({kittyname:kittyname})
    let i=0;
    let arr1=[]
    let arr2=[]
    opts.forEach(element=>{
        if(element.options.length==users[0].members.length){
            i=i+1;
        }
    })
    let w=""

    opts.forEach(element=>{
           
           
           if(element.users.includes(req.user.username)){
                 arr1.push(element)
           }
           else{
               arr2.push(element)
           }
    })
     if(i==opts.length){
         w="FINALISATION OF VOTES";
    }
    console.log(arr1)
    console.log("hi")
    res.render("planning",{opts,w,arr1,arr2});
})


router.get('/question',(req,res)=>{
    res.render("question", {csrfToken: req.csrfToken()})
})
router.post('/question',async(req,res)=>{
    const ques=req.body.question;
    const kittyname=req.session.kittyname;
    await question({
        question:ques,
        kittyname:kittyname,
    }).save().then(result=> {
        console.log('done');
    });
    res.redirect('/planning')
})

router.get('/option',(req,res)=>{
    res.render('option',{csrfToken: req.csrfToken()})
})
router.get('/planning',async(req,res)=>{
    const opts=await question.find({kittyname:req.session.kittyname})
    const users=await kitty.find({kittyname:req.session.kittyname})
    let i=0;
    let arr1=[]
    let arr2=[]
    opts.forEach(element=>{
        if(element.options.length==users[0].members.length){
            i=i+1;
        }
    })
    let w=""

    opts.forEach(element=>{
           
           
           if(element.users.includes(req.user.username)){
                 arr1.push(element)
           }
           else{
               arr2.push(element)
           }
    })
     if(i==opts.length){
         w="FINALISATION OF VOTES";
    }
    console.log(arr1)
    console.log(arr2)
    res.render("planning",{opts,w,arr1,arr2});
})
router.post('/option',async(req,res)=>{
    var obj=req.body.choice;
    var uss=req.user.username;
    await question.updateOne(       
        {question:req.body.question,
    },{
        $push:{
            options:obj,
            users:uss,
        }
    })
    res.redirect('/planning');
})


router.get('/profile',(req,res)=>{
      res.render('profile',{ username: req.user.username,email:req.user.email});
})

router.get('/editprofile',(req,res)=>{
      res.render('editprofile',{csrfToken: req.csrfToken()})
})

router.post('/editprofile',async(req,res)=>{
    const id=req.user.id;
    await user.updateOne({
        _id:id
    },{
        $set:{
            username:req.body.username,
            email:req.body.email,
        }
    })
    res.redirect('profile')
})



router.get('/itenarary',async(req,res)=>{
    const opts=await question.find({kittyname:req.session.kittyname})
    var arr=[];

    function mode(array)
{
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}
    opts.forEach(element=>{
          var t=mode(element.options);
          arr.push(t)
    })
    console.log(arr);
    let s=Number(arr[1]);
    let m=arr[2];
    let y=Number(arr[3])
        
    const dates=await date.find({kittyname:req.session.kittyname})
         if(dates.length==0){
         date({
            kittyname:req.session.kittyname,
            date:s,
            month:arr[2],
            year:y,
         }).save().then(result=>{
            console.log(result)
         })}
    const events=await requi.find({kittyname:req.session.kittyname})
    console.log(dates)
    res.render('itenarary',{arr,dates,events})
})


router.get('/event',(req,res)=>{
    res.render('event',{csrfToken: req.csrfToken()})
})
router.post('/event',async(req,res)=>{
    await date.updateOne(
        {kittyname:req.session.kittyname},
        {
            $push:{
                events:req.body.event
            }
        }
    )
    res.redirect('itenarary')
}
)

router.get('/requi',(req,res)=>{
    res.render('requi',{csrfToken: req.csrfToken()})
})

router.post('/requi',(req,res)=>{
    requi({
        kittyname:req.session.kittyname,
        requisite:req.body.choice
    }).save();
    res.redirect('itenarary')
})

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email',] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),async (req, res) => {
    username=req.user.username;
    let kittys=await kitty.find({members:{$elemMatch:{$eq:username}}});
    res.render('dashboard', { username: req.user.username, verified : req.user.isVerified ,kittys,csrfToken: req.csrfToken()});
});

module.exports=router;