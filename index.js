const { execSync } = require('child_process');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const ks = require('node-key-sender');

const PORT = 8080;

const ACCESS_CODE = (Math.floor(Math.random() * 90) + 10).toString();

const app = express();

app.use(cors());

app.use(express.static('.'));

async function sendEvent(data) {
    const res = await fetch('https://ntfy.sh/sudaxo', {
        method: 'POST',
        body: data,
    });
    const resp = await res.json();
    return resp;
}

app.get('/notify', async (req, res) => {
    const data = 'hello world at ' + Date.now();
    const resp = await sendEvent(data);
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

    if (msg.startsWith('token_req_')) {
        const ac = msg.split('token_req_')[1];
        if (ac === ACCESS_CODE) {
            sendEvent('token_res_success');
        } else {
            sendEvent('token_res_failure');
        }
        return;
    }

    const [code, action] = msg.split('#');
    if (code && action) {
        if (code === ACCESS_CODE) {
            if (action.toLowerCase().includes('toggle')) {
                processAction('TOGGLE_YOUTUBE');
            } else if (action.toLowerCase().includes('lock')) {
                processAction('LOCK_SCREEN');
            } else if (action.toLowerCase().includes('minimize')) {
                processAction('MINIMIZE');
            }
        } else {
            sendEvent('token_res_failure');
        }
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
    console.log(`Server running on ${PORT} with ACCESS_CODE ${ACCESS_CODE}`)
});
