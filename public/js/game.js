// Game Configuration
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE, // Resize to fit parent
        parent: 'game-container',
        width: '100%',
        height: '100%'
    },
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    pixelArt: true
};

// Global State
let game;
let sceneRef;
let worldState = { characters: [] };
const charactersMap = new Map(); // id -> CustomCharacter
let highlightedId = null;
let selectedId = null;

// UI References
const statusDiv = document.getElementById('connection-status');
const searchInput = document.getElementById('search-input');
const modal = document.getElementById('project-modal');
const closeModalBtn = document.getElementById('close-modal');

// Modal Elements
const modalSymbol = document.getElementById('modal-symbol');
const modalName = document.getElementById('modal-name');
const modalIcon = document.getElementById('modal-icon');
const modalRank = document.getElementById('modal-rank');
const creatorName = document.getElementById('creator-name');
const creatorPfp = document.getElementById('creator-pfp');
const modalPerformance = document.getElementById('modal-performance');
const modalFees = document.getElementById('modal-fees');
const modalPrice = document.getElementById('modal-price');
const modalMcap = document.getElementById('modal-mcap');
const modalVolume = document.getElementById('modal-volume');
const modalHolders = document.getElementById('modal-holders');
const modalAddress = document.getElementById('modal-address');
const modalLink = document.getElementById('modal-link');

// Constants
const ISLAND_SHAPES = [
    { x: 0, y: 0, r: 380 },
    { x: -320, y: 150, r: 180 },
    { x: 320, y: -100, r: 200 },
    { x: 100, y: -350, r: 150 },
    { x: -150, y: 350, r: 140 }
];

const COLORS = {
    island: 0x98ff98,
    islandBorder: 0x5da85d,
    sand: 0xF4A460,
    houseWall: 0xfdf6e3,
    houseRoof: 0xff6b6b,
    tree: 0x2ecc71,
    treeShadow: 0x27ae60
};

