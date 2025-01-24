import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DoublePendulum } from './doublePendulum.js';
import { createEducationalPanel } from './education.js';

// Dynamic Systems Equations
const systems = {
    doublePendulum: {
        name: 'Double Pendulum',
        params: { 
            m1: 1.0, 
            m2: 1.0, 
            l1: 1.0, 
            l2: 1.0, 
            g: 9.81, 
            damping: 0.0 
        },
        equations: null, // Special handling in simulator
        defaultState: [Math.PI/2, 0, Math.PI/2, 0]
    },
    lorenz: {
        name: 'Lorenz Attractor',
        params: { sigma: 10, rho: 28, beta: 8/3 },
        equations: (x, y, z, params) => ({
            dx: params.sigma * (y - x),
            dy: x * (params.rho - z) - y,
            dz: x * y - params.beta * z
        }),
        defaultState: [1, 1, 1]
    },
    rossler: {
        name: 'Rössler Attractor',
        params: { a: 0.2, b: 0.2, c: 5.7 },
        equations: (x, y, z, params) => ({
            dx: -y - z,
            dy: x + params.a * y,
            dz: params.b + z * (x - params.c)
        }),
        defaultState: [1, 1, 1]
    },
    vanDerPol: {
        name: 'Van der Pol Oscillator',
        params: { mu: 1 },
        equations: (x, y, z, params) => ({
            dx: y,
            dy: params.mu * (1 - x * x) * y - x,
            dz: 0
        }),
        defaultState: [1, 1, 0]
    },
    pointAttractor: {
        name: 'Point Attractor',
        params: { lambda: 1 },
        equations: (x, y, z, params) => ({
            dx: -params.lambda * x,
            dy: -params.lambda * y,
            dz: -params.lambda * z
        }),
        defaultState: [1, 1, 1]
    },
    pointRepeller: {
        name: 'Point Repeller',
        params: { lambda: 1 },
        equations: (x, y, z, params) => ({
            dx: params.lambda * x,
            dy: params.lambda * y,
            dz: params.lambda * z
        }),
        defaultState: [0.1, 0.1, 0.1]
    }
};

