
#include <stdio.h>
#include "token.h"

void print_token(PToken ptoken) {
	printf("TOKEN: %-10s %.*s\n", 
		TOKEN_NAMES[ptoken->TokenType], 
		ptoken->TextLength, 
		ptoken->Text);
}

