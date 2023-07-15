
HINTERNET session_handle = 0;
HINTERNET connection_handle = 0;

struct Request
{
    WCHAR *Host;
    WCHAR *Path;
    WCHAR *Method;
    WCHAR *Headers;
    int    HeadersLength;
    char  *Body;
    int    BodyLength;
};

struct Response
{
    char *Data;
    int   DataLength;
};

int InitializeWinHttp()
{
    session_handle = WinHttpOpen(L"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.06",
                                 WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,
                                 WINHTTP_NO_PROXY_NAME,
                                 WINHTTP_NO_PROXY_BYPASS, 0);
    
    if (!session_handle) {
        printf("Failed to open a WinHttp Session\n");
        return 0;
    }
    
    return 1;
}

void CleanupWinHttp()
{
    if (session_handle) WinHttpCloseHandle(session_handle);
}

void SendRequest(Request *request)
{
    char buffer[4096];
    DWORD data_size = 0;
    BOOL send_result = 0;
    BOOL receive_result = 0;
    HINTERNET request_handle = 0;
    char * headers;
    if (request->Headers == 0) headers = 0;
    
    connection_handle = WinHttpConnect(session_handle,
                                       request->Host,
                                       INTERNET_DEFAULT_HTTPS_PORT, 0);
    
    if (connection_handle)
    {
        request_handle = WinHttpOpenRequest(connection_handle,
                                            request->Method, request->Path, 
                                            0, // version NULL means HTTP/1.1
                                            WINHTTP_NO_REFERER,
                                            WINHTTP_DEFAULT_ACCEPT_TYPES,
                                            WINHTTP_FLAG_SECURE);
        if (request_handle)
        {
            send_result = WinHttpSendRequest(request_handle,
                                             request->Headers, 
                                             request->HeadersLength,
                                             request->Body,
                                             request->BodyLength,
                                             request->BodyLength, // total length if greater than body length could potentially be used to send addtional data with WinHttpWriteData
                                             0); // context
            
            if (send_result)
            {
                receive_result = WinHttpReceiveResponse(request_handle, 0);
                
                if (receive_result)
                {
                    do
                    {
                        data_size = 0;
                        if (!WinHttpQueryDataAvailable(request_handle, &data_size))
                            printf("WinHttpQueryDataAvailable Error: %u\n", GetLastError());
                        else if (!WinHttpReadData(request_handle, &buffer, 4096, &data_size))
                            printf("WinHttpReadData Error: %u\n", GetLastError());
                        else
                            fwrite(buffer, 1, data_size, stdout);
                    }
                    while(data_size > 0);
                }
            }
        }
    }
    
    if (request_handle) WinHttpCloseHandle(request_handle);
    if (connection_handle) WinHttpCloseHandle(connection_handle);
}