class DynamicalSystemSimulator {
    constructor() {
        this.setupScene();
        this.setupUI();
        
        // Create pendulum visualization elements
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x00fff2 });
        this.bob1 = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.bob2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
        
        // Create pendulum rods
        const rodGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1);
        rodGeometry.rotateZ(Math.PI / 2);  // Make cylinder horizontal
        const rodMaterial = new THREE.MeshPhongMaterial({ color: 0xff00ff });
        
        // Create rod meshes
        this.rod1 = new THREE.Mesh(rodGeometry.clone(), rodMaterial);
        this.rod2 = new THREE.Mesh(rodGeometry.clone(), rodMaterial);
        
        // Create pivot points as groups to handle rotations
        this.rod1Pivot = new THREE.Group();
        this.rod2Pivot = new THREE.Group();
        
        // Add rods to pivots
        this.rod1Pivot.add(this.rod1);
        this.rod2Pivot.add(this.rod2);
        
        // Add pivots to scene
        this.scene.add(this.rod1Pivot);
        this.scene.add(this.rod2Pivot);
        
        // Add pendulum elements to scene (only bobs and pivots, rods are already added via pivots)
        this.scene.add(this.bob1);
        this.scene.add(this.bob2);
        
        // Hide pendulum elements initially
        this.setPendulumVisibility(false);
        
        this.initializeSystem('lorenz');
        this.animate();
    }

    setPendulumVisibility(visible) {
        this.bob1.visible = visible;
        this.bob2.visible = visible;
        this.rod1Pivot.visible = visible;
        this.rod2Pivot.visible = visible;
    }

    setupScene() {
        // Get existing visualization container
        this.visualizationContainer = document.querySelector('.visualization');

        // Main 3D view
        this.scene = new THREE.Scene();
        const mainView = document.createElement('div');
        mainView.className = 'panel holographic';
        this.visualizationContainer.appendChild(mainView);
        
        // Calculate view dimensions based on container size
        const updateViewDimensions = () => {
            const container = mainView.getBoundingClientRect();
            const viewWidth = container.width - 30;  // Account for padding
            const viewHeight = container.height - 30;
            
            this.camera.aspect = viewWidth / viewHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(viewWidth, viewHeight);
        };
        
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setClearColor(0x0a0a0f, 1);
        mainView.appendChild(this.renderer.domElement);
        
        // Initial size setup
        setTimeout(updateViewDimensions, 0);
        
        // Update sizes on window resize
        window.addEventListener('resize', updateViewDimensions);

        // Set initial camera position
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);

        // Enable camera controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.rotateSpeed = 1.5;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 1.0;

        // 2D Projections
        this.projections = {
            xy: this.create2DProjection('X-Y Projection'),
            yz: this.create2DProjection('Y-Z Projection'),
            xz: this.create2DProjection('X-Z Projection')
        };

        // Time series canvas
        this.timeSeriesCanvas = document.createElement('canvas');
        this.timeSeriesCanvas.width = window.innerWidth / 2;
        this.timeSeriesCanvas.height = window.innerHeight / 4;
        const timeSeriesPanel = document.createElement('div');
        timeSeriesPanel.className = 'panel';
        timeSeriesPanel.appendChild(this.timeSeriesCanvas);
        this.visualizationContainer.appendChild(timeSeriesPanel);

        // Initialize time series data
        this.timeSeriesData = {
            x: [],
            y: [],
            z: [],
            time: []
        };

        // Set initial camera zoom
        this.camera.position.z = 50;

        // Trajectory
        this.trajectory = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({ 
            vertexColors: true,
            linewidth: 2 
        });
        this.line = new THREE.Line(this.trajectory, material);
        this.scene.add(this.line);

        // Vector field
        this.vectorField = new THREE.Group();
        this.scene.add(this.vectorField);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x00fff2, 1);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);

        // Grid helper with custom colors
        const gridHelper = new THREE.GridHelper(100, 20, 0x00fff2, 0x00fff2);
        this.scene.add(gridHelper);

        // Handle window resize
        const handleResize = () => {
            updateViewDimensions();
            
            // Update 2D projections
            Object.values(this.projections).forEach(proj => {
                const container = proj.canvas.parentElement.getBoundingClientRect();
                proj.canvas.width = container.width - 30;
                proj.canvas.height = container.height - 50;
            });

            // Update time series
            const timeSeriesContainer = this.timeSeriesCanvas.parentElement.getBoundingClientRect();
            this.timeSeriesCanvas.width = timeSeriesContainer.width - 30;
            this.timeSeriesCanvas.height = timeSeriesContainer.height - 50;

            // Force redraw of all views
            this.updateProjections();
            this.updateTimeSeries();
        };
        
        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 0);
    }

    setupUI() {
        const controlPanel = document.querySelector('.control-panel');

        // Educational panel container
        this.educationalContainer = document.createElement('div');
        this.educationalContainer.className = 'educational-container';
        controlPanel.appendChild(this.educationalContainer);

        // System selector
        const systemSelect = document.createElement('select');
        systemSelect.className = 'dropdown';
        Object.keys(systems).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = systems[key].name;
            systemSelect.appendChild(option);
        });
        systemSelect.addEventListener('change', (e) => this.initializeSystem(e.target.value));
        controlPanel.appendChild(systemSelect);

        // Parameters UI will be dynamically updated based on selected system
        this.paramsContainer = document.createElement('div');
        this.paramsContainer.className = 'panel';
        controlPanel.appendChild(this.paramsContainer);

        // Playback controls
        const playbackControls = document.createElement('div');
        playbackControls.className = 'panel';
        
        const playPauseBtn = document.createElement('button');
        playPauseBtn.className = 'button';
        playPauseBtn.textContent = 'Pause';
        playPauseBtn.onclick = () => {
            this.isRunning = !this.isRunning;
            playPauseBtn.textContent = this.isRunning ? 'Pause' : 'Play';
        };
        
        const resetBtn = document.createElement('button');
        resetBtn.className = 'button';
        resetBtn.textContent = 'Reset';
        resetBtn.onclick = () => this.reset();

        playbackControls.appendChild(playPauseBtn);
        playbackControls.appendChild(resetBtn);
        
        // Save/Load controls
        const saveBtn = document.createElement('button');
        saveBtn.className = 'button';
        saveBtn.textContent = 'Save Config';
        saveBtn.onclick = () => this.saveConfiguration();
        
        const loadInput = document.createElement('input');
        loadInput.type = 'file';
        loadInput.accept = '.json';
        loadInput.style.display = 'none';
        loadInput.onchange = (e) => this.loadConfiguration(e.target.files[0]);
        
        const loadBtn = document.createElement('button');
        loadBtn.className = 'button';
        loadBtn.textContent = 'Load Config';
        loadBtn.onclick = () => loadInput.click();

        // Export controls
        const exportBtn = document.createElement('button');
        exportBtn.className = 'button';
        exportBtn.textContent = 'Export View';
        exportBtn.onclick = () => this.exportVisualization();

        // Share button
        const shareBtn = document.createElement('button');
        shareBtn.className = 'button';
        shareBtn.textContent = 'Share Config';
        shareBtn.onclick = () => this.shareConfiguration();
        
        playbackControls.appendChild(saveBtn);
        playbackControls.appendChild(loadBtn);
        playbackControls.appendChild(loadInput);
        playbackControls.appendChild(exportBtn);
        playbackControls.appendChild(shareBtn);
        controlPanel.appendChild(playbackControls);
    }

    create2DProjection(title) {
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth / 4;
        canvas.height = window.innerHeight / 4;
        
        const panel = document.createElement('div');
        panel.className = 'panel';
        
        const titleElement = document.createElement('div');
        titleElement.textContent = title;
        titleElement.className = 'projection-title';
        
        panel.appendChild(titleElement);
        panel.appendChild(canvas);
        this.visualizationContainer.appendChild(panel);
        
        return {
            canvas,
            context: canvas.getContext('2d'),
            data: []
        };
    }

    saveConfiguration() {
        const config = {
            system: this.currentSystem.name,
            parameters: this.currentParams,
            state: this.state
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentSystem.name.toLowerCase()}_config.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async loadConfiguration(file) {
        try {
            const text = await file.text();
            const config = JSON.parse(text);
            
            const systemKey = Object.keys(systems).find(
                key => systems[key].name === config.system
            );
            
            if (!systemKey) throw new Error('Invalid system in configuration file');
            
            this.initializeSystem(systemKey);
            this.currentParams = { ...config.parameters };
            this.state = [...config.state];
            
            // Update UI
            this.updateParameterControls();
            this.reset();
        } catch (error) {
            console.error('Error loading configuration:', error);
            alert('Error loading configuration file');
        }
    }

    exportVisualization() {
        // Create a composite canvas of all views
        const canvas = document.createElement('canvas');
        const width = this.renderer.domElement.width * 2;
        const height = this.renderer.domElement.height * 2;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw main 3D view
        ctx.drawImage(this.renderer.domElement, 0, 0, width/2, height/2);

        // Draw projections
        ctx.drawImage(this.projections.xy.canvas, width/2, 0, width/4, height/4);
        ctx.drawImage(this.projections.yz.canvas, width/2, height/4, width/4, height/4);
        ctx.drawImage(this.projections.xz.canvas, width*3/4, 0, width/4, height/4);

        // Draw time series
        ctx.drawImage(this.timeSeriesCanvas, width/2, height/2, width/2, height/4);

        // Export
        const link = document.createElement('a');
        link.download = `${this.currentSystem.name.toLowerCase()}_visualization.png`;
        link.href = canvas.toDataURL();
        link.click();
    }

    shareConfiguration() {
        const config = {
            system: this.currentSystem.name,
            parameters: this.currentParams,
            state: this.state
        };
        
        const queryString = btoa(JSON.stringify(config));
        const url = `${window.location.href.split('?')[0]}?config=${queryString}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            alert('Configuration URL copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy URL:', err);
            alert('Failed to copy URL to clipboard');
        });
    }

    updateParameterControls() {
        this.paramsContainer.innerHTML = '';
        Object.entries(this.currentParams).forEach(([key, value]) => {
            const container = document.createElement('div');
            container.className = 'slider-container';
            
            const label = document.createElement('label');
            label.textContent = key;
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'slider';
            slider.min = '0';
            slider.max = value * 2;
            slider.step = value / 100;
            slider.value = value;
            
            const valueDisplay = document.createElement('input');
            valueDisplay.type = 'number';
            valueDisplay.className = 'input-box';
            valueDisplay.value = value;
            
            slider.oninput = () => {
                this.currentParams[key] = parseFloat(slider.value);
                valueDisplay.value = slider.value;
            };
            
            valueDisplay.onchange = () => {
                this.currentParams[key] = parseFloat(valueDisplay.value);
                slider.value = valueDisplay.value;
            };
            
            container.appendChild(label);
            container.appendChild(slider);
            container.appendChild(valueDisplay);
            this.paramsContainer.appendChild(container);
        });
    }

    initializeSystem(systemKey) {
        this.currentSystem = systems[systemKey];
        this.currentParams = { ...this.currentSystem.params };

        // Update educational panel
        this.educationalContainer.innerHTML = '';
        const educationalPanel = createEducationalPanel(systemKey);
        if (educationalPanel) {
            this.educationalContainer.appendChild(educationalPanel);
        }
        
        // Handle pendulum visibility and initialization
        if (systemKey === 'doublePendulum') {
            this.doublePendulum = new DoublePendulum(this.currentParams);
            this.state = this.doublePendulum.getState();
            this.setPendulumVisibility(true);
            // Adjust camera for better pendulum view
            this.camera.position.set(0, 0, 15);
            this.camera.lookAt(0, 0, 0);
        } else {
            this.doublePendulum = null;
            this.state = [...this.currentSystem.defaultState];
            this.setPendulumVisibility(false);
            // Reset camera for other systems
            this.camera.position.set(15, 15, 15);
            this.camera.lookAt(0, 0, 0);
        }
        
        this.positions = [];
        this.colors = [];
        this.isRunning = true;
        
        // Clear projections and time series
        Object.values(this.projections).forEach(proj => {
            proj.data = [];
            proj.context.clearRect(0, 0, proj.canvas.width, proj.canvas.height);
        });
        
        this.timeSeriesData = { x: [], y: [], z: [], time: [] };
        
        // Clear existing parameter controls
        this.paramsContainer.innerHTML = '';
        
        // Create parameter controls
        Object.entries(this.currentParams).forEach(([key, value]) => {
            const container = document.createElement('div');
            container.className = 'slider-container';
            
            const label = document.createElement('label');
            label.textContent = key;
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'slider';
            slider.min = '0';
            slider.max = value * 2;
            slider.step = value / 100;
            slider.value = value;
            
            const valueDisplay = document.createElement('input');
            valueDisplay.type = 'number';
            valueDisplay.className = 'input-box';
            valueDisplay.value = value;
            
            slider.oninput = () => {
                this.currentParams[key] = parseFloat(slider.value);
                valueDisplay.value = slider.value;
            };
            
            valueDisplay.onchange = () => {
                this.currentParams[key] = parseFloat(valueDisplay.value);
                slider.value = valueDisplay.value;
            };
            
            container.appendChild(label);
            container.appendChild(slider);
            container.appendChild(valueDisplay);
            this.paramsContainer.appendChild(container);
        });

        this.updateVectorField();
    }

    updateVectorField() {
        // Clear existing vector field
        while(this.vectorField.children.length > 0) {
            this.vectorField.remove(this.vectorField.children[0]);
        }

        // Skip vector field for double pendulum
        if (this.currentSystem.name === 'Double Pendulum') {
            return;
        }

        // Create new vector field
        const gridSize = 5;
        const spacing = 5;
        
        for(let x = -gridSize; x <= gridSize; x++) {
            for(let y = -gridSize; y <= gridSize; y++) {
                for(let z = -gridSize; z <= gridSize; z++) {
                    const position = new THREE.Vector3(x * spacing, y * spacing, z * spacing);
                    if (this.currentSystem.equations) {
                        const derivatives = this.currentSystem.equations(
                            position.x, 
                            position.y, 
                            position.z, 
                            this.currentParams
                        );
                        
                        const direction = new THREE.Vector3(
                            derivatives.dx,
                            derivatives.dy,
                            derivatives.dz
                        ).normalize();

                        const arrowHelper = new THREE.ArrowHelper(
                            direction,
                            position,
                            spacing * 0.8,
                            0x00fff2,
                            spacing * 0.2,
                            spacing * 0.1
                        );
                        
                        this.vectorField.add(arrowHelper);
                    }
                }
            }
        }
    }

    reset() {
        this.state = [...this.currentSystem.defaultState];
        this.positions = [];
        this.colors = [];
        this.updateTrajectory();
    }

    updateTrajectory() {
        const positions = new Float32Array(this.positions.flat());
        const colors = new Float32Array(this.colors.flat());
        
        this.trajectory.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trajectory.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        this.trajectory.attributes.position.needsUpdate = true;
        this.trajectory.attributes.color.needsUpdate = true;
    }

    integrate(dt = 0.01) {
        if (!this.isRunning) return;

        let velocity = 0;
        let pos;

        if (this.currentSystem.name === 'Double Pendulum') {
            const pendulumPos = this.doublePendulum.step(dt);
            this.state = this.doublePendulum.getState();
            
            // Update pendulum visualization
            const { x1, y1, x2, y2 } = pendulumPos;
            
            // Position bobs
            this.bob1.position.set(x1, y1, 0);
            this.bob2.position.set(x2, y2, 0);
            
            // Calculate rod lengths and angles
            const l1 = Math.sqrt(x1*x1 + y1*y1);
            const l2 = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
            const angle1 = Math.atan2(y1, x1);
            const angle2 = Math.atan2(y2-y1, x2-x1);
            
            // Update rod lengths
            this.rod1.scale.x = l1;
            this.rod2.scale.x = l2;
            
            // Position rods at their centers
            this.rod1.position.x = l1/2;
            this.rod2.position.x = l2/2;
            
            // Position and rotate pivots
            this.rod1Pivot.position.set(0, 0, 0);
            this.rod2Pivot.position.set(x1, y1, 0);
            this.rod1Pivot.rotation.z = angle1;
            this.rod2Pivot.rotation.z = angle2;
            
            pos = [x2, y2, 0];
            
            // Calculate velocity for double pendulum
            const [, omega1, , omega2] = this.state;
            velocity = Math.sqrt(omega1 * omega1 + omega2 * omega2);
        } else {
            const derivatives = this.currentSystem.equations(
                this.state[0],
                this.state[1],
                this.state[2],
                this.currentParams
            );

            this.state[0] += derivatives.dx * dt;
            this.state[1] += derivatives.dy * dt;
            this.state[2] += derivatives.dz * dt;
            
            pos = [this.state[0], this.state[1], this.state[2]];
            
            // Calculate velocity for other systems
            velocity = Math.sqrt(
                derivatives.dx * derivatives.dx +
                derivatives.dy * derivatives.dy +
                derivatives.dz * derivatives.dz
            );
        }

        // Update positions array
        this.positions.push(pos);
        
        // Store data for projections
        Object.values(this.projections).forEach(proj => {
            if (proj.data.length > 1000) proj.data.shift();
            proj.data.push([...pos]);
        });

        // Update time series
        const currentTime = this.timeSeriesData.time.length * dt;
        if (this.timeSeriesData.x.length > 200) {
            this.timeSeriesData.x.shift();
            this.timeSeriesData.y.shift();
            this.timeSeriesData.z.shift();
            this.timeSeriesData.time.shift();
        }
        this.timeSeriesData.x.push(pos[0]);
        this.timeSeriesData.y.push(pos[1]);
        this.timeSeriesData.z.push(pos[2]);
        this.timeSeriesData.time.push(currentTime);

        // Calculate color based on velocity
        const hue = (velocity * 0.1) % 1;
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        this.colors.push([color.r, color.g, color.b]);

        // Limit trajectory length
        if (this.positions.length > 1000) {
            this.positions.shift();
            this.colors.shift();
        }

        this.updateTrajectory();
        this.updateProjections();
        this.updateTimeSeries();
    }

    updateProjections() {
        // Update XY projection
        this.drawProjection(this.projections.xy, 0, 1);
        // Update YZ projection
        this.drawProjection(this.projections.yz, 1, 2);
        // Update XZ projection
        this.drawProjection(this.projections.xz, 0, 2);
    }

    drawProjection(projection, xIndex, yIndex) {
        const { canvas, context, data } = projection;
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        if (data.length < 2) return;

        // Find min/max for scaling
        const xValues = data.map(p => p[xIndex]);
        const yValues = data.map(p => p[yIndex]);
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        
        const padding = 20;
        const xScale = (canvas.width - 2 * padding) / (xMax - xMin || 1);
        const yScale = (canvas.height - 2 * padding) / (yMax - yMin || 1);

        // Draw trajectory
        context.beginPath();
        context.strokeStyle = '#00fff2';
        context.lineWidth = 1;
        
        data.forEach((point, i) => {
            const x = padding + (point[xIndex] - xMin) * xScale;
            const y = canvas.height - (padding + (point[yIndex] - yMin) * yScale);
            
            if (i === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        });
        
        context.stroke();
    }

    updateTimeSeries() {
        const ctx = this.timeSeriesCanvas.getContext('2d');
        const width = this.timeSeriesCanvas.width;
        const height = this.timeSeriesCanvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(0, 255, 242, 0.1)';
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let x = 0; x < width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let y = 0; y < height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw time series
        const variables = [
            { data: this.timeSeriesData.x, color: '#00fff2' },
            { data: this.timeSeriesData.y, color: '#ff00ff' },
            { data: this.timeSeriesData.z, color: '#0066ff' }
        ];
        
        variables.forEach(({ data, color }) => {
            if (data.length < 2) return;
            
            const yMin = Math.min(...data);
            const yMax = Math.max(...data);
            const yScale = (height - 40) / (yMax - yMin || 1);
            
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            data.forEach((value, i) => {
                const x = (i / data.length) * width;
                const y = height - 20 - (value - yMin) * yScale;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.integrate();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the simulator when the page loads
window.addEventListener('load', () => {
    new DynamicalSystemSimulator();
});
