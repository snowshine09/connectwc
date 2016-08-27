var mongoose = require('mongoose');


var msgSchema = mongoose.Schema({
    receiver: String,
    sender:String,
    msg: String,
    time:  { type : Date, default: Date.now }

}, {collection:"msg"});

module.exports = mongoose.model('Message', msgSchema);
