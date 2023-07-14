
let is_null = (obj) => obj == null || typeof(obj) == "undefined";
let is_object = (obj) => typeof(obj) == "object" && !is_null(obj);
let is_function = (obj) => typeof(obj) == "function";
let is_array = (obj) => is_object(obj) && obj.hasOwnProperty("length") && is_function(obj.pop);
let is_string = (obj) => typeof(obj) == "string";
let query = (selector) => document.querySelector(selector);
let query_all = (selector) => document.querySelectorAll(selector);
let make_el = (tag_name, class_name) => { let el = document.createElement(tag_name); el.className = class_name; return el; }
let make_tnode = (text_content) => document.createTextNode(text_content);
let stop_bubble = (e) => { if (is_function(e.stopPropagation)) e.stopPropagation(); e.cancelBubble = true; };
Array.prototype.any = function(fn) {
    if (is_null(fn)) fn = () => true;
    else if (!is_function(fn)) fn = () => false;
    for(let i = 0; i < this.length; i++) 
        if (fn(this[i])) return true; 
    return false; 
}
Array.prototype.where = function(fn) { 
    if (is_null(fn)) fn = () => true;
    else if (!is_function(fn)) fn = () => false;
    let result = [];
    for (let i = 0; i < this.length; i++)
        if (fn(this[i])) result.push(this[i]);
    return result;
};
Array.prototype.orderby = function(fn) {
    if (is_null(fn)) fn = (a,b) => 0;
    else if (!is_function(fn)) fn = (a,b) => 0;
    let result = this.slice(0, this.length);
    result.sort(fn);
    return result;
};
String.prototype.is_empty = function() { return this.length == 0; };
String.prototype.find_first = function(start_index, ...strings) {
    let index = Infinity,s = "";
    for(let i = 0; i < strings.length; i++) {
        let j = this.indexOf(strings[i], start_index);
        if (j > -1 && j < index) {
            index = j;
            s = strings[i];
        }
    }
    if (index != Infinity) {
        return { index: index, text: s };
    } else {
        return { index: -1 };
    }
};
HTMLElement.prototype.is_id = function(id) { return this.id == id; };
HTMLElement.prototype.is_visible = function() { return this.clientHeight > 0; };
HTMLElement.prototype.has_class = function(class_name) { return this.classList.contains(class_name); };
HTMLElement.prototype.add_class = function(class_name) { if (!this.classList.contains(class_name)) this.classList.add(class_name); return this; };
HTMLElement.prototype.remove_class = function(class_name) { if (this.classList.contains(class_name)) this.classList.remove(class_name); return this; };
HTMLElement.prototype.clear = function() { this.innerHTML = ""; return this; };
HTMLElement.prototype.set_text = function(text) { this.textContent = text; return this; };
HTMLElement.prototype.set_title = function(text) { this.title = text; return this; };
HTMLElement.prototype.append_to = function(el) { el.appendChild(this); return this; };
HTMLElement.prototype.replace_content = function(el) { this.clear().appendChild(el); return this; };
HTMLElement.prototype.highlight = function() { highlight(this); return this; };
HTMLElement.prototype.query = function(selector) { return this.querySelector(selector); };
Text.prototype.append_to = function(el) { el.appendChild(this); return this; };

//hljs.configure({});

document.querySelector("#txt_search").addEventListener("keyup", e => {
    stop_bubble(e);
    socket.send_search(e.target.value);
});

document.querySelector("body").addEventListener("click", e => {
    if (e.target.has_class("search_result_title")) {
        stop_bubble(e);
        socket.get_file(e.target.textContent);
    }
    else if (e.target.has_class("file_list_item")) {
        stop_bubble(e);
        socket.get_file(e.target.textContent);
    }
    else if (e.target.has_class("close") && e.target.parentElement.is_id("div_content_header")) {
        stop_bubble(e);
        query("#div_content").remove_class("header_visible");
        query("#div_content_header").remove_class("visible");
        socket.send_search(query("#txt_search").value);
    }
    else if (e.target.has_class("copy") && e.target.parentElement.is_id("div_content_header")) {
        stop_bubble(e);
        let text = query("#div_content").textContent;
        navigator.clipboard.writeText(text);
    }
    else if (e.target.has_class("clear-search")) {
        stop_bubble(e);
        query("#txt_search").value = "";
        socket.send_search("");
    }
});