function openModal(data) {
    highlightedId = data.id;
    
    // Populate Data
    modalSymbol.textContent = data.symbol;
    modalName.textContent = data.name;
    modalRank.textContent = data.size === 3 ? 'HIGH' : (data.size === 2 ? 'MED' : 'LOW');
    
    // Creator
    const creatorContainer = document.querySelector('.creator-row');
    // Clear previous
    creatorContainer.innerHTML = '';
    
    // Add "BY" prefix
    const bySpan = document.createElement('span');
    bySpan.textContent = 'BY';
    bySpan.style.marginRight = '5px';
    creatorContainer.appendChild(bySpan);

    // 1. Creator
    // Check if creator username exists and isn't just 'Unknown'
    const hasCreator = data.creator && data.creator.username && data.creator.username !== 'Unknown';
    
    if (hasCreator) {
        const cLink = document.createElement('a');
        // Handle might be undefined if not set in backend, fallback to username
        const handle = data.creator.handle || data.creator.username;
        cLink.href = `https://twitter.com/${handle}`;
        cLink.target = '_blank';
        cLink.style.display = 'flex';
        cLink.style.alignItems = 'center';
        cLink.style.textDecoration = 'none';
        cLink.style.color = '#586e75'; // Explicit color for visibility
        cLink.style.marginRight = '10px';
        cLink.style.fontWeight = 'bold';

        if (data.creator.pfp) {
            const img = document.createElement('img');
            img.src = data.creator.pfp;
            img.className = 'creator-pfp';
            cLink.appendChild(img);
        }
        
        const name = document.createElement('span');
        name.textContent = '@' + data.creator.username;
        cLink.appendChild(name);
        
        creatorContainer.appendChild(cLink);
    } else {
        // Fallback if no creator found
        const span = document.createElement('span');
        span.textContent = 'Unknown';
        span.style.color = '#93a1a1';
        creatorContainer.appendChild(span);
    }

    // 2. Royalty (if different)
    if (data.royalty && data.royalty.username !== 'None') {
        const rSpan = document.createElement('span');
        rSpan.textContent = 'ROYALTY: ';
        rSpan.style.marginRight = '5px';
        rSpan.style.fontSize = '0.7rem';
        creatorContainer.appendChild(rSpan);

        const rLink = document.createElement('a');
        rLink.href = `https://twitter.com/${data.royalty.handle}`;
        rLink.target = '_blank';
        rLink.style.display = 'flex';
        rLink.style.alignItems = 'center';
        rLink.style.textDecoration = 'none';
        rLink.style.color = 'inherit';

        if (data.royalty.pfp) {
            const img = document.createElement('img');
            img.src = data.royalty.pfp;
            img.className = 'creator-pfp';
            rLink.appendChild(img);
        }

        const rName = document.createElement('span');
        rName.textContent = '@' + data.royalty.username;
        rLink.appendChild(rName);
        
        creatorContainer.appendChild(rLink);
    }

    // Stats
    const fees = data.fees || 0;
    const price = data.priceUsd || 0;
    const mcap = data.mcap || 0;
    const volume = data.volume24h || 0;
    const holders = data.holders || 0;
    const change = data.priceDelta || 0;

    modalPerformance.textContent = change.toFixed(2) + '%';
    modalPerformance.style.color = change >= 0 ? '#98ff98' : '#ff6b6b';
    
    modalFees.textContent = '◎' + formatCurrency(fees);
    modalPrice.textContent = '$' + price.toFixed(price < 0.01 ? 6 : 2);
    modalMcap.textContent = '$' + formatCurrency(mcap);
    modalVolume.textContent = '◎' + formatCurrency(volume);
    modalHolders.textContent = holders.toLocaleString();

    // Contract
    modalAddress.textContent = data.id.slice(0, 4) + '...' + data.id.slice(-4);
    modalLink.href = `https://bags.fm/${data.id}`;

    // Icon
    if (data.icon) {
        modalIcon.src = data.icon;
        modalIcon.style.display = 'block';
    } else {
        modalIcon.style.display = 'none';
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    highlightedId = null;
}

function formatCurrency(num) {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString();
}

// Initialize Game
function initGame() {
    const oldCanvas = document.getElementById('town-canvas');
    if (oldCanvas) oldCanvas.remove();
    game = new Phaser.Game(config);
}

// --- Phaser Scene Functions ---

function preload() {
    this.load.setBaseURL('');
}

function create() {
    sceneRef = this;
    
    // 1. Create Graphics Textures
    createTextures(this);

    // 2. Map Generation
    this.mapContainer = this.add.container(0, 0);
    drawMap(this);

    // 3. Groups
    this.buildings = this.physics.add.staticGroup();
    // Characters group for physics (invisible bodies)
    this.charGroup = this.physics.add.group({
        collideWorldBounds: false,
        bounceX: 1,
        bounceY: 1
    });
    this.fishes = this.add.group();

    // 4. Populate Static World
    initStaticWorld(this);
    
    // Add Special Buildings (Away from center)
    createSpecialBuilding(this, -250, 100, 'building_bagsapp', 'BagsAPP');
    createSpecialBuilding(this, 250, -80, 'building_finnbags', 'FinnBags');

    // 5. Populate Fishes
    initFishes(this);

    // 6. Populate Ships (Sniper Bots)
    initShips(this);

    // 7. Camera Setup
    this.cameras.main.setBackgroundColor('#87CEEB');
    this.cameras.main.centerOn(0, 0);

    // Auto-Fit Function: Adjusts zoom to fit the island based on screen size
    this.fitCamera = () => {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Target dimension to fit (Island is approx 800-900px wide/tall)
        // We want to see a bit of water too, so ~1100px coverage is good
        const targetWorldSize = 1100;
        
        // Determine zoom needed to fit the target world size into the smallest screen dimension
        let zoom = Math.min(width, height) / targetWorldSize;
        
        // Clamp values:
        // Max 1.5: Don't over-magnify on huge screens
        // Min 0.4: Don't shrink to invisibility on tiny screens
        zoom = Phaser.Math.Clamp(zoom, 0.4, 1.5);
        
        this.cameras.main.setZoom(zoom);
    };

    // Call initially
    this.fitCamera();

    // Listen for resize changes (Mobile rotation, Desktop window resize)
    this.scale.on('resize', (gameSize) => {
        // Only re-fit if we aren't currently interacting (dragging/pinching)
        // to prevent jarring jumps during active use if browser chrome shifts
        if (!this.input.activePointer.isDown) {
            this.fitCamera();
        }
    });

    // 7. Input
    // Handle Click on Game Objects
    this.input.on('gameobjectdown', (pointer, gameObject) => {
        if (gameObject.userData && gameObject.userData.type === 'character') {
            openModal(gameObject.userData.data);
            // Stop propagation to prevent drag start if needed, 
            // but the drag logic below checks for isDragging flag which is fine.
        }
    });

    // Zoom/Pan
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
        const newZoom = this.cameras.main.zoom - deltaY * 0.001;
        this.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, 0.4, 2));
    });

    let isDragging = false;
    let startX, startY;
    let dragThreshold = 5; // Pixels
    
    // Pinch Zoom Variables
    let initialPinchDistance = null;
    let initialZoom = 1;

    this.input.on('pointerdown', (pointer) => {
        if (pointer.button === 0) {
            // Only start drag logic if we didn't just click a UI element (which we can't detect easily here, 
            // but the gameobjectdown fires before this if the sprite is top).
            // Actually, we'll just track start position.
            isDragging = false;
            startX = pointer.x;
            startY = pointer.y;
        }
        
        // Handle Pinch Zoom Start
        if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
            isDragging = false; // Disable dragging during pinch
            initialPinchDistance = Phaser.Math.Distance.Between(
                this.input.pointer1.x, this.input.pointer1.y,
                this.input.pointer2.x, this.input.pointer2.y
            );
            initialZoom = this.cameras.main.zoom;
        }
    });

    this.input.on('pointermove', (pointer) => {
        // Handle Pinch Zoom Move
        if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
            if (initialPinchDistance) {
                const currentDistance = Phaser.Math.Distance.Between(
                    this.input.pointer1.x, this.input.pointer1.y,
                    this.input.pointer2.x, this.input.pointer2.y
                );
                const zoomFactor = currentDistance / initialPinchDistance;
                this.cameras.main.setZoom(Phaser.Math.Clamp(initialZoom * zoomFactor, 0.4, 2));
            }
            return; // Skip drag logic
        }

        if (pointer.isDown && pointer.button === 0) {
            const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, startX, startY);
            if (dist > dragThreshold) {
                isDragging = true;
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
            }
        }
    });
    
    this.input.on('pointerup', () => {
        isDragging = false;
        // Reset pinch
        if (!this.input.pointer1.isDown || !this.input.pointer2.isDown) {
            initialPinchDistance = null;
        }
    });

    // Wire up Modal Close
    closeModalBtn.onclick = closeModal;
    
    // Close modal on outside click
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    connectSSE();
}

