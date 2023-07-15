#ifndef __NEXUS_STRING_H__
#define __NEXUS_STRING_H__

#define STRING(x) { (x), strlen(x) }

struct string
{
    const char *value;
    u32 length;
};

void print_string(string *s) 
{
    for(u32 i = 0; i < s->length; i++)
    {
        putchar(*(s->value + i));
    }
}

#endif
