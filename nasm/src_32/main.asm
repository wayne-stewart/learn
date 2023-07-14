
%include 'functions.asm'
%include 'lib/file.asm'

SECTION .data
msg_prompt db 'Please enter your name: ', 0h
msg_welcome db 'Hello, ', 0h
msg_filed db 'File Descriptor: ', 0h
num_string db '42', 0h
log_file db 'log.txt', 0h

SECTION .bss
buffer resb 1024

SECTION .text
global _start

_start:
	; open a file
	mov eax, log_file
	call file_open
	
	; call itoa on file descriptor
	mov ebx, buffer
	call itoa

	; print start of message
	mov eax, msg_filed
	call print

	; print file descriptor
	mov eax, buffer
	call println

_start_done:
	mov eax, 0
	call quit
