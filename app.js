const path = require('path');
const express = require('express');
const { EventEmitter } = require('events');

const port = process.env.PORT || 3000;
const app = express();
const chatEmitter = new EventEmitter();


function respondText(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.end('hi ');
}

function respondJson(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ text: 'hi', numbers: [1, 2, 3] }));
}
function respondEcho(req, res) {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const input = urlObj.searchParams.get('input') || '';

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
        normal: input,
        shouty: input.toUpperCase(),
        charCount: input.length,
        backwards: input.split('').reverse().join(''),
    }));
}



app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});


app.get('/text', (req, res) => {
  res.type('text/plain').send('hi');
});


app.get('/json', (req, res) => {
  res.json({
    text: 'hi',
    numbers: [1, 2, 3],
  });
});


app.get('/echo', (req, res) => {
  const { input = '' } = req.query;
  res.json({
    normal: input,
    shouty: input.toUpperCase(),
    charCount: input.length,
    backwards: input.split('').reverse().join(''),
  });
});


app.get('/chat', (req, res) => {
  const { message } = req.query;
  chatEmitter.emit('message', message);
  res.end();
});


app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const onMessage = (message) => {
    // Each SSE message must end with a double newline
    res.write(`data: ${message}\n\n`);
  };

  chatEmitter.on('message', onMessage);

  // If the client disconnects, clean up the listener
  req.on('close', () => {
    chatEmitter.off('message', onMessage);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).type('text/plain').send('Not Found');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
