
#include <stdio.h>

#include "list.h"
#include "token.h"
#include "lexer.h"
#include "parser.h"

#define RETURNIF(check) if (check) {\
	printf("USAGE: js \"<command string here>\"\n");\
	return 1;\
}\

int main(int argc, char **argv) {

	RETURNIF(argc != 2);

	Lexer lexer;
	lexer_init(&lexer, argv[1]);

	RETURNIF(lexer.Length < 2);

	List tokens;
	list_init(&tokens, sizeof(Token), 5);

	while(lexer_next_token(&lexer, (PToken)list_push(&tokens)));

	for (size_t i = 0; i < tokens.Length; i++) {
		token_print(list_get(&tokens, i));
	}

	printf("complete\n");
	return 0;
}


