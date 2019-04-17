const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const moment = require('moment');

app.use(express.static('client/build'));

server.listen(9999, () => console.log('the server is running'));

// usernames of users that logged in 
const users = [];

// the main on connection socket
io.on('connection', socket => {
    socket.emit('users-init', users);

    // on login socket
    socket.on('login', user => {
        try {
            if (user) {
                const time = moment().format('HH:mm');

                socket.user = user;
                users.push(user.name);

                const newMessage = { user, text: `user ${user.name} connected`, time, color: user.color, users };

                io.emit('message', newMessage);
            } else {
                throw new TypeError('No user found on login.');
            }
        }
        catch (err) {
            console.error(err);
        }
    });

    // on logout
    socket.on('logout', user => {
        try {
            if (user) {
                const time = moment().format('HH:mm');

                users.splice(users.indexOf(user.name), 1);

                const newMessage = { user, text: `user ${user.name} disconnected`, time, color: user.color, users };

                io.emit('message', newMessage);
            } else {
                throw new TypeError('No user found on logout.');
            }
        }
        catch (err) {
            console.error(err);
        }
    });

    // on message 
    socket.on('message', message => {
        try {
            const { user, text } = message;

            if (user) {
                const time = moment().format('HH:mm');

                const newMessage = { user: user, text: `${user.name}: ${text}`, time, color: user.color, users };

                io.emit('message', newMessage);
            } else {
                throw new TypeError('No user found on message.');
            }
        }
        catch (err) {
            console.error(err);
        }
    });

    // on disconnect
    socket.on('disconnect', () => {
        try {
            const { user } = socket;

            if (user) {
                const time = moment().format('HH:mm');

                users.splice(users.indexOf(user.name), 1);

                const newMessage = { user, text: `user ${user.name} disconnected`, time, color: user.color, users };

                io.emit('message', newMessage);
            } else {
                throw new TypeError('No user found on disconnect.');
            }
        }
        catch (err) {
            console.error(err);
        }
    });

    socket.on('typing', data => {
        try {
            io.emit('typing', data);
        }
        catch(err) {
            console.error(err);
        }

    })
})