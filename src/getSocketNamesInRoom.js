/**
 * Gives playernames of all sockets in a room
 * @param {io} io 
 * @param {room} room 
 */
module.exports = (io, roomName) => {
    const room = io.sockets.adapter.rooms[roomName];
    if(!room) return [];
    const clients = room.sockets;   

    //to get the number of clients
    const numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;
    const names = [];

    for (const clientId in clients ) {

        //this is the socket of each client in the room.
        const clientSocket = io.sockets.connected[clientId];
        names.push({ id: clientSocket.id, playername: clientSocket.playername });
    }
    return names;
}