print("Loading libraries")
import schem_tools, requests, json, subprocess, os, shutil, zipfile
try:
    from flask import Flask, render_template, request, jsonify, send_from_directory, abort
except ImportError:
    subprocess.run("pip install Flask", shell=True)
    from flask import Flask, render_template, request, jsonify, send_from_directory, abort

print("Libraries loaded")

def get_available_versions():
    av = []
    for version in versions:
        if os.path.isdir(f"versions/{version}"):
            av.append(version)
    return av
            

def change_version(version_id:str):
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
    Loads the data for the provided version of Minecraft and stores them to ./versions
    
    :param version_id: String containing the version to install, example: \"1.21.4\"
    :param force: Bool, when True, no precautions regarding existing files will be done.
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
    if not os.path.isfile(f"versions/{version_id}/data.zip"):
        file_server = f"https://github.com/InventivetalentDev/minecraft-assets/zipball/refs/heads/{version_id}"
        print(file_server)
        print("Downloading minecraft assets")
        request = requests.get(file_server)
        if request.ok:
            open(f"versions/{version_id}/data.zip", "xb").write(request.content)
        else:
            print("Error while downloading version "+version_id)
            shutil.rmtree(f"versions/{version_id}")
            return False
    else:
        print("Assets already downloaded, skipping download")
        
    # Extract the block textures from the data.zip file
    print("Extracting assets")
    with zipfile.ZipFile(f"versions/{version_id}/data.zip", 'r') as data:
        block_dir = data.namelist()[0] + "assets/minecraft/textures/block"
        # Iterate through all files in the zip
        for file in data.namelist():
            if file.startswith(block_dir) and file.endswith(".png"):
                # Extract only the file name (strip the directory structure)
                filename = os.path.basename(file)
                if filename:
                    destination = f"versions/{version_id}/block_textures/{filename}"
                    with open(destination, "wb") as f:
                        f.write(data.read(file))

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
    asdfasdf = ""
    for e in range(100):
        asdfasdf += "\n"
    print(asdfasdf)
    
def get_index():    
    data = open("website/index.html","r").read().replace("{VERSION}", selected_version).replace("{ SCRIPT }", open("website/script.js","r").read())

    return data

def command(data: dict):
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
            resp = install_version(data["version"])
            if resp:
                return {"success": True, "version": data["version"]}
            else:
                return {"success": False, "version": data["version"]}
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
    global versions
    status = json.load(open("status.json", "r"))
    status["installing"]["status"] = False
    status["installing"]["version"] = ""
    status["versions"]["all"]=versions
    status["versions"]["installed"]=get_available_versions()
    json.dump(status,open("status.json", "w"))
    
def update_status():
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

# Define the root route to serve the HTML page
@app.route('/')
def index():
    return get_index()

# Define an API endpoint that the HTML/JavaScript can call
@app.route('/process', methods=['POST'])
def process():
    data = request.get_json()  # Receive data from the client
    command(data)
    return jsonify("success")

@app.route('/style.css')
def css():
    return send_from_directory('website', 'style.css', mimetype='text/css')

@app.route('/blocks/<filename>')
def serve_block_texture(filename):
    # Define the path to the block_textures directory for the given version
    directory = "assets\\block_icons"
    print(directory+"\\"+filename+".png")

    # Check if the directory and file exist
    if os.path.exists(os.path.join(directory, filename+".png")):
        return send_from_directory(directory, filename+".png")
    else:
        # If the file or directory does not exist, return a 404 error
        config = json.load(open("config.json", "r"))
        config["blocks"]["invalid_blocks"].append(filename)
        json.dump(config, open("config.json", "w"))
        abort(404)
    
@app.route('/status')
def status():
    update_status()
    d = jsonify(json.load(open("status.json", "r")))
    return d

@app.route('/blocks')
def send_block_list():
    return send_from_directory(f'versions/{selected_version}', 'block_data.json', mimetype='application/json')
print("Opening website")
subprocess.run("start http://localhost:5000", shell=True)
app.run(debug=False)
