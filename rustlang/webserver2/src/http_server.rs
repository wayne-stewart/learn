
use std::net::{TcpListener, TcpStream};

use request_handlers::RequestHandler;
use http_request::{HttpRequest, HttpMethod};
use http_response::HttpResponse;

pub struct HttpServer {
    address: String,
    //middle_ware: Vec<String>,
    handler: Option<Box<RequestHandler>>
    //routes: Vec<String>
}

impl HttpServer {
    pub fn new(address: &str) -> HttpServer {
        HttpServer {
            address: String::from(address),
            handler: None
        }
    }

    pub fn start(&self) {
        let listener = TcpListener::bind(&self.address).expect("Unable to start HTTP Server");
        for stream in listener.incoming() {
            match stream {
                Ok(stream) => handle_connection(self, stream),
                Err(e) => println!("TCP Connection could not be opened - Err: {:?}", e)
            }
        }
    }

    pub fn get_address(&self) -> String {
        self.address.clone()
    }

    pub fn use_handler(&mut self, next : Box<RequestHandler>) {
        match self.handler {
            Some(ref mut handler) => handler.set_next(next),
            None => self.handler = Some(next)
        }
    }
}

fn handle_connection(server: &HttpServer, stream: TcpStream) {
    let request = HttpRequest::read_from(&stream);
    match request {
        Err(_e) => { 
            HttpResponse::from_code(400).write_to(stream); 
        },
        Ok(request) => {
            if !validate_request(&request) {
                HttpResponse::from_code(400).write_to(stream);
            }
            else {
                match server.handler {
                    Some(ref handler) => {
                        let mut response = HttpResponse::from_code(200);
                        handler.invoke(&request, &mut response);
                        response.write_to(stream);
                    },
                    None => {
                        println!("Request Handler not found!");
                        HttpResponse::from_code(500).write_to(stream);
                    }
                }
            }
        }
    }
}

fn validate_request(request: &HttpRequest) -> bool {
    if request.method == HttpMethod::INVALID {
        return false;
    }
    if request.http_version != "HTTP/1.1" {
        return false;
    }
    return true;
}