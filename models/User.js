'use strict'

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SALT_WORK_FACTOR = 10,
    bcrypt = require('bcrypt'),
    autoIncrement = require('./db');

var UserSchema = new Schema({
    _id: Number,
    email: {
        type: String,
        unique: true,
    },
    name: String,
    password: {
        type: String,
    },
    admin: {
        type: Boolean,
        default: false
    },
    token: String
});

UserSchema.methods.toJSON = function () {
    var obj = this.toObject()
    delete obj.password
    delete obj.token
    return obj
}

UserSchema.plugin(autoIncrement.plugin, 'User');

UserSchema.pre('save', function (next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);

        // hash the password along with our new salt
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

var User = mongoose.model('User', UserSchema);

User.find({}).exec(function (err, collection) {
    if (collection.length === 0) {
        var user = new User({
            email: 'admin@admin.com',
            name: 'admin',
            password: 123,
            admin: true
        });
        user.save();

        var userz = new User({
            email: 'test@test.com',
            name: 'test',
            password: 123,
        });
        userz.save();

    }
});

module.exports = mongoose.model('User', UserSchema);