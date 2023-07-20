
/*
    NOT FOR PRODUCTION!

    This is a simple  nodejs server for local testing
*/

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
	});
    
	/*fs.readFile(__dirname + request.url, function(error, data){
      response.end(data);
    });*/
};

var server = http.createServer(handleRequest);

server.listen(PORT, function(){
    console.log("Server Listening at http://localhost:" + PORT);
});
