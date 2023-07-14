use std::io;
use std::path::Path;
use std::fs::{File};
use std::io::{Read,Write,StdoutLock,Error};
use windows_sys::Win32::System::Console::{
    GetStdHandle,
    GetConsoleMode,
    SetConsoleMode,
    ReadConsoleInputW,
    GetConsoleScreenBufferInfoEx,
    STD_INPUT_HANDLE,
    STD_OUTPUT_HANDLE,
    CONSOLE_MODE,
    INPUT_RECORD,
    CONSOLE_SCREEN_BUFFER_INFOEX,
    ENABLE_WINDOW_INPUT,
    ENABLE_MOUSE_INPUT,
    ENABLE_EXTENDED_FLAGS,
    ENABLE_QUICK_EDIT_MODE,
    ENABLE_VIRTUAL_TERMINAL_INPUT,
    KEY_EVENT,
    MOUSE_EVENT,
    DOUBLE_CLICK,
    MOUSE_HWHEELED,
    MOUSE_MOVED,
    MOUSE_WHEELED,
    MENU_EVENT,
    WINDOW_BUFFER_SIZE_EVENT,
    FOCUS_EVENT,
};
use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
    VK_ESCAPE, VK_RETURN, VK_BACK,
    VK_LEFT, VK_RIGHT, VK_UP, VK_DOWN,
    VK_END, VK_HOME};

const USE_ALTERNATE_BUFFER: &str = "\x1b[?1049h";
const USE_MAIN_BUFFER: &str = "\x1b[?1049l";
const MOVE_CURSOR_TO_UPPER_LEFT: &str = "\x1b[0;0H";

struct Position {
    x: usize,
    y: usize,
}

impl Position {
    pub fn new (x: usize, y: usize) -> Self {
        Self {
            x,
            y,
        }
    }
}

struct LineInfo {
    // data represents the striing characters of a single 
    // line in a document
    data: Vec<char>,

    // the following fields represent the current screen
    // representation of the line
    screen_line_count: usize,
    screen_y_offset: usize,
    screen_width: usize,
}

impl LineInfo {
    pub fn new() -> Self {
        Self {
            data: Vec::<char>::with_capacity(128),
            screen_line_count: 0,
            screen_y_offset: 0,
            screen_width: 0,
        }
    }
    pub fn from_line_data(data: Vec<char>) -> LineInfo {
        let mut line_info = LineInfo::new();
        line_info.data.extend_from_slice(data.as_slice());
        line_info
    }
    pub fn len(&self) -> usize {
        self.data.len()
    }
    pub fn wrapped_line_index_from_cursor(&self, x: usize) -> (usize, usize) {
        (x / self.screen_width, x % self.screen_width)
    }
}

struct ScreenInfo {
    width: usize,
    height: usize,
}

struct DocumentInfo {
    _lines: Vec<LineInfo>,
    cursor: Position,
    screen_cursor_x_desired: usize,
    screen_line_count: usize,
    line_number_margin_width: usize,
    line_number_width: usize,
}

impl DocumentInfo {
    pub fn new() -> Self {
        let mut lines: Vec<LineInfo> = Vec::with_capacity(1024);
        lines.push(LineInfo::new());

        Self {
            _lines: lines,
            cursor: Position::new(0,0),
            screen_cursor_x_desired: 0,
            screen_line_count: 0,
            line_number_margin_width: 2,
            line_number_width: 1,
        }
    }

    pub fn calculate_metrics(&mut self, screen_info: &ScreenInfo) {
        let mut line_len = self._lines.len();
        let mut width = 0;
        loop {
            line_len /= 10;
            width += 1;
            if line_len == 0 {
                break;
            }
        }
        self.line_number_width = width;
        self.line_number_margin_width = self.line_number_width + 1;
        let screen_width = screen_info.width - self.line_number_margin_width;
        let mut screen_y_offset = 0;
        for i in 0..self._lines.len() {
            let line_info = &mut self._lines[i];
            let line_width = line_info.data.len();
            let mut screen_line_count = line_width / screen_width;
            if line_width == 0 || line_width % screen_width > 0 {
                screen_line_count += 1;
            }
            line_info.screen_line_count = screen_line_count;
            line_info.screen_y_offset = screen_y_offset;
            line_info.screen_width = screen_width;
            screen_y_offset += line_info.screen_line_count;
        }
        self.screen_line_count = screen_y_offset;
    }

    pub fn char_count(&self) -> usize { 
        let mut x = 0;
        for line in &self._lines {
            x += line.len();
        }
        x
    }

