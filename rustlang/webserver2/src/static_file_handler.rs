use std::io::prelude::*;
use std::fs::File;
use std::path::{PathBuf};
use std::collections::HashMap;
use http_request::HttpRequest;
use http_response::HttpResponse;
use request_handlers::RequestHandler;
use json::JsonValue;

pub struct StaticFileHandler {
    next: Option<Box<RequestHandler>>,
    wwwroot: String,
    file_mapping: HashMap<String, String>
}

impl StaticFileHandler {
    pub fn new(wwwroot : String, file_mapping: HashMap<String, String>) -> Box<RequestHandler> {
        let x = StaticFileHandler {
            wwwroot,
            file_mapping,
            next: None
        };
        return Box::new(x);
    }

    pub fn from_config(config: HashMap<String, JsonValue>) -> Result<Box<RequestHandler>, &'static str> {
        let config = config.get("static_file_handler").unwrap().get_object();

        let mut wwwroot = String::new();
        match config.get("wwwroot") {
            Some(value) => wwwroot.push_str(value.get_string()),
            _ => { }
        }

        let mut file_mapping : HashMap<String, String> = HashMap::new();
        match config.get("file_mapping") {
            Some(value) => { 
                let array = value.get_array();
                for json_value in array {
                    match json_value {
                        &JsonValue::ObjectVal(ref obj) => { 
                            if let Some(ext) = obj.get("ext") {
                                if let Some(mime_type) = obj.get("type") {
                                    println!("file type - ext: {} type: {}", ext.get_string(), mime_type.get_string());
                                    file_mapping.insert(ext.get_string().to_owned(), mime_type.get_string().to_owned());
                                }
                            }
                        }
                        _ => { }
                    }
                }
            },
            _ => { }
        }

        Ok(StaticFileHandler::new(wwwroot, file_mapping))
    }
}

impl RequestHandler for StaticFileHandler {
    fn invoke(&self, request: &HttpRequest, response: &mut HttpResponse) {
        if let Ok(path) = resolve_path(&self.wwwroot, &request.uri) {
            let mut ext = String::new();
            if validate_path(&path, &self.file_mapping, &mut ext) {
                match File::open(&path) {
                    Ok(mut file) => { 
                        match file.read_to_end(&mut response.content_buffer) {
                            Ok(_) => { 
                                response.status_code = 200;
                                response.headers.push(format!("Content-Type: {}", self.file_mapping.get(&ext).unwrap()));
                            },
                            Err(_) => response.status_code = 404
                        }
                    },
                    Err(_e) => { response.status_code = 404 }
                }
                return;
            }
        }

        match self.next {
            Some(ref next) => next.invoke(request, response),
            None => { response.status_code = 404 }
        }
    }

    fn set_next(&mut self, handler: Box<RequestHandler>) {
        self.next = Some(handler);
    }
}

fn resolve_path(root: &str, path: &str) -> Result<PathBuf, &'static str> {
    let mut path_buf = PathBuf::new();
    path_buf.push(root);
    for part in path.split("/") {
        match part {
            "." => { return Err("invalid path"); },
            ".." => { path_buf.pop(); if path_buf.components().count() == 0 { return Err("invalid path"); } },
            _ => { if part.len() > 0 { path_buf.push(part); } }
        }
    }
    Ok(path_buf)
}

fn validate_path(path: &PathBuf, file_types: &HashMap<String, String>, ext_out: &mut String) -> bool {
    if path.exists() && path.is_file() {
        match path.extension() {
            Some(ext) => {
                ext_out.push_str(&*ext.to_string_lossy());
                file_types.contains_key(ext_out);
                true
            },
            None => false
        }
    }
    else {
        false
    }
}