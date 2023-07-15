
use std::net::TcpStream;
use std::io::prelude::*;
use std::io;

pub struct HttpResponse {
    pub status_code: u16,
    pub headers: Vec<String>,
    pub content_buffer: Vec<u8>
}

impl HttpResponse {
    pub fn from_code(code: u16) -> HttpResponse {
        let content_buffer : Vec<u8> = Vec::new();
        let headers : Vec<String> = Vec::new();
        HttpResponse {
            status_code : code,
            content_buffer : content_buffer,
            headers : headers
        }
    }

    pub fn write_to(&mut self, stream: TcpStream) {
        let status_message = get_status_message_from_status_code(self.status_code);
        let status_line = format!("HTTP/1.1 {} {}\r\n", self.status_code, status_message);

        let content_length_header = format!("Content-Length: {}", self.content_buffer.len());

        self.headers.push(content_length_header);

        match write(stream, status_line, &self.headers, &self.content_buffer) {
            Ok(()) => { },
            Err(e) => println!("Could not write response: {:?}", e)
        }
    }
}

fn get_status_message_from_status_code(code: u16) -> String {
    match code {
        200 => String::from("OK"),
        400 => String::from("Bad Request"),
        404 => String::from("Not Found"),
        _ => String::from("Not Defined")
    }
}

fn write(mut stream: TcpStream, status_line: String, headers: &Vec<String>, content: &Vec<u8>) -> Result<(), io::Error> {
    stream.write(status_line.as_bytes())?;
    for header in headers {
        stream.write(header.as_bytes())?;
        stream.write(b"\r\n")?;
    }
    stream.write(b"\r\n")?;
    stream.write_all(&content)?;
    stream.flush()?;
    Ok(())
}