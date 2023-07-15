use std::fs::File;
use std::io::prelude::*;
use std::collections::HashMap;

pub enum JsonValue {
    StringVal(String),
    ArrayVal(Vec<JsonValue>),
    ObjectVal(HashMap<String, JsonValue>)
}

impl JsonValue {
    pub fn get_string(&self) -> &str {
        if let &JsonValue::StringVal(ref value) = self {
            return value;
        }
        panic!("JsonValue is not a String.");
    }

    pub fn get_array(&self) -> &Vec<JsonValue> {
        if let &JsonValue::ArrayVal(ref value) = self {
            return value;
        }
        panic!("JsonValue is not an Array.");
    }

    pub fn get_object(&self) -> &HashMap<String, JsonValue> {
        if let &JsonValue::ObjectVal(ref value) = self {
            return value;
        }
        panic!("JsonValue is not an object.");
    }
}

pub fn from_file(path: &str) -> Result<HashMap<String, JsonValue>, String> {
    if let Ok(mut file) = File::open(path) {
        let mut content = String::new();
        match file.read_to_string(&mut content) {
            Ok(_) => { 
                return parse(&content);
            },
            Err(_) => {
                return Err(format!("Could not read file: {}", path));
            },
        }
    }
    Err(format!("Could not open file: {}", path))
}

pub fn parse(input: &str) -> Result<HashMap<String, JsonValue>, String> {
    let tokens = tokenize(input);
    let mut index : usize = 0;
    parse_object(&tokens, &mut index)
}

fn parse_object(tokens: &Vec<Token>, index: &mut usize) -> Result<HashMap<String, JsonValue>, String> {
    if *index < tokens.len() {
        match tokens[*index].token_type {
            '{' => { 
                let mut map = HashMap::new();
                loop {
                    *index = *index + 1;
                    if *index < tokens.len() {
                        match tokens[*index].token_type {
                            's' => { 
                                match parse_property(&tokens, index, &mut map) {
                                    Ok(()) => { },
                                    Err(e) => { return Err(e); }
                                }
                            },
                            ',' => { },
                            '}' => { return Ok(map); },
                            _ => { return Err("invalid token".to_string()); }
                        }
                    }
                    else {
                        return Err("unexpected end".to_string());
                    }
                }
            },
            _ => {
                return Err("invalid token".to_string());
            }
        }
    }
    else {
        return Err("unexpected end".to_string());
    }
}

fn parse_property(tokens: &Vec<Token>, index: &mut usize, map: &mut HashMap<String, JsonValue>) -> Result<(), String> {
    if (*index + 3) < tokens.len() {
        
        let c1 = &tokens[*index];
        *index = *index + 1;
        let c2 = &tokens[*index];
        *index = *index + 1;
        let c3 = &tokens[*index];
        if c1.token_type == 's' {
            if c2.token_type == ':' {
                match c3.token_type {
                    's' => { map.insert(c1.value.clone(), JsonValue::StringVal(c3.value.clone())); return Ok(()); },
                    '[' => { 
                        match parse_array(&tokens, index) {
                            Ok(value) => { map.insert(c1.value.clone(), JsonValue::ArrayVal(value)); return Ok(()); },
                            Err(e) => return Err(e)
                        }
                    },
                    '{' => { 
                        match parse_object(&tokens, index) {
                            Ok(value) => { map.insert(c1.value.clone(), JsonValue::ObjectVal(value)); return Ok(()); },
                            Err(e) => return Err(e)
                        }
                    },
                    _ => { return Err("invalid token".to_string()); }
                }
            }
        }
        return Err("invalid token".to_string());
    }
    return Err("unexpected end".to_string());
}

