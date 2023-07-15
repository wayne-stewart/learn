
mod json;
mod http_server;
mod http_request;
mod http_response;
mod request_handlers;
mod static_file_handler;

use http_server::HttpServer;
use static_file_handler::StaticFileHandler;

fn main() {

    if let Ok(config) = json::from_file("./www/app_settings.json") {
        println!("loading configuration");
        let mut server = HttpServer::new("127.0.0.1:8088");
        server.use_handler(StaticFileHandler::from_config(config).unwrap());
        //server.use_handler(RouteHandler::new());
        println!("starting server on {}", server.get_address());
        server.start();
    }
    else {
        println!("server not started, config could not be loaded");
    }
}