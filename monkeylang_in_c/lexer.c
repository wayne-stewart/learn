
#include <stdlib.h>
#include <string.h>
#include "lexer.h"

void lexer_init(PLexer lexer, char *text) {
	lexer->Text = text;
	lexer->Position = 0;
	lexer->Length = strlen(text);
}

char peek_char(PLexer lexer) {
	if (lexer->Position >= lexer->Length) {
		return 0;
	}
	char return_value = lexer->Text[lexer->Position];
	return return_value;
}

char next_char(PLexer lexer) {
	char return_value = peek_char(lexer);
	lexer->Position++;
	return return_value;
}

int is_literal_start(char ch) {
	if ((ch >= 'a' && ch <= 'z') ||
		(ch >= 'A' && ch <= 'Z'))
		return 1;
	return 0;
}

int is_literal_char(char ch) {
	if (is_literal_start(ch) ||
		(ch >= '0' && ch <= '9') ||
		ch == '_')
		return 1;
	return 0;
}

void eat_literal(PLexer lexer) {
	char ch = peek_char(lexer);
	while(is_literal_char(ch)) {
		next_char(lexer);
		ch = peek_char(lexer);
	}
}

int is_digit(char ch) {
	if (ch >= '0' && ch <= '9')
		return 1;
	return 0;
}

void eat_number(PLexer lexer) {
	int periods_found = 0;
	char ch = peek_char(lexer);
	while(is_digit(ch) || (ch == '.' && periods_found < 2)) {
		next_char(lexer);
		ch = peek_char(lexer);
		if (ch == '.') periods_found++;
	}
}

int eat_string(PLexer lexer, char string_char) {
	char ch = peek_char(lexer);
	while(ch != string_char && ch != 0) {
		next_char(lexer);
		ch = peek_char(lexer);
	}
	if (ch == string_char) {
		next_char(lexer);
		return 1;
	}
	else {
		return 0;
	}
}

int is_whitespace(char ch) {
	if (ch == ' ' ||
		ch == '\t' ||
		ch == '\r' ||
		ch == '\n')
		return 1;
	return 0;
}

void eat_whitespace(PLexer lexer) {
	char ch = peek_char(lexer);
	while(is_whitespace(ch)) {
		next_char(lexer);
		ch = peek_char(lexer);
	}
}

int lookup_identifier(const char *identifier, int length) {
	if (length == 2 && strncmp(identifier, "fn", length) == 0)
		return TOKEN_FUNCTION;
	if (length == 3 && strncmp(identifier, "let", length) == 0)
		return TOKEN_LET;
	if (length == 4 && strncmp(identifier, "true", length) == 0)
		return TOKEN_TRUE;
	if (length == 5 && strncmp(identifier, "false", length) == 0)
		return TOKEN_FALSE;
	if (length == 2 && strncmp(identifier, "if", length) == 0)
		return TOKEN_IF;
	if (length == 4 && strncmp(identifier, "else", length) == 0)
		return TOKEN_ELSE;
	if (length == 6 && strncmp(identifier, "return", length) == 0)
		return TOKEN_RETURN;

	return TOKEN_IDENTIFIER;
}

PToken make_token(
	PLexer lexer, 
	size_t pos,
	int length,
	int token_type) {
	PToken token = malloc(sizeof(Token));
	token->Text = lexer->Text + pos;
	token->TextLength = length;
	token->TokenType = token_type;
	return token;
}

PToken lexer_next_token(PLexer lexer) {
	eat_whitespace(lexer);
	char c1, c2;
	size_t start_pos = lexer->Position;
	c1 = next_char(lexer);
	c2 = peek_char(lexer);
	PToken token;

	if (is_literal_start(c1)) {
		eat_literal(lexer);
		int length = lexer->Position - start_pos;
		token = make_token(lexer, start_pos, length, TOKEN_IDENTIFIER);
		token->TokenType = lookup_identifier(token->Text, length);
	}
	else if (is_digit(c1)) {
		eat_number(lexer);
		int length = lexer->Position - start_pos;
		token = make_token(lexer, start_pos, length, TOKEN_NUMBER);
	}
	else if (c1 == '=' && c2 == '=') {
		token = make_token(lexer, start_pos, 2, TOKEN_EQUALS);
		next_char(lexer);
	}
	else if (c1 == '!' && c2 == '=') {
		token = make_token(lexer, start_pos, 2, TOKEN_NOT_EQUALS);
		next_char(lexer);
	}
	else if (c1 == '\'' || c1 == '"' || c1 == '`') {
		if (eat_string(lexer, c1)) {
			int length = lexer->Position - start_pos;
			token = make_token(lexer, start_pos, length, TOKEN_STRING);
		}
		else {
			// EOF reached before end of string
			token = make_token(lexer, start_pos, 1, TOKEN_INVALID);
			return 0;
		}
	}
	else if (c1 == '.')
		token = make_token(lexer, start_pos, 1, TOKEN_PERIOD);
	else if (c1 == '(')
		token = make_token(lexer, start_pos, 1, TOKEN_LPAREN);
	else if (c1 == ')')
		token = make_token(lexer, start_pos, 1, TOKEN_RPAREN);
	else if (c1 == '{')
		token = make_token(lexer, start_pos, 1, TOKEN_LBRACE);
	else if (c1 == '}')
		token = make_token(lexer, start_pos, 1, TOKEN_RBRACE);
	else if (c1 == '[')
		token = make_token(lexer, start_pos, 1, TOKEN_LBRACKET);
	else if (c1 == ']')
		token = make_token(lexer, start_pos, 1, TOKEN_RBRACKET);
	else if (c1 == ';')
		token = make_token(lexer, start_pos, 1, TOKEN_SEMICOLON);
	else if (c1 == ',')
		token = make_token(lexer, start_pos, 1, TOKEN_COMMA);
	else if (c1 == '+')
		token = make_token(lexer, start_pos, 1, TOKEN_PLUS);
	else if (c1 == '-')
		token = make_token(lexer, start_pos, 1, TOKEN_MINUS);
	else if (c1 == '*')
		token = make_token(lexer, start_pos, 1, TOKEN_STAR);
	else if (c1 == '/')
		token = make_token(lexer, start_pos, 1, TOKEN_SLASH);
	else if (c1 == '=')
		token = make_token(lexer, start_pos, 1, TOKEN_ASSIGN);
	else if (c1 == '!')
		token = make_token(lexer, start_pos, 1, TOKEN_BANG);
	else if (c1 == '<')
		token = make_token(lexer, start_pos, 1, TOKEN_LT);
	else if (c1 == '>')
		token = make_token(lexer, start_pos, 1, TOKEN_GT);
	else if (c1 == 0) {
		token = make_token(lexer,  0, 0, TOKEN_EOF);
		return 0;
	}
	else {
		token = make_token(lexer, start_pos, 1, TOKEN_INVALID);
		return 0;
	}
	return token;
}





