#HTMatica
## Table of contents
[TOC]
## What is this?
This repository hosts a webserver on [localhost:5000], that lets you edit simple Minecraft schematics in your browser. It uses the lightweight library _flask_ to do all the backend stuff and the _mc-schematics_ library to compile the schematics.
## Features
### Simple GUI
The in-browser GUI is simple and clean. It's easy to install new versions and manage blocks. The GUI features an isometric preview of the schematic. Drag around to move the camera, scroll to zoom.
### Simple block placement functionality
At the time being, you can only place single blocks. A fill command will be added in close future.
### Hierachy & Inspector
You can check, move, change and destroy blocks from the hierachy on the top right.
### Blocks from different versions (Ranging from 1.12 to 1.21.4) & block history
Using the version manager, you can install block data for versions ranging from 1.12 to 1.21.4. The blocks can then be searched and selected. The 10 most recently used blocks are shown in a container above the main block list. _Hint: Type "*" to show all available blocks (Can destroy your performance though)_
### Export to different formats
You can either export the schematic to the .json format of the .schem format (Compatible with Schematica/Litematica)
### Easy renders
Just right click the viewport and select "Save image" to get an image of your schematic.