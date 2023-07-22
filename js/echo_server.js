
var http = require("http");

const PORT = 8080;

var handleRequest = function(request, response) {
    console.log(request.url);
	var txt_data = '';
	request.on('data', (chunk) => {
		txt_data += `${chunk}`;
	});
	request.on('end', () => {
		response.end(txt_data);
		console.log(txt_data);
	});
};

var server = http.createServer(handleRequest);

server.listen(PORT, function(){
    console.log("Server Listening at http://localhost:" + PORT);
});
