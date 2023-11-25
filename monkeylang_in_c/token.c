
#include <stdio.h>
#include "token.h"

static const char *TOKEN_NAMES[] = {
	FOREACH_TOKEN(GENERATE_STRING)
};

void print_token(PToken ptoken) {
	printf("TOKEN: %-10s %.*s\n", 
		TOKEN_NAMES[ptoken->TokenType], 
		ptoken->TextLength, 
		ptoken->Text);
}

