
#ifndef _WS_LEXER_H_
#define _WS_LEXER_H_

#include "token.h"

typedef struct t_Lexer {
	char	*Text;
	size_t	Position;
	size_t	Length;
} Lexer, *PLexer;

void make_lexer(PLexer lexer, char *text); 

int next_token(PLexer lexer, PToken token);



#endif


