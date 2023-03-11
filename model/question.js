const mongoose = require('mongoose');
const questionschema=new mongoose.Schema({
    kittyname:{
        type:String,
    },
    question:{
        type:String,
        required:true,
    },
    options:[
    ],
    users:[
        
    ]
})
module.exports = mongoose.model('question', questionschema);