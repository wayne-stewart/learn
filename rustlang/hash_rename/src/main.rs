use std::io;
use std::fs::{self};
use std::path::Path;

#[derive(Debug)]
struct FileHash {
    path: String,
    hash: String,
}

fn main() -> io::Result<()> {

    let mut hashes : Vec<FileHash> = Vec::new();

    let entries = fs::read_dir(".").unwrap();

    for wrapped_entry in entries {
        let entry = wrapped_entry.unwrap();
        let path = entry.path().display().to_string();
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