    pub fn line_count(&self) -> usize {
        self._lines.len()
    }

    pub fn line_at_screen_index(&self, index: usize) -> Option<&[char]> {
        let mut iter_index = 0;
        for line in self._lines.iter() {
            let next_index = iter_index + line.screen_line_count;
            if index >= iter_index && index < next_index {
                let wrap_index = index - iter_index;
                let char_index = wrap_index * line.screen_width;
                let wrapped_line_length = std::cmp::min(line.len() - char_index, line.screen_width);
                let end_index = char_index + wrapped_line_length;
                return Some(&line.data[char_index..end_index]);
            } else {
                iter_index = next_index;
            }
        }
        None
    }

    pub fn insert_line(&mut self, index: usize, line: Vec<char>) {
        let line_info = LineInfo::from_line_data(line);
        self._lines.insert(index, line_info);
    }

    pub fn remove_line(&mut self, index: usize) -> Vec<char> {
        let line_info = self._lines.remove(index);
        line_info.data
    }

    pub fn enumerate_lines(&self) -> std::iter::Enumerate<std::slice::Iter<'_, LineInfo>> {
        self._lines.iter().enumerate()
    }

    pub fn move_cursor_to_end_of_line(&mut self) {
        self.cursor.x = self._lines[self.cursor.y].len();
    }

    pub fn key_left(&mut self) {
        if self.cursor.x == 0 {
            if self.cursor.y == 0 {
                // do nothing, there's no where to go
            } else {
                self.cursor.y -= 1;
                let doc_line = &self._lines[self.cursor.y];
                self.cursor.x = doc_line.len();
            }
        } else {
            self.cursor.x -= 1; 
        }
    }

    pub fn key_right(&mut self) {
        let doc_line = &self._lines[self.cursor.y];
        if self.cursor.x == doc_line.len() {
            if self.cursor.y == self._lines.len() - 1 {
                // do nothing, there's no where to go
            } else {
                self.cursor.y += 1;
                self.cursor.x = 0;
            }
        } else {
            self.cursor.x += 1; 
        }
    }

    pub fn key_up(&mut self) {

        // get the line at the current cursor position
        let doc_line = &self._lines[self.cursor.y];

        // record the current x position of the cursor if
        // not yet set so we can pop back to it depending
        // on line length
        if self.screen_cursor_x_desired == 0 {
            self.screen_cursor_x_desired = self.screen_cursor().x;
        }

        // the next line up is the first part of this wrapped
        // line, so to go up, subtract the screen width
        if self.cursor.x > doc_line.screen_width {
            self.cursor.x -= doc_line.screen_width;
        } else {
            // make sure the cursor isn't already at the first line
            // then set the cursor to the previous line
            if self.cursor.y > 0 {
                self.cursor.y -= 1;
                let doc_line = &self._lines[self.cursor.y];
    
                // move the cursor forward in the line so that it rests
                // at the same screen x position on the final wrapped line
                // if this position goes past the line data, set the 
                // cursor to the end of the line
                self.cursor.x += (doc_line.screen_line_count - 1) * doc_line.screen_width;
                if doc_line.len() < self.cursor.x {
                    self.cursor.x = doc_line.len();
                }
            }
        }

        // put the cursor as close to the desired x as possible
        let screen_cursor = self.screen_cursor();
        let screen_x_diff = if screen_cursor.x < self.screen_cursor_x_desired {
            self.screen_cursor_x_desired - screen_cursor.x
        } else {
            0
        };
        if screen_x_diff > 0  {
            let doc_line = &self._lines[self.cursor.y];
            let desired_x = self.cursor.x + screen_x_diff;
            if desired_x > doc_line.len() {
                self.cursor.x = doc_line.len();
            } else {
                self.cursor.x = desired_x;
            }
        }
    }

    pub fn key_down(&mut self) {
        let doc_line = &self._lines[self.cursor.y];

        // record the current x position of the cursor if
        // not yet set so we can pop back to it depending
        // on line length
        if self.screen_cursor_x_desired == 0 {
            self.screen_cursor_x_desired = self.screen_cursor().x;
        }

        // check if the next line down is a wrapped part
        // of the current line
        let (wrapped_line_index, _) = doc_line.wrapped_line_index_from_cursor(self.cursor.x);
        let max_line_index = doc_line.screen_line_count - 1;
        if wrapped_line_index < max_line_index {
            self.cursor.x += doc_line.screen_width;
        } else {
            if self.cursor.y < self._lines.len() - 1 {
                self.cursor.y += 1;
            }
        }

        // put the cursor as close to the desired x as possible
        let screen_cursor = self.screen_cursor();
        let screen_x_diff = if screen_cursor.x < self.screen_cursor_x_desired {
            self.screen_cursor_x_desired - screen_cursor.x
        } else {
            0
        };
        if screen_x_diff > 0  {
            let doc_line = &self._lines[self.cursor.y];
            let desired_x = self.cursor.x + screen_x_diff;
            if desired_x > doc_line.len() {
                self.cursor.x = doc_line.len();
            } else {
                self.cursor.x = desired_x;
            }
        }


        // if self.cursor.y == self._lines.len() - 1 {
        //     // do nothing, there's no where to go
        // } else {
        //     self.cursor.y += 1;
        //     let doc_line = &self._lines[self.cursor.y];
        //     if self.screen_cursor_x_desired > 0 { 
        //         self.cursor.x = self.screen_cursor_x_desired;
        //     } else {
        //         self.screen_cursor_x_desired = self.cursor.x;
        //     }
        //     if doc_line.len() < self.cursor.x {
        //         self.cursor.x = doc_line.len();
        //     }
        // }
    }

    pub fn key_return(&mut self) {
        let doc_line = &mut self._lines[self.cursor.y];
        let drained_chars = doc_line.data.drain(self.cursor.x..).collect();
        self.cursor.y += 1;
        self.cursor.x = 0;
        self.insert_line(self.cursor.y, drained_chars);
    }

    pub fn key_back(&mut self) {
        if self.cursor.x == 0 {
            if self.cursor.y != 0 {
                // we are here if user backspaces at the beginning of a line
                // and we are not at the top of the document
                // backspace should remove the line break at this point so
                // we remove the current line and append remaining characters
                // to the end of the previous line
                let mut removed_doc_line = self.remove_line(self.cursor.y);
                self.cursor.y -= 1;
                let doc_line = &mut self._lines[self.cursor.y];
                self.cursor.x = doc_line.len();
                doc_line.data.append(&mut removed_doc_line);
            }
        } else {
            self.cursor.x -= 1;
            let doc_line = &mut self._lines[self.cursor.y];
            doc_line.data.remove(self.cursor.x);
        }
    }

    pub fn key_char(&mut self, c: char) {
        let doc_line = &mut self._lines[self.cursor.y];
        doc_line.data.insert(self.cursor.x, c);
        self.cursor.x += 1;
    }

    pub fn screen_cursor(&self) -> Position {
        let line_info = &self._lines[self.cursor.y];
        let (i,x) = line_info.wrapped_line_index_from_cursor(self.cursor.x);
        let screen_y = line_info.screen_y_offset + i + 1;
        let screen_x = self.line_number_margin_width + x + 1;
        Position::new(screen_x, screen_y)
    }

    pub fn load_file(&mut self, file_path: &str) {
        let path = Path::new(&file_path);
        if path.try_exists().expect(format!("Can't check existence of file. This may be due to insufficient permission: {}", file_path).as_str()) {
            if path.is_file() {
                let mut file = File::open(&file_path).expect(format!("Unable to open file: {}", file_path).as_str());
                let mut buffer = String::new();
                file.read_to_string(&mut buffer).expect(format!("Unable to read file as text: {}", file_path).as_str());
                self.load_string(buffer.as_str());
            } else {
                panic!("Cannot open directory: {}", file_path);
            }
        }
    }

    pub fn load_string(&mut self, buffer: &str) {
        self._lines.clear();
        let lines: Vec<&str> = buffer.split('\n').collect();
        for line in lines {
            let mut vec_char: Vec<char> = line.chars().collect();
            if vec_char.last() == Some(&'\r') {
                vec_char.pop();
            }
            self._lines.push(LineInfo::from_line_data(vec_char));
        }
    }
}