function update(time, delta) {
    const dt = delta / 1000;

    // Update Characters
    charactersMap.forEach(char => {
        char.update(dt);
    });

    // Update Fishes
    this.fishes.getChildren().forEach(fish => {
        fish.x += fish.userData.speed * fish.userData.dir * dt;
        if (fish.x > 1500) { fish.x = -1500; fish.flipX = !fish.flipX; fish.userData.dir *= -1; }
        else if (fish.x < -1500) { fish.x = 1500; fish.flipX = !fish.flipX; fish.userData.dir *= -1; }
    });

    // Update Ships
    if (this.ships) {
        this.ships.getChildren().forEach(container => {
            container.x += container.userData.speed * container.userData.dir * dt;
            // Get the ship sprite (first child) to flip
            const ship = container.list[0];
            
            if (container.x > 1200) { 
                container.x = -1200; 
                container.userData.dir *= -1;
                ship.flipX = !ship.flipX;
            } else if (container.x < -1200) { 
                container.x = 1200; 
                container.userData.dir *= -1;
                ship.flipX = !ship.flipX;
            }
        });
    }
}

// --- Custom Character Class ---
class CustomCharacter {
    constructor(scene, data, x, y) {
        this.scene = scene;
        this.data = data;
        this.id = data.id;
        
        // Physics Body (Invisible Sprite)
        this.bodySprite = scene.charGroup.create(x, y, null);
        this.bodySprite.setVisible(false);
        this.bodySprite.body.setCircle(8); // Approximation
        this.bodySprite.body.setOffset(-8, -8);
        
        // Visual Container
        this.container = scene.add.container(x, y);
        
        // Graphics for drawing the character
        this.graphics = scene.add.graphics();
        this.container.add(this.graphics);
        
        // Label
        this.label = scene.add.text(0, -20, data.symbol, { 
            fontFamily: 'monospace', 
            fontSize: '12px', 
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.container.add(this.label);

        // Interaction Sprite (Use a transparent sprite for reliable clicking)
        this.hitSprite = scene.add.sprite(0, 0, 'char_base').setAlpha(0.001);
        this.hitSprite.setDisplaySize(32, 32);
        this.hitSprite.setInteractive({ useHandCursor: true });
        
        // Ensure this sprite is on TOP of everything in the container
        this.container.add(this.hitSprite);
        
        // Store data on the sprite so global handler works
        this.hitSprite.userData = { type: 'character', data: data };
        this.container.userData = { type: 'character', data: data };

        // State
        this.state = 'idle';
        this.idleTime = Math.random() * 2;
        this.targetX = x;
        this.targetY = y;
        this.moveSpeed = 30 + Math.random() * 20;
        this.speedMultiplier = data.speed || 1;
        this.color = getColorFromSymbol(data.symbol);
        
        // Visual State
        this.bounceOffset = 0;
        this.size = 16 * (data.size || 1);
    }

    update(dt) {
        const body = this.bodySprite.body;
        const x = this.bodySprite.x;
        const y = this.bodySprite.y;

        // Sync Container to Physics Body
        this.container.x = x;
        this.container.y = y;
        this.container.setDepth(y + 2000); // Y-sort adjusted to be above map

        // Logic
        if (this.state === 'idle') {
            this.idleTime -= dt;
            if (this.idleTime <= 0) {
                this.pickNewTarget();
            }
            this.bodySprite.setVelocity(0, 0);
        } else if (this.state === 'moving') {
            const speed = this.moveSpeed * this.speedMultiplier;
            const dist = Phaser.Math.Distance.Between(x, y, this.targetX, this.targetY);
            
            if (dist < 10) {
                this.bodySprite.body.reset(this.targetX, this.targetY);
                this.state = 'idle';
                this.idleTime = 1 + Math.random() * 3;
            } else {
                this.scene.physics.moveTo(this.bodySprite, this.targetX, this.targetY, speed);
            }

            if (!isPointOnLand(x, y)) {
                // Bounce back
                const angle = Phaser.Math.Angle.Between(x, y, 0, 0);
                this.scene.physics.velocityFromRotation(angle, speed, this.bodySprite.body.velocity);
                this.pickNewTarget();
            }
        }

        // Draw Visuals
        this.drawVisuals();
    }

    pickNewTarget() {
        let valid = false;
        let attempts = 0;
        let tx, ty;
        while(!valid && attempts < 20) {
            tx = (Math.random() - 0.5) * 800;
            ty = (Math.random() - 0.5) * 800;
            if (isPointOnLand(tx, ty)) valid = true;
            attempts++;
        }
        if (valid) {
            this.targetX = tx;
            this.targetY = ty;
            this.state = 'moving';
        } else {
            this.state = 'idle';
        }
    }

    drawVisuals() {
        const g = this.graphics;
        g.clear();
        
        const size = this.size;
        const isMoving = this.state === 'moving';
        
        // Bounce Animation
        let bounce = 0;
        if (isMoving) {
            bounce = Math.sin(Date.now() / 150 * this.speedMultiplier) * 3;
        }

        // Shadow
        g.fillStyle(0x000000, 0.5);
        g.fillEllipse(0, size/2, size, size/2);

        // Legs
        g.fillStyle(0x111111);
        const legW = size / 4;
        const legH = size / 4;
        if (isMoving) {
            g.fillRect(-size/4 - legW/2, size/2 - 2 + bounce, legW, legH);
            g.fillRect(size/4 - legW/2, size/2 - 2 - bounce, legW, legH);
        } else {
            g.fillRect(-size/4 - legW/2, size/2 - 2, legW, legH);
            g.fillRect(size/4 - legW/2, size/2 - 2, legW, legH);
        }

        // Body
        g.fillStyle(this.color.color); // Phaser Color object needs .color for hex integer
        g.fillRect(-size/2, -size/2, size, size);

        // Shading
        g.fillStyle(0x000000, 0.3);
        g.fillRect(-size/2, size/2 - 4, size, 4); // Bottom shade
        g.fillRect(size/2 - 4, -size/2, 4, size); // Right shade

        // Eyes
        g.fillStyle(0xffffff);
        const eyeSize = Math.max(2, size / 5);
        const eyeOffset = size / 4;
        g.fillRect(-eyeOffset - eyeSize/2, -eyeOffset, eyeSize, eyeSize);
        g.fillRect(eyeOffset - eyeSize/2, -eyeOffset, eyeSize, eyeSize);

        // Pupils
        g.fillStyle(0x000000);
        const pupilSize = Math.max(1, eyeSize / 2);
        let pupilOffsetX = 0;
        if (isMoving) {
            const dx = this.targetX - this.container.x;
            pupilOffsetX = (dx > 0 ? 1 : -1) * (eyeSize / 4);
        }
        g.fillRect(-eyeOffset - pupilSize/2 + pupilOffsetX, -eyeOffset, pupilSize, pupilSize);
        g.fillRect(eyeOffset - pupilSize/2 + pupilOffsetX, -eyeOffset, pupilSize, pupilSize);
        
        // Highlight
        if (this.id === highlightedId || this.id === selectedId) {
            g.lineStyle(2, 0xfff176);
            g.strokeRect(-size/2 - 4, -size/2 - 4, size + 8, size + 8);
        }
    }

    destroy() {
        this.container.destroy();
        this.bodySprite.destroy();
    }
}

// --- Helpers ---

function createTextures(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

    // BagsAPP Building - Futuristic Blue Tower
    graphics.fillStyle(0x001f3f); // Navy Base
    graphics.fillRect(10, 20, 60, 80); // Taller base
    // Gold Accents
    graphics.fillStyle(0xFFD700);
    graphics.fillRect(5, 20, 5, 80); // Left pillar
    graphics.fillRect(70, 20, 5, 80); // Right pillar
    // Glass Front
    graphics.fillStyle(0x0074D9);
    graphics.fillRect(15, 30, 50, 60);
    // Grid Lines
    graphics.lineStyle(1, 0x00ffff);
    graphics.moveTo(15, 50); graphics.lineTo(65, 50);
    graphics.moveTo(15, 70); graphics.lineTo(65, 70);
    graphics.strokePath();
    // Roof
    graphics.fillStyle(0x003366);
    graphics.beginPath();
    graphics.moveTo(10, 20);
    graphics.lineTo(40, 0); // Peak
    graphics.lineTo(70, 20);
    graphics.closePath();
    graphics.fillPath();
    graphics.generateTexture('building_bagsapp', 80, 100);
    graphics.clear();

    // FinnBags Building - Massive Skyscraper
    // Base Section
    graphics.fillStyle(0x1a1a1a); // Dark Grey Concrete
    graphics.fillRect(10, 80, 80, 70); 
    // Mid Section (Glass Tower)
    graphics.fillStyle(0x2E8B57); // SeaGreen Glass
    graphics.fillRect(15, 20, 70, 130);
    // Vertical Gold Struts
    graphics.fillStyle(0xFFD700);
    graphics.fillRect(15, 20, 5, 130);
    graphics.fillRect(47, 20, 6, 130);
    graphics.fillRect(80, 20, 5, 130);
    // Horizontal Dividers
    graphics.fillStyle(0x1a1a1a);
    graphics.fillRect(15, 50, 70, 3);
    graphics.fillRect(15, 80, 70, 3);
    graphics.fillRect(15, 110, 70, 3);
    // Roof Spire
    graphics.fillStyle(0xFFD700);
    graphics.beginPath();
    graphics.moveTo(15, 20);
    graphics.lineTo(50, 0); // Peak
    graphics.lineTo(85, 20);
    graphics.closePath();
    graphics.fillPath();
    // Antenna
    graphics.lineStyle(2, 0xFFD700);
    graphics.moveTo(50, 0);
    graphics.lineTo(50, -15);
    graphics.strokePath();
    // Glowing Light at top
    graphics.fillStyle(0xFF0000);
    graphics.fillCircle(50, -15, 2);

    graphics.generateTexture('building_finnbags', 100, 160);
    graphics.clear();

    // Sniper Bot Ship - Pirate Ship Style
    // Hull
    graphics.fillStyle(0x8B4513); // SaddleBrown
    graphics.beginPath();
    graphics.moveTo(5, 25);
    // Phaser 3 Graphics doesn't have quadraticBezierTo directly exposed on the Graphics object like Canvas Context
    // We use slice commands or simple lines for pixel art style
    graphics.lineTo(55, 25); 
    graphics.lineTo(45, 45); // Trapezoid shape instead of curve for stability
    graphics.lineTo(15, 45);
    graphics.lineTo(5, 25); // Deck line
    graphics.closePath();
    graphics.fillPath();
    // Deck Wood Texture
    graphics.lineStyle(1, 0x654321);
    graphics.moveTo(5, 18); graphics.lineTo(55, 18);
    graphics.moveTo(8, 21); graphics.lineTo(52, 21);
    graphics.strokePath();
    // Mast
    graphics.fillStyle(0x5D4037);
    graphics.fillRect(28, 5, 4, 30);
    // Main Sail
    graphics.fillStyle(0xFFFFFF); // White Sail
    graphics.beginPath();
    graphics.moveTo(30, 25);
    graphics.lineTo(10, 20); // Simple triangle sail left
    graphics.lineTo(30, 5);
    graphics.lineTo(32, 5);
    graphics.lineTo(52, 20); // Simple triangle sail right
    graphics.lineTo(32, 25);
    graphics.fillPath();
    // Pirate Flag
    graphics.fillStyle(0x000000);
    graphics.fillRect(30, -5, 15, 10);
    // Skull hint (white dots)
    graphics.fillStyle(0xFFFFFF);
    graphics.fillRect(35, -2, 2, 2);
    graphics.fillRect(39, -2, 2, 2);
    
    graphics.generateTexture('ship_sniper', 60, 50);
    graphics.clear();

    // House
    graphics.fillStyle(COLORS.houseWall);
    graphics.fillRect(0, 15, 30, 25);
    graphics.fillStyle(COLORS.houseRoof);
    graphics.beginPath();
    graphics.moveTo(0, 15);
    graphics.lineTo(15, 0);
    graphics.lineTo(30, 15);
    graphics.fillPath();
    graphics.fillStyle(0x5d4037);
    graphics.fillRect(10, 25, 10, 15);
    graphics.generateTexture('house', 30, 40);
    graphics.clear();

    // Tree
    graphics.fillStyle(0x795548);
    graphics.fillRect(8, 20, 8, 12);
    graphics.fillStyle(COLORS.tree);
    graphics.fillCircle(12, 12, 12);
    graphics.generateTexture('tree', 24, 32);
    graphics.clear();

    // Fish
    graphics.fillStyle(0xff6b6b);
    graphics.fillEllipse(10, 5, 20, 10);
    graphics.fillStyle(0x000000);
    graphics.fillCircle(15, 4, 1);
    graphics.generateTexture('fish_red', 20, 10);
    graphics.clear();

    graphics.fillStyle(0xffd93d);
    graphics.fillEllipse(10, 5, 20, 10);
    graphics.fillStyle(0x000000);
    graphics.fillCircle(15, 4, 1);
    graphics.generateTexture('fish_yellow', 20, 10);
    graphics.clear();

    // Character Base Hitbox (Invisible/Transparent)
    graphics.fillStyle(0xffffff);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('char_base', 32, 32);
    graphics.clear();
}

function drawMap(scene) {
    const g = scene.add.graphics();
    g.setDepth(-5000); // Ensure map is always behind everything
    // Border
    g.fillStyle(COLORS.islandBorder);
    for (const shape of ISLAND_SHAPES) { g.fillCircle(shape.x, shape.y, shape.r + 15); }
    // Sand
    g.fillStyle(COLORS.sand);
    for (const shape of ISLAND_SHAPES) { g.fillCircle(shape.x, shape.y, shape.r + 8); }
    // Grass
    g.fillStyle(COLORS.island);
    for (const shape of ISLAND_SHAPES) { g.fillCircle(shape.x, shape.y, shape.r); }
}

function createSpecialBuilding(scene, x, y, texture, labelText) {
    if (!isPointOnLand(x, y)) return; // Safety check
    
    const building = scene.buildings.create(x, y, texture);
    building.setImmovable(true);
    building.refreshBody();
    building.setDepth(y + 2000);
    
    // Label (No Highlight)
    const label = scene.add.text(x, y - 60, labelText, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5);
    label.setDepth(y + 2001);
}

function initStaticWorld(scene) {
    const gridSize = 60;
    const range = 18; 
    for (let x = -range; x <= range; x++) {
        for (let y = -range; y <= range; y++) {
            if (Math.abs(x) < 3 && Math.abs(y) < 3) continue;
            const posX = x * gridSize + (Math.random() * 20 - 10);
            const posY = y * gridSize + (Math.random() * 20 - 10);
            if (!isPointOnLand(posX, posY)) continue;
            const rand = Math.random();
            if (rand < 0.05) {
                const house = scene.buildings.create(posX, posY, 'house');
                house.setImmovable(true);
                house.refreshBody();
                house.setDepth(posY + 2000);
            } else if (rand < 0.15) {
                const tree = scene.buildings.create(posX, posY, 'tree');
                tree.setImmovable(true);
                tree.refreshBody();
                tree.body.setSize(10, 10);
                tree.body.setOffset(7, 20);
                tree.setDepth(posY + 2000);
            }
        }
    }
}

function initFishes(scene) {
    for(let i=0; i<30; i++) {
        const x = (Math.random() - 0.5) * 2800;
        const y = (Math.random() - 0.5) * 1800;
        // Avoid Land
        if (isPointOnLand(x, y)) continue;

        const isRed = Math.random() > 0.5;
        const fish = scene.add.sprite(x, y, isRed ? 'fish_red' : 'fish_yellow');
        fish.userData = { speed: 20 + Math.random() * 30, dir: Math.random() > 0.5 ? 1 : -1 };
        if (fish.userData.dir === -1) fish.flipX = true;
        fish.setAlpha(0.7);
        scene.fishes.add(fish);
    }
}

function initShips(scene) {
    scene.ships = scene.add.group();
    for(let i=0; i<8; i++) {
        // Spawn ships in a wider area but ensure they are visible
        // Try multiple times to find a water spot
        let x, y, valid = false;
        let attempts = 0;
        
        while(!valid && attempts < 20) {
            x = (Math.random() - 0.5) * 1600; // Constrain slightly to keep on screen
            y = (Math.random() - 0.5) * 1200;
            if (!isPointOnLand(x, y)) {
                 valid = true;
            }
            attempts++;
        }

        if (!valid) continue;

        const container = scene.add.container(x, y);
        const ship = scene.add.sprite(0, 0, 'ship_sniper');
        // Ensure ship is above water (-5000) but below land objects
        container.setDepth(10); 
        
        const label = scene.add.text(0, -30, 'SNIPER BOT', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: 'rgba(0,0,0,0.5)'
        }).setOrigin(0.5);

        container.add([ship, label]);
        container.userData = { 
            speed: 50 + Math.random() * 30, 
            dir: Math.random() > 0.5 ? 1 : -1 
        };
        
        if (container.userData.dir === -1) ship.flipX = true;
        
        scene.ships.add(container);
    }
}

function isPointOnLand(x, y) {
    for (const shape of ISLAND_SHAPES) {
        const dx = x - shape.x;
        const dy = y - shape.y;
        if (dx*dx + dy*dy < shape.r * shape.r) return true;
    }
    return false;
}

// --- Data Sync ---

function connectSSE() {
    const evtSource = new EventSource('/api/stream');
    evtSource.onopen = () => {
        statusDiv.textContent = '● Live';
        statusDiv.style.color = '#81c784';
    };
    evtSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWorldUpdate(data);
    };
    evtSource.onerror = (err) => {
        statusDiv.textContent = '○ Reconnecting';
        statusDiv.style.color = '#ff9800';
    };
}

