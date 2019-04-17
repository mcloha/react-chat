import React, { Component } from 'react';
import messageSound from '../message-sound.mp3';
import io from 'socket.io-client';

// socket init.
const socket = io('192.168.1.167:9999');

export default class Chat extends Component {
    state = {
        currentUser: null,
        typing: false,
        typingTimeOut: undefined,
        // initializing users becouse we dont have a db :)
        users: [
            {
                name: 'Dog',
                color: 'warning',
                id: 1,
                icon: 'fas fa-dog'
            },
            {
                name: 'Cat',
                color: 'primary',
                id: 2,
                icon: 'fas fa-cat'
            },
            {
                name: 'Dragon',
                color: 'danger',
                id: 3,
                icon: 'fas fa-dragon'
            },
            {
                name: 'Horse',
                color: 'dark',
                id: 4,
                icon: 'fas fa-horse'
            },
            {
                name: 'Android',
                color: 'success',
                id: 5,
                icon: 'fab fa-android'
            },
            {
                name: 'Fish',
                color: 'info',
                id: 6,
                icon: 'fas fa-fish'
            }
        ],
        messages: [],
        loggedUsers: []
    }
    componentDidMount() {

        // getting who is logged in when we start the app.
        socket.on('users-init', users => {
            this.setState({ loggedUsers: users });
        });

        // message socket (text messages and the notifications).
        socket.on('message', newMessage => {
            // pushing to messages array and checking for logged users
            const messages = this.state.messages;
            this.setState({ messages: [...messages, newMessage], loggedUsers: newMessage.users });

            // Playing the sound
            const messageSound = document.getElementById('audio');
            messageSound.play();
        })

        socket.on('typing', data => {
            const { currentUser } = this.state;
            const { typing, user } = data;

            if (typing) {
                if (currentUser) {
                    if (user.id != currentUser.id) {
                        this.setState({ typingNotice: `${user.name} is typing...` });
                    }
                } else {
                    this.setState({ typingNotice: `${user.name} is typing...` });
                }
            } else {
                this.setState({ typingNotice: null });
            }

        })
    }

    // login handler
    login = e => {
        const { users } = this.state;
        const id = e.target.id;

        let currentUser = null;

        users.map(user => {
            if (user.id == id) {
                currentUser = user;
            }
        })

        this.setState({ currentUser: currentUser });
        socket.emit('login', currentUser);
    }

    // logout handler
    logout = () => {
        const { currentUser } = this.state;
        this.setState({ currentUser: null });
        socket.emit('logout', currentUser);

        clearTimeout(this.state.typingTimeOut);
        this.setState({ typing: false });
        socket.emit('typing', { user: currentUser, typing: false });
    }

    // send message handler
    sendMessage = e => {
        e.preventDefault();

        const { currentUser } = this.state;
        const text = e.target.text.value;

        if (text.length > 0) {
            const newMessage = { user: currentUser, text };

            socket.emit('message', newMessage);

            e.target.text.value = '';
        }

    }

    // prin user list 
    printUsers = () => {
        const { users, loggedUsers, currentUser } = this.state;

        const usersList = users.map((user, i) => {
            if (loggedUsers && loggedUsers.includes(user.name)) {
                return <li id={user.id} className="list-group-item" key={i}><i className={`${user.icon} m-1 text-${user.color}`} />{user.name}<i className="text-success fas fa-signal m-1" /></li>
            } else if (currentUser) {
                return <li id={user.id} className="list-group-item" key={i}><i className={`${user.icon} m-1`} />{user.name}</li>
            } else {
                return <li id={user.id} className="list-group-item" key={i} onClick={e => this.login(e)}><i className={`${user.icon} m-1`} />{user.name}</li>
            }
        });
        return <ul className="list-group m-4">{usersList}</ul>
    }

    // print the messages list
    printMessages = () => {
        const { messages, currentUser } = this.state;

        const messagesList = messages.map((message, i) => (
            <li className={`m-1 d-flex justify-content-between align-content-center ${currentUser ? message.user.id == currentUser.id ? 'flex-row-reverse' : '' : ''}`} key={i}>
                <span className={`list-group-item text-white  text-${message.color}`}><i className={`${message.user.icon} m-1`} />{message.text}</span>
                <span>{message.time}</span>
            </li>
        ));
        return <ul className="list-group m-4 d-flex flex-column justify-content-end overflow-auto" style={{ maxHeight: '95%' }}>{messagesList}</ul>
    }

    timeOutFunction = () => {
        const { currentUser } = this.state;
        this.setState({ typing: false });
        socket.emit('typing', { user: currentUser, typing: false });
    }

    typing = () => {
        const { currentUser, typing } = this.state;

        if (!typing) {
            this.setState({ typing: true });
            socket.emit('typing', { user: currentUser, typing: true });
            this.setState({ typingTimeOut: setTimeout(this.timeOutFunction, 5000) });
        } else {
            clearTimeout(this.state.typingTimeOut);
            this.setState({ typingTimeOut: setTimeout(this.timeOutFunction, 5000) });
        }

    }

    render() {
        const { currentUser, typingNotice } = this.state;

        return (
            <div>
                <div className="d-flex">
                    <div className="w-75 bg-light" style={{ height: '88vh' }}>
                        {this.printMessages()}
                    </div>
                    <div className="d-flex flex-column justify-content-around w-25">
                        <div>
                            {currentUser ? <h5 className="mb-4">hello {currentUser.name}</h5> : null}
                            {this.printUsers()}
                            <input className="btn btn-danger" type="button" value="log-out" onClick={() => this.logout()} disabled={!currentUser} />
                        </div>
                        <h6 className="text-success">{typingNotice}</h6>
                    </div>
                </div>
                <form className="input-group  m-2" onSubmit={e => this.sendMessage(e)} >
                    <input name="text" className="form-control" type="text" placeholder="enter message..." disabled={!currentUser} onKeyDown={() => this.typing()} />
                    <div className="input-group-prepend">
                        <input className="btn btn-primary form-control" type="submit" value="SEND" disabled={!currentUser} />
                    </div>
                </form>
                <audio id="audio"><source src={messageSound} type="audio/mpeg" /></audio>
            </div>
        )
    }
}

