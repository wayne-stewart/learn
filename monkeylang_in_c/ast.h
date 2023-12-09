
#ifndef _WS_AST_H_
#define _WS_AST_H_

#include "list.h"
#include "token.h"

typedef struct {
	PToken Token;
} AstIdentifier;

typedef struct {
	int Type;
	union {
		AstIdentifier Ident;
	} Expression;
} AstExpression;

typedef struct {
	AstIdentifier Identifier;
	AstExpression Expression;
} AstLetStatement;

typedef struct {
	int Type;
	union {
		AstLetStatement Let;
	} Statement;
} AstStatement, *PAstStatement;

typedef struct {
	PList Statements;
} AstProgram, *PAstProgram;

#endif


