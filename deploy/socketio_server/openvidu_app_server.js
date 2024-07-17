var express = require("express");
var bodyParser = require("body-parser");
var http = require("http");
var OpenVidu = require("openvidu-node-client").OpenVidu;
var cors = require("cors");
var app = express();

// Environment variable: PORT where the node server is listening
var SERVER_PORT = 1235;
// Environment variable: URL where our OpenVidu server is listening
var OPENVIDU_URL = 'https://video.poke-code.com'; //'https://video.poke-code.com:4443'; //
// Environment variable: secret shared with our OpenVidu server
var OPENVIDU_SECRET = 'LOVE';

app.use(cors());
var server = http.createServer(app);
var openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

// Allow application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// Allow application/json
app.use(bodyParser.json());

// Serve application
server.listen(SERVER_PORT, () => {
  console.log("Application started on port: ", SERVER_PORT);
  console.warn('Application server connecting to OpenVidu at ' + OPENVIDU_URL);
});

app.post("/api/sessions", async (req, res) => {
  console.log('############### /api/sessions');
  var session = await openvidu.createSession(req.body);
  res.send(session.sessionId);
});

app.get("/check", async (req, res) => {
  console.log("ok lets go");
  res.send("ok lets go");
});

app.post("/api/sessions/:sessionId/connections", async (req, res) => {
  console.log("Requested Session ID: ", req.params.sessionId);
  console.log("Request Body: ", req.body);

  var session = openvidu.activeSessions.find(
    (s) => s.sessionId === req.params.sessionId
  );

  if (!session) {
    res.status(404).send();
  } else {
    console.log("-=-=-=-=-=-=-=-=-=-=-=-=-", `/api/sessions/${req.params.sessionId}/connections`);
    var connection = await session.createConnection(req.body);
    console.log(connection);
    res.send(connection.token);
  }
});

process.on('uncaughtException', err => console.error(err));
