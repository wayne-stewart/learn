
#include "parser.h"


void make_parser(PParser parser, PLexer lexer) {
	parser->Lexer = lexer;
	parser_next_token(parser);
	parser_next_token(parser);
}

void parser_next_token(PParser parser) {
	parser->CurrentToken = parser->PeekToken;
	lexer_next_token(parser->Lexer, parser->PeekToken);
}

void parser_parse_program(PParser parser, PAstProgram program) {
	
}