function handleWorldUpdate(state) {
    if (!sceneRef) return;
    worldState = state;
    const incomingIds = new Set(state.characters.map(c => c.id));

    state.characters.forEach(charData => {
        let charObj = charactersMap.get(charData.id);
        if (charObj) {
            charObj.data = charData;
            charObj.speedMultiplier = charData.speed || 1;
        } else {
            // Find valid spawn
            let sx, sy;
            let attempts = 0;
            do {
                sx = (Math.random() - 0.5) * 600;
                sy = (Math.random() - 0.5) * 600;
                attempts++;
            } while (!isPointOnLand(sx, sy) && attempts < 10);

            charObj = new CustomCharacter(sceneRef, charData, sx, sy);
            sceneRef.physics.add.collider(charObj.bodySprite, sceneRef.buildings);
            
            // Add collision with other characters
            charactersMap.forEach(other => {
                sceneRef.physics.add.collider(charObj.bodySprite, other.bodySprite);
            });

            charactersMap.set(charData.id, charObj);
        }
    });

    for (const [id, charObj] of charactersMap) {
        if (!incomingIds.has(id)) {
            charObj.destroy();
            charactersMap.delete(id);
        }
    }
}

function getColorFromSymbol(symbol) {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
        hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return Phaser.Display.Color.HSLToColor(hue / 360, 0.6, 0.5);
}

// Start
initGame();