fn move_cursor_in_viewport(stdout: &mut StdoutLock, x: usize, y: usize) -> Result<(), std::io::Error> {
    write!(stdout, "\x1b[{};{}H", y, x)?;
    stdout.flush()?;
    Ok(())
}


/*
    Enable virstual terminal processing in windows 10+ required for ANSI escape codes in cmd.exe
    REG ADD HKCU\CONSOLE /f /v VirtualTerminalLevel /t REG_DWORD /d 1

    TODO
    double click a word to select it - will also highlight all other instances of that word
    triple click a line to select it
    ctrl + c to copy - no selection copy line
    ctrl + v to paste
    ctrl + x to cut - no selection cut line
    ctrl + d to delete line
    ctrl + z to undo
    ctrl + y to redo
    ctrl + s to save
    ctrl + o to open
    ctrl + f to find
    ctrl + r to replace - replace all - replace next - show count of replacements before doing it
    ctrl + g to go to line
    ctrl + a to select all
    ctrl + n to create new file
    ctrl + w to close file
    ctrl + q to quit
    ctrl + left/right arrow to move cursor by word
    esc to cancel anything
    shift + arrow to select text
    shift + home to select to beginning of line
    shift + end to select to end of line
    shift + page up to select to beginning of file
    shift + page down to select to end of file
    mouse wheel to scroll
    ctrl + shift + f find in files

    syntax highlighting per language c, sql, javascript, rust, go, css, html

    tab completion

    github copilot integration

    keep indent level on return

    matrix easter egg
    ctrl + shift + m to enter the matrix
*/
fn main() -> Result<(), Error> {
    unsafe { 
        let h_stdin = GetStdHandle(STD_INPUT_HANDLE);
        let h_stdout = GetStdHandle(STD_OUTPUT_HANDLE);
        let mut original_std_input_mode : CONSOLE_MODE = 0;
        GetConsoleMode(h_stdin, &mut original_std_input_mode);
        SetConsoleMode(h_stdin, (ENABLE_WINDOW_INPUT | ENABLE_MOUSE_INPUT | ENABLE_EXTENDED_FLAGS) & !ENABLE_QUICK_EDIT_MODE);
        let mut console_screen_buffer_info: CONSOLE_SCREEN_BUFFER_INFOEX = std::mem::zeroed();
        GetConsoleScreenBufferInfoEx(h_stdout, &mut console_screen_buffer_info);
        let mut screen_info = ScreenInfo {
            width: console_screen_buffer_info.dwSize.X as usize,
            height: console_screen_buffer_info.dwSize.Y as usize,
        };

        let mut running = true;
        let mut output_buffer = String::with_capacity(4096);
        let mut document_info = DocumentInfo::new();

        let mut stdout = io::stdout().lock();
        let mut input_records: Vec<INPUT_RECORD> = Vec::with_capacity(128);
        let mut input_record_count: u32 = 0;
        let mut mouse_screen_x: isize = 0;
        let mut mouse_screen_y: isize = 0;

        let args: Vec<String> = std::env::args().collect();
        
        if args.len() > 1 {
            document_info.load_file(&args[1]);
        }

        write!(stdout, "{}", USE_ALTERNATE_BUFFER)?;
        move_cursor_in_viewport(&mut stdout, 0, 0)?;

        while running {
            if ReadConsoleInputW(h_stdin, input_records.as_mut_ptr(), 128, &mut input_record_count) > 0 {
                input_records.set_len(input_record_count.try_into().unwrap());
                for input_record in &input_records {
                    match input_record.EventType as u32 {
                        KEY_EVENT => {
                            let key_event = input_record.Event.KeyEvent;
                            
                            // any event aside from up/down should reset document_screen_cursor_x_desired
                            // docuemnt_screen_cursor_x_desired is used for recording the cursor position
                            // when using arrows keys to navigate up and down. If navigating into
                            // a shorter line than the current, the cursor jumps to the end of the
                            // shorter line. When the cursor jumps back into a longer line, restore
                            // the position of the cursor to the desired position
                            match key_event.wVirtualKeyCode {
                                VK_UP => { },
                                VK_DOWN => { },
                                _ => document_info.screen_cursor_x_desired = 0,
                            }
                            match key_event.wVirtualKeyCode {
                                VK_ESCAPE => running = false,
                                VK_HOME => document_info.cursor.x = 0,
                                VK_END => document_info.move_cursor_to_end_of_line(),
                                VK_LEFT => if key_event.bKeyDown > 0 { document_info.key_left(); },
                                VK_RIGHT => if key_event.bKeyDown > 0 { document_info.key_right(); },
                                VK_UP => if key_event.bKeyDown > 0 { document_info.key_up(); },
                                VK_DOWN => if key_event.bKeyDown > 0 { document_info.key_down(); },
                                VK_RETURN => if key_event.bKeyDown > 0 { document_info.key_return(); },
                                VK_BACK => if key_event.bKeyDown > 0 { document_info.key_back(); },
                                _=> {
                                    if key_event.bKeyDown > 0 {
                                        match std::char::from_u32(key_event.uChar.UnicodeChar as u32) {
                                            None => {},
                                            Some(c) => {
                                                if !c.is_control() {
                                                    document_info.key_char(c);
                                                }
                                            },
                                        }
                                    }
                                },
                            }
                        },

                        MOUSE_EVENT => { 
                            let coord = input_record.Event.MouseEvent.dwMousePosition;
                            let flags = input_record.Event.MouseEvent.dwEventFlags;
                            match flags {
                                0 => {}, //move_cursor_in_viewport(&mut stdout, coord.X as usize, coord.Y as usize)?,
                                DOUBLE_CLICK => { },
                                MOUSE_MOVED => { mouse_screen_x = coord.X as isize; mouse_screen_y = coord.Y as isize; },
                                MOUSE_WHEELED => { },
                                MOUSE_HWHEELED => { },
                                _ => { },
                            }
                            //write!(stdout, "\rmouse coord: {} {}", coord.X, coord.Y)?;
                            //write!(stdout, "mouse coord: {} {} {}", flags, coord.X, coord.Y);
                        },
                        
                        WINDOW_BUFFER_SIZE_EVENT => {
                            let coord = input_record.Event.WindowBufferSizeEvent.dwSize;
                            screen_info.width = coord.X as usize;
                            screen_info.height = coord.Y as usize;
                        },

                        MENU_EVENT => { }, 
                        
                        FOCUS_EVENT => { }, 
                        _=> panic!("Invalid Event Type {}", input_record.EventType),
                    }
                }
                output_buffer.clear();
                //let line_width = screen_info.line_width(&document_info);
                let mut lines_written_to_view_port = 0;

                // fill chars from document, fill all columns of each line
                // with either characters from document or empty space
                // expectation is each line should be fully filled
                // and ending with the cursor on the next line down
                document_info.calculate_metrics(&screen_info);
                for (i, line) in document_info.enumerate_lines() {
                    // write out the line number with an extra space
                    // the total width will be document_info.line_number_margin_width
                    output_buffer.push_str(format!("\x1b[36m{:1$} \x1b[0m",i+1,document_info.line_number_width).as_str());
                    let mut line_char_count = document_info.line_number_margin_width;
                    lines_written_to_view_port += 1;
                    for c in &line.data {
                        output_buffer.push(*c);
                        line_char_count += 1;
                        if line_char_count == screen_info.width {
                            for _ in 0..document_info.line_number_margin_width { output_buffer.push(' '); }
                            line_char_count = document_info.line_number_margin_width;
                            lines_written_to_view_port += 1;
                        }
                    }
                    if line_char_count < screen_info.width {
                        for _ in 0..(screen_info.width - line_char_count) {
                            output_buffer.push(' ');
                        }
                    }
                }
                // fill the remaining vertical space in the output buffer with space
                // ending 1 before the final line which is the status/command line
                for _ in 0..(screen_info.height - lines_written_to_view_port - 1) {
                    for _ in 0..screen_info.width {
                        output_buffer.push(' ');
                    }
                }
                // status command line appears at the bottom of the viewport
                // (line, col) [lines,length]
                let coln = format!("({},{}) ({},{}) [{},{}]", mouse_screen_x, mouse_screen_y, document_info.cursor.y+1, document_info.cursor.x+1,document_info.line_count(), document_info.char_count());
                for _ in 0..(screen_info.width - coln.len()) {
                    output_buffer.push(' ');
                }
                output_buffer.push_str(&coln);
                write!(stdout, "{}{}", MOVE_CURSOR_TO_UPPER_LEFT, output_buffer)?;
                let screen_cursor = document_info.screen_cursor();
                move_cursor_in_viewport(&mut stdout, screen_cursor.x, screen_cursor.y)?;
                stdout.flush()?;
            }
        }

        println!("{}", USE_MAIN_BUFFER);

        SetConsoleMode(h_stdin, original_std_input_mode);
    }
    Ok(())
}

