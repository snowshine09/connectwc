var mongoose = require('mongoose'),
bcrypt = require('bcrypt-nodejs');


var userSchema = mongoose.Schema({
    username: String,
    id:String,
    email: String,
    exp: Number,
    password: String,
    classes: [String],
    prev_degree: String,
    degree: String,
    majors: [String],
    onlineEXP:String,
    EMP_status: { type:[String], default: ['Student']},
    ERL: Number,
    timezone: String,
    RES: {type: String, default: 'State College, PA, US'},
    workday: [String],
    workhour: [Number],
    POS: String,
    goal: String,
    goal_others: String,
    new: String,
    dom: String,
    subd: String,
    instit: String,
    kids: Number,
    age: Number,
    gender: Number,
    nationality: String,
    kids: Number,
    priv_bkg: Number,
    priv_prof: Number,
    priv_personal: Number,
    priv_contact: Number,
    priv_loc: Number,
    name:String,
    student_id: String

}, {collection:"user"});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', userSchema);
