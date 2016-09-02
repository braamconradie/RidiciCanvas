var exp = require('express');
var e = exp();
var users = new Map();

var port = process.env.PORT || 5000;

var pos = [];

var path = require('path');

console.log(port);

var fs = require('fs');

var se = e.listen(port);
e.use(exp.static(__dirname + '/public'));

var sio = require('socket.io');
var s = sio(se);
// fs.openSync('positions.bkp', 'w');

// Console
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('> ');
rl.prompt();
rl.on('line', function(line) {
    if (line === "clear") {
        pos = [];
        fs.openSync('positions.bkp', 'w');
        s.sockets.emit('clear', {});
        console.log('Cleared!');
    } else if (line === "stop") {
        process.exit();
    }
    rl.prompt();
});
//
// var input;
// input = fs.createReadStream('positions.bkp');
// input.on('error', function(err) {
//     fs.openSync('positions.bkp', 'w');
//     input = fs.createReadStream('positions.bkp');
// });
//
// var lineReader = require('readline').createInterface({
//     input: input
// });
//
// lineReader.on('error', function(err) {
//     fs.openSync('positions.bkp', 'w');
// });
//
// lineReader.on('line', function(line) {
//     pos.push(JSON.parse(line));
// });
//
// var int = setInterval(function() {
//     // console.log('Saving!');
//     this.lineReader = require('readline').createInterface({
//         input: input
//     });
//
//     this.lineReader.on('error', function(err) {
//         fs.openSync('positions.bkp', 'w');
//     });
//
//     this.lineReader.on('line', function(line) {
//         pos.push(JSON.parse(line));
//     });
//     this.lineReader.close();
//     var file = fs.createWriteStream('positions.bkp');
//     file.on('error', function(err) {
//         console.error(err);
//     });
//     pos.forEach(function(v) {
//         file.write(JSON.stringify(v) + '\n');
//     });
//     file.end();
// }, 10000);

s.on('connection', function(socket) {
    //console.log('Connection from: ' + socket.id);
    socket.on('color', function(data) {
        users.set(socket.id, data);
        socket.broadcast.emit('color', data);
    });
    // socket.on('name', function(data) {
    //     if (data.hasName && users.get(socket.id)) {
    //         var has = false;
    //         users.forEach(function(v, k) {
    //             if (v == data) {
    //                 has = true;
    //             }
    //         });
    //         if (!has) {
    //             socket.emit('update', {});
    //         }
    //     }
    // });
    socket.on('checkName', function(data) {
        if (!data.name) {
            return;
        }
        var hass = false;
        users.forEach(function(v, k) {
            if (v.username == data.name) {
                hass = true;
            }
        });
        socket.emit('nameCheck', {
            has: hass
        });
    });
    socket.on('download', function(data) {
        pos.forEach(function(v) {
            socket.emit('pos', v);
        });
        // What the hell?? Value Key pair?
        users.forEach(function(v, k) {
            socket.emit('color', v);
        });
        socket.emit('begin', {
            clear: true
        });
    });
    socket.on('mouse', function(data) {
        if (pos.length > 60000) {
            pos.splice(0, 1000);
        }
        if (!users.has(socket.id)) {
            socket.emit('update', {});
            return;
        }
        pos.push(data);
        socket.broadcast.emit('mouse', data);
    });
    socket.on('disconnect', function() {
        if (users.has(socket.id)) {
            s.sockets.emit('disconnect', {
                username: users.get(socket.id).username
            });
            users.delete(socket.id);
        }
    });
});

function writeable(path) {
    try {
        fs.accessSync(path, fs.R_OK | fs.W_OK);
    } catch (err) {
        return false;
    }
    return true;
}
