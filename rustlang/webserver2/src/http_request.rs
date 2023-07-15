
use std::net::TcpStream;
use std::io::{BufReader};
use std::io::prelude::*;
use std::io;

#[derive(PartialEq)]
pub enum HttpMethod {
    INVALID,
    GET,
    POST
}

impl HttpMethod {
    fn from(method: &str) -> HttpMethod {
        match method {
            "GET" => HttpMethod::GET,
            "POST" => HttpMethod::POST,
            _ => HttpMethod::INVALID
        }
    }
}

pub struct HttpRequest {
    pub method: HttpMethod,
    pub uri: String,
    pub http_version: String,
    headers: Vec<String>
}

impl HttpRequest {
    pub fn read_from(stream: &TcpStream) -> Result<HttpRequest, io::Error> {
        let mut request_line = String::new();
        let mut headers : Vec<String> = Vec::new();
        let method: String;
        let uri: String;
        let http_version: String;
        {
            let mut reader = BufReader::new(stream);
            reader.read_line(&mut request_line)?;
            let mut iter = request_line.split_whitespace();
            method = (match iter.next() { Some(s) => s, None => "" }).to_string();
            uri = (match iter.next() { Some(s) => s, None => "" }).to_string();
            http_version = (match iter.next() { Some(s) => s, None => "" }).to_string();
            let mut size : usize = 3;
            while size > 2 {
                let mut header = String::new();
                size = reader.read_line(&mut header)?;
                if size > 2 {
                    headers.push(header);
                }
            }
        }
        
        Ok(HttpRequest {
            method: HttpMethod::from(&method),
            uri,
            http_version,
            headers
        })
    }
}