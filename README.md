# 2D Shape Extrusion and Manipulation

## Overview

This project is a Babylon.js application that enables users to draw arbitrary 2D shapes on a ground plane, extrude them into 3D objects, and then manipulate these objects by moving or editing their vertices. The application provides an interactive 3D environment where users can easily switch between drawing, extrusion, moving, and editing modes using buttons.

## Features

1. 3D Scene with Ground Plane:
   - A 3D environment with a grid-textured ground plane as the drawing surface.

2. **Draw Mode**:
   - Allows users to draw 2D shapes directly on the ground plane.
   - **Draw Button**: Activate the drawing mode.
   - **Left-click**: Add points to define the shape.
   - **Right-click**: Complete the shape.

3. **Extrude Mode**:
   - Convert the drawn 2D shapes into 3D objects with a fixed extrusion height of 5 units.
   - **Extrude Button**: Activate the extrusion process.

4. **Move Mode**:
   - Enables users to move extruded shapes across the ground plane.
   - **Move Button**: Activate the movement mode.

5. **Vertex Edit Mode**:
   - Allows users to modify the vertices of the extruded shapes.
   - **Edit Button**: Activate the vertex editing mode.

6. **Visual Cues and UI Elements**:
   - Visual markers and UI buttons to indicate the selected object and active mode.
   - Color changes and markers help guide user interactions.

## How to Run the Application

 **Open the Application**:
   - Open the `index.html` file in your preferred web browser to launch the application.

## Usage Instructions

- **Draw Mode**:
  - Click the "Draw" button to enter draw mode.
  - Use **left-click** to add points to your shape.
  - Use **right-click** to complete the shape.
  - Click "Draw" again to exit draw mode.

- **Extrude Mode**:
  - Click the "Extrude" button to extrude the drawn shapes into 3D objects with a fixed height of 5 units.

- **Move Mode**:
  - Click the "Move" button to move extruded shapes around the ground plane.
  - Drag the shape to the desired position.

- **Vertex Edit Mode**:
  - Click the "Vertex Edit" button to modify the vertices of extruded shapes.
  - Select and drag individual vertices to adjust the shape.

## Requirements

- A modern web browser (e.g., Chrome, Firefox, Edge) with JavaScript enabled.
- Internet connection to load Babylon.js dependencies if running the application for the first time.

