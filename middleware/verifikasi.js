const jwt = require('jsonwebtoken');
const config = require('../config/secret');
var db = require('../koneksi');
var mysql = require('mysql');
var response = require('../res');
var role2;
var ip = require('ip');

function verifikasi(accrole, accrole2, accrole3) {
    return function (req, rest, next) {
        // var role = req.body.role;
        //cek authorization header
        var tokenWithBearer = req.headers.authorization;
        if (tokenWithBearer) {
            var token = tokenWithBearer.split(' ')[1];
            
            //verifikasi
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    var time = new Date();
                    log(ip.address(), null, time);
                    return rest.status(401).send({auth:false, message:'Token tidak terdaftar!'});
                }else{
                    
                    var ngeongg = token.replace('Bearer','');
                    var time = new Date();
                    var usernameLog;

                    if(role2!="superadmin")log(ip.address(), usernameLog, time);

                    const query = `SELECT user.role, user.username FROM user JOIN akses_token ON user.id_user=akses_token.id_user WHERE access_token='${ngeongg}'`;
                    db.query(query, function(error, result, fields){
                        if(error) throw error;
                        if(result.length!=0){
                        usernameLog = result[0].username;
                        
                        role2 = result[0].role;
                        log(ip.address(), usernameLog, time);
                    
                        if (role2 == accrole || role2 == accrole2 ||role2 == accrole3 ) {
                            // console.log(tokenWithBearer)
                            console.log(role2);
                            req.auth = decoded;
                            next();
                        }
                        else{
                            return rest.status(401).send({auth:false, message:'Role tidak sesuai!'});
                        }
                        }
                    });
                    
                }
            });
        }else{
            return rest.status(401).send({auth:false, message:'Token tidak terdaftar! Silahkan login terlebih dahulu'});
        }
    }
}

function log (ip, username, time){
    db.query('INSERT INTO logs (username, time, ip) VALUES (?, ?, ?)',[username, time, ip],
        function (error, rows, fields) {
            if (error) {
                console.log("Log Error",error);
            } else {
                console.log("Log Success");
            }
        });
}


module.exports = verifikasi;