const mongoose = require('mongoose');
const requischema=new mongoose.Schema({
    kittyname:{
        type:String,
        required:true,
    },
    requisite:{
        type:String,
    }
         
})
module.exports = mongoose.model('requi', requischema);