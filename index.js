const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const PORT = 8080;

const app = express();

app.use(cors());

app.use(express.static('.'));

app.get('/notify', async (req, res) => {
    const data = 'hello world at ' + Date.now();
    const res2 = await fetch('https://ntfy.sh/sudaxo', {
        method: 'POST',
        body: data,
    });
    const resp = await res2.json();
    console.log(resp);
    res.send(resp);
});

const socket = new WebSocket('wss://ntfy.sh/sudaxo/ws');

socket.on('open', () => {
    console.log('Connected to WebSocket server');
});
socket.on('message', (message) => {
    console.log(`Received message from server: ${message}`);
});
socket.on('close', () => {
    console.log('Connection closed');
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
});
