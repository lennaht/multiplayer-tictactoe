require('dotenv').config();

const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const getSocketNamesInRoom = require('./getSocketNamesInRoom');
const Game = require('./Game');

//Front-End in 'public' serven
app.use('/', express.static(__dirname + '/public'));

let games = []; //Spiele werden in-memory gespeichert
let scores = [];

io.on('connection', (socket) => {
    socket.on('join', join => {
        if(join.room.length > 30) {
            socket.emit('msg', {
                msg: 'Die Game-ID darf höchstens 30 Zeichen beinhalten.',
                type: 'danger'
            });
            return;
        }
        socket.playername = join.playername;
        if(getSocketNamesInRoom(io, join.room).length === 2) {
            socket.emit('msg', {
                msg: 'Dieses Spiel ist voll.',
                type: 'danger'
            });
            return;
        }
        socket.join(join.room, () => {
            Object.values(socket.rooms)
                .filter(room => room !== join.room && room !== socket.id)
                .forEach(room => {
                    socket.leave(room, () => {
                        const playersInRoom = getSocketNamesInRoom(io, room);
                        io.to(room).emit('players', playersInRoom);
                        io.to(room).emit('msg', {
                            msg: 'Ein Spieler hat das Spiel verlassen',
                            type: 'danger'
                        });
                        games = games.filter(game => game.room !== room);
                        scores = scores.filter(score => score.room !== room);
                    })
                });
        });
        io.to(join.room).emit('msg', 'Ein Spieler ist beigetreten.');


        const playersInRoom = getSocketNamesInRoom(io, join.room);
        io.to(join.room).emit('players', playersInRoom);
        if(playersInRoom.length === 2) {
            if(games.length >= 200) {
                io.to(join.room).emit('msg', {
                    msg: 'Maximale Anzahl an Spielen auf dem Server erreicht.',
                    type: 'danger'
                });
            }
            io.to(join.room).emit('msg', {
                msg: 'Zwei Spieler sind beigetreten, das Spiel beginnt!',
                type: 'success'
            });
            const newGame = new Game(join.room, playersInRoom[0], playersInRoom[1]);
            games.push(newGame);

            const newScore = { room: join.room, score: {} };
            newScore.score[playersInRoom[0].id] = 0;
            newScore.score[playersInRoom[1].id] = 0;
            scores.push(newScore);
            io.to(join.room).emit('score', newScore.score);

            io.to(join.room).emit('gamestate', newGame.checkGameState());
        }
    });
    socket.on('box', box => {
        try {
            const { id } = socket;
            const game = games.find(g => Object.keys(socket.rooms).includes(g.room));
            if(!game) return;
            const gamestate = game.tickBox(socket.id, box);
            io.to(game.room).emit('gamestate', gamestate);
            if(['draw', 'win'].includes(gamestate.state)) {
                const gameRoom = game.room;
                const playersInRoom = getSocketNamesInRoom(io, gameRoom);

                games = games.filter(deleteGame => deleteGame.room !== gameRoom);

                if(gamestate.state === 'win') {
                    for(let i in scores) {
                        if(scores[i].room === gameRoom) {
                            scores[i].score[gamestate.player]++;
                            io.to(gameRoom).emit('score', scores[i].score);
                            break;
                        }
                    }
                }

                const newGame = new Game(gameRoom, playersInRoom[0], playersInRoom[1]);
                games.push(newGame);
                io.to(gameRoom).emit('gamestate', newGame.checkGameState());
            }
        } catch (error) {
            console.log(error);
            socket.emit('msg',{
                msg: error.message,
                type: 'danger'
            });
        }
    });
    socket.on('disconnecting', e => {
        const rooms = Object.keys(socket.rooms).filter(room => room !== socket.id);
        for(let room of rooms) {
            io.to(room).emit('msg', {
                msg: 'Ein Spieler hat das Spiel verlassen.',
                type: 'danger'
            });
            games = games.filter(game => game.room !== room);
            scores = scores.filter(score => score.room !== room);
        }
    });
});

const PORT = Number(process.env.PORT);
server.listen(PORT, () => {
    console.log('Server listening on Port ' + PORT);
});