;--------------------------------------
; int strlen(string message)
; calculate the length of a 0 terminated string
strlen:
	push ebx
	mov ebx, eax
_strlen_nextchar:
	cmp byte[eax], 0
	jz _strlen_finished
	inc eax
	jmp _strlen_nextchar
_strlen_finished:
	sub eax, ebx
	pop ebx
	ret

;--------------------------------------
; void print(string message)
; print the 0 terminated messsage to stdout
print:
	push edx
	push ecx
	push ebx
	push eax       ; eax will have the pointer to the message

	call strlen    ; eax will be replaced with the length of the messge
	mov edx, eax   ; put the length of the message in edx
	pop eax        ; put the pointer of the message back in eax

	; make the kernel syscall to print a string
	mov ecx, eax   ; pointer to message
	mov ebx, 1     ; STDOUT
	mov eax, 4     ; print syscall
	int 80h        ; invoke

	pop ebx
	pop ecx
	pop edx
	ret

;--------------------------------------
; void println(string message)
; print the 0 terminated message to stdout followed by a linefeed
println:
;--------------------------------------
	call print     ; first print the message passed in

	push eax       ; preserve eax on the stack
	mov eax, 0Ah   ; fill eax with a line feed char
	push eax       ; push eax on the stack so we can get it's address there from esp
	mov eax, esp   ; fill eax with the address of the line feed we added to the stack
	call print     ; print the line feed char
	pop eax        ; remove our line feed char
	pop eax        ; restore eax to what it was
	ret

;--------------------------------------
; void itoa(int number(eax), byte[] buffer(ebx))
; put ascii representation of number into buffer with a 0 termination
itoa:
	push eax
	push ebx
	push ecx
	push edx
	push esi

	mov ecx, 0          ; initialize counter so we know how many digits there are

_itoa_decode_loop:
	inc ecx             ; increment ecx - digit counter
	mov edx, 0          ; empty edx
	mov esi, 10         ; we'll be dividing by 10 to convert number to decimal -> ascii
	idiv esi            ; dived eax by esi. eax holds result, edx holds remainder
	add edx, 48         ; convert number in edx to ascii
	push edx            ; push the value in edx on the stack
	cmp eax, 0          ; eax will be 0 when there are no more digits to find
	jnz _itoa_decode_loop

_itoa_fill_loop:
	pop eax             ; pop digit off stack into eax
	mov byte[ebx], al   ; move ascii value in eax to buffer pointed at by ebx
	inc ebx             ; increment buffer to next spot
	dec ecx             ; decrement ecx, we will stop at 0
	cmp ecx, 0
	jnz _itoa_fill_loop

	mov byte[ebx], 0h   ; add the 0 terminator on the string

	pop esi
	pop edx
	pop ecx
	pop ebx
	pop eax
	ret

;--------------------------------------
; int atoi(string num_string(eax))
; convert a number string pointed to by eax into an integer. result will be stored in eax
atoi:
	push ebx
	push ecx
	push edx
	push esi
	
	mov esi, eax
	mov eax, 0

	pop esi
	pop edx
	pop ecx
	pop ebx
	ret


;--------------------------------------
; void quit(exit_code)
; exit the program with the specified exit code
quit:
	mov ebx, eax
	mov eax, 1
	int 80h
	ret

