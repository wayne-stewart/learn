
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#include <netdb.h>
#include <string.h>
#include <arpa/inet.h>
#include <time.h>
#include <limits.h>
#include <pthread.h>

#include "nexus_numbers.h"
#include "nexus_string.h"
#include "nexus_tables.h"

#define PORT "5000"
#define LISTEN_QUEUE_SIZE 10
#define BUFFER_SIZE 4096
#define WWW_ROOT "./www_root"

#define UNUSED(x) (void)(x)
#define ARRAY_SIZE(x) (sizeof(x) / sizeof(x[0]))
#define MIN(x,y) ((x) > (y) ? (y) : (x))
#define MAX(x,y) ((x) > (y) ? (x) : (y))
#define HANDLE_LISTEN_ERROR(fn_name) perror(fn_name); listen_socket = -1; goto CLEANUP;
#define RECV_FLAGS 0

#define CONSOLE_RED     "\e[0;31m"
#define CONSOLE_GREEN   "\e[0;32m"
#define CONSOLE_NC      "\e[0m"

//#define MAP_HANDLER(method, uri, handler) { method, STRING(uri), (handler) }
#define MAP_GET(uri, handler) { http_method::GET, STRING(uri), (HTML), (handler), (0) }
#define MAP_STATIC_FILE(uri, file_type) { http_method::GET, STRING(uri), (file_type), (0), (handle_static_file) }
//#define MAP_POST(uri, handler) { http_method::POST, STRING(uri), (handler) }

void print_listening_message(struct addrinfo *addr_info)
{
    char buffer[1024] = { };
    void *addr;
    if (addr_info->ai_family == AF_INET)
    {
        addr = &(((sockaddr_in *)addr_info->ai_addr)->sin_addr);
    }
    else
    {
        addr = &(((struct sockaddr_in6 *)addr_info->ai_addr)->sin6_addr);
    }
    if (inet_ntop(addr_info->ai_family, addr, buffer, addr_info->ai_addrlen) != NULL)
    {
        printf("listening on: %s\n", buffer);
    }
}

int start_listening()
{
    struct addrinfo addr_info_hints = { }, *addr_info = NULL;
    s32 listen_socket;
    u32 yes = 1;

    addr_info_hints.ai_family = AF_UNSPEC;
    addr_info_hints.ai_socktype = SOCK_STREAM;
    addr_info_hints.ai_flags = AI_PASSIVE;

    if (getaddrinfo(NULL, PORT, &addr_info_hints, &addr_info) != 0)
    {
        HANDLE_LISTEN_ERROR("getaddrinfo");
    }

    if ((listen_socket = socket(addr_info->ai_family, addr_info->ai_socktype, addr_info->ai_protocol)) < 0)
    {
        HANDLE_LISTEN_ERROR("socket");
    }

    if (setsockopt(listen_socket, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes)) == -1)
    {
        HANDLE_LISTEN_ERROR("setsockopt");
    }

    if (bind(listen_socket, addr_info->ai_addr, addr_info->ai_addrlen) != 0)
    {
        HANDLE_LISTEN_ERROR("bind");
    }

    if (listen(listen_socket, LISTEN_QUEUE_SIZE) < 0)
    {
        HANDLE_LISTEN_ERROR("listen");
    }

    print_listening_message(addr_info);

    CLEANUP:
    if (addr_info)
    {
        freeaddrinfo(addr_info);
    }

    return listen_socket;
}

const string HTTP_CONTENT_TYPES[7] = {
    STRING("text/html; charset=utf8"),
    STRING("image/x-icon"),
    STRING("image/png"),
    STRING("image/jpeg"),
    STRING("application/javascript"),
    STRING("text/css; charset=utf-8"),
    STRING("font/woff2")
};

enum class http_content_type : u32
{
    HTML,
    ICO,
    PNG,
    JPG,
    JS,
    CSS,
    WOFF2
};

#define HTML http_content_type::HTML
#define ICO http_content_type::ICO
#define PNG http_content_type::PNG
#define JPG http_content_type::JPG
#define JS http_content_type::JS
#define CSS http_content_type::CSS
#define WOFF2 http_content_type::WOFF2

const string HTTP_METHODS[10] = { 
    STRING("UNKNOWN"),
    STRING("GET"),
    STRING("HEAD"),
    STRING("POST"),
    STRING("PUT"),
    STRING("DELETE"),
    STRING("CONNECT"),
    STRING("OPTIONS"),
    STRING("TRACE"),
    STRING("PATCH"),
};
enum class http_method : u32
{
    UNKNOWN,
    GET,
    HEAD,
    POST,
    PUT,
    DELETE,
    CONNECT,
    OPTIONS,
    TRACE,
    PATCH
};