let SocketWrapper = function() { 

    let _CLOSED = 1;
    let _OPENING = 2;
    let _CONNECTED = 3;

    let _socket = null;

    let _status = _CLOSED;

    let _command_queue = [];

    let _on_open = e => { console.log("socket open"); set_status(_CONNECTED);
        let command = _command_queue.pop();
        while(!is_null(command)) {
            _socket.send(JSON.stringify(command));
            command = _command_queue.pop();
        }
    };

    let _on_error = e => { console.error("socket error"); };

    let _on_close = e => { 
        if (e.wasClean) {
            console.log("socket closed clean");
        } else {
            console.log("socket closed dirty");
        }
        _socket = null;
        set_status(_CLOSED);
    };

    let _on_message = e => { 
        let obj = JSON.parse(e.data);
        if (is_object(obj))
        {
            if (is_array(obj.Files)) 
                on_message_received_search(obj);
            else if (is_string(obj.FileName) && is_string(obj.Content)) 
                on_message_received_file(obj);
            else 
                on_message_received_error(obj);
        }
        else
        {
            on_message_received_error(null);
        }
    };

    let set_status = function(status) {
        _status = status;
        on_socket_status_changed(status);
    };

    let make_socket = function() { 
        let socket = new WebSocket(`wss://${location.host}/socket`)
        set_status(_OPENING);
        socket.onopen = _on_open;
        socket.onclose = _on_close;
        socket.onerror = _on_error;
        socket.onmessage = _on_message;
        return socket;
    };

    let send_or_queue = function(command) { 
        if(is_null(_socket)) _socket = make_socket();
        if (_status == _CONNECTED)
            _socket.send(JSON.stringify(command));
        else
            _command_queue.push(command);
    };

    this.get_status = function() { return _status; };

    this.send_search = function(search_string) {
        send_or_queue({ op: "search", data: search_string });
    };

    this.get_file = function(file_name) {
        send_or_queue({ op: "get file", data: file_name });
    };
};

let set_selected = (file_name) => {
    let el = query('[title="' + file_name + '"]');
    query_all("#div_files .file_list_item.selected").forEach(el => el.remove_class("selected"));
    el.add_class("selected");
};

let on_message_received_search = (obj) => {
    let is_empty_search = query("#txt_search").value.is_empty();
    let div_results = query("#div_files");
    let div_content_header = query("#div_content_header");
    let div_content = query("#div_content");
    div_results.clear();
    if (!div_content_header.is_visible()) div_content.clear();
    for(let i = 0; i < obj.Files.length; i++) {
        let file = obj.Files[i];
        let el = make_el("div", "file_list_item")
            .set_text(file.FileName)
            .set_title(file.FileName)
            .append_to(div_results);
        if ((is_empty_search || file.HasSearchMatch) && file.HasContents) {
            if (!is_empty_search) {
                el.add_class("has-content");
            }
            if(!div_content_header.is_visible()) {
                el = make_el("div", "search_result_item");
                make_el("div", "search_result_title")
                    .set_text(file.FileName)
                    .highlight()
                    .append_to(el);
                make_el("div", "search_result_body")
                    .set_text(file.Content)
                    .highlight()
                    .append_to(el);
                el.append_to(div_content);
                div_content.scrollTop = 0;
            }
        }
    }
    if (div_content_header.is_visible()) {
        set_selected(div_content_header.query(".fill").textContent);
        div_content_header.query(".fill").highlight();
        div_content.query("code").highlight();
    }
};

let on_message_received_file = (obj) => {
    query("#div_content_header").add_class("visible");
    query("#div_content_header > div.fill").set_text(obj.FileName).highlight();
    let div_content = query("#div_content");
    div_content.add_class("header_visible");
    let code_el = make_el("code", "hljs");
    if (/.sql$/i.test(obj.FileName)) {
        code_el.add_class("language-sql");
    } else {
        code_el.add_class("language-bash");
    }
    code_el.set_text(obj.Content).highlight();
    div_content.replace_content(code_el);
    div_content.scrollTop = 0;
    set_selected(obj.FileName);
};

let on_message_received_error = (obj) => { 
    let div_results = query("#div_files");
    div_results.innerHTML = "ERROR: Invalid Response";
};

let on_socket_status_changed = (status) => { 
    console.log(status);
};

let highlight = (el) => { 
    let search_terms = query("#txt_search").value.toLowerCase().split(" ")
        .where(s => s.length > 0)
        .orderby((a,b) => a.length <= b.length ? 1 : -1);
    let text = el.textContent;
    let text_lowered = text.toLowerCase();
    el.clear();
    for (let i = 0; i < text.length;) {
        let found = text_lowered.find_first(i, ...search_terms);
        if (found.index >= i) {
            let t1 = text.substring(i, found.index);
            make_tnode(t1).append_to(el);
            let t2 = text.substr(found.index, found.text.length);
            make_el("span", "search-highlight").set_text(t2).append_to(el);
            i = found.index + found.text.length;
        } else {
            let t1 = text.substr(i);
            make_tnode(t1).append_to(el);
            i = text.length;
        }
    }
};

let socket = new SocketWrapper();

socket.send_search("");