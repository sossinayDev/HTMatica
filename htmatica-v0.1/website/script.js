function send_data(data, reload = false) {
    fetch('/process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (reload) {
                document.location.reload()
            }
        })
}

function install_version_clicked() {
    let version = document.getElementById("version_selector").value
    send_data({ command: "install_version", version: version })
}


function update_version_selector() {
    fetch('/status', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the JSON from the response
        })
        .then(data => {
            if (data.installing.status) {
                document.getElementById("install_status").style.display = "block"
            }
            else {
                document.getElementById("install_status").style.display = "none"
            }

            let installed_versions = data.versions.installed
            let all_versions = data.versions.all
            recent_blocks = data.recent_blocks

            let parent = document.getElementById("installed_versions");
            parent.innerHTML = ""; // Clear the parent element

            installed_versions.forEach(ver => {
                let button = document.createElement("button");
                button.onclick = function () { switch_version(ver); }; // Pass the function, not a string
                button.textContent = ver; // Set the button's text
                parent.appendChild(button); // Append the button to the parent
            });



            parent = document.getElementById("version_selector")
            let selection = parent.value
            parent.innerHTML = ""
            all_versions.forEach(ver => {
                let button = document.createElement("option")
                button.textContent = ver
                parent.appendChild(button)
            });
            parent.value = selection

            if (data.installing.status) {
                document.getElementById("install_status").style.display = "block"
                document.getElementById("install_version").style.display = "none"
            }
            else {
                document.getElementById("install_status").style.display = "none"
                document.getElementById("install_version").style.display = "block"
            }

            show_recent_blocks()
        })
}
setInterval(update_version_selector, 1000)

function switch_version(version) {
    send_data({ command: "change_version", version: version }, reload = true)
}

function show_block_buttons(all = false) {
    let prompt = document.getElementById("search").value.toLowerCase().replace(" ", "_")

    parent = document.getElementById("blocks")
    parent.innerHTML = ""

    console.log("Show blocks...")
    block_list.forEach(block => {
        if (block.includes(prompt) || all) {
            console.log(block)
            let button = document.createElement("button")
            button.innerHTML = `<img src="/blocks/${block}">`
            button.title = blocks[block]["name"]
            button.onclick = () => select_block(block);
            parent.appendChild(button)
        }
    });
}

function show_recent_blocks() {
    parent = document.getElementById("recent")
    parent.innerHTML = ""

    recent_blocks.forEach(block => {
        let button = document.createElement("button")
        button.innerHTML = `<img src="/blocks/${block}">`
        button.title = blocks[block]["name"]
        button.onclick = () => select_block(block);
        parent.appendChild(button)

    });
}

function select_block(block) {
    selected_block = block
    document.getElementById("block_preview").src = `blocks/${block}`
    send_data({ command: "save_recent_block", block: block })
}

function load_block_pallette() {
    console.log("Loading...")

    let prompt = document.getElementById("search").value.toLowerCase().replaceAll(" ", "_")



    if (prompt.length >= 2) {
        show_block_buttons()
    }
    if (prompt == "*") {
        if (confirm(`Are you sure that you want to show all ${block_list.length} items?`)) {
            show_block_buttons(all = true)
        }
    }

}

let blocks = {}
let block_list = []
let recent_blocks = []

