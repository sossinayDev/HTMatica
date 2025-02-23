print("Loading libraries")
import schem_tools, requests, json, subprocess, os
try:
    from flask import Flask, render_template, request, jsonify, send_from_directory, abort
except ImportError:
    subprocess.run("pip install Flask", shell=True)
    from flask import Flask, render_template, request, jsonify, send_from_directory, abort

print("Libraries loaded")

def get_available_versions():
    """
    Returns a list containing all version codes (e.g ["1.21.4","1.12"])
    
    :return: list
    """
    av = []
    for version in versions:
        if os.path.isdir(f"versions/{version}"):
            av.append(version)
    return av



def change_version(version_id:str):
    """
    Switches to the given version and validates the installation assets.
    
    :param version_id: The version ID of the version you want to switch to (e.g "1.21.4")

    :return: Returns an int. Codes: 1 = Success, 2 = Version is not installed, 3 = Unknown version
    """
    global selected_version
    if os.path.isdir(f"versions/{version_id}"):
        selected_version = version_id
        
        blocks = json.load(open(f"versions/{version_id}/block_data.json"))["block_list"]
        valid_blocks = []
        for block in blocks:
            if os.path.exists(f"assets/block_icons/{block}.png"):
                valid_blocks.append(block)
                
        new_data = json.load(open(f"versions/{version_id}/block_data.json"))
        new_data["block_list"]=valid_blocks
        json.dump(new_data, open(f"versions/{version_id}/block_data.json", "w"))
        
        return 1
    elif version_id in versions:
        return 2
    else:
        return 3

def install_version(version_id:str,force:bool=False):
    """
    Loads the data for the provided version of Minecraft and stores them to ./versions.
    
    :param version_id: String containing the version to install, example: \"1.21.4\"
    :param force: Bool, when True, no precautions regarding existing files will be done.

    :return: Returns True on successfull installation
    """  
    print(f"Installing version {version_id}")
    
    # Load config for prohibited keywords
    print("Loading config...")
    config = json.load(open("config.json", "r"))
    
    # Check for existing installation. When force is enabled, ignore the duplicate.

    if os.path.isdir(f"versions/{version_id}"):
        if force:
            print("Found existing installation, continuing because of force parameter.")
        else:
            print("Version already installed. Use force parameter to force reinstall.")
            return False
        
    # Iterate through all needed directories and create them
    needed_dirs = [
        f"versions/{version_id}",
        f"versions/{version_id}/block_textures"
    ]        
    for dir in needed_dirs:
        try:
            os.mkdir(dir)
        except FileExistsError:
            pass
    
    # Download the minecraft assets from minecraft-assets cloud
    # Skip this part if file already exists
    # if not os.path.isfile(f"versions/{version_id}/data.zip"):
    #     file_server = f"https://github.com/InventivetalentDev/minecraft-assets/zipball/refs/heads/{version_id}"
    #     print(file_server)
    #     print("Downloading minecraft assets")
    #     request = requests.get(file_server)
    #     if request.ok:
    #         open(f"versions/{version_id}/data.zip", "xb").write(request.content)
    #     else:
    #         print("Error while downloading version "+version_id)
    #         shutil.rmtree(f"versions/{version_id}")
    #         return False
    # else:
    #     print("Assets already downloaded, skipping download")
        
    # # Extract the block textures from the data.zip file
    # print("Extracting assets")
    # with zipfile.ZipFile(f"versions/{version_id}/data.zip", 'r') as data:
    #     block_dir = data.namelist()[0] + "assets/minecraft/textures/block"
    #     # Iterate through all files in the zip
    #     for file in data.namelist():
    #         if file.startswith(block_dir) and file.endswith(".png"):
    #             # Extract only the file name (strip the directory structure)
    #             filename = os.path.basename(file)
    #             if filename:
    #                 destination = f"versions/{version_id}/block_textures/{filename}"
    #                 with open(destination, "wb") as f:
    #                     f.write(data.read(file))

    # Download block information from github
    print("Loading block data...")
    block_path = f"https://raw.githubusercontent.com/PrismarineJS/minecraft-data/refs/heads/master/data/pc/{version_id}/blocks.json"
    block_data = json.loads(requests.get(block_path).text)
    print("Loaded block data")
    
    

    # Iterate through all blocks and save only the essential information.
    # If the block id contains a prohibited keyword, skip the block
    prohibited_keywords = config["blocks"]["prohibited_keywords"]
    invalid_blocks = config["blocks"]["invalid_blocks"]
    
    blocks = {}
    block_list = []
    for block in block_data:
        id = block["name"]
        invalid = False
        for keyword in prohibited_keywords:
            if keyword in id:
                invalid = True
                break
        if id in invalid_blocks:
            invalid = True
        if not invalid:
            name = block["displayName"]
            stack_size = block["stackSize"]
            collider = block["boundingBox"]
            states = block["states"]
            block_list.append(id)
            blocks[id] = {"name": name, "stack_size": stack_size, "collider": collider, "states": states}
    json.dump({"blocks": blocks, "block_list": block_list}, open(f"versions/{version_id}/block_data.json", "w"))
    status = json.load(open("status.json", "r"))
    status["installing"]["status"] = False
    status["installing"]["version"] = ""
    json.dump(status,open("status.json", "w"))
    print("Finished installing version "+version_id)
    return True



