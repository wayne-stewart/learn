
var http = require("http");
var fs = require("fs");

const PORT = 8080;

var handleRequest = function(request, response) {
    console.log("REQUEST: " + request.url);
    var queryIndex = request.url.indexOf("?");
    var path;
    var query;
    if (queryIndex >= 0) {
        path = request.url.substring(0, queryIndex);
        query = request.url.substring(queryIndex);
    } else {
        path = request.url;
    }
    
    fs.readFile(__dirname + path, function(error, data) {
        response.end(data);
    });
};

var server = http.createServer(handleRequest);

server.listen(PORT, function() {
    console.log("Server listening at http://localhost:" + PORT);
});
