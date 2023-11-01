
#ifndef _WS_PARSER_H_
#define _WS_PARSER_H_

typedef struct t_Parser {
	PLexer Lexer;
	PToken CurrentToken;
	PToken PeekToken;
} Parser, *PParser;


#endif