fn parse_array(tokens: &Vec<Token>, index: &mut usize) -> Result<Vec<JsonValue>, String> {
    if *index < tokens.len() {
        match tokens[*index].token_type {
            '[' => { 
                let mut array = Vec::new();
                loop {
                    *index = *index + 1;
                    if *index < tokens.len() {
                        match tokens[*index].token_type {
                            's' => { array.push(JsonValue::StringVal(tokens[*index].value.clone())); },
                            '[' => {
                                match parse_array(tokens, index) {
                                    Ok(value) => array.push(JsonValue::ArrayVal(value)),
                                    Err(e) => return Err(e)
                                }
                             },
                            '{' => { 
                                match parse_object(tokens, index) {
                                    Ok(value) => array.push(JsonValue::ObjectVal(value)),
                                    Err(e) => return Err(e)
                                }
                            },
                            ',' => { },
                            ']' => { return Ok(array); },
                            _ => { return Err("invalid token".to_string()); }
                        }
                    }
                    else {
                        return Err("unexpected end".to_string());
                    }
                }
            },
            _ => return Err("invalid token".to_string())
        }
    }
    else {
        return Err("unexpected end".to_string());
    }
}

struct Token {
    token_type: char, // { } [ ] : , w s
    value: String
}

impl Token {
    fn from_string(s: &String) -> Token {
        Token {
            token_type: 's',
            value: s.clone()
        }
    }

    fn from_char(ch: char) -> Token {
        Token {
            token_type: ch,
            value: String::from("")
        }
    }
}

fn tokenize(input: &str) -> Vec<Token> {
    let mut tokens = Vec::new();
    let mut buffer = String::new();
    let mut iter = input.chars();
    let mut in_string = false;
    //let mut in_whitespace = false;

    loop {
        match iter.next() {
            None => break,
            Some(ch) => { 
                if in_string {
                    if ch == '"' {
                        in_string = false;
                        tokens.push(Token::from_string(&buffer));
                        buffer.clear();
                    }
                    else {
                        buffer.push(ch);
                    }
                }
                else {
                    match ch {
                        '{'|'}'|'['|']'|':'|',' => tokens.push(Token::from_char(ch)),
                        '"' => { in_string = true; },
                        ' '|'\t'|'\r'|'\n' => { /* ignored */ },
                        _ => { panic!("invalid character: \"{}\"", ch) }
                    }
                }
            }
        }
    }

    tokens
}

#[cfg(test)]
mod tests {
    use json::*;

    const JSON_STRING_1: &str = "{ \"name\": \"value\", \"name2\" :  \"value2\"    }";
    const JSON_STRING_2: &str = "
        {
            \"connection_string\": \"this is a database { } [ ] , : connection string\",
            \"sub_object\": { 
                \"logging\": \"logging helps diagnose problems in production\",
                \"string array\": [\"v1\", \"v2v2\", \"v3v3v3\",{ \"red\" : \"blue\"}]
            }
        }";

    #[test]
    fn tokenize_test_1() {
        let tokens = tokenize(JSON_STRING_1);
        assert_eq!(tokens.len(), 9);
        assert_eq!(tokens[0].token_type,'{');
        assert_eq!(tokens[1].token_type, 's');
        assert_eq!(tokens[1].value, "name");
        assert_eq!(tokens[8].token_type, '}');
        assert_eq!(tokens[7].token_type, 's');
        assert_eq!(tokens[7].value, "value2");
    }

    #[test]
    fn parse_test_1() { 
        match parse(JSON_STRING_1) {
            Ok(map) => {
                assert_eq!(map.get("name").unwrap().get_string(), "value");
                assert_eq!(map.get("name2").unwrap().get_string(), "value2");
            },
            Err(e) => {
                panic!("not parsed error: {}", e);
            }
        }
    }

    #[test]
    fn parse_test_2() {
        match parse(JSON_STRING_2) {
            Ok(map) => {
                let sub_object = map.get("sub_object").unwrap().get_object();
                let logging = sub_object.get("logging").unwrap();
                let array = sub_object.get("string array").unwrap().get_array();
                let arrayobj = array[3].get_object();
                assert_eq!(logging.get_string(), "logging helps diagnose problems in production");
                assert_eq!(array[0].get_string(), "v1");
                assert_eq!(array[1].get_string(), "v2v2");
                assert_eq!(array[2].get_string(), "v3v3v3");
                assert_eq!(arrayobj.get("red").unwrap().get_string(), "blue");
            },
            Err(e) => {
                panic!("not parsed error: {}", e);
            }
        }
    }
}