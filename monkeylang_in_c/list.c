
#include "list.h"

void make_list(PList list, size_t item_size, size_t capacity) {
	list->Length = 0;
	list->Capacity = capacity;
	list->ItemSize = item_size;
	list->Data = malloc(capacity * item_size);
}

void * list_get(PList list, size_t index) {
	if (index >= list->Length) return 0;
	return ((uint8_t*)list->Data) + (list->ItemSize * index);
}

void * list_push(PList list) {
	list->Length++;
	if (list->Length > list->Capacity) {
		size_t capacity = list->Capacity * 2;
		size_t data_size = list->ItemSize * capacity;
		void *data = realloc(list->Data, data_size);
		if (data == 0) {
			return 0;
		}
		else {
			list->Capacity = capacity;
			list->Data = data;
		}
	}
	size_t index = list->Length - 1;
	size_t offset = index * list->ItemSize;
	return memset(((uint8_t*)list->Data) + offset, 0, list->ItemSize);
}

void * list_pop(PList list) {
	if (list->Length > 0) {
		list->Length--;
		return ((uint8_t*)list->Data) + (list->Length * list->ItemSize);
	}
	return 0;
}