function init() {
    update_version_selector()

    document.getElementById("canvas").width = document.getElementById("viewport").clientWidth
    document.getElementById("canvas").height = document.getElementById("viewport").clientHeight

    fetch('/blocks', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the JSON from the response
        })



        .then(data => {
            console.log(data)
            blocks = data["blocks"]
            block_list = data["block_list"]
        })


        .catch(error => console.error('Error:', error));

    canvas = document.getElementById('canvas');
    ctx2 = canvas.getContext('2d');


    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Mouse down event
    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        lastMouseX = event.offsetX; // Store the initial mouse position
        lastMouseY = event.offsetY;
    });

    canvas.addEventListener('touchstart', (event) => {
        isDragging = true;

        // Get the touch coordinates and set lastMouseX and lastMouseY
        const touch = event.touches[0];
        lastMouseX = touch.clientX - canvas.getBoundingClientRect().left;
        lastMouseY = touch.clientY - canvas.getBoundingClientRect().top;
    });

    // Mouse move event
    canvas.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const mouseX = event.offsetX;
            const mouseY = event.offsetY;

            // Calculate how much the mouse moved
            const deltaX = mouseX - lastMouseX;
            const deltaY = mouseY - lastMouseY;

            // Update the camera position based on the mouse movement
            camX -= deltaX;
            camY -= deltaY;

            // Update last mouse positions
            lastMouseX = mouseX;
            lastMouseY = mouseY;

            // Optionally, redraw your scene here using the updated camX and camY
            render(camera_zoom)
        }
    });

    canvas.addEventListener('touchmove', (event) => {
        if (isDragging) {
            // Prevent the default behavior (like scrolling)
            event.preventDefault();

            // Get the touch coordinates
            const touch = event.touches[0];
            const mouseX = touch.clientX - canvas.getBoundingClientRect().left;
            const mouseY = touch.clientY - canvas.getBoundingClientRect().top;
            console.log(mouseX, mouseY)
            // Calculate how much the touch moved
            const deltaX = mouseX - lastMouseX;
            const deltaY = mouseY - lastMouseY;

            // Update the camera position based on the touch movement
            camX -= deltaX;
            camY -= deltaY;

            // Update last touch positions
            lastMouseX = mouseX;
            lastMouseY = mouseY;

            // Optionally, redraw your scene here using the updated camX and camY
            render(camera_zoom);
        }
    });


    // Mouse up event
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });
    canvas.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Mouse leave event (stops dragging if the mouse leaves the canvas)
    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    canvas.addEventListener('wheel', function (event) {
        event.preventDefault(); // Prevent page scroll

        // Adjust camera_zoom based on scroll direction
        if (event.deltaY < 0) {
            camera_zoom *= 1.1;  // Zoom in
            camX += canvas.clientWidth / 50 * camera_zoom / 2
            camY += canvas.clientHeight / 50 * camera_zoom / 2
        } else {
            camX -= canvas.clientWidth / 50 * camera_zoom / 2
            camY -= canvas.clientHeight / 50 * camera_zoom / 2
            camera_zoom /= 1.1;  // Zoom out
        }

        // Redraw the canvas with updated zoom
        render(camera_zoom);
    });

    setTimeout(load_recent_schematic, 500)
}

function load_recent_schematic() {
    schem = JSON.parse(localStorage.getItem("last_schematic"))
    if (!(schem)) {
        new_schematic()
    }
    else {
        load_from_data(schem)
    }
}

function auto_save() {
    schematic.meta.name = document.getElementById("schematic_name").value
    localStorage.setItem("last_schematic", JSON.stringify(schematic))
}
setInterval(auto_save, 5000)

function new_schematic() {
    schematic = { blocks: [], meta: {} }
    camX = -200
    camY = -200
    camera_zoom = 1
    render(camera_zoom)
    update_hierachy()
    clear_inspector()
    document.getElementById("schematic_name").value = ""
    auto_save()
    document.getElementById("preloaded_blocks").innerHTML = ""
}

