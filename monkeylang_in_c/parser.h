
#ifndef _WS_PARSER_H_
#define _WS_PARSER_H_

#include "token.h"
#include "lexer.h"
#include "ast.h"

typedef struct t_Parser {
	PLexer Lexer;
	PToken CurrentToken;
	PToken PeekToken;
} Parser, *PParser;

void parser_init(PParser parser, PLexer lexer);

void parser_next_token(PParser parser);

void parser_parse_program(PParser parser);

#endif

