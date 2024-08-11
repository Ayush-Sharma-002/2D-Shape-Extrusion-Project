
// Global Variables
var canvas = document.getElementById('myCanvas'); // Get the canvas element from the HTML
var engine = new BABYLON.Engine(canvas, true); // Create a Babylon.js engine to render the scene
var scene = new BABYLON.Scene(engine); // Create a new scene
const camera = new BABYLON.ArcRotateCamera("Camera",  0, Math.PI / 3, 30, BABYLON.Vector3.Zero(), scene); // Create a camera to view the scene
camera.attachControl(canvas, true); // Attach the camera controls to the canvas

// Mode flags
var drawMode = false; // Flag to indicate if the app is in draw mode
var moveMode = false; // Flag to indicate if the app is in move mode
var vertexEditMode = false; // Flag to indicate if the app is in vertex edit mode

// Arrays to store points and shapes
var points = []; // Array to store points for drawing shapes
var shapesToExtrude = []; // Array to store shapes that can be extruded

// Step 0: Set the background color of the scene
scene.clearColor = new BABYLON.Color3(1, 1, 1); // Set the background color to white

// Step 1: Create a ground plane
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 15, height: 35}, scene); // Create a ground mesh
ground.material = new BABYLON.GridMaterial("groundMaterial", scene); // Apply a grid material to the ground

ground.enableEdgesRendering(); // Enable edge rendering for the ground
ground.edgesWidth = 4.0; // Set the width of the edges
ground.edgesColor = new BABYLON.Color4(0, 0, 0, 1); // Set the edge color to black

// Step 2: Draw a 2D shape when in draw mode
scene.onPointerObservable.add(handlePointer); // Add an event listener to handle pointer events

function enterDrawMode() {
    // Enable draw mode and disable other modes
    drawMode = true;
    moveMode = false;
    vertexEditMode = false;
    extrudeMode = false;
}

function handlePointer(pointerInfo) {
    if(drawMode){
        var pickInfo = pointerInfo.pickInfo;
        switch (pointerInfo.type) {

            case BABYLON.PointerEventTypes.POINTERDOWN:

                // If left-click, add points to the shape
                if(pointerInfo.event.inputIndex == 2 && pickInfo.pickedMesh && (pickInfo.pickedMesh.id === "ground" || pickInfo.pickedMesh.id === "lines")){
                    points.push(pickInfo.pickedPoint); // Add picked point to the points array
                    drawPointMarker(pickInfo.pickedPoint); // Draw a marker for the point
                }

                // If right-click, complete the shape
                else if(pointerInfo.event.inputIndex == 4){
                    points.push(points[0]); // Close the shape by connecting to the first point
                    var idx = shapesToExtrude.length;
                    var lines = BABYLON.MeshBuilder.CreateLines("lines"+idx.toString(), {points: points, updatable: true}, scene); // Create lines for the shape
                    lines.color = new BABYLON.Color3(1, 0, 0); // Set the color of the lines to red
                    shapesToExtrude.push(points); // Add the shape to the shapesToExtrude array
                    points = []; // Clear the points array for the next shape
                }

            break;                
        }
    }
}

function drawPointMarker(point) {
    // Draw a sphere marker at the given point

    var curShapeNumber = shapesToExtrude.length;
    var curSphereWithinShape = points.length - 1;
    var sphere = BABYLON.MeshBuilder.CreateSphere("pointMarker" + curShapeNumber.toString() + "_" + curSphereWithinShape.toString(), { diameter: 0.5}, scene); // Create a small sphere at the point
    sphere.position = point; // Position the sphere at the point

    // UI enhancements for the point marker
    var material = new BABYLON.StandardMaterial("pointMarkerMaterial", scene);
    material.emissiveColor = new BABYLON.Color3(1, 1, 1); // Set the color of the sphere to white
    sphere.material = material; // Apply the material to the sphere
}

// Step 3: Extrude the 2D shapes to 3D

var shapesExtruded = [] // Boolean array to track which shapes have been extruded