function add_block_preload(blockstate) {
    console.log(blockstate)
    if (!(used_blocks.includes(blockstate))) {
        used_blocks.push(blockstate)

        if (blockstate.includes("stairs")) {
            let i2 = document.createElement("img")
            i2.src = `blocks/${blockstate.replace("stairs", "slab")}`
            i2.style.display = "none"
            document.getElementById("preloaded_blocks").appendChild(i2)
            let i = document.createElement("img")
            i.src = `blocks/${blockstate}_quarter`
            i.style.display = "none"
            document.getElementById("preloaded_blocks").appendChild(i)
        }
        else if (blockstate.includes("wall")) {
            let i2 = document.createElement("img")
            i2.src = `blocks/${blockstate}`
            i2.style.display = "none"
            document.getElementById("preloaded_blocks").appendChild(i2)
            const sides = ["north", "west", "east", "south"]
            sides.forEach(side => {
                let i3 = document.createElement("img")
                i3.src = `blocks/${blockstate}_${side}_low`
                i3.style.display = "none"
                document.getElementById("preloaded_blocks").appendChild(i3)

                let i4 = document.createElement("img")
                i4.src = `blocks/${blockstate}_${side}_tall`
                i4.style.display = "none"
                document.getElementById("preloaded_blocks").appendChild(i4)
            });
        }
        else {
            let i = document.createElement("img")
            i.src = `blocks/${blockstate}`
            i.style.display = "none"
            document.getElementById("preloaded_blocks").appendChild(i)
        }
    }
}

function set_block(x, y, z, blockstate) {
    add_block_preload(blockstate)

    let i = 0
    schematic.blocks.forEach(block => {
        if (block.pos.x == x && block.pos.y == y && block.pos.z == z) {
            console.log(schematic.blocks.splice(i, 1))
        }
        i++
    });

    let states = blocks[blockstate].states
    let additional = "["
    states.forEach(state => {
        if (state.type == "bool") {
            additional += `${state.name}=false,`
        }
        if (state.type == "enum") {
            additional += `${state.name}=${state.values[0]},`
        }
        if (state.type == "int") {
            additional += `${state.name}=0,`
        }
    })
    additional = "[" + additional.substring(1, additional.length - 1) + "]"

    schematic.blocks.push(
        {
            pos: {
                x: x,
                y: y,
                z: z
            },
            block_state: blockstate,
            additional: additional
        })

    update_hierachy()
    render(camera_zoom)

    auto_save()
}

