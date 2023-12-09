
#include <stdio.h>
#include "parser.h"


void parser_init(PParser parser, PLexer lexer) {
	parser->Lexer = lexer;
	parser_next_token(parser);
	parser_next_token(parser);
}

void parser_next_token(PParser parser) {
	parser->CurrentToken = parser->PeekToken;
	parser->PeekToken = lexer_next_token(parser->Lexer);
}

void parse_statement_let(PParser parser, PAstStatement statement) {
	statement->Type = TOKEN_LET;
	statement->Statement.Let.Identifier.Token = parser->CurrentToken;
	printf("Parsed Let\n");
}

void parse_statement(PParser parser, PAstStatement statement) {
	switch(parser->CurrentToken->TokenType) {
		case TOKEN_LET:
			parse_statement_let(parser, statement); 
			break;
		default:
			printf("Parser error\n");
			token_print(parser->CurrentToken);
			exit(1);
			break;
	}
}

void parser_parse_program(PParser parser) {
	AstProgram program = {0};
	program.Statements = list_make(sizeof(AstStatement), 100);
	while (parser->CurrentToken->TokenType != TOKEN_EOF) {
		PAstStatement statement = list_push(program.Statements);
		parse_statement(parser, statement);
		parser_next_token(parser);
	}
}


