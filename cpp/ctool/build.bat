
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars64.bat"

if not exist build (
	mkdir build
)
pushd build
del *
cl.exe ../src/main.cpp /Fetool.exe

tool.exe

