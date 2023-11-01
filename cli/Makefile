
build:
	gcc -o js -Wall -Wextra -Wpedantic $(wildcard *.c)

test: build
	./js "fs.ls();"

clean:
	rm -f *.o
	rm -f js

