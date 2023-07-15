#ifndef __NEXUS_TABLES_H__
#define __NEXUS_TABLES_H__

b32  __REQUEST_CHAR_CONVERT_TABLE_INITIALIZED = 0;
char REQUEST_CHAR_CONVERT_TABLE[256];

void init_request_char_convert_table() {
    char *t = REQUEST_CHAR_CONVERT_TABLE;
    memset(t, 0, sizeof(REQUEST_CHAR_CONVERT_TABLE));

    for (char i = 'a'; i <= 'z'; i++) 
    {
        t[(u32)i] = i;
    }

    for (char i = 'A'; i <= 'Z'; i++) 
    {
        t[(u32)i] = i + ('a' - 'A');
    }

    for (char i = '0'; i <= '9'; i++)
    {
        t[(u32)i] = i;
    }

    t['/'] = '/';
    t['.'] = '.';
    t['?'] = '?';
    t['='] = '=';
    t[':'] = ':';

    __REQUEST_CHAR_CONVERT_TABLE_INITIALIZED = 1;
};

/*
    convert_request_chars
    lowers the ascii string in place
    if a char is encounted I don't want to support
    then 0 is returned.
    otherwise 1 is returned for success;
*/
b32 convert_request_chars(char* s, u32 count)
{
    if (__REQUEST_CHAR_CONVERT_TABLE_INITIALIZED == 0) {
        fprintf(stderr, "convert_request_chars - conversion table not initialized!");
        return 0;
    }
    
    while ((--count) > 0)
    {
        *s = REQUEST_CHAR_CONVERT_TABLE[(u32)(*s)];
        if (*s == 0) {
            return 0;
        }
        s++;
    }
    return 1;
}

#endif
