
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#include <windows.h>
#include <winsock2.h>
#include <mstcpip.h>
#include <ws2tcpip.h>
#include <stdio.h>

#pragma comment(lib, "Ws2_32.lib")
#pragma comment(lib, "fwpuclnt.lib")

void main(char **args, int argc)
{
    printf("Initializing WINSOCK\n");
    
    WSADATA wsa_data;
    
    if (WSAStartup(MAKEWORD(1,1), &wsa_data) != 0)
    {
        printf("WSAStartup failed.\n");
        return;
    }
    
    struct addrinfo *addr_info = 0, hints = {};
    
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_protocol = IPPROTO_TCP;
    
    int iresult = getaddrinfo("google.com", "https", &hints, &addr_info);
    if (iresult != 0) {
        printf("getaddrinfo failed: %d\n", iresult);
        goto cleanup;
    }
    
    SOCKET connect_socket = INVALID_SOCKET;
    
    connect_socket = WSASocket(addr_info->ai_family, addr_info->ai_socktype, addr_info->ai_protocol, 0, 0, 0);
    if (connect_socket == INVALID_SOCKET)
    {
        printf("Error creating socket: %ld\n", WSAGetLastError());
        return;
    }
    
    const SOCKET_SECURITY_SETTINGS security_settings = {};
    const int settings_len = 0;
    
    iresult = WSASetSocketSecurity(connect_socket, 0, 0, 0, 0);
    if (iresult == SOCKET_ERROR)
    {
        printf("WSASetSocketSecurity returned error: %d\n", WSAGetLastError());
        goto cleanup;
    }
    
    iresult = WSAConnect(connect_socket, addr_info->ai_addr, (int)addr_info->ai_addrlen, 0, 0, 0, 0);
    if (iresult == SOCKET_ERROR)
    {
        printf("WSAConnect returned error: %d\n", WSAGetLastError());
        goto cleanup;
    }
    printf("Secure connection Established!\n");
    
    CHAR *http_request = "GET / HTTP/1.1\nHost: www.google.com\nConnection: close\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.06\n\n";
    
    WSABUF wsa_buf = {};
    wsa_buf.len = strlen(http_request);
    wsa_buf.buf = http_request;
    DWORD bytes_sent = 0;
    iresult = WSASend(connect_socket, &wsa_buf, 1, &bytes_sent, 0, 0, 0);
    if (iresult == SOCKET_ERROR)
    {
        printf("WSASend failed: %d\n", WSAGetLastError());
        goto cleanup;
    }
    printf("bytes sent: %d\n", iresult);
    
    char buffer[4096];
    DWORD bytes_read = 0;
    DWORD bytes_received = 0;
    wsa_buf.len = 4096;
    wsa_buf.buf = buffer;
    do {
        iresult = WSARecv(connect_socket, &wsa_buf, 1, &bytes_received, 0, 0, 0);
        if (iresult == SOCKET_ERROR)
        {
            printf("WSARecv returned error: %d\n", WSAGetLastError());
            break;
        }
        bytes_read += bytes_received;
        fwrite(buffer,1,iresult,stdout);
    } while(iresult > 0);
    
    printf("\n\n");
    printf("%d bytes received!\n", bytes_read);
    printf("\n\n");
    
    cleanup:
    if (connect_socket != INVALID_SOCKET) {
        closesocket(connect_socket);
    }
    if (addr_info != 0) {
        freeaddrinfo(addr_info);
    }
    WSACleanup();
    printf("Complete\n");
}