const string HTTP_PROTOCOLS[4] = { 
    STRING("UNKNOWN"), 
    STRING("HTTP/1.0"), 
    STRING("HTTP/1.1"), 
    STRING("HTTP/2.0")
};
enum class http_protocol : u32
{
    UNKNOWN,
    HTTP_10,
    HTTP_11,
    HTTP_20
};

const string HTTP_HEADERS[14] = {
    STRING("UNKNOWN"),
    STRING("Host"),
    STRING("User-Agent"),
    STRING("Accept-Language"),
    STRING("Accept-Encoding"),
    STRING("Accept"),
    STRING("Connection"),
    STRING("Cookie"),
    STRING("Content-Type"),
    STRING("Keep-Alive"),
    STRING("Date"),
    STRING("Content-Length"),
    STRING("Server"),
    STRING("Cache-Control") // public, max-age=31536000
};

enum class http_header : u32
{
    UNKNOWN,
    HOST,
    USER_AGENT,
    ACCEPT_LANGUAGE,
    ACCEPT_ENCODING,
    ACCEPT,
    CONNECTION,
    COOKIE,
    CONTENT_TYPE,
    KEEP_ALIVE,
    DATE,
    CONTENT_LENGTH,
    SERVER,
    CACHE_CONTROL
};

struct buffer_4k
{
    char data[4096];
    u32 length;
};

struct http_request_headers
{
    string host;
    string user_agent;
    string accept;
    string accept_language;
    string accept_encoding;
    string connection;
    string cookie;
};

struct http_request
{
    s32 socket;
    s32 status;
    b32 isvalid;
    http_method method;
    http_protocol protocol;
    http_request_headers headers;
    string request_line;
    string uri;
    string body;
    buffer_4k input_buffer;
    buffer_4k output_buffer;
    buffer_4k work_buffer;
};

http_method parse_http_request_method(char *data)
{
    for(u32 i = 1; i < ARRAY_SIZE(HTTP_METHODS); i++)
    {
        if (strncmp(HTTP_METHODS[i].value, data, HTTP_METHODS[i].length) == 0)
        {
            return (http_method)i;
        }
    }
    return http_method::UNKNOWN;
}

http_protocol parse_http_request_protocol(char *data)
{
    for(u32 i = 1; i < ARRAY_SIZE(HTTP_PROTOCOLS); i++)
    {
        if (strncmp(HTTP_PROTOCOLS[i].value, data, HTTP_PROTOCOLS[i].length) == 0)
        {
            return (http_protocol)i;
        }
    }
    return http_protocol::UNKNOWN;
}

void debug_print_http_request_header(http_request *request)
{
    if (request->isvalid == 1)
    {
        printf(CONSOLE_GREEN);
        print_string(&request->request_line);
        printf("\n" CONSOLE_NC "URI: ");
        print_string(&request->uri);
        printf("\nHost: ");
        print_string(&request->headers.host);
        printf("\nUser Agent: ");
        print_string(&request->headers.user_agent);
        printf("\nConnection: ");
        print_string(&request->headers.connection);
        printf("\n");
    }
    else
    {
        printf(CONSOLE_RED);
        print_string(&request->request_line);
        printf(CONSOLE_NC);
    }
}

void log_http_request(http_request *request)
{
    if (request->status == -1)
    {
        printf("Connection reset by peer.\n");
    }
    else if (request->status == -2)
    {
        printf("Failed to read from stream.\n");
    }
    else
    {
        char buffer[1024] = {};
        s32 i = sprintf(buffer, "%s ", HTTP_METHODS[(s32)request->method].value);
        memcpy(buffer + i, request->uri.value, request->uri.length);
        i += request->uri.length;
        sprintf(buffer + i, " %d\n", request->status);
        printf("%s", buffer);
    }
}

char * parse_http_request_headers(struct http_request *request, char *data, u32 data_length)
{
    char *data_end = data + data_length;
    string *header = NULL;

    while (strncmp(data, "\r\n", 2) != 0 && data < data_end)
    {
        header = NULL;

        // make sure we found an \r\n sequence to mark the end of a header
        char *end = (char *)memchr(data, '\n', (data_end - data));
        if (end == NULL) return NULL;
        if (*(end - 1) == '\r') end -= 1;
        else return NULL;

        // check if header matches any we care about and store
        // a string referencing it's value
        for(u32 i = 1; i < ARRAY_SIZE(HTTP_HEADERS); i++)
        {
            if (strncmp(HTTP_HEADERS[i].value, data, HTTP_HEADERS[i].length) == 0)
            {
                // header string must be followed by : and space
                data += HTTP_HEADERS[i].length;
                if (strncmp(data, ": ", 2) == 0) data += 2;
                else return NULL;

                switch((http_header)i)
                {
                    case http_header::HOST: header = &request->headers.host; break;
                    case http_header::USER_AGENT: header = &request->headers.user_agent; break;
                    case http_header::ACCEPT_LANGUAGE: header = &request->headers.accept_language; break;
                    case http_header::ACCEPT_ENCODING: header = &request->headers.accept_encoding; break;
                    case http_header::ACCEPT: header = &request->headers.accept; break;
                    case http_header::CONNECTION: header = &request->headers.connection; break;
                    case http_header::COOKIE: header = &request->headers.cookie; break;
                    default: break;
                }
                if (header != NULL)
                {
                    header->value = data;
                    header->length = end - data + 1;
                }
            }
        }
        data = end + 2;
    }

    // we should have a final \r\n sequence to finalize the header area
    if (strncmp(data, "\r\n", 2) == 0)
    {
        return data + 2;
    }
    else
    {
        return NULL;
    }
}

