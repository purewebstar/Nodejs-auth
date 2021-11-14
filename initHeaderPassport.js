'use strict'
/**
 *  Module Dependencies
 */

const JwtPassport = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

const initHeaderPassport = (passport)=>{
    passport.use(new JwtPassport({
    secretOrKey: process.env.SECRET_KEY,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    },  (payload, done) =>{
        done(null, payload)
    }))
}

module.exports = {initHeaderPassport}