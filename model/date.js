const mongoose = require('mongoose');
const dateschema=new mongoose.Schema({
    kittyname:{
        required:true,
        type:String,
    },
    date:{
        type:Number,
    },
    month:{
        type:String,
    },
    year:{
         type:Number,
    },
    events:[
    ]
})
module.exports = mongoose.model('date', dateschema);