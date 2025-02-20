import mcschematic
import json

def json_to_schem(data, directory: str="C:\\Users\\yanis\\Documents\\mc-schematics"):
    schematic = mcschematic.MCSchematic()
    print(data)
    name = data["meta"]["name"]
    print(name)
    for block in data["blocks"]:
        if "additional_data" in block.keys():
            schematic.setBlock(
                                (
                                    block["pos"]["x"],
                                    block["pos"]["y"],
                                    block["pos"]["z"]
                                ),
                                block["block_state"]+"["+block["additional_data"]+"]"
                            )
        else:
            schematic.setBlock(
                                (
                                    block["pos"]["x"],
                                    block["pos"]["y"],
                                    block["pos"]["z"]
                                ),
                                block["block_state"]
                            )
    schematic.save(directory,name,mcschematic.Version.JE_23W18A)
    return f"{directory}\\{name}.schem"

VERSIONS = {
    "1.12": mcschematic.Version.JE_1_12,
    "1.12.1": mcschematic.Version.JE_1_12_1,
    "1.12.2": mcschematic.Version.JE_1_12_2,
    "1.13": mcschematic.Version.JE_1_13,
    "1.13.1": mcschematic.Version.JE_1_13_1,
    "1.13.2": mcschematic.Version.JE_1_13_2,
    "1.14": mcschematic.Version.JE_1_14,
    "1.14.1": mcschematic.Version.JE_1_14_1,
    "1.14.3": mcschematic.Version.JE_1_14_3,
    "1.14.4": mcschematic.Version.JE_1_14_4,
    "1.15": mcschematic.Version.JE_1_15,
    "1.15.1": mcschematic.Version.JE_1_15_1,
    "1.15.2": mcschematic.Version.JE_1_15_2,
    "1.16": mcschematic.Version.JE_1_16,
    "1.16.1": mcschematic.Version.JE_1_16_1,
    "1.16.2": mcschematic.Version.JE_1_16_2,
    "1.16.3": mcschematic.Version.JE_1_16_3,
    "1.16.4": mcschematic.Version.JE_1_16_4,
    "1.16.5": mcschematic.Version.JE_1_16_5,
    "1.17": mcschematic.Version.JE_1_17,
    "1.17.1": mcschematic.Version.JE_1_17_1,
    "1.18": mcschematic.Version.JE_1_18,
    "1.18.1": mcschematic.Version.JE_1_18_1,
    "1.18.2": mcschematic.Version.JE_1_18_2,
    "1.19": mcschematic.Version.JE_1_19,
    "1.19.1": mcschematic.Version.JE_1_19_1,
    "1.19.2": mcschematic.Version.JE_1_19_2,
    "1.19.3": mcschematic.Version.JE_1_19_3,
    "1.19.4": mcschematic.Version.JE_1_19_4,
    "1.20": mcschematic.Version.JE_1_20,
    "1.20.1": mcschematic.Version.JE_1_20_1,
    "1.21.1": mcschematic.Version.JE_23W18A,
    "1.21.2": mcschematic.Version.JE_23W18A,
    "1.21.3": mcschematic.Version.JE_23W18A,
    "1.21.4": mcschematic.Version.JE_23W18A
}