def clear():
    """
    Clears the console by spamming newline characters
    
    :return: None
    """
    asdfasdf = ""
    for e in range(100):
        asdfasdf += "\n"
    print(asdfasdf)
    
def get_index():
    """
    Opens the index.html file, reads it and replaces important parts with the needed data.
    
    :return: Returns the text content of the index.html file.
    """
    
    data = open("website/index.html","r").read().replace("{VERSION}", selected_version).replace("{ SCRIPT }", open("website/script.js","r").read())
    
    # config = json.load(open("config.json", "r"))
    # if not config["mobile"]:
    #     data = open("website/index.html","r").read().replace("{VERSION}", selected_version).replace("{ SCRIPT }", open("website/script.js","r").read())
    # else:
    #     data = open("website/index_mobile.html","r").read().replace("{VERSION}", selected_version).replace("{ SCRIPT }", open("website/script.js","r").read())
    return data

def command(data: dict):
    """
    Parses a command dict and executes the corresponding commands
    
    :param data: Dictionary containing command data. Must have "command" key and corresponding params
                 Available commands: change_version, install_version, save_recent_block, export_schematic
    
    :return: None
    """    
    
    status = json.load(open("status.json", "r"))
    if type(data) != dict:
        print("Invalid command recieved")
        return
    try:
        print(f"{data['command']} command recieved")
        if data["command"] == "change_version":
            change_version(data["version"])
        if data["command"] == "install_version":
            status["installing"]["status"] = True
            status["installing"]["version"] = data["version"]
            json.dump(status,open("status.json", "w"))
            install_version(data["version"])
        if data["command"] == "save_recent_block":
            status = json.load(open("status.json", "r"))
            try:
                status["recent_blocks"].remove(data["block"])
                status["recent_blocks"].remove(data["block"])
            except:
                pass
            status["recent_blocks"].insert(0, data["block"])
            status["recent_blocks"]=status["recent_blocks"][:10]
            json.dump(status, open("status.json", "w"))
        if data["command"] == "export_schematic":
            print(data["schematic"])
            schem_tools.json_to_schem(data["schematic"],"schematics")
            print(data)
            subprocess.run(f"start {os.path.abspath('schematics')}", shell=True)
            
            
    except KeyError:
        print("Recieved unknown or invalid command:\n"+str(data))
        return {"error": "Recieved unknown or invalid command:\n"+str(data)}
    except Exception as e:
        print(e)
        return {"error": "Unknown error"}
    return {"error": "Unknown command"}

def init():
    """
    Resets status and loads versions.

    :return: None
    """
    
    global versions
    status = json.load(open("status.json", "r"))
    status["installing"]["status"] = False
    status["installing"]["version"] = ""
    status["versions"]["all"]=versions
    status["versions"]["installed"]=get_available_versions()
    json.dump(status,open("status.json", "w"))
    
def update_status():
    """
    Updates the server status. Writes important information like installed and available versions
    
    :return: None
    """
    
    global versions
    status = json.load(open("status.json", "r"))
    status["versions"]["all"]=versions
    status["versions"]["installed"]=get_available_versions()
    json.dump(status,open("status.json", "w"))



print("Loading config")
data = json.load(open("config.json","r"))
selected_version = data["version"]["selected"]
versions = data["version"]["available"]
newest_version = versions[-1]
print(f"Version {selected_version} selected, {len(versions)} other versions available. Newest version {newest_version}")
print("Resetting status...")
init()
print("Starting server...")


app = Flask("schematic_server")

@app.route('/')
def index():
    """
    index.html
    """
    return get_index()

@app.route('/process', methods=['POST'])
def process():
    """
    Runs a command
    """
    data = request.get_json()
    command(data)
    return jsonify("success")

@app.route('/style.css')
def css():
    """
    Sends the style.css file
    """
    return send_from_directory('website', 'style.css', mimetype='text/css')

@app.route('/style_mobile.css')
def css2():
    """
    Sends the style.css file
    """
    return send_from_directory('website', 'style_mobile.css', mimetype='text/css')

@app.route('/blocks/<filename>')
def serve_block_texture(filename):
    
    """
    Loads the given block texture from storage and returns it as content of the page.
    
    :param filename: The blockstate of the wanted block, for example "diamond_block" or "waxed_weathered_cut_copper_stairs"
    """
    
    directory = "assets/block_icons/"
    print(directory+filename+".png")
    config = json.load(open("config.json", "r"))

    if not filename in config["blocks"]["invalid_blocks"]:
        if os.path.exists(os.path.join(directory, filename+".png")):
            return send_from_directory(directory, filename+".png")
        else:
            config["blocks"]["invalid_blocks"].append(filename)
            json.dump(config, open("config.json", "w"))
            abort(404) 
    else:
        abort(404) 
    
@app.route('/status')
def status():
    """
    Returns the current status to the client
    """
    update_status()
    d = jsonify(json.load(open("status.json", "r")))
    return d

@app.route('/blocks')
def send_block_list():
    """
    Returns the block data/list to the client
    """
    return send_from_directory(f'versions/{selected_version}', 'block_data.json', mimetype='application/json')

print("Opening website")
subprocess.run("start http://localhost:5000", shell=True)
app.run(debug=False)