#[test]
fn line_info_test() {
    let mut line_info = LineInfo::from_line_data("abcdefghijklmnopqrstuvwxyz".chars().collect());
    line_info.screen_width = 5;
    line_info.screen_line_count = 6;
    assert_eq!(line_info.wrapped_line_index_from_cursor(0), (0, 0));
    assert_eq!(line_info.wrapped_line_index_from_cursor(1), (0, 1));
    assert_eq!(line_info.wrapped_line_index_from_cursor(4), (0, 4));
    assert_eq!(line_info.wrapped_line_index_from_cursor(5), (1, 0));
    assert_eq!(line_info.wrapped_line_index_from_cursor(9), (1, 4));

    assert_eq!(line_info.len(), 26);
}

#[test]
fn document_info_test() {
    let mut doc_info = DocumentInfo::new();
    let screen_info = ScreenInfo { width: 5, height: 10 };

    // empty string should have 1 line
    doc_info.load_string("");
    doc_info.calculate_metrics(&screen_info);
    assert_eq!(doc_info.line_number_width, 1);
    assert_eq!(doc_info.line_number_margin_width, 2);
    assert_eq!(doc_info.line_count(), 1);
    assert_eq!(doc_info.screen_line_count, 1);

    // string under screen width should have 1 line
    doc_info.load_string("abc");
    doc_info.calculate_metrics(&screen_info);
    assert_eq!(doc_info.line_number_width, 1);
    assert_eq!(doc_info.line_number_margin_width, 2);
    assert_eq!(doc_info.line_count(), 1);
    assert_eq!(doc_info.screen_line_count, 1);

    // 3 line breaks with empty strings in between means 4 lines
    doc_info.load_string("\n\n\n");
    doc_info.calculate_metrics(&screen_info);
    assert_eq!(doc_info.line_number_width, 1);
    assert_eq!(doc_info.line_number_margin_width, 2);
    assert_eq!(doc_info.line_count(), 4);
    assert_eq!(doc_info.screen_line_count, 4);

    // 2 lines of strings at screen width 3 = 5 - 2
    doc_info.load_string("abc\ndef");
    doc_info.calculate_metrics(&screen_info);
    assert_eq!(doc_info.line_number_width, 1);
    assert_eq!(doc_info.line_number_margin_width, 2);
    assert_eq!(doc_info.line_count(), 2);
    assert_eq!(doc_info.screen_line_count, 2);

    // 2 lines because 1 line string overflows screen width of 3 = 5 - 2
    doc_info.load_string("abcde");
    doc_info.calculate_metrics(&screen_info);
    assert_eq!(doc_info.line_number_width, 1);
    assert_eq!(doc_info.line_number_margin_width, 2);
    assert_eq!(doc_info.line_count(), 1);
    assert_eq!(doc_info.screen_line_count, 2);
    assert_eq!(doc_info.line_at_screen_index(0), Some(&"abc".chars().collect::<Vec<char>>()[..]));
    assert_eq!(doc_info.line_at_screen_index(1), Some(&"de".chars().collect::<Vec<char>>()[..]));

    // 3 lines because 1 line string overflows twice
    doc_info.load_string("abcdefg");
    doc_info.calculate_metrics(&screen_info);
    assert_eq!(doc_info.line_number_width, 1);
    assert_eq!(doc_info.line_number_margin_width, 2);
    assert_eq!(doc_info.line_count(), 1);
    assert_eq!(doc_info.screen_line_count, 3);

    doc_info.load_string("abcdefg\nhij\nk\n\nlmnopqrs\ntuv");
    doc_info.calculate_metrics(&screen_info);
    assert_eq!(doc_info.line_number_width, 1);
    assert_eq!(doc_info.line_number_margin_width, 2);
    assert_eq!(doc_info.line_count(), 6);
    assert_eq!(doc_info.screen_line_count, 10);
    assert_eq!(doc_info.line_at_screen_index(0), Some(&"abc".chars().collect::<Vec<char>>()[..]));
    assert_eq!(doc_info.line_at_screen_index(1), Some(&"def".chars().collect::<Vec<char>>()[..]));
    assert_eq!(doc_info.line_at_screen_index(2), Some(&"g".chars().collect::<Vec<char>>()[..]));
    assert_eq!(doc_info.line_at_screen_index(3), Some(&"hij".chars().collect::<Vec<char>>()[..]));
    assert_eq!(doc_info.line_at_screen_index(4), Some(&"k".chars().collect::<Vec<char>>()[..]));
    assert_eq!(doc_info.line_at_screen_index(5), Some(&"".chars().collect::<Vec<char>>()[..]));
    assert_eq!(doc_info.line_at_screen_index(6), Some(&"lmn".chars().collect::<Vec<char>>()[..]));
    assert_eq!(doc_info.line_at_screen_index(7), Some(&"opq".chars().collect::<Vec<char>>()[..]));
    assert_eq!(doc_info.line_at_screen_index(8), Some(&"rs".chars().collect::<Vec<char>>()[..]));
    assert_eq!(doc_info.line_at_screen_index(9), Some(&"tuv".chars().collect::<Vec<char>>()[..]));
}