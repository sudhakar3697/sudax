const { execSync } = require('child_process');
const path = require('path');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const ks = require('node-key-sender');
const puppeteer = require('puppeteer-core');

const chromePathOnWindows = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe');
const airtelDongleWebUrl = 'http://192.168.1.1/index.html';

async function checkDongleChargeStatus(cc) {
    const browser = await puppeteer.launch({
        executablePath: chromePathOnWindows
    });
    const page = await browser.newPage();
    await page.goto(airtelDongleWebUrl);

    const { bat, isCharging } = await page.evaluate(() => {
        return {
            bat: window['batt_p'],
            isCharging: window['flag_battery'] === 4 ? true : false
        }
    })
    sendEvent('reporting_' + `Dongle Battery: ${bat}%  Charging: ${isCharging}` + '?cc=' + cc);
    await browser.close();
}

const PORT = 8080;

const ACCESS_CODE = (Math.floor(Math.random() * 100)).toString();

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
        const part2 = msg.split('token_req_')[1];
        const [ac, cc] = part2.split('?cc=');
        if (ac === ACCESS_CODE) {
            sendEvent('token_res_success?cc=' + cc);
        } else {
            sendEvent('token_res_failure?cc=' + cc);
        }
        return;
    }

    const [code, part2] = msg.split('#');
    if (part2) {
        const [action, cc] = part2.split('?cc=');
        if (code && action) {
            if (code === ACCESS_CODE) {
                if (action.toLowerCase().includes('toggle')) {
                    processAction('TOGGLE_YOUTUBE');
                } else if (action.toLowerCase().includes('lock')) {
                    processAction('LOCK_SCREEN');
                } else if (action.toLowerCase().includes('minimize')) {
                    processAction('MINIMIZE');
                } else if (action.toLowerCase().includes('$clipcopy')) {
                    let content = action.split('$clipcopy=')[1];
                    processAction('CLIPBOARD_COPY', content);
                } else if (action.toLowerCase().includes('donglechargestatus')) {
                    processAction('CHECK_DONGLE_CHARGE_STATUS', cc)
                }
            } else {
                sendEvent('token_res_failure?cc=' + cc);
            }
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
        case 'CLIPBOARD_COPY':
            execSync(`echo ${input} | clip`);
            break;
        case 'CHECK_DONGLE_CHARGE_STATUS':
            checkDongleChargeStatus(input);
            break;
        default:
            break;
    }
    return result;
}

app.listen(PORT, () => {
    console.log(`Server running on ${PORT} with ACCESS_CODE ${ACCESS_CODE}`)
});
