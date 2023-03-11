const mongoose = require('mongoose');
const kittySchema = new mongoose.Schema({
    kittyname:{
        type:String,
        required:true,
    },
    members:[
        {type:String}
    ]
})

module.exports = mongoose.model('kitty', kittySchema);