void parse_http_request(struct http_request *request)
{
    //s32 index = 0, read = 0, body_size;
    char *res;
    char *data = request->input_buffer.data;
    char *data_end = data + request->input_buffer.length;

    // REQUEST LINE
    // I don't want to support a request line longer
    // than 1024 characters
    res = (char *)memchr(data, '\n', MIN(1024, request->input_buffer.length));
    request->request_line.value = data;
    if (res == NULL || *(res - 1) != '\r')
    {
        request->request_line.length = MIN(1024, request->input_buffer.length);
        return;
    }
    else
    {
        request->request_line.length = (res - 2) - data + 1;
        printf("L: %d\n", request->request_line.length);
    }

    //printf("%p %p %d %d\n", data_end, data, (data_end - data));

    // HTTP METHOD
    request->method = parse_http_request_method(data);
    if (request->method == http_method::UNKNOWN) return;
    data += HTTP_METHODS[(u32)request->method].length;
    if (*data == ' ') data++;
    else return;

    // URI
    res = (char *)memchr(data, ' ', (data_end - data));
    if (res == NULL) return;
    request->uri.value = data;
    request->uri.length = res - data;
    data = res + 1;

    // PROTOCOL
    request->protocol = parse_http_request_protocol(data);
    if (request->protocol == http_protocol::UNKNOWN) return;
    data += HTTP_PROTOCOLS[(u32)request->protocol].length;
    if (strncmp(data, "\r\n", 2) == 0) data+=2;
    else return;

    // HEADERS
    data = parse_http_request_headers(request, data, (data_end - data));
    if (data == NULL) return;

    // if parsing reaches the end, then request should be valid
    request->isvalid = 1;
}

typedef void (*fn_request_handler)(http_request *request);
typedef void (*fn_static_file_request_handler)(http_request *request, http_content_type content_type);

struct request_handler
{
    http_method method;
    string uri;
    http_content_type content_type;
    fn_request_handler handler;
    fn_static_file_request_handler static_file_handler;
};

s32 http_write_response_headers(
    http_request *request, s32 status, const char *status_message, const char *content_type, s32 content_length)
{
    request->status = status;
    char t_buffer[32];
    struct tm gmt;
    time_t t = time(NULL);
    gmtime_r(&t, &gmt);
    strftime(t_buffer, ARRAY_SIZE(t_buffer), "%a, %d %b %Y %H:%M:%S GMT", &gmt);
    string protocol = HTTP_PROTOCOLS[(s32)http_protocol::HTTP_11];
    s32 size = sprintf(
        request->output_buffer.data, "%s %d %s\r\nServer: Nexus\r\nDate: %s\r\nContent-Type: %s\r\nContent-Length: %d\r\n\r\n",
        protocol.value, status, status_message, t_buffer, content_type, content_length);
    return size;
}

void http_write_404(http_request *request)
{
    s32 written = http_write_response_headers(
        request, 404, "Not Found", "text/html; charset=utf8", 0);
    write(request->socket, request->output_buffer.data, written);
}

void http_write_file_to_socket(http_request *request, char *file_path, http_content_type content_type)
{
    auto output_buffer = &request->output_buffer;
    FILE *file = fopen(file_path, "rb");
    struct stat fs;
    stat(file_path, &fs);
    u64 file_size = fs.st_size;
    s32 written = http_write_response_headers(
        request, 200, "OK", HTTP_CONTENT_TYPES[(u32)content_type].value, file_size);
    write(request->socket, output_buffer->data, written);
    s32 read = 0;
    while((read = fread(output_buffer->data, 1, ARRAY_SIZE(output_buffer->data), file)) != 0)
    {
        write(request->socket, output_buffer->data, read);
    }
}

void handle_static_file(http_request *request, http_content_type content_type)
{
    char file_path[1024] = { };
    s32 written = sprintf(file_path, "%s", WWW_ROOT);
    memcpy(file_path + written, request->uri.value, request->uri.length);
    
    //printf("%s\n", buffer);
    if (access(file_path, F_OK) == 0)
    {
        http_write_file_to_socket(request, file_path, content_type);
    }
    else
    {
        http_write_404(request);
    }
}

