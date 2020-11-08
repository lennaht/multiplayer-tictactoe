module.exports = class {
    constructor(room, player1, player2, beginningShape = 'cross') {
        this.moves = 0;

        this.beginningShape = beginningShape;
        this.room = room;
        
        const random0or1 = Math.round(Math.random());
        this.shapes = {
            cross: random0or1 === 0 ? player1 : player2,
            circle: random0or1 === 0 ? player2 : player1
        };

        this.boxes = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];        
    }
    /* 
           0  1  2   0  1  2
        0 [1, 2, 3] [0, 1, 2]
        1 [4, 5, 6] [3, 4, 5]
        2 [7, 8, 9] [6, 7, 8]
    */
    getIndexesOfBox(number) {
        const i = number - 1;
        const row = Math.floor(i / 3);
        return [
            row,
            i - row*3
        ];
    }
    getValueOfBox(number) {
        const indexes = this.getIndexesOfBox(number);
        return this.boxes[indexes[0]][indexes[1]];
    }
    tickBox(playerID, number) {
        if(number < 1 || number > 9) throw new Error('Die Nummer muss zwischen 1 und 9 sein.');
        if(this.moves === 0 && this.shapes[this.beginningShape].id !== playerID) {
            throw new Error('Du bist nicht an der Reihe.');
        }

        if(this.moves % 2 === 0 && this.shapes[this.beginningShape].id !== playerID) {
            throw new Error('Du bist nicht an der Reihe.');
        }

        if(this.moves % 2 === 1 && this.shapes[this.beginningShape].id === playerID) {
            throw new Error('Du bist nicht an der Reihe.');
        }

        if(this.getValueOfBox(number) !== null) throw new Error('Feld ist bereits belegt');

        const indexes = this.getIndexesOfBox(number);
        this.boxes[indexes[0]][indexes[1]] = playerID;
        this.moves++;

        return this.checkGameState();
    }
    checkGameState() {
        //Horizontale Reihen
        for(let i=0; i<3; i++) {
            if(this.boxes[i].every(box => box === this.boxes[i][0] && box !== null)) {
                return {
                    state: 'win',
                    player: this.boxes[i][0],
                    boxes: this.boxes,
                    shapes: this.shapes
                };
            }
        }

        //Vertikale Reihen
        for (let i=0; i<3; i++) {
            const columnBoxes = [];
            for (let j=0; j<3; j++) {
                columnBoxes.push(this.boxes[j][i]);
            }
            if(columnBoxes.every(box => box === this.boxes[0][i] && box !== null)) {
                return {
                    state: 'win',
                    player: this.boxes[0][i],
                    boxes: this.boxes,
                    shapes: this.shapes
                };
            }
        }

        //Diagonale Reihen
        const diagBoxes1 = [0, 1, 2].map(i => this.boxes[i][i]);
        if(diagBoxes1.every(box => box === diagBoxes1[0] && box !== null)) {
            return {
                state: 'win',
                player: this.boxes[1][1],
                boxes: this.boxes,
                shapes: this.shapes
            };
        }

        const diagBoxes2 = [0, 1, 2].map(i => this.boxes[i][Math.abs(i - 2)]);
        if(diagBoxes2.every(box => box === diagBoxes2[0] && box !== null)) {
            return {
                state: 'win',
                player: this.boxes[1][1],
                boxes: this.boxes,
                shapes: this.shapes
            };
        }

        if(this.moves === 9) {
            return {
                state: 'draw',
                shapes: this.shapes,
                boxes: this.boxes
            }
        }

        return {
            state: 'playing',
            playing: this.moves % 2 === 0 
                ? this.shapes[this.beginningShape]
                : this.shapes[this.beginningShape === 'cross' ? 'circle' : 'cross'],
            shapes: this.shapes,
            boxes: this.boxes
        };
    }
};