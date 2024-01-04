const { execSync } = require('child_process');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const ks = require('node-key-sender');

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
socket.on('message', (json) => {
    console.log(`Received message from server: ${json}`);
    json = JSON.parse(json);
    const msg = json.message || '';
    if (msg.toLowerCase().includes('toggle')) {
        processAction('TOGGLE_YOUTUBE');
    } else if (msg.toLowerCase().includes('lock')) {
        processAction('LOCK_SCREEN');
    } else if (msg.toLowerCase().includes('minimize')) {
        processAction('MINIMIZE');
    }
});
socket.on('close', () => {
    console.log('Connection closed');
});

function processAction(action, input) {
    let result = {
        status: 'ok'
    };
    switch (action) {
        case 'TOGGLE_YOUTUBE':
            ks.sendCombination(['control', 'q']); // ctrl + q shortcut
            break;
        case 'MINIMIZE':
            ks.sendCombination(['windows', 'm']);
            break;
        case 'LOCK_SCREEN':
            execSync(`rundll32.exe user32.dll, LockWorkStation`);
            break;
        default:
            break;
    }
    return result;
}

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
});