function render(scale = 1, snapshot_image = false) {
    ctx2.clearRect(0, 0, canvas.width, canvas.height);


    r_schematic = structuredClone(schematic)

    // Sort blocks for proper layering: sort by z first (depth), then y (height), then x (left-right)
    let all_blocks = r_schematic.blocks.sort((a, b) => {
        if (a.pos.z !== b.pos.z) {
            return a.pos.z - b.pos.z; // Sort by depth (z-coordinate)
        } else if (a.pos.y !== b.pos.y) {
            return a.pos.y - b.pos.y; // Sort by height (y-coordinate)
        } else {
            return a.pos.x - b.pos.x; // Sort by left-right (x-coordinate) as a tiebreaker
        }
    });

    all_blocks.forEach(block => {
        let posX = (block.pos.x * scale * 90) - (block.pos.z * scale * 90) - camX;
        let posY = (block.pos.x / 2 * scale * 90) + (block.pos.z / 2 * scale * 90) - (block.pos.y * scale * 90) - camY + (block.pos.z * scale * 8) + (block.pos.x * scale * 8) - (block.pos.y * scale * 14);

        let xmod = 0
        let ymod = 0

        let img = document.getElementById("placement_block_img");
        img.src = `/blocks/${block.block_state}`;
        if (block.block_state.includes("slab")) {
            additional = parse_additional(block.additional)

            if (additional.type == "top") {
                ymod = -(scale * 52)
                ctx2.drawImage(img, posX + xmod, posY + ymod, scale * 256, scale * 256);
            }
            else if (additional.type == "double") {
                ctx2.drawImage(img, posX, posY, scale * 256, scale * 256);
                ymod = -(scale * 52)
                ctx2.drawImage(img, posX + xmod, posY + ymod, scale * 256, scale * 256);
            }
            else {
                ctx2.drawImage(img, posX, posY, scale * 256, scale * 256);
            }
        }
        else if (block.block_state.includes("stairs")) {
            additional = parse_additional(block.additional)

            let img = document.getElementById("placement_block_img");

            let possible_quarters = {
                "straight": "0101",
                "inner_left": "0111",
                "inner_right": "1101",
                "outer_left": "0001",
                "outer_right": "0100",
            }

            let rotations = {
                "north": 0,
                "west": 3,
                "south": 2,
                "east": 1
            }

            if (additional.half == "bottom") {
                img.src = `/blocks/${block.block_state.replace("stairs", "slab")}`;
                ctx2.drawImage(img, posX, posY, scale * 256, scale * 256);
            }



            let quarters = possible_quarters[additional.shape]
            for (var i2 = 0; i2 < rotations[additional.facing]; i2++) {
                quarters = quarters[1] + quarters[3] + quarters[0] + quarters[2]
            }

            let quarter_positions = [
                { xmod: 0, ymod: -scale * 52 },
                { xmod: -scale * 44, ymod: -scale * 26 },
                { xmod: -scale * -44, ymod: -scale * 26 },
                { xmod: 0, ymod: 0 }
            ]
            img.src = `/blocks/${block.block_state}_quarter`;
            for (var i3 = 0; i3 < 4; i3++) {
                if (quarters.substring(i3, i3 + 1) == "1") {
                    xmod = quarter_positions[parseInt(i3)].xmod
                    ymod = quarter_positions[parseInt(i3)].ymod
                    if (additional.half == "top") {
                        ymod += scale * 52
                    }
                    let ctx3 = canvas.getContext("2d")
                    ctx3.drawImage(img, posX + xmod, posY + ymod, scale * 256, scale * 256);
                }
            }

            if (additional.half == "top") {
                ymod = -(scale * 52)
                xmod = 0
                img.src = `/blocks/${block.block_state.replace("stairs", "slab")}`;
                ctx2.drawImage(img, posX + xmod, posY + ymod, scale * 256, scale * 256);
            }
        }
        else if (block.block_state.includes("wall")) {
            additional = parse_additional(block.additional)
            const sides = ["north", "west", "east", "south"]
            img.src = `/blocks/${block.block_state}`
            ctx2.drawImage(img, posX, posY, scale * 256, scale * 256);
            sides.forEach(side => {
                let value = additional[side]
                if (value != "none") {
                    ymod = 0
                    xmod = 0
                    img.src = `/blocks/${block.block_state}_${side}_${value}`;
                    let ctx3 = canvas.getContext("2d")
                    if (value == "low") {
                        ymod = (scale * 8)
                        xmod = -(scale * 16)
                    }
                    else {
                        if (side == "south") {
                            ymod = -scale * 2
                            xmod = scale * 6
                        }
                        else if (side == "west") {
                            xmod = scale * 8
                            ymod = -scale * 3.5
                        }
                        else if (side == "north") {
                            xmod = scale * 3.5
                            ymod = -scale * 3.5
                        }
                        else if (side == "east") {
                            xmod = scale * 3.5
                            ymod = -scale * 3
                        }
                    }
                    ctx3.drawImage(img, posX + xmod, posY + ymod, scale * 256, scale * 256);
                }
            });
        }
        else {
            ctx2.drawImage(img, posX, posY, scale * 256, scale * 256);
        }
    });

    if (snapshot_image) {
        var image = canvas.toDataURL("image/png");
        var link = document.createElement('a');

        let name = document.getElementById("schematic_name").value.replaceAll(" ", "_")

        invalid_filename_chars.split("").forEach(char => {
            name = name.replaceAll(char, "")
        });

        link.download = `${name}.png`;
        link.href = image;

        link.click();
    }
    else {
        ctx2.drawImage(document.getElementById("axis_overlay"), 10, canvas.clientHeight - 138, 128, 128)
    }
}



function photo() {
    render(camera_zoom, true)
}

