var fs = require("fs");
var irc = require("irc");
var http = require("https");
var url = require("url");
var SETTINGS_FILE = __dirname + "/settings.json";

var settings = JSON.parse(fs.readFileSync(SETTINGS_FILE));

var letschat_url = url.parse(settings.letschat.url);
var letschat_token = settings.letschat.token;

var client = new irc.Client(settings.server, settings.nick, {
  channels: [settings.channel],
  autoRejoin: true
});
client.addListener("registered", function () {
  console.log("Logged into freenode successfully");
});
client.addListener("join", function (channel, nick) {
  if (nick === settings.nick) {
    console.log("Joined " + channel);
  }
});

function request(options, cb) {
  options.hostname = letschat_url.hostname;
  options.port = letschat_url.port;
  options.headers = options.headers || {};
  if (letschat_token) {
    options.headers.Authorization = "Bearer " + letschat_token;
  }
  options.headers["Content-Type"] = "application/json";
  return http.request(options, function(res) {
    console.log("sent @ " + new Date() + " with status: " + res.statusCode);
  });
}

client.addListener("message", function (from, to, message) {
  var req = request({
    method: "POST",
    path: "/rooms/" + settings.letschat.room + "/messages"
  });

  req.on("error", function (err) {
    console.error(err);
  });

  req.write(JSON.stringify({
    text: from + ": " + message
  }));
  req.end();
});
client.addListener("error", function(message) {
  console.error("error: ", message);
});
