#! /bin/bash

gcc -Wall -Wextra -Wpedantic -o js js.c lexer.c token.c && ./js "let x = 5;"


