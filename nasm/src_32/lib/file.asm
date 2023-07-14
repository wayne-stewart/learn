
;--------------------------------------
; int file_open(string file_name (eax))
; opens or creates a file with rw access
;--------------------------------------
file_open:
	push edx
	push ecx
	push ebx
	
	mov edx, eax        ; put file name edx

	mov ecx, 2          ; 0_RDONLY = 0, O_WRONLY = 1, O_RDRW = 2
	mov ebx, eax        ; set ebx with pointer to file name
	mov eax, 5          ; SYS_OPEN (kernel opcode 5)
	int 80h             ; invoke kernel call, eax holds file descriptor

	mov ebx, eax
	and ebx, 080000000h ; bit mask for invalid file descriptor
	shr ebx, 31         ; shift 31st bit to 0th bit

	cmp ebx, 0          ; if ebx = 0, we have a valid file descriptor, return
	jz .return	
                            ; create file since it doesn't exist
	mov ecx, 0666o      ; rw-rw-rw- file access
	mov ebx, edx        ; edx holds a pointer to the file name string
	mov eax, 8          ; SYS_CREAT (kernel opcode 8)
	int 80h             ; invoke kernel call, file descriptor is in eax

.return:
	pop ebx
	pop ecx
	pop edx
	ret

;--------------------------------------
; void file_close(int file_descriptor (eax))
; close the file pointed to by the file descriptor passed in eax
;--------------------------------------
file_close:
	push ebx
	push eax
	mov ebx, eax  ; eax holds a file descriptor
	mov eax, 6    ; SYS_CLOSE (kernel opcode 6)
	int 80h       ; invoke kernel call
	pop eax
	pop ebx
	ret

;--------------------------------------
; void file_seek_end(int file_descriptor (eax))
; seek to the end of the file
;--------------------------------------
file_seek_end:
	push edx
	push ecx
	push ebx
	push eax

	mov edx, 2    ; SEEK_END = 2
	mov ecx, 0    ; move file cursor 0 bytes
	mov ebx, eax  ; eax holds the file descriptor
	mov eax, 19   ; SYS_LSEEK (kernel opcode 19)
	int 80h       ; invoke kernel call

	pop eax
	pop ebx
	pop ecx
	pop edx
	ret

;--------------------------------------
; CDECL void file_write(int file_descriptor , byte *buffer, int bytes_to_write)
; write the string msg to the file, msg should be 0 terminated
;--------------------------------------
file_write:
	push ebp      ; store base pointer on stack
	mov ebp, esp  ; store stack pointer
	push ebx
	push ecx
	push edx

	mov edx, [ebp + 8]    ; bytes_to_write
	mov ecx, [ebp + 12]   ; buffer
	mov ebx, [ebp + 16]   ; file_descriptor
	mov eax, 4            ; SYS_WRITE (kernel opcode 4)
	int 80h               ; syscall

	pop edx
	pop ecx
	pop ebx
	pop ebp
	ret

;--------------------------------------
; void file_read(int file_descriptor (eax), byte[] buffer (ebx), int bytes_to_read (ecx))
; reads from the file into the buffer. reads up to bytes_to_read number of bytes
; returns the number of bytes read
;--------------------------------------
file_read:

	ret

