function extrudeShape(){
    // Enable extrusion mode and disable other modes
    drawMode = false;
    moveMode = false;
    vertexEditMode = false;
    extrudeMode = true;

    for(let i=0; i<shapesToExtrude.length; i++){

        if(i == shapesExtruded.length){
            shapesExtruded.push(false); // Add an entry to the extruded shapes array if needed
        }

        if(shapesExtruded[i] == false){

            // Extrude the shape to a height of 5
            var extrudedShapeUniqueId = "shapeExtruded" + i.toString();
            const extrusion = BABYLON.MeshBuilder.ExtrudePolygon(extrudedShapeUniqueId, {shape: shapesToExtrude[i], depth: 5, updatable: true}, scene);
            extrusion.position.y = 5; // Position the extruded shape above the ground
    
            // UI enhancements for the extruded shape
            var material = new BABYLON.StandardMaterial("extrudedMaterial", scene);
            material.emissiveColor = new BABYLON.Color3(0, 128, 128); // Set the color of the extruded shape
            extrusion.material = material; // Apply the material to the extruded shape
            extrusion.enableEdgesRendering(); // Enable edge rendering
            extrusion.edgesWidth = 4.0; // Set the edge width
            extrusion.edgesColor = new BABYLON.Color4(0, 0, 0, 1); // Set the edge color to black

            // Mark the shape as extruded
            shapesExtruded[i] = true;
        }
        
    }

}

// Step 4: Move or edit the extruded shape

function enterMoveMode() {
    // Enable move mode and disable other modes
    moveMode = true;
    drawMode = false;
    vertexEditMode = false;
    extrudeMode = false;

    runMoveMode(); // Call the function to handle move mode
}

function runMoveMode() {
    // Handle move mode operations

    var canvas = engine.getRenderingCanvas();
    var startingPoint;
    var currentMesh = null;

    var getGroundPosition = function () {
        // Get the position on the ground where the mouse is pointing
        var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
        if (pickinfo.hit) {
            return pickinfo.pickedPoint;
        }
        return null;
    }

    var onPointerDownDrag = function (evt) {
        // Handle pointer down event for moving shapes
        if(moveMode === false){
            canvas.removeEventListener("pointerdown", onPointerDownDrag);
            canvas.removeEventListener("pointerup", onPointerUpDrag);
            canvas.removeEventListener("pointermove", onPointerMoveDrag);
        }
        if (evt.button !== 0) {
            return;
        }

        // Check if the mouse is over a shape that can be moved
        var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh !== ground && mesh.id.startsWith("shapeExtruded"); });
        if (pickInfo.hit) {
            currentMesh = pickInfo.pickedMesh; // Store the selected shape
            startingPoint = getGroundPosition(evt); // Get the starting point for moving

            if (startingPoint) { 
                // Disconnect the camera controls if a shape is selected
                setTimeout(function () {
                    camera.detachControl(canvas);
                }, 0);
            }
        }
    }

    var onPointerUpDrag = function () {
        // Handle pointer up event to stop moving shapes
        if (startingPoint) {
            var material = new BABYLON.StandardMaterial("extrudedMaterial", scene);
            material.emissiveColor = new BABYLON.Color3(0, 128, 128); // Reset the material color
            currentMesh.material = material;
            camera.attachControl(canvas, true); // Reattach the camera controls
            startingPoint = null;
            return;
        }
    }

    var onPointerMoveDrag = function (evt) {
        // Handle pointer move event to update the position of the selected shape
        if (!startingPoint) {
            return;
        }

        var current = getGroundPosition();

        if (!current) {
            return;
        }

        var diff = current.subtract(startingPoint); // Calculate the difference between the current and starting positions

        // Update the 3D shape position
        currentMesh.position.addInPlace(diff);
        var material = new BABYLON.StandardMaterial("extrudedMaterial", scene);
        material.emissiveColor = new BABYLON.Color3(20, 100, 120); // Change the color during the move
        currentMesh.material = material;

        // Update the 2D line mesh position
        var lineMeshId = "lines" + currentMesh.id.slice(13);
        var lineMesh = scene.getMeshByID(lineMeshId);
        lineMesh.position.addInPlace(diff);

        // Update the vertices' positions
        var idx

 = Number(currentMesh.id.slice(13));    
        curPointSet = shapesToExtrude[idx];

        var updatedPath = []
        for(var i=0; i<curPointSet.length; i++){
            sphereName = "pointMarker"+idx.toString() + "_" + i.toString();
            curSphere = scene.getMeshByName(sphereName);
            if(curSphere != null){
                curSphere.position.addInPlace(diff); // Move each point marker
                curPointSet[i] = curSphere.position; // Update the points array
                updatedPath.push(curSphere.position.x);
                updatedPath.push(curSphere.position.y);
                updatedPath.push(curSphere.position.z);
            }
            else{
                console.log("sphere not found: ", sphereName);
                break;
            }
        }

        // Dispose of the old line and create a new one with the updated positions

        var n = curPointSet.length;
        curPointSet[n-1] = curPointSet[0]; // Close the shape by connecting to the first point

        updatedPath.push(updatedPath[0]);
        updatedPath.push(updatedPath[1]);
        updatedPath.push(updatedPath[2]);

        // Create new line mesh and dispose of the old one
        var lineMeshId = "lines" + currentMesh.id.slice(13);
        var lineMesh = scene.getMeshByID(lineMeshId);
        lineMesh.dispose();
        lineMesh = new BABYLON.MeshBuilder.CreateLines(lineMeshId, {points: curPointSet}, scene);
        lineMesh.color = new BABYLON.Color3(0, 1, 0); // Set the color of the new line

        startingPoint = current; // Update the starting point for the next move

    }

    canvas.addEventListener("pointerdown", onPointerDownDrag, false); // Attach event listener for pointer down
    canvas.addEventListener("pointerup", onPointerUpDrag, false); // Attach event listener for pointer up
    canvas.addEventListener("pointermove", onPointerMoveDrag, false); // Attach event listener for pointer move

}

