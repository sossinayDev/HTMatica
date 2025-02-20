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

    let prompt = document.getElementById("search").value.toLowerCase().replace(" ", "_")



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

            // Log the updated camera position
            console.log(`Camera moved to: (${camX}, ${camY})`);

            // Update last mouse positions
            lastMouseX = mouseX;
            lastMouseY = mouseY;

            // Optionally, redraw your scene here using the updated camX and camY
            render(camera_zoom)
        }
    });

    // Mouse up event
    canvas.addEventListener('mouseup', () => {
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
            camX += canvas.clientWidth/50*camera_zoom/2
            camY += canvas.clientHeight/50*camera_zoom/2
        } else {
            camX -= canvas.clientWidth/50*camera_zoom/2
            camY -= canvas.clientHeight/50*camera_zoom/2
            camera_zoom /= 1.1;  // Zoom out
        }

        // Redraw the canvas with updated zoom
        render(camera_zoom);
    });
}

function set_block(x, y, z, blockstate) {
    if (!(used_blocks.includes(blockstate))) {
        used_blocks.push(blockstate)
        let i = document.createElement("img")
        i.src = `blocks/${blockstate}`
        i.style.display = "none"
        document.querySelector(".sidebar.left-sidebar").appendChild(i)
    }

    let i = 0
    schematic.blocks.forEach(block => {
        if (block.pos.x == x && block.pos.y == y && block.pos.z == z) {
            console.log(schematic.blocks.splice(i, 1))
        }
        i++
    });

    schematic.blocks.push(
        {
            pos: {
                x: x,
                y: y,
                z: z
            },
            block_state: blockstate
        })

    update_hierachy()
    render(camera_zoom)
}

function render(scale) {
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
        // Calculate isometric position
        let posX = (block.pos.x * scale * 90) - (block.pos.z * scale * 90) - camX;
        let posY = (block.pos.x / 2 * scale * 90) + (block.pos.z / 2 * scale * 90) - (block.pos.y * scale * 90) - camY + (block.pos.z * scale * 8) + (block.pos.x * scale * 8) - (block.pos.y * scale * 14);

        // Get the block image and render it
        let img = document.getElementById("placement_block_img");
        img.src = `/blocks/${block.block_state}`;
        ctx2.drawImage(img, posX, posY, scale * 256, scale * 256);

        console.log(`Block ${block.block_state} at: (${block.pos.x}, ${block.pos.y}, ${block.pos.z}) rendered at (${posX}, ${posY})`);
    });
}

function export_json() {
    let filename = document.getElementById("schematic_name").value.replace(" ", "_").toLowerCase() + ".json"
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
}

function inspect_block(i) {
    console.log(i)
    inspected_block = i
    block = schematic.blocks[i]
    document.getElementById("inspect_x").value = block.pos.x
    document.getElementById("inspect_y").value = block.pos.y
    document.getElementById("inspect_z").value = block.pos.z
    document.getElementById("inspect_block_state").value = block.block_state
    if ("additional" in block) {
        document.getElementById("inspect_additional").value = block.additional
    }
    else {
        document.getElementById("inspect_additional").value = ""
    }
}

function delete_inspected() {
    schematic.blocks.splice(inspected_block, 1)
    render(camera_zoom)
    update_hierachy()
}

function save_inspection() {
    if (block_list.includes(document.getElementById("inspect_block_state").value)) {
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
            additional: document.getElementById("inspect_additional").value
        }
        if (!(used_blocks.includes(document.getElementById("inspect_block_state").value))) {
            used_blocks.push(document.getElementById("inspect_block_state").value)
            let i = document.createElement("img")
            i.src = `blocks/${document.getElementById("inspect_block_state").value}`
            i.onload = () => render(camera_zoom)
            i.style.display = "none"
            document.querySelector(".sidebar.left-sidebar").appendChild(i)
        }
        render(camera_zoom)
        update_hierachy()
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
    let block = ""
    let i = 0
    schematic.blocks.forEach(block => {
        if (block.pos.x == x && block.pos.y == y && block.pos.z == z) {
            override = true
            block = block.block_state
        }
        i++
    });
    if (override) {
        if (confirm(`Overwrite ${block} at ${x}, ${y}, ${z}?`)) {
            set_block(x, y, z, selected_block)
        }
    }
    else {
        set_block(x, y, z, selected_block)
    }
}

function save_inpection() {

}


let schematic = { blocks: [], meta: {} }

let camX = -200
let camY = -200
let camera_zoom = 1

let selected_block = "stone"
let used_blocks = []

let inspected_block = 0

let canvas
let ctx2

setTimeout(init, 100)
