const ws = new WebSocket("wss://ntfy.sh/sudaxo/ws");

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