// Step 5: Edit the vertex positions of the shape

function enterVertexEditMode(){
    // Enable vertex edit mode and disable other modes
    vertexEditMode = true;
    moveMode = false;
    drawMode = false;
    extrudeMode = false;
    runVertexEditMode(); // Call the function to handle vertex edit mode
}

function runVertexEditMode(){
    // Handle vertex edit mode operations

    var canvas = engine.getRenderingCanvas();
    var startingPoint;
    var currentMesh;
    var currentMeshNonSphere;

    var isVertex = function (){
        var isVertexBool = false;
        
        // Determine the cursor point from scene 2D coordinates to vector 3D coordinates
        var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, BABYLON.Matrix.Identity(), camera);
        var rayCastHit = scene.pickWithRay(ray);

        // Prepare parameters for a ray perpendicular to the ground in the negative Y axis direction
        var origin = rayCastHit.pickedPoint;
        var direction = new BABYLON.Vector3(0, -1, 0);
        var length = 5;

        var rayPerpedicular = new BABYLON.Ray(origin, direction, length);
        
        // For debugging purposes
        // var rayHelper = new BABYLON.RayHelper(rayPerpedicular);
        // rayHelper.show(scene, new BABYLON.Color3(1, 0, 0)); // Red color

        // Determine all the meshes hit by the perpendicular ray
        var hits = scene.multiPickWithRay(rayPerpedicular);
        if (hits){
            for (var i=0; i<hits.length; i++){
                // If pointMarker on ground is hit, it is a vertex of the extruded polygon
                if(hits[i].pickedMesh.name.startsWith("pointMarker")){
                    currentMeshNonSphere = hits[i].pickedMesh;
                    isVertexBool = true;
                    break;
                }
            }
         }
        return isVertexBool;
    }

    var getGroundPosition = function () {
        // Get the position on the ground where the mouse is pointing
        var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
        if (pickinfo.hit) {
            return pickinfo.pickedPoint;
        }
        return null;
    }

    var onPointerDown = function (evt) {
        // Handle pointer down event for vertex editing
        if(vertexEditMode === false){
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointermove", onPointerMove);
        }

        if (evt.button !== 0) {
            return;
        }

        // Check if the mouse is over a vertex marker or shape
        var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
            console.log(mesh.position);
            return mesh !== ground && (mesh.id.startsWith("pointMarker") || (mesh.id.startsWith("shapeExtruded") && isVertex())); });
        if (pickInfo.hit) {
            currentMesh = pickInfo.pickedMesh; // Store the selected mesh
            console.log("current meshhh: ", currentMesh);
            if(!currentMesh.id.startsWith("pointMarker"))
                currentMesh = currentMeshNonSphere;
            console.log("picked mesh: ", currentMesh);
            startingPoint = getGroundPosition(evt); // Get the starting point for vertex editing

            if (startingPoint) { 
                // Disconnect the camera controls if a shape is selected
                setTimeout(function () {
                    camera.detachControl(canvas);
                }, 0);
            }
        }
    }

    var onPointerUp = function () {
        // Handle pointer up event to stop vertex editing
        if (startingPoint) {
            camera.attachControl(canvas, true); // Reattach the camera controls
            startingPoint = null;            
            return;
        }
    }

    var onPointerMove = function (evt) {
        // Handle pointer move event to update the position of the selected vertex
        if (!startingPoint) {
            return;
        }

        var current = getGroundPosition(evt);

        if (!current) {
            return;
        }

        // Update the position of the selected vertex
        var diff = current.subtract(startingPoint);
        currentMesh.position.addInPlace(diff);

        // Update the line mesh 2D shape
        var curMeshIdxs = currentMesh.id.split("_");
        var lineMeshId = "lines" + curMeshIdxs[0].slice(11);
        var pointToUpdate = Number(curMeshIdxs[1]);
        var lineMesh = scene.getMeshByID(lineMeshId);
        
        var positions = lineMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        var startIdx = 3*Number(pointToUpdate);
        
        positions[startIdx] = currentMesh.position.x;
        positions[startIdx+1] = currentMesh.position.y;
        positions[startIdx+2] = currentMesh.position.z;

        if(startIdx == 0){
            var n = positions.length;
            positions[n-3] = positions[startIdx];
            positions[n-2] = positions[startIdx+1];
            positions[n-1] = positions[startIdx+2];
        }

        var myPoints = [];

        for (var i = 0; i < positions.length; i += 3) {
            var x = positions[i];
            var y = positions[i + 1];
            var z = positions[i + 2];

            myPoints.push(new BABYLON.Vector3(x, y, z));
        }

        lineMesh.dispose(); // Dispose of the existing mesh
        lineMesh = BABYLON.MeshBuilder.CreateLines(lineMeshId, { points: myPoints, updatable: true}, scene); // Create new line mesh with updated points
        lineMesh.color = new BABYLON.Color3(0, 0, 1); // Set the color of the new line
        
        // Update the extruded polygon
        var extrudedMeshId = "shapeExtruded" + curMeshIdxs[0].slice(11);
        var extrudedMesh = scene.getMeshByID(extrudedMeshId);
        extrudedMesh.dispose();
        extrudedMesh = BABYLON.MeshBuilder.ExtrudePolygon(extrudedMeshId, {shape: myPoints, depth: 5, updatable: true}, scene);
        extrudedMesh.position.y = 5;
        
        var material = new BABYLON.StandardMaterial("extrudedMaterial", scene);
        material.emissiveColor = new BABYLON.Color3(0, 128, 128); // Set the color of the extruded shape
        extrudedMesh.material = material;
        extrudedMesh.enableEdgesRendering();
        extrudedMesh.edgesWidth = 4.0; // Set the width of the edges
        extrudedMesh.edgesColor = new BABYLON.Color4(0, 0, 0, 1); // Set the color of the edges

        startingPoint = current; // Update the starting point for the next move

    }

    canvas.addEventListener("pointerdown", onPointerDown, false); // Attach event listener for pointer down
    canvas.addEventListener("pointerup", onPointerUp, false); // Attach event listener for pointer up
    canvas.addEventListener("pointermove", onPointerMove, false); // Attach event listener for pointer move

}
    
// Run the app
engine.runRenderLoop(function(){
    scene.render(); // Render the scene in a loop
}); 

