package main

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"io/ioutil"
	"log"
	"math"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gorilla/websocket"
	"golang.org/x/text/language"
	"golang.org/x/text/search"
)

type Config struct {
	HostAddr string
	WWWRoot  string
	TLSCert  string
	TLSKey   string
	Include  []string
	Suffix   []string
}

type File struct {
	Content string
	Info    fs.FileInfo
}

type DTO struct {
	Op   string
	Data string
}

type FileResult struct {
	FileName       string
	Content        string
	HasContents    bool
	HasSearchMatch bool
}

type SearchResult struct {
	Files []FileResult
}

var websocket_upgrader = websocket.Upgrader{}

var files []File

func socket_handler(w http.ResponseWriter, r *http.Request) {
	conn, err := websocket_upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Could not create upgrade to websocket:", err)
		return
	}
	defer conn.Close()

	for {
		message_type, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Println("Error reading message: ", message_type, err)
			}
			break
		}

		var dto DTO
		err = json.Unmarshal(message, &dto)
		if err != nil {
			log.Println("Error reading message: ", err)
			break
		}

		switch dto.Op {
		case "get all":
			socket_handle_get_all(&dto, conn)
		case "get file":
			socket_handle_get_file(&dto, conn)
		case "search":
			socket_handle_search(&dto, conn)
		default:
			log.Printf("Invalid DTO: %+v", dto)
		}
	}
}

func socket_handle_get_all(dto *DTO, conn *websocket.Conn) {
	var search_result SearchResult
	var file_results []FileResult
	for _, file := range files {
		file_result := FileResult{FileName: file.Info.Name()}
		file_results = append(file_results, file_result)
	}
	search_result.Files = file_results
	buffer, _ := json.Marshal(search_result)
	conn.WriteMessage(websocket.TextMessage, buffer)
}

func socket_handle_search(dto *DTO, conn *websocket.Conn) {
	var search_result SearchResult
	var file_results []FileResult
	search_strings := strings.Fields(string(dto.Data))
	m := search.New(language.English, search.IgnoreCase)
	for _, file := range files {
		search_count := 0
		name := file.Info.Name()
		content := file.Content
		content_length := len(content)
		var l float64 = float64(content_length)
		var x int = int(math.Min(512, l)) - 1
		file_result := FileResult{
			FileName:    name,
			Content:     content[0:x],
			HasContents: content_length > 0,
		}

		if content_length > 0 && len(search_strings) > 0 {
			for _, search_string := range search_strings {
				if index, _ := m.IndexString(name, search_string); index >= 0 {
					search_count++
				} else if index, _ := m.IndexString(content, search_string); index >= 0 {
					search_count++
				}
			}
			if len(search_strings) == search_count {
				file_result.HasSearchMatch = true
			}
		}
		file_results = append(file_results, file_result)
	}
	search_result.Files = file_results
	//log.Printf("search result: %+v", search_result)
	buffer, _ := json.Marshal(search_result)
	conn.WriteMessage(websocket.TextMessage, buffer)
}

func socket_handle_get_file(dto *DTO, conn *websocket.Conn) {
	file_name := string(dto.Data)
	var file_result FileResult
	file_result.FileName = file_name
	file_result.Content = "FILE NOT FOUND"
	for _, file := range files {
		if file.Info.Name() == file_name {
			file_result.Content = file.Content
		}
	}
	buffer, _ := json.Marshal(file_result)
	conn.WriteMessage(websocket.TextMessage, buffer)
}

func form_handler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		fmt.Fprintf(w, "ParseForm() err: %v", err)
		return
	}
	fmt.Fprintf(w, "POST request successful\n")
	name := r.FormValue("name")
	address := r.FormValue("address")
	fmt.Fprintf(w, "Name = %s\n", name)
	fmt.Fprintf(w, "Address = %s\n", address)
}

func filter_by_suffix(file_name string, ext ...string) bool {
	for i := 0; i < len(ext); i++ {
		if strings.HasSuffix(file_name, ext[i]) {
			return true
		}
	}
	return false
}

func main() {

	config_file_content, err := ioutil.ReadFile("./config.json")
	if err != nil {
		log.Fatal("Error opening config file: ", err)
	}

	var config Config
	err = json.Unmarshal(config_file_content, &config)
	if err != nil {
		log.Fatal("Error reading config file: ", err)
	}

	for _, folder_name := range config.Include {
		file_infos, err := ioutil.ReadDir(folder_name)
		if err != nil {
			log.Fatal("Error reading include folder: ", err)
		}
		for _, file_info := range file_infos {
			if !file_info.IsDir() && filter_by_suffix(file_info.Name(), config.Suffix...) {
				log.Println(file_info.Name())
				var file File
				file.Info = file_info
				content, err := ioutil.ReadFile(filepath.Join(folder_name, file_info.Name()))
				if err != nil {
					log.Fatal("Error reading file: ", err)
				}
				file.Content = string(content)
				files = append(files, file)
			}
		}
	}

	fileserver := http.FileServer(http.Dir(config.WWWRoot))
	http.Handle("/", fileserver)
	http.HandleFunc("/socket", socket_handler)
	http.HandleFunc("/form", form_handler)

	fmt.Printf("Starting server at port 8137\n")
	log.Fatal(http.ListenAndServeTLS(config.HostAddr, config.TLSCert, config.TLSKey, nil))
}
