
#ifndef _WS_LEXER_H_
#define _WS_LEXER_H_

#include "token.h"

typedef struct t_Lexer {
	char	*Text;
	int		Position;
	int		Length;
} Lexer, *PLexer;

void lexer_init(PLexer lexer, char *text); 

int lexer_next_token(PLexer lexer, PToken token);



#endif


