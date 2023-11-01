
#include <stdio.h>

#include "list.h"
#include "token.h"
#include "lexer.h"

#define RETURNIF(check) if (check) {\
	printf("USAGE: js \"<command string here>\"\n");\
	return 1;\
}\

int main(int argc, char **argv) {

	RETURNIF(argc != 2);

	Lexer lexer;
	make_lexer(&lexer, argv[1]);

	RETURNIF(lexer.Length < 2);

	List tokens;
	make_list(&tokens, sizeof(Token), 5);

	while(next_token(&lexer, (PToken)list_push(&tokens)));

	for (size_t i = 0; i < tokens.Length; i++) {
		print_token(list_get(&tokens, i));
	}

	printf("complete\n");
	return 0;
}

