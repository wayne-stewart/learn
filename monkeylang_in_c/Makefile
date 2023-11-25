
build: clean
	mkdir -p build
	gcc -o build/js -Wall -Wextra -Wpedantic $(wildcard *.c)

test: build
	build/js "fs.ls();"

clean:
	rm -rf build


