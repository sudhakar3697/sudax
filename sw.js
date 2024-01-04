const ws = new WebSocket("wss://ntfy.sh/sudaxo/ws");

// self.addEventListener('activate', function (event) {
//     event.waitUntil(self.clients.claim());
// });

self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        // Perform background synchronization here
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // Implement your background synchronization logic here
    console.log('Background synchronization initiated');
}

ws.addEventListener('open', () => {
    console.log('WebSocket connection opened');
});

ws.addEventListener("message", function (event) {
    const data = event.data;
    console.log('Received data:', data);

    self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
            client.postMessage(data);
        });
    });

    self.registration.showNotification('sudaxo123', {
        body: data
    });

});