void handle_default(http_request *request)
{
    char file_path[1024] = { };
    sprintf(file_path, "%s/default.html", WWW_ROOT);
    http_write_file_to_socket(request, file_path, HTML);
}

void handle_tools(http_request *request)
{
    request->work_buffer.length = sprintf(request->work_buffer.data, "<html><body><p>Tools Page</p>");
    write(request->socket, request->work_buffer.data, request->work_buffer.length);
}

request_handler *find_handler(request_handler *handlers, s32 handlers_size, http_request *request)
{
    request_handler *handler;
    for(s32 i = 0; i < handlers_size; i++)
    {
        handler = &handlers[i];
        if (handler->method == request->method)
        {
            if (handler->uri.length == request->uri.length)
            {
                if (strncmp(handler->uri.value, request->uri.value, request->uri.length) == 0)
                {
                    return handler;
                }
            }
        }
    }
    return NULL;
}

void handle_request(request_handler *handlers, s32 handlers_size, http_request *request)
{
    auto in_buffer = &request->input_buffer;
    s32 recv_res = recv(request->socket, in_buffer->data, ARRAY_SIZE(in_buffer->data), RECV_FLAGS);
    in_buffer->length = recv_res;
    if (recv_res > 0)
    {
        //printf("%s\n", in_buffer->data);
        parse_http_request(request);
        debug_print_http_request_header(request);

        auto handler = find_handler(handlers, handlers_size, request);

        if (handler)
        {
            if (handler->handler)
                handler->handler(request);
            else if (handler->static_file_handler)
                handler->static_file_handler(request, handler->content_type);
            else
                http_write_404(request);
        }
        else
        {
            http_write_404(request);
        }
    }
    else if (recv_res == 0)
    {
        request->status = -1;
        log_http_request(request);
    }
    else
    {
        request->status = -2;
        log_http_request(request);
    }
}

struct thr_data
{
    int tid;
};

void *thr_func(void *arg)
{
    thr_data *data = (struct thr_data *)arg;

    printf("thread %d\n", data->tid);

    pthread_exit(NULL);
}

int NOTUSED_main(int argc, char** argv, char** env)
{
    UNUSED(argc);
    UNUSED(argv);
    UNUSED(env);

    pthread_t thr[2];
    thr_data data[2];

    data[0].tid = 5;
    data[1].tid = 12;

    int r0 = pthread_create(&thr[0], NULL, thr_func, &data[0]);
    int r1 = pthread_create(&thr[1], NULL, thr_func, &data[1]);

    pthread_join(thr[0], NULL);
    pthread_join(thr[1], NULL);
    printf("threads all done!\n");
}

int main(int argc, char** argv, char** env)
{
    UNUSED(argc);
    UNUSED(argv);
    UNUSED(env);

    //printf("ARGV: %s ENV: %s\n", argv[0], env[0]);

   char cwd[PATH_MAX];
   if (getcwd(cwd, sizeof(cwd)) != NULL) {
       printf("Current working dir: %s\n", cwd);
   }

    init_request_char_convert_table();

    request_handler handlers[] = {
        MAP_GET("/",        handle_default),
        MAP_GET("/tools",   handle_tools),

        MAP_STATIC_FILE("/css/site.css",                    CSS),
        MAP_STATIC_FILE("/js/site.js",                      JS),
        MAP_STATIC_FILE("/favicon.ico",                     ICO),
        MAP_STATIC_FILE("/img/favicon-16x16.png",           PNG),
        MAP_STATIC_FILE("/img/favicon-32x32.png",           PNG),
        MAP_STATIC_FILE("/img/apple-touch-icon.png",        PNG),
        MAP_STATIC_FILE("/img/android-chrome-192x192.png",  PNG),
        MAP_STATIC_FILE("/img/android-chrome-512x512.png",  PNG),
    };

    socklen_t addrlen = { };
    struct sockaddr_in accept_address = { };
    s32 listen_socket, accept_socket;

    listen_socket = start_listening();

    if (listen_socket < 0)
    {
        exit(1);
    }

    while(1)
    {
        memset(&accept_address, 0, sizeof(accept_address));
        
        if ((accept_socket = accept(listen_socket, (struct sockaddr *) &accept_address, &addrlen)) < 0)
        {
            perror("server: accept");
            continue;
        }

        printf("The client is connected...\n");
        
        http_request request = { };
        request.socket = accept_socket;
        handle_request(handlers, ARRAY_SIZE(handlers), &request);
        log_http_request(&request);

        close(accept_socket);
    }

    close(listen_socket);
    return 0;
}