function export_json() {
    let filename = document.getElementById("schematic_name").value.replaceAll(" ", "_").toLowerCase() + ".json"

    invalid_filename_chars.split("").forEach(char => {
        filename = filename.replaceAll(char, "")
    });

    schematic["meta"]["name"] = document.getElementById("schematic_name").value

    const jsonString = JSON.stringify(schematic, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function export_schem() {
    schematic.meta.name = document.getElementById("schematic_name").value
    send_data({ command: "export_schematic", schematic: schematic })
}

function update_hierachy() {
    document.getElementById("hierachy").innerHTML = ""

    schematic.blocks.forEach(block => {
        pos = `(${block.pos.x}, ${block.pos.y}, ${block.pos.z})`
        block_name = blocks[block.block_state].name

        text = `${block_name} - ${pos}`

        let b = document.createElement("button")
        b.textContent = text
        b.onclick = () => inspect_block(schematic.blocks.indexOf(block))
        document.getElementById("hierachy").appendChild(b)
    });
    auto_save()
}

function parse_additional(str) {
    const trimmedStr = str.slice(1, -1);

    const pairs = trimmedStr.split(',');
    const result = {};

    pairs.forEach(pair => {
        const [key, value] = pair.split('=');

        result[key] = value === "true" ? true : value === "false" ? false : value;
    });

    return result;
}

function inspect_block(i) {
    console.log(i)
    inspected_block = i
    block = schematic.blocks[i]
    document.getElementById("inspect_x").value = block.pos.x
    document.getElementById("inspect_y").value = block.pos.y
    document.getElementById("inspect_z").value = block.pos.z
    document.getElementById("inspect_block_state").value = block.block_state

    // Load special states
    let states = blocks[block.block_state].states

    parent = document.getElementById("additional_elements")
    parent.innerHTML = ""

    let additional = false
    if ("additional" in block) {
        additional = parse_additional(block.additional)
        console.log(additional)
    }

    states.forEach(state => {
        let name = state.name
        let type = state.type

        if (type == "enum") {
            let possibilities = state.values
            let element = document.createElement("select")
            element.id = `inspector_additional_${name}`

            element.onchange = () => save_inspection()
            possibilities.forEach(pos => {
                let opt = document.createElement("option")
                opt.textContent = pos
                element.appendChild(opt)
            });
            let label = document.createElement("label")
            label.for = element.id
            label.textContent = name

            parent.appendChild(label)
            parent.appendChild(element)

            if (additional != false) {
                document.getElementById(`inspector_additional_${name}`).value = additional[name]
            }
        }

        if (type == "bool") {
            let element = document.createElement("input")
            element.type = "checkbox"
            element.id = `inspector_additional_${name}`
            element.onchange = () => save_inspection()

            let label = document.createElement("label")
            label.for = element.id
            label.textContent = name

            parent.appendChild(label)
            parent.appendChild(element)

            if (additional != false) {
                document.getElementById(`inspector_additional_${name}`).checked = additional[name]
            }
        }

        if (type == "int") {
            let element = document.createElement("input")
            element.type = "number"
            element.id = `inspector_additional_${name}`
            element.onchange = () => save_inspection()


            let label = document.createElement("label")
            label.for = element.id
            label.textContent = name

            parent.appendChild(label)
            parent.appendChild(element)

            if (additional != false) {
                document.getElementById(`inspector_additional_${name}`).value = additional[name]
            }
        }
        let br = document.createElement("br")
        parent.append(br)
    });
}

function delete_inspected() {
    if (inspected_block != null) {
        schematic.blocks.splice(inspected_block, 1)
        render(camera_zoom)
        update_hierachy()
        inspected_block = null
        document.getElementById("additional_elements").innerHTML = ""
        document.getElementById("inspect_x").value = ""
        document.getElementById("inspect_y").value = ""
        document.getElementById("inspect_z").value = ""
        document.getElementById("inspect_block_state").value = ""
        auto_save()
    }
}

function clear_inspector() {
    document.getElementById("additional_elements").innerHTML = ""
    document.getElementById("inspect_x").value = ""
    document.getElementById("inspect_y").value = ""
    document.getElementById("inspect_z").value = ""
    document.getElementById("inspect_block_state").value = ""
}

function save_inspection() {
    if (block_list.includes(document.getElementById("inspect_block_state").value)) {
        let states = blocks[block.block_state].states

        let additional = "["

        states.forEach(state => {
            let name = state.name
            let type = state.type
            let value = "error"
            if (type != "bool") {
                value = document.getElementById(`inspector_additional_${name}`).value
            }
            else {
                if (document.getElementById(`inspector_additional_${name}`).checked) {
                    value = "true"
                }
                else {
                    value = "false"
                }
            }
            additional += `${name}=${value},`
        })

        additional = additional.substring(0, additional.length - 1) + "]"

        let x = document.getElementById("inspect_x").value
        let y = document.getElementById("inspect_y").value
        let z = document.getElementById("inspect_z").value

        if (!x) {
            x = 0
        }
        if (!y) {
            y = 0
        }
        if (!z) {
            z = 0
        }
        x = parseInt(x)
        y = parseInt(y)
        z = parseInt(z)





        schematic.blocks[inspected_block] = {
            pos: {
                x: x,
                y: y,
                z: z
            },
            block_state: document.getElementById("inspect_block_state").value,
            additional: additional
        }
        add_block_preload(document.getElementById("inspect_block_state").value)
        update_hierachy()
        inspect_block(inspected_block)
        render(camera_zoom)

        auto_save()
    }
}


function place_button_clicked() {
    let x = document.getElementById("set_pos_x").value
    let y = document.getElementById("set_pos_y").value
    let z = document.getElementById("set_pos_z").value

    if (!x) {
        x = 0
    }
    if (!y) {
        y = 0
    }
    if (!z) {
        z = 0
    }
    x = parseInt(x)
    y = parseInt(y)
    z = parseInt(z)

    let override = false
    let f_block = ""
    let i = 0
    schematic.blocks.forEach(block => {
        if (block.pos.x == x && block.pos.y == y && block.pos.z == z) {
            override = true
            f_block = blocks[block.block_state].name
        }
        i++
    });
    if (override) {
        if (confirm(`Overwrite ${f_block} at ${x}, ${y}, ${z}?`)) {
            set_block(x, y, z, selected_block)
        }
    }
    else {
        set_block(x, y, z, selected_block)
    }
}

function open_json() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', (event) => {
        const file = event.target.files[0];

        if (file && file.type === 'application/json') {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    console.log('JSON Content:', json);
                    schematic = json

                    load_from_data(schematic)

                } catch (error) {
                    console.error('Invalid JSON file');
                    alert('Error: Invalid JSON file!');
                    console.error(error)
                }
            };
            reader.readAsText(file);
        } else {
            alert('Please select a valid JSON file!');
        }
    });
    input.click();
}

function load_from_data(schem) {
    document.getElementById("schematic_name").value = schem.meta.name


    schem.blocks.forEach(block => {
        console.log(block.block_state)
        add_block_preload(block.block_state)

        setTimeout(() => render(camera_zoom), 500)
    });

    schematic = schem
    update_hierachy()

}

function fix_render_bugs() {
    render(camera_zoom)
}
setInterval(fix_render_bugs, 1000)


let schematic = { blocks: [], meta: {} }

let camX = -200
let camY = -200
let camera_zoom = 1

let selected_block = "stone"
let used_blocks = []

let inspected_block = 0

let canvas
let ctx2

const invalid_filename_chars = "|@#¦°§¬¢`?'^\":{}[]¨<>/\\*%&$!";

setTimeout(init, 100)
window.onload = render