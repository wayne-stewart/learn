use std::io;
use std::fs::{self};
use std::path::Path;

#[derive(Debug)]
struct FileHash {
    path: String,
    hash: String,
}

fn run_hash_rename(extension: &str) -> io::Result<()> {
    let mut hashes : Vec<FileHash> = Vec::new();

    let entries = fs::read_dir(".").unwrap();

    for wrapped_entry in entries {
        let entry = wrapped_entry.unwrap();
        let path = entry.path().display().to_string();
        if !path.ends_with(extension) {
            continue;
        }
        let data = fs::read(&path).unwrap();
        let hash_value = blake3::hash(&data).to_hex().to_string();

        if hashes.iter().any(|hash| hash.hash == hash_value) {
            println!("Duplicate Found {}", &path);
        } else {
            let file_hash = FileHash {
                path: path,
                hash: hash_value,
            };
            hashes.push(file_hash);
        }
    }

    println!("total files: {}", hashes.len());

    for path_hash in hashes {
        let ext = Path::new(&path_hash.path).extension().unwrap().to_str().unwrap();
        let new_path = format!("./{}.{}",&path_hash.hash, ext);
        fs::rename(path_hash.path, new_path)?;
    }

    Ok(())
}

fn main() -> io::Result<()> {
    let arg_switch = std::env::args().nth(1).unwrap_or("".to_string());
    if arg_switch == "-e" {
        let ext = std::env::args().nth(2).unwrap_or("".to_string());
        if ext.len() > 0 {
            return run_hash_rename(&ext);
        }
    }
    println!("Usage:   hash_rename -e <extension>");
    println!("Example: hash_rename -e .jpg");
    return Ok(());
}
