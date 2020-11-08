const socket = io();

const msgBox = document.getElementById('msgBox');

const renderMessages = (messages = []) => {
    msgBox.innerHTML = '';
    /* messages.forEach(msg => {
        const p = document.createElement('p');
        switch (typeof msg) {
            case 'string':
                p.innerText = msg
                break;
            case 'object':
                p.innerText = msg.msg;
                p.classList.add(`text-${msg.type}`);
                break;
        }
        msgBox.appendChild(p);
    }); */
    for(let i=messages.length-1; i>-1; i--) {
        const msg = messages[i];
        const p = document.createElement('p');
        switch (typeof msg) {
            case 'string':
                p.innerText = msg
                break;
            case 'object':
                p.innerText = msg.msg;
                p.classList.add(`text-${msg.type}`);
                break;
        }
        msgBox.appendChild(p);
    }
};

const addMessage = msg => {
    if(messages.length >= 3) messages.shift();
    messages.push(msg);
    renderMessages(messages);
};


const messages = [];

socket.on('msg', addMessage);

socket.on('init', console.log);

const joinGameForm = document.getElementById('joinGame');
const gameID = document.getElementById('gameID');
const playername = document.getElementById('playername');

joinGameForm.addEventListener('submit', e => {
    e.preventDefault();
    socket.emit('join', {
        room: gameID.value,
        playername: playername.value
    });
    socket.playername = playername.value;
});

const opponent = document.getElementById('opponent');

socket.on('players', players => {
    const opponentPlayer = players.filter(player => player.id !== socket.id)[0];
    opponent.innerText = opponentPlayer ? opponentPlayer.playername : 'Wartet auf Mitspieler...';
});

const boxes = document.querySelectorAll('.tic-box');
for(let box of boxes) {
    box.addEventListener('click', e => {
        const boxID = e.currentTarget.id.split('-')[1]; //gets ID from id like box-3
        socket.emit('box', Number(boxID));
    });
}

socket.on('gamestate', gamestate => {
    console.log(gamestate);
    for(let i=0; i<3; i++) {
        for(let j=0; j<3; j++) {
            const num = j + i*3 + 1;
            const box = document.querySelector(`#box-${num}`);
            
            const playerIDOnBox = gamestate.boxes[i][j];
            const shape = Object.keys(gamestate.shapes).find(shape => gamestate.shapes[shape].id === playerIDOnBox);
            
            const displayShape = document.createElement('h1');
            displayShape.classList.add('tic-shape')

            box.innerHTML = '';
            
            if(playerIDOnBox) {
                displayShape.innerText = shape === 'cross' ? 'X' : 'O';
                box.appendChild(displayShape);
            }
        }
    }

    const playing = document.querySelector('#playingName');
    if(gamestate.state === 'playing') {
        playing.innerText = gamestate.playing.id === socket.id ? 'Du' : opponent.innerText;
    }
});

const scoreBox = document.querySelector('#scoreBox');
socket.on('score', score => {
    console.log(score);
    const opponentID = Object.keys(score).filter(id => id !== socket.id)[0];
    scoreBox.innerText = 
        `Du: ${score[socket.id]}
        Gegner: ${score[opponentID]}`
});