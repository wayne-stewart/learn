
#ifndef _WS_LIST_H_
#define _WS_LIST_H_

#include <stdlib.h>
#include <string.h>
#include <stdint.h>

typedef struct t_List {
	void *Data;
	size_t Length;
	size_t Capacity;
	size_t ItemSize;
} List, *PList;

void make_list(PList list, size_t item_size, size_t capacity);
void * list_get(PList list, size_t index);
void * list_push(PList list);
void * list_pop(PList list);


#endif

