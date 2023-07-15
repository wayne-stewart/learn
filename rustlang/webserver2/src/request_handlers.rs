
use http_request::HttpRequest;
use http_response::HttpResponse;

pub trait RequestHandler {
    fn invoke(&self, request: &HttpRequest, response: &mut HttpResponse);
    fn set_next(&mut self, handler: Box<RequestHandler>);
}

