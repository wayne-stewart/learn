
#pragma comment(lib, "Winhttp.lib")

#define WIN32_LEAN_AND_MEAN

#include <windows.h>
#include <winhttp.h>
#include <stdio.h>
#include "http.cpp"
#include "jsmn.h"

DWORD global_bytes_transfered = 0;
void FileIOCompletionRoutine(DWORD error_code,
                             DWORD bytes_transfered,
                             LPOVERLAPPED lpol)
{
    printf("Error Code:       %x\n", error_code);
    printf("Bytes Transfered: %x\n", bytes_transfered);
    global_bytes_transfered = bytes_transfered;
}

struct TokenCursor
{
    jsmntok_t *Tokens;
    int Count;
    int Index;
}

jsmntok_t *NextToken(JsmnTokenCursor *cursor)
{
    int index = cursor->Index + 1;
    if (index >= cursor.Count)
    {
        return 0;
    }
    cursor.Index = index;
    return cursor->Tokens + index;
}

struct Arena
{
    void *Memory;
    int   Size;
    void *Index;
};

void *Allocate(Arena *arena, int size)
{
    int size = arena->index + size;
    if (arena->Size >= size)
    {
        printf("Could not allocate node from arena\n");
        return 0;
    }
    void *ptr = arena->Memory + arena->Index;
    arena->index += size;
    return ptr;
}

int Equals(char *a, int a_len, char *b, int b_len)
{
    if (a_len != b_len) return 0;
    for(int i = 0; i < a_len; i++)
    {
        if (*(a++) != *(b++)) return 0;
    }
    return 1;
}

struct String
{
    char *Value;
    int   Length;
}

void PrintTokenString(char *json, jsmntok_t *t)
{
    fwrite(json + t->start, 1, t->end - t->start, stdout);
}

void PrintIndent(int depth)
{
    for(int i = 0; i < depth; i++) printf("  ");
}

void PrintTokens(char *json, jsmntok_t *tokens, int tokens_length)
{
    jsmntok_t prev_token;
    jsmntok_t token;
    jsmntok_t next_token;
    int depth = 0;
    int token_index = 1;
    while(token_index < tokens_length)
    {
        prev_token = tokens[token_index - 1];
        token = tokens[token_index++];
        next_token = tokens[token_index];
        if (token.type == JSMN_STRING)
        {
            PrintIndent(depth);
            PrintTokenString(json, &token);
            if (next_token.type == JSMN_STRING && next_token.size == 0)
            {
                printf(" : ");
                PrintTokenString(json, &next_token);
                printf("\n");
                token_index++;
            }
            else
            {
                printf("\n");
            }
        }
        else if (token.type == JSMN_OBJECT)
        {
            if (prev_token.size > 0)
                depth++;
        }
        else if (token.type == JSMN_ARRAY)
        {
            
        }
        if (token.size == 0) depth--;
    }
}

int main(int argc, char **args)
{
    /*if(!InitializeWinHttp())
    {
        return 1;
    }
    
    Request request = {};
    request.Host = L"testing.mvpplant.com";
    request.Path = L"/v2/Login";
    request.Method = L"GET";
    request.Headers = 0;
    request.HeadersLength = 0;
    request.Body = 0;
    request.BodyLength = 0;
    
    
    SendRequest(&request);
    
    
    
    CleanupWinHttp();
*/
    
    HANDLE file_handle = CreateFile("c:\\Users\\wayne\\Desktop\\testdata\\json.txt",
                                    GENERIC_READ,
                                    FILE_SHARE_READ,
                                    NULL, // DEFAULT SECURITY
                                    OPEN_EXISTING,
                                    FILE_ATTRIBUTE_NORMAL | FILE_FLAG_OVERLAPPED,
                                    NULL); // NO ATTR TEMPLATE
    
    char file_buffer[32768];
    OVERLAPPED ol = { };
    DWORD bytes_read = 0;
    ReadFileEx(file_handle, file_buffer, 32768, &ol, FileIOCompletionRoutine);
    SleepEx(5000, 1);
    bytes_read += global_bytes_transfered;
    file_buffer[bytes_read] = 0;
    
    
    printf("file result\n");
    fwrite(file_buffer,1, bytes_read, stdout);
    printf("\n");
    
    jsmn_parser parser;
    jsmntok_t tokens[4096];
    jsmn_init(&parser);
    int token_count = jsmn_parse(&parser, file_buffer, bytes_read, tokens, 4096);
    tokens[token_count].type = JSMN_UNDEFINED;
    int itoken = 0;
    jsmntok_t lt;
    while(itoken < 15)
    {
        lt = tokens[itoken++];
        printf("Token Type: %d Start: %d End: %d, Size: %d\n", lt.type, lt.start, lt.end, lt.size);
    }
    
    PrintTokens(file_buffer, tokens, token_count);
    
    Arena Arena = {};
    Arena.Size = 20 * 1024 * 1024;
    Arena.Memory = malloc(Arena.Size);
    Arena.Index = 0;
    
    JsmnNode *tree = BuildJsmnTree(&Arena, tokens, token_count);
    
    printf("\nDone\n");
}

