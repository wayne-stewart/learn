
#ifndef _ALLOCATOR_H_
#define	_ALLCOATOR_H_

typedef struct {
	void * PageTable;	// store all the page indexes in a realloced array
	int PageCount;		// the number of allocated pages
	int PageOffset;		// the offset of the next allocation in the last page
} Allocator, *PAllocator;

void allocator_init(PAllocator allocator);
void * allocator_alloc(PAllocator allocator, size_t size);


#endif

