'use strict'
/**
 *  Module Dependencies
 */
const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    username: String,
    password: String,
    first_name: String,
    last_name: String,
},{
    timestamps: true
})

module.exports = mongoose.model('User', UserSchema)
