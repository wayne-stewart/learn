
#include <stdlib.h>
#include <string.h>
#include "allocator.h"

#define PAGE_SIZE = 16384;

void allocator_init(PAllocator allocator) {
	
}

void * allocator_alloc(PAllocator allocator, int size) {
	int remaining = allocator->PageSize - allocator->PageOffset;
	if (remaining < size) {
		allocator->Capacity += capacity;
		int newsize = allocator->Capacity * sizeof(void*);
		allocator->Table = realloc(allocator->Table, newsize);
		if (allocator->Table == 0) {
			printf("Could not allocate page table\n");
			exit(1);
		}

}
