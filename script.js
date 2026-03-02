// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.48;
renderer.setClearColor(0x000000, 1);
// append renderer normally; canvas will be visible to show 3D scene
const canvasContainer = document.getElementById('canvas-container');
canvasContainer.appendChild(renderer.domElement);

camera.position.set(0, 0, 8);

// Lighting
let sunLight = null;

// skybox optional
textureLoader.load('skybox.jpg', tex => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
    scene.environment = tex;
}, undefined, err => console.error('Error loading skybox', err));

// objects array kept for interaction
const objects = [];
let homeSphere = null;
let sunGlowLayer = null;
let pokeball = null;
let sasCube = null;
let spaceStationPivot = null;
let spaceStation = null;
let spaceShip = null;
let enemyDreadnought = null;
let shipEngineLight = null;
let shipEngineGlowMaterial = null;
let shipControlActive = false;
let shipDocked = true;
let shipAutoDockActive = false;
const earthCloudLayers = [];
let earthTiltGroup = null;
let orbitPathGroup = null;
let showPokeballLink = false;
let showSASLink = false;
const pokeballScreenPos = new THREE.Vector3();
const sasScreenPos = new THREE.Vector3();
const focusTarget = new THREE.Vector3();
const orbitCenter = new THREE.Vector3();
const trackedWorldQuat = new THREE.Quaternion();
const trackedForward = new THREE.Vector3(0, 0, 1);
const trackedCameraPos = new THREE.Vector3();
const trackedLastTargetPos = new THREE.Vector3();
const trackedTargetDelta = new THREE.Vector3();
let trackedObject = null;
let trackedDistance = 8;
let trackedHeightOffset = 1.2;
let trackedFollowInitialized = false;
const shipControlState = {
    KeyW: false,
    KeyS: false,
    Space: false,
    ShiftLeft: false
};
const shipVelocity = new THREE.Vector3();
const shipForwardAxis = new THREE.Vector3(0, 0, -1);
const shipUpAxis = new THREE.Vector3(0, 1, 0);
const shipWorldPos = new THREE.Vector3();
const shipWorldQuat = new THREE.Quaternion();
const shipParentWorldQuat = new THREE.Quaternion();
const shipTargetWorldQuat = new THREE.Quaternion();
const shipTargetLocalQuat = new THREE.Quaternion();
const shipForwardWorld = new THREE.Vector3();
const shipUpWorld = new THREE.Vector3();
const shipCameraDesiredPos = new THREE.Vector3();
const shipCameraLookTarget = new THREE.Vector3();
const shipDockWorldPos = new THREE.Vector3();
const shipDockLocalPos = new THREE.Vector3();
const shipDockOffset = new THREE.Vector3(0, 0.04, -0.2);
const shipOrbitVelocityLocal = new THREE.Vector3();
const shipOrbitVelocityTiltLocal = new THREE.Vector3();
const shipOrbitVelocityWorld = new THREE.Vector3();
let shipThrottleLevel = 0;
let shipThrottleCommand = 0;
const freecamMoveState = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    Space: false,
    ShiftLeft: false
};
const freecamLookDirection = new THREE.Vector3();
const freecamTarget = new THREE.Vector3();
const freecamSpeed = 16;
let freecamEnabled = false;
const singaporeTimeEl = document.getElementById('sg-time');
const tokyoTimeEl = document.getElementById('tokyo-time');
const singaporeDateEl = document.getElementById('sg-date');
const tokyoDateEl = document.getElementById('tokyo-date');
const projectsDropdownToggle = document.getElementById('projects-dropdown-toggle');
const projectsDropdownMenu = document.getElementById('projects-dropdown-menu');
const todoDropdownToggle = document.getElementById('todo-dropdown-toggle');
const todoDropdownMenu = document.getElementById('todo-dropdown-menu');
const todoSectionsListEl = document.getElementById('todo-sections-list');
const todoSectionInput = document.getElementById('todo-section-input');
const todoSectionAddButton = document.getElementById('todo-section-add');
const todoStorageKey = 'mli0806.todoSections';
let todoSections = [];
const cityTimeFormatters = {
    singapore: new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Singapore',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }),
    tokyo: new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }),
    singaporeDate: new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Singapore',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }),
    tokyoDate: new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Tokyo',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
};
const earthClockSyncConfig = {
    mode: 'reference-image',
    timeZone: 'Asia/Tokyo',
    longitudeDeg: 139.6917,
    // Pacific-centered daylight to match the provided screenshot.
    referenceSubsolarLongitudeDeg: 160,
    // Calibrates the Earth texture's visual prime meridian to geographic longitude.
    textureLongitudeOffsetDeg: 0
};
const earthSyncTimePartsFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: earthClockSyncConfig.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});
const orbitConfig = {
    pokeball: {
        semiMajorAxis: 18.5,
        eccentricity: 0.22,
        inclinationRad: THREE.MathUtils.degToRad(8),
        longitudeOfAscendingNodeRad: THREE.MathUtils.degToRad(36),
        argumentOfPeriapsisRad: THREE.MathUtils.degToRad(118),
        meanAnomalyRad: Math.PI * 0.2,
        periodSeconds: 46
    },
    sas: {
        semiMajorAxis: 27.5,
        eccentricity: 0.0167,
        inclinationRad: THREE.MathUtils.degToRad(11),
        longitudeOfAscendingNodeRad: THREE.MathUtils.degToRad(-24),
        argumentOfPeriapsisRad: THREE.MathUtils.degToRad(103),
        meanAnomalyAtReferenceRad: 0
    }
};
const orbitPathConfig = {
    segments: 360,
    pokeball: { color: 0xff9b2f, opacity: 0.42 },
    sas: { color: 0x7dc4ff, opacity: 0.48 }
};
const earthOrbitConfig = {
    // Earth perihelion reference near +X (UTC), then advance by sidereal-year period.
    perihelionReferenceUtcMs: Date.UTC(2026, 0, 4, 15, 0, 0),
    siderealYearDays: 365.256363004
};
const earthAxialTiltRad = THREE.MathUtils.degToRad(23.44);
const planetRotationConfig = {
    // Approximate sidereal rotation periods.
    sunSecondsPerRotation: 25.38 * 24 * 60 * 60,
    earthSecondsPerRotation: 86164.0905
};
const sunRotationRadPerSecond = (Math.PI * 2) / planetRotationConfig.sunSecondsPerRotation;
const earthRotationRadPerSecond = -((Math.PI * 2) / planetRotationConfig.earthSecondsPerRotation);
const earthAxialDriftRadPerSecond = THREE.MathUtils.degToRad(1.6);
const earthCloudLayerSpeedMultipliers = [1.03, 1.12];
const TWO_PI = Math.PI * 2;
const spaceflightStationOrbitRadius = 2.1;
const spaceflightStationOrbitTiltRad = THREE.MathUtils.degToRad(28);
const spaceflightStationAngularSpeed = TWO_PI / 11;
const spaceflightOrbitPathColor = 0x8bc4ff;
const spaceflightOrbitPathOpacity = 0.5;
const missileLoadoutOrder = ['short', 'long'];
const missileLoadouts = {
    short: {
        name: 'AIM-67 Maduro',
        keybind: 'O',
        speed: 84,
        lifetimeSeconds: 8.6,
        damage: 155,
        radius: 0.028,
        cooldownSeconds: 0.14,
        color: 0xc8f4ff,
        emissive: 0x4bb7ff
    },
    long: {
        name: 'AIM-69 Khamenei',
        keybind: 'P',
        speed: 42,
        lifetimeSeconds: 12.2,
        damage: 360,
        radius: 0.034,
        cooldownSeconds: 0.66,
        color: 0xffd79c,
        emissive: 0xff8a2f
    }
};
const shipMaxAmmo = 1000;
const enemyMaxHealth = 10000;
const enemyHitRadius = 0.9;
const enemyHealthUIRange = 18;
const enemyProjectileSpeed = 11;
const enemyProjectileAimJitter = 0.14;
const enemyProjectileDamageRadius = 0.085;
const enemyFireCooldownSeconds = 0.95;
const enemyFireRange = 22;
const enemyProjectileLifetimeSeconds = 8;
const shipAcceleration = 7.2;
const shipBoostMultiplier = 2.35;
const shipDragPerSecond = 0.012;
const shipLowThrottleDragPerSecond = 0.95;
const shipBrakeDragPerSecond = 2.2;
const shipMaxSpeed = 34;
const shipMouseYawSensitivity = 0.0009;
const shipMousePitchSensitivity = 0.00075;
const shipTurnImpulseGain = 16;
const shipTurnDampingPerSecond = 4.6;
const shipMaxTurnRate = THREE.MathUtils.degToRad(34);
const shipHighSpeedTurnAuthorityMin = 0.34;
const shipLateralDampingBase = 1.25;
const shipLateralDampingAtMaxSpeed = 10.2;
const shipCollisionRadius = 0.06;
const shipUndockCollisionGraceSeconds = 0.8;
const shipThrottleLerpSpeed = 8.5;
const shipThrottleStep = 0.05;
const shipThrottleFineStep = 0.01;
const shipLatchRange = 2;
const shipAutoDockSpeed = 2.4;
const shipAutoDockRotateLerp = 0.12;
const shipCameraBackOffset = 0.34;
const shipCameraUpOffset = 0.03;
const shipCameraLookAhead = 1.35;
const orbitDefaultMinDistance = 2;
const orbitStationMinDistance = 0.45;
const orbitUpAxis = new THREE.Vector3(0, 1, 0);
const orbitPitchAxis = new THREE.Vector3(1, 0, 0);
const pokeballOrbitPos = new THREE.Vector3();
const sasOrbitPos = new THREE.Vector3();
const spaceStationTargetPos = new THREE.Vector3();
const shipAngularVelocity = new THREE.Vector2();
const shipCollisionSegment = new THREE.Vector3();
const shipCollisionToCenter = new THREE.Vector3();
const shipCollisionClosestPoint = new THREE.Vector3();
const shipCollisionStartWorld = new THREE.Vector3();
const shipCollisionEndWorld = new THREE.Vector3();
const shipCollisionMeshScale = new THREE.Vector3();
const shipCollisionMeshCenter = new THREE.Vector3();
const shipCollisionMeshes = [];
const shipVelocityForwardComponent = new THREE.Vector3();
const shipVelocityLateralComponent = new THREE.Vector3();
const enemyOrbitPos = new THREE.Vector3();
const enemyOrbitLookPos = new THREE.Vector3();
const enemyOrbitCenter = new THREE.Vector3();
const enemyPathTarget = new THREE.Vector3();
const missileSpawnPos = new THREE.Vector3();
const missileVelocityWorld = new THREE.Vector3();
const missileEnemyDelta = new THREE.Vector3();
const enemyToShipDelta = new THREE.Vector3();
const missiles = [];
const enemyProjectiles = [];
const explosions = [];
const enemyNavState = {
    speed: 7.2,
    arrivalThreshold: 0.8
};
const missileGeometry = new THREE.CylinderGeometry(0.008, 0.012, 0.09, 8);
missileGeometry.rotateX(Math.PI / 2);
const missileMaterials = {};
missileLoadoutOrder.forEach((loadoutId) => {
    const loadout = missileLoadouts[loadoutId];
    missileMaterials[loadoutId] = new THREE.MeshStandardMaterial({
        color: loadout.color,
        emissive: loadout.emissive,
        emissiveIntensity: 1.2,
        roughness: 0.2,
        metalness: 0.1
    });
});
const enemyProjectileGeometry = new THREE.SphereGeometry(0.018, 10, 10);
const enemyProjectileMaterial = new THREE.MeshStandardMaterial({
    color: 0xff7f4d,
    emissive: 0xff4d21,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.08
});
const explosionGeometry = new THREE.SphereGeometry(0.08, 14, 14);
let shipPendingYaw = 0;
let shipPendingPitch = 0;
let shipUndockCollisionGraceTimer = 0;
let shipCrashed = false;
let missileCooldownTimer = 0;
let enemyFireCooldownTimer = 0;
let enemyHealth = enemyMaxHealth;
let enemyAlive = true;
let enemyEncounterActive = false;
let shipAmmo = shipMaxAmmo;
let missileTriggerHeld = false;
let activeMissileLoadoutId = missileLoadoutOrder[0];

const pokeballLinkPopup = document.createElement('div');
pokeballLinkPopup.id = 'pokeball-link-popup';
const pokeballPopupClose = document.createElement('button');
pokeballPopupClose.id = 'pokeball-popup-close';
pokeballPopupClose.type = 'button';
pokeballPopupClose.textContent = 'x';
const pokeballLinkLabel = document.createElement('a');
pokeballLinkLabel.id = 'pokeball-link-label';
pokeballLinkLabel.href = 'https://modrinth.com/mod/cobblemonmorecosmetics';
pokeballLinkLabel.target = '_blank';
pokeballLinkLabel.rel = 'noopener noreferrer';
pokeballLinkLabel.textContent = 'CobblemonMoreCosmetics - A Cobblemon Addon';
pokeballLinkPopup.appendChild(pokeballPopupClose);
pokeballLinkPopup.appendChild(pokeballLinkLabel);
document.body.appendChild(pokeballLinkPopup);

const sasLinkPopup = document.createElement('div');
sasLinkPopup.id = 'sas-link-popup';
const sasPopupClose = document.createElement('button');
sasPopupClose.id = 'sas-popup-close';
sasPopupClose.type = 'button';
sasPopupClose.textContent = 'x';
const sasLinksToggle = document.createElement('button');
sasLinksToggle.id = 'sas-links-toggle';
sasLinksToggle.type = 'button';
sasLinksToggle.textContent = 'SAS Links';
const sasLinksList = document.createElement('div');
sasLinksList.id = 'sas-links-list';

const sasLinks = [
    { title: 'Schoology', url: 'https://sas.schoology.com/home' },
    { title: 'Gmail', url: 'https://mail.google.com/mail/u/0/#inbox' },
    { title: 'Powerschool', url: 'https://powerschool.sas.edu.sg/public/home.html' },
    { title: 'Khan Academy', url: 'https://www.khanacademy.org/' },
    { title: 'MIT OCW', url: 'https://ocw.mit.edu/' }
];

sasLinks.forEach((link) => {
    const anchor = document.createElement('a');
    anchor.className = 'sas-link-item';
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = link.title;
    sasLinksList.appendChild(anchor);
});

sasLinkPopup.appendChild(sasPopupClose);
sasLinkPopup.appendChild(sasLinksToggle);
sasLinkPopup.appendChild(sasLinksList);
document.body.appendChild(sasLinkPopup);

const simSpeedometer = document.createElement('div');
simSpeedometer.id = 'sim-speedometer';
const simSpeedLabel = document.createElement('div');
simSpeedLabel.className = 'sim-meter-label';
simSpeedLabel.textContent = 'SPEED';
const simSpeedValue = document.createElement('div');
simSpeedValue.id = 'sim-speed-value';
simSpeedValue.className = 'sim-meter-numerals';
simSpeedValue.textContent = '0.00';
const simSpeedUnit = document.createElement('div');
simSpeedUnit.className = 'sim-meter-unit';
simSpeedUnit.textContent = 'u/s';
simSpeedometer.appendChild(simSpeedLabel);
simSpeedometer.appendChild(simSpeedValue);
simSpeedometer.appendChild(simSpeedUnit);
simSpeedometer.style.display = 'none';
document.body.appendChild(simSpeedometer);

const simThrottleMeter = document.createElement('div');
simThrottleMeter.id = 'sim-throttle-meter';
const simThrottleLabel = document.createElement('div');
simThrottleLabel.className = 'sim-meter-label';
simThrottleLabel.textContent = 'THROTTLE';
const simThrottleTrack = document.createElement('div');
simThrottleTrack.className = 'sim-meter-track';
const simThrottleFill = document.createElement('div');
simThrottleFill.id = 'sim-throttle-fill';
simThrottleTrack.appendChild(simThrottleFill);
const simThrottleValue = document.createElement('div');
simThrottleValue.id = 'sim-throttle-value';
simThrottleValue.className = 'sim-meter-numerals';
simThrottleValue.textContent = '0%';
simThrottleMeter.appendChild(simThrottleLabel);
simThrottleMeter.appendChild(simThrottleTrack);
simThrottleMeter.appendChild(simThrottleValue);
simThrottleMeter.style.display = 'none';
document.body.appendChild(simThrottleMeter);

const simAmmoCounter = document.createElement('div');
simAmmoCounter.id = 'sim-ammo-counter';
const simAmmoLabel = document.createElement('div');
simAmmoLabel.className = 'sim-meter-label';
simAmmoLabel.textContent = 'AMMO';
const simAmmoValue = document.createElement('div');
simAmmoValue.id = 'sim-ammo-value';
simAmmoValue.className = 'sim-meter-numerals';
simAmmoValue.textContent = `${shipMaxAmmo}`;
simAmmoCounter.appendChild(simAmmoLabel);
simAmmoCounter.appendChild(simAmmoValue);
simAmmoCounter.style.display = 'none';
document.body.appendChild(simAmmoCounter);

const missileInventoryUI = document.createElement('div');
missileInventoryUI.id = 'missile-inventory-ui';
const missileInventoryTitle = document.createElement('div');
missileInventoryTitle.id = 'missile-inventory-title';
missileInventoryTitle.textContent = 'MISSILES';
const missileInventorySlots = document.createElement('div');
missileInventorySlots.id = 'missile-inventory-slots';
const missileSlotElements = {};

missileLoadoutOrder.forEach((loadoutId) => {
    const loadout = missileLoadouts[loadoutId];
    const slot = document.createElement('div');
    slot.className = 'missile-slot';
    slot.dataset.loadoutId = loadoutId;

    const slotKey = document.createElement('div');
    slotKey.className = 'missile-slot-key';
    slotKey.textContent = loadout.keybind;
    const slotName = document.createElement('div');
    slotName.className = 'missile-slot-name';
    slotName.textContent = loadout.name;
    const slotStats = document.createElement('div');
    slotStats.className = 'missile-slot-stats';
    slotStats.textContent = `DMG ${loadout.damage} | RNG ${(loadout.speed * loadout.lifetimeSeconds).toFixed(0)} | CD ${loadout.cooldownSeconds.toFixed(2)}s`;

    slot.appendChild(slotKey);
    slot.appendChild(slotName);
    slot.appendChild(slotStats);
    missileInventorySlots.appendChild(slot);
    missileSlotElements[loadoutId] = slot;
});

missileInventoryUI.appendChild(missileInventoryTitle);
missileInventoryUI.appendChild(missileInventorySlots);
missileInventoryUI.style.display = 'none';
document.body.appendChild(missileInventoryUI);

const enemyHealthUI = document.createElement('div');
enemyHealthUI.id = 'enemy-health-ui';
const enemyHealthLabel = document.createElement('div');
enemyHealthLabel.id = 'enemy-health-label';
enemyHealthLabel.textContent = 'THETA CLASS-I FREIGHTER';
const enemyHealthTrack = document.createElement('div');
enemyHealthTrack.id = 'enemy-health-track';
const enemyHealthFill = document.createElement('div');
enemyHealthFill.id = 'enemy-health-fill';
enemyHealthTrack.appendChild(enemyHealthFill);
const enemyHealthValue = document.createElement('div');
enemyHealthValue.id = 'enemy-health-value';
enemyHealthValue.textContent = `${enemyMaxHealth}/${enemyMaxHealth}`;
enemyHealthUI.appendChild(enemyHealthLabel);
enemyHealthUI.appendChild(enemyHealthTrack);
enemyHealthUI.appendChild(enemyHealthValue);
enemyHealthUI.style.display = 'none';
document.body.appendChild(enemyHealthUI);

const shipCrashOverlay = document.createElement('div');
shipCrashOverlay.id = 'ship-crash-overlay';
const shipCrashTitle = document.createElement('div');
shipCrashTitle.id = 'ship-crash-title';
shipCrashTitle.textContent = 'YOU CRASHED';
const shipCrashSubtitle = document.createElement('div');
shipCrashSubtitle.id = 'ship-crash-subtitle';
shipCrashSubtitle.textContent = 'Your ship impacted an object.';
const shipCrashRespawnButton = document.createElement('button');
shipCrashRespawnButton.id = 'ship-crash-respawn';
shipCrashRespawnButton.type = 'button';
shipCrashRespawnButton.textContent = 'Respawn';
shipCrashOverlay.appendChild(shipCrashTitle);
shipCrashOverlay.appendChild(shipCrashSubtitle);
shipCrashOverlay.appendChild(shipCrashRespawnButton);
document.body.appendChild(shipCrashOverlay);

pokeballPopupClose.addEventListener('click', (e) => {
    e.stopPropagation();
    showPokeballLink = false;
    pokeballLinkPopup.style.display = 'none';
});

sasPopupClose.addEventListener('click', (e) => {
    e.stopPropagation();
    showSASLink = false;
    sasLinkPopup.style.display = 'none';
});

sasLinksToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sasLinksList.classList.toggle('open');
});

projectsDropdownToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    todoDropdownMenu.classList.remove('open');
    todoDropdownToggle.setAttribute('aria-expanded', 'false');
    const isOpen = projectsDropdownMenu.classList.toggle('open');
    projectsDropdownToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

todoDropdownToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    projectsDropdownMenu.classList.remove('open');
    projectsDropdownToggle.setAttribute('aria-expanded', 'false');
    const isOpen = todoDropdownMenu.classList.toggle('open');
    todoDropdownToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

function saveTodoSections() {
    try {
        localStorage.setItem(todoStorageKey, JSON.stringify(todoSections));
    } catch (error) {
        console.warn('Failed to save todo sections.', error);
    }
}

function loadTodoSections() {
    try {
        const rawValue = localStorage.getItem(todoStorageKey);
        if (!rawValue) {
            return [];
        }
        const parsed = JSON.parse(rawValue);
        if (!Array.isArray(parsed)) {
            return [];
        }
        const sanitized = parsed
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter((value) => value.length > 0);
        return sanitized;
    } catch (error) {
        console.warn('Failed to read saved todo sections; using empty list.', error);
        return [];
    }
}

function renderTodoSections() {
    if (!todoSectionsListEl) {
        return;
    }

    todoSectionsListEl.innerHTML = '';

    if (todoSections.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'todo-empty';
        emptyEl.textContent = 'No sections yet';
        todoSectionsListEl.appendChild(emptyEl);
        return;
    }

    todoSections.forEach((section, index) => {
        const row = document.createElement('div');
        row.className = 'todo-section-row';
        row.dataset.index = String(index);

        const title = document.createElement('span');
        title.className = 'todo-section-title';
        title.textContent = section;
        row.appendChild(title);

        const actions = document.createElement('div');
        actions.className = 'todo-section-actions';

        const upButton = document.createElement('button');
        upButton.type = 'button';
        upButton.className = 'todo-action';
        upButton.dataset.action = 'up';
        upButton.dataset.index = String(index);
        upButton.textContent = '↑';
        upButton.title = 'Move up';
        actions.appendChild(upButton);

        const downButton = document.createElement('button');
        downButton.type = 'button';
        downButton.className = 'todo-action';
        downButton.dataset.action = 'down';
        downButton.dataset.index = String(index);
        downButton.textContent = '↓';
        downButton.title = 'Move down';
        actions.appendChild(downButton);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'todo-action';
        deleteButton.dataset.action = 'delete';
        deleteButton.dataset.index = String(index);
        deleteButton.textContent = 'x';
        deleteButton.title = 'Delete';
        actions.appendChild(deleteButton);

        row.appendChild(actions);
        todoSectionsListEl.appendChild(row);
    });
}

function addTodoSection() {
    if (!todoSectionInput) {
        return;
    }

    const title = todoSectionInput.value.trim();
    if (!title) {
        return;
    }

    todoSections.push(title);
    todoSectionInput.value = '';
    saveTodoSections();
    renderTodoSections();
}

function moveTodoSectionUp(index) {
    if (index <= 0 || index >= todoSections.length) {
        return;
    }
    [todoSections[index - 1], todoSections[index]] = [todoSections[index], todoSections[index - 1]];
    saveTodoSections();
    renderTodoSections();
}

function moveTodoSectionDown(index) {
    if (index < 0 || index >= todoSections.length - 1) {
        return;
    }
    [todoSections[index + 1], todoSections[index]] = [todoSections[index], todoSections[index + 1]];
    saveTodoSections();
    renderTodoSections();
}

function deleteTodoSection(index) {
    if (index < 0 || index >= todoSections.length) {
        return;
    }
    todoSections.splice(index, 1);
    saveTodoSections();
    renderTodoSections();
}

if (todoSectionAddButton) {
    todoSectionAddButton.addEventListener('click', (e) => {
        e.stopPropagation();
        addTodoSection();
    });
}

if (todoSectionInput) {
    todoSectionInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
            addTodoSection();
        }
    });
}

if (todoSectionsListEl) {
    todoSectionsListEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionButton = e.target.closest('.todo-action');
        if (!actionButton) {
            return;
        }

        const index = Number(actionButton.dataset.index);
        if (!Number.isInteger(index)) {
            return;
        }

        const action = actionButton.dataset.action;
        if (action === 'up') {
            moveTodoSectionUp(index);
            return;
        }
        if (action === 'down') {
            moveTodoSectionDown(index);
            return;
        }
        if (action === 'delete') {
            deleteTodoSection(index);
        }
    });
}

function updateCityTimes() {
    const now = new Date();
    singaporeTimeEl.textContent = cityTimeFormatters.singapore.format(now);
    tokyoTimeEl.textContent = cityTimeFormatters.tokyo.format(now);
    singaporeDateEl.textContent = cityTimeFormatters.singaporeDate.format(now);
    tokyoDateEl.textContent = cityTimeFormatters.tokyoDate.format(now);
}

function focusOnObject(object3D, desiredDistance = null) {
    if (!object3D || !controls) {
        return;
    }

    object3D.getWorldPosition(focusTarget);
    let cameraOffset = camera.position.clone().sub(controls.target);
    if (desiredDistance !== null) {
        const safeDistance = Math.max(controls.minDistance + 0.5, desiredDistance);
        cameraOffset = cameraOffset.normalize().multiplyScalar(safeDistance);
    }

    trackedDistance = cameraOffset.length();
    trackedHeightOffset = cameraOffset.y;

    controls.target.copy(focusTarget);
    camera.position.copy(focusTarget.clone().add(cameraOffset));
    controls.update();
}

function updateTrackedCameraFollow() {
    if (!trackedObject || !controls) {
        trackedFollowInitialized = false;
        return;
    }

    trackedObject.getWorldPosition(focusTarget);
    if (!trackedFollowInitialized) {
        trackedLastTargetPos.copy(focusTarget);
        trackedFollowInitialized = true;
    } else {
        trackedTargetDelta.subVectors(focusTarget, trackedLastTargetPos);
        camera.position.add(trackedTargetDelta);
        trackedLastTargetPos.copy(focusTarget);
    }

    controls.target.copy(focusTarget);
}

function updatePokeballLinkLabelPosition() {
    if (!showPokeballLink || !pokeball) {
        pokeballLinkPopup.style.display = 'none';
        return;
    }

    pokeball.getWorldPosition(pokeballScreenPos);
    pokeballScreenPos.project(camera);

    // hide if outside clip space / behind the camera
    if (pokeballScreenPos.z < -1 || pokeballScreenPos.z > 1) {
        pokeballLinkPopup.style.display = 'none';
        return;
    }

    const x = (pokeballScreenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pokeballScreenPos.y * 0.5 + 0.5) * window.innerHeight;

    pokeballLinkPopup.style.display = 'flex';
    const desiredLeft = x + 120;
    const maxLeft = window.innerWidth - pokeballLinkPopup.offsetWidth - 12;
    const left = Math.max(12, Math.min(desiredLeft, maxLeft));
    const top = Math.max(24, Math.min(y, window.innerHeight - 24));
    pokeballLinkPopup.style.left = `${left}px`;
    pokeballLinkPopup.style.top = `${top}px`;
}

function updateSASLinkLabelPosition() {
    if (!showSASLink || !sasCube) {
        sasLinkPopup.style.display = 'none';
        return;
    }

    sasCube.getWorldPosition(sasScreenPos);
    sasScreenPos.project(camera);

    if (sasScreenPos.z < -1 || sasScreenPos.z > 1) {
        sasLinkPopup.style.display = 'none';
        return;
    }

    const x = (sasScreenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-sasScreenPos.y * 0.5 + 0.5) * window.innerHeight;

    sasLinkPopup.style.display = 'flex';
    const desiredLeft = x + 110;
    const maxLeft = window.innerWidth - sasLinkPopup.offsetWidth - 12;
    const left = Math.max(12, Math.min(desiredLeft, maxLeft));
    const top = Math.max(24, Math.min(y, window.innerHeight - 24));
    sasLinkPopup.style.left = `${left}px`;
    sasLinkPopup.style.top = `${top}px`;
}

function createSASCube() {
    earthTiltGroup = new THREE.Group();
    earthTiltGroup.rotation.z = earthAxialTiltRad;
    scene.add(earthTiltGroup);

    const sphereGeom = new THREE.SphereGeometry(0.35, 48, 48);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0x0a1f5e, roughness: 0.55, metalness: 0.02 });
    sasCube = new THREE.Mesh(sphereGeom, sphereMat);
    // Rotate around Y so longitude alignment is corrected without inverting poles.
    sasCube.rotation.y = Math.PI;
    sasCube.name = 'SAS';
    sasCube.userData.projectId = 'sas';
    earthTiltGroup.add(sasCube);
    objects.push(sasCube);

    earthCloudLayers.length = 0;
    const cloudLayerConfigs = [
        { radius: 0.357, opacity: 0.74, rotationY: 0.0 },
        { radius: 0.362, opacity: 0.36, rotationY: Math.PI / 5 }
    ];
    const cloudMaterials = [];

    cloudLayerConfigs.forEach((config) => {
        const cloudGeom = new THREE.SphereGeometry(config.radius, 48, 48);
        const cloudMat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: config.opacity,
            depthWrite: false
        });
        const cloudLayer = new THREE.Mesh(cloudGeom, cloudMat);
        cloudLayer.rotation.y = config.rotationY;
        sasCube.add(cloudLayer);
        earthCloudLayers.push(cloudLayer);
        cloudMaterials.push(cloudMat);
    });

    textureLoader.load(
        'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
        (earthTexture) => {
            earthTexture.encoding = THREE.sRGBEncoding;
            earthTexture.flipY = true;
            sphereMat.map = earthTexture;
            sphereMat.color.set(0xffffff);
            sphereMat.needsUpdate = true;
        },
        undefined,
        () => {
            console.warn('Earth texture failed to load; using fallback sphere color.');
        }
    );

    textureLoader.load(
        'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
        (cloudTexture) => {
            cloudTexture.encoding = THREE.sRGBEncoding;
            cloudTexture.flipY = true;
            cloudMaterials.forEach((cloudMat) => {
                cloudMat.map = cloudTexture;
                cloudMat.alphaMap = cloudTexture;
                cloudMat.needsUpdate = true;
            });
        },
        undefined,
        () => {
            console.warn('Earth cloud texture failed to load; using layered transparent cloud fallback.');
        }
    );
}

function createSpaceflightSimDisplay() {
    if (!earthTiltGroup) {
        return;
    }
    spaceStationPivot = new THREE.Group();
    spaceStationPivot.name = 'Space Station Orbit Pivot';
    spaceStationPivot.rotation.z = spaceflightStationOrbitTiltRad;
    earthTiltGroup.add(spaceStationPivot);

    spaceStation = new THREE.Group();
    spaceStation.name = 'Space Station';
    spaceStation.userData.projectId = 'spaceflight-sim-3d';
    spaceStation.position.set(spaceflightStationOrbitRadius, 0, 0);
    spaceStation.scale.setScalar(0.16);
    spaceStationPivot.add(spaceStation);

    const stationHullMaterial = new THREE.MeshStandardMaterial({ color: 0xdde4ef, roughness: 0.34, metalness: 0.78 });
    const stationDarkMaterial = new THREE.MeshStandardMaterial({ color: 0x6f7b90, roughness: 0.46, metalness: 0.62 });
    const stationPanelMaterial = new THREE.MeshStandardMaterial({
        color: 0x3e5e99,
        emissive: 0x1f2f56,
        roughness: 0.5,
        metalness: 0.45
    });
    const stationRadiatorMaterial = new THREE.MeshStandardMaterial({ color: 0xd6dbe6, roughness: 0.28, metalness: 0.36 });

    const trussSpine = new THREE.Mesh(
        new THREE.BoxGeometry(2.25, 0.07, 0.07),
        stationDarkMaterial
    );
    trussSpine.userData.projectId = 'spaceflight-sim-3d';
    spaceStation.add(trussSpine);
    objects.push(trussSpine);

    const trussSegmentGeometry = new THREE.BoxGeometry(0.18, 0.05, 0.05);
    for (let i = -5; i <= 5; i += 1) {
        const segment = new THREE.Mesh(trussSegmentGeometry, stationDarkMaterial);
        segment.position.x = i * 0.2;
        segment.userData.projectId = 'spaceflight-sim-3d';
        spaceStation.add(segment);
        objects.push(segment);

        if (i < 5) {
            const braceA = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.23, 8), stationDarkMaterial);
            braceA.position.x = i * 0.2 + 0.1;
            braceA.rotation.z = THREE.MathUtils.degToRad(58);
            braceA.userData.projectId = 'spaceflight-sim-3d';
            const braceB = braceA.clone();
            braceB.rotation.z = THREE.MathUtils.degToRad(-58);
            braceB.userData.projectId = 'spaceflight-sim-3d';
            spaceStation.add(braceA, braceB);
            objects.push(braceA, braceB);
        }
    }

    const node = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 20), stationHullMaterial);
    node.userData.projectId = 'spaceflight-sim-3d';
    spaceStation.add(node);
    objects.push(node);

    const mainLab = new THREE.Mesh(
        new THREE.CylinderGeometry(0.082, 0.082, 0.58, 22),
        stationHullMaterial
    );
    mainLab.rotation.z = Math.PI / 2;
    mainLab.position.x = -0.42;
    mainLab.userData.projectId = 'spaceflight-sim-3d';
    spaceStation.add(mainLab);
    objects.push(mainLab);

    const serviceModule = new THREE.Mesh(
        new THREE.CylinderGeometry(0.072, 0.09, 0.32, 20),
        stationHullMaterial
    );
    serviceModule.rotation.z = Math.PI / 2;
    serviceModule.position.x = -0.84;
    serviceModule.userData.projectId = 'spaceflight-sim-3d';
    spaceStation.add(serviceModule);
    objects.push(serviceModule);

    const lab2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.074, 0.074, 0.34, 20),
        stationHullMaterial
    );
    lab2.rotation.z = Math.PI / 2;
    lab2.position.x = 0.4;
    lab2.userData.projectId = 'spaceflight-sim-3d';
    spaceStation.add(lab2);
    objects.push(lab2);

    const cupolaBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.06, 0.1, 14),
        stationHullMaterial
    );
    cupolaBase.position.set(0.08, -0.11, 0);
    cupolaBase.rotation.z = Math.PI / 2;
    cupolaBase.userData.projectId = 'spaceflight-sim-3d';
    const cupolaWindow = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 12, 10),
        new THREE.MeshStandardMaterial({
            color: 0x9fccff,
            emissive: 0x78a8ff,
            emissiveIntensity: 0.14,
            transparent: true,
            opacity: 0.72,
            roughness: 0.12,
            metalness: 0.22
        })
    );
    cupolaWindow.position.set(0.13, -0.11, 0);
    cupolaWindow.scale.set(1.1, 0.78, 0.78);
    cupolaWindow.userData.projectId = 'spaceflight-sim-3d';
    spaceStation.add(cupolaBase, cupolaWindow);
    objects.push(cupolaBase, cupolaWindow);

    const zenithModule = new THREE.Mesh(
        new THREE.CylinderGeometry(0.062, 0.062, 0.26, 18),
        stationHullMaterial
    );
    zenithModule.position.set(0.03, 0.19, 0);
    zenithModule.userData.projectId = 'spaceflight-sim-3d';
    const nadirModule = zenithModule.clone();
    nadirModule.position.y = -0.22;
    nadirModule.userData.projectId = 'spaceflight-sim-3d';
    spaceStation.add(zenithModule, nadirModule);
    objects.push(zenithModule, nadirModule);

    const dockPortGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.07, 16);
    const foreDockPort = new THREE.Mesh(dockPortGeometry, stationDarkMaterial);
    foreDockPort.position.set(0, 0.04, -0.2);
    foreDockPort.rotation.x = Math.PI / 2;
    foreDockPort.userData.projectId = 'spaceflight-sim-3d';
    const aftDockPort = foreDockPort.clone();
    aftDockPort.position.set(-1.04, 0, 0);
    aftDockPort.rotation.z = Math.PI / 2;
    aftDockPort.userData.projectId = 'spaceflight-sim-3d';
    spaceStation.add(foreDockPort, aftDockPort);
    objects.push(foreDockPort, aftDockPort);

    const radiatorGeometry = new THREE.BoxGeometry(0.62, 0.014, 0.13);
    const radiatorTop = new THREE.Mesh(radiatorGeometry, stationRadiatorMaterial);
    radiatorTop.position.set(-0.08, 0.33, 0);
    radiatorTop.userData.projectId = 'spaceflight-sim-3d';
    const radiatorBottom = radiatorTop.clone();
    radiatorBottom.position.y = -0.33;
    radiatorBottom.userData.projectId = 'spaceflight-sim-3d';
    spaceStation.add(radiatorTop, radiatorBottom);
    objects.push(radiatorTop, radiatorBottom);

    const arrayPanelGeometry = new THREE.BoxGeometry(0.42, 0.014, 0.22);
    const arrayFrameGeometry = new THREE.BoxGeometry(0.46, 0.02, 0.26);
    const arrayWingRoots = [
        { x: -0.66, zDir: -1 },
        { x: -0.66, zDir: 1 },
        { x: 0.66, zDir: -1 },
        { x: 0.66, zDir: 1 }
    ];

    arrayWingRoots.forEach((wing) => {
        for (let i = 0; i < 2; i += 1) {
            const frame = new THREE.Mesh(arrayFrameGeometry, stationDarkMaterial);
            frame.position.set(wing.x, 0, wing.zDir * (0.26 + i * 0.3));
            frame.userData.projectId = 'spaceflight-sim-3d';
            spaceStation.add(frame);
            objects.push(frame);

            const panel = new THREE.Mesh(arrayPanelGeometry, stationPanelMaterial);
            panel.position.copy(frame.position);
            panel.userData.projectId = 'spaceflight-sim-3d';
            spaceStation.add(panel);
            objects.push(panel);

            const mast = new THREE.Mesh(
                new THREE.CylinderGeometry(0.008, 0.008, 0.26, 8),
                stationDarkMaterial
            );
            mast.position.set(wing.x, 0, wing.zDir * (0.11 + i * 0.3));
            mast.rotation.x = Math.PI / 2;
            mast.userData.projectId = 'spaceflight-sim-3d';
            spaceStation.add(mast);
            objects.push(mast);
        }
    });

    spaceShip = new THREE.Group();
    spaceShip.name = 'Space Ship';
    spaceShip.userData.projectId = 'spaceflight-sim-3d';
    spaceShip.position.copy(shipDockOffset);
    spaceStation.add(spaceShip);

    const shipHullMaterial = new THREE.MeshStandardMaterial({ color: 0xeaf2ff, roughness: 0.38, metalness: 0.7 });
    const shipDarkMaterial = new THREE.MeshStandardMaterial({ color: 0x4f5f78, roughness: 0.46, metalness: 0.6 });
    const shipAccentMaterial = new THREE.MeshStandardMaterial({ color: 0x7ca7ff, roughness: 0.32, metalness: 0.4 });
    const shipGlassMaterial = new THREE.MeshStandardMaterial({
        color: 0xa8d8ff,
        emissive: 0x5ea5ff,
        emissiveIntensity: 0.16,
        transparent: true,
        opacity: 0.78,
        roughness: 0.1,
        metalness: 0.2
    });

    const shipBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.034, 0.22, 16),
        shipHullMaterial
    );
    shipBody.rotation.x = Math.PI / 2;
    shipBody.userData.projectId = 'spaceflight-sim-3d';
    spaceShip.add(shipBody);
    objects.push(shipBody);

    const shipSpine = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.026, 0.19),
        shipDarkMaterial
    );
    shipSpine.position.set(0, 0.013, 0.01);
    shipSpine.userData.projectId = 'spaceflight-sim-3d';
    spaceShip.add(shipSpine);
    objects.push(shipSpine);

    const shipNose = new THREE.Mesh(
        new THREE.ConeGeometry(0.026, 0.07, 14),
        shipHullMaterial
    );
    shipNose.position.z = -0.11;
    shipNose.rotation.x = Math.PI / 2;
    shipNose.userData.projectId = 'spaceflight-sim-3d';
    spaceShip.add(shipNose);
    objects.push(shipNose);

    const shipCanopy = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 14, 10),
        shipGlassMaterial
    );
    shipCanopy.position.set(0, 0.018, -0.06);
    shipCanopy.scale.set(1.15, 0.75, 1.65);
    shipCanopy.userData.projectId = 'spaceflight-sim-3d';
    spaceShip.add(shipCanopy);
    objects.push(shipCanopy);

    const shipWingGeometry = new THREE.BoxGeometry(0.15, 0.01, 0.06);
    const shipWingMaterial = shipAccentMaterial;
    const shipWing = new THREE.Mesh(shipWingGeometry, shipWingMaterial);
    shipWing.position.set(0, -0.014, 0.005);
    shipWing.userData.projectId = 'spaceflight-sim-3d';
    spaceShip.add(shipWing);
    objects.push(shipWing);

    const shipPodGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.11, 12);
    [-0.04, 0.04].forEach((xPosition) => {
        const pod = new THREE.Mesh(shipPodGeometry, shipDarkMaterial);
        pod.rotation.x = Math.PI / 2;
        pod.position.set(xPosition, -0.008, 0.02);
        pod.userData.projectId = 'spaceflight-sim-3d';
        spaceShip.add(pod);
        objects.push(pod);
    });

    const shipFinGeometry = new THREE.BoxGeometry(0.012, 0.042, 0.05);
    [-0.046, 0.046].forEach((xPosition) => {
        const fin = new THREE.Mesh(shipFinGeometry, shipDarkMaterial);
        fin.position.set(xPosition, -0.005, 0.078);
        fin.userData.projectId = 'spaceflight-sim-3d';
        spaceShip.add(fin);
        objects.push(fin);
    });

    const shipEngineGeometry = new THREE.CylinderGeometry(0.015, 0.02, 0.046, 12);
    const shipEngineSideGeometry = new THREE.CylinderGeometry(0.01, 0.014, 0.036, 10);
    const shipEngine = new THREE.Mesh(shipEngineGeometry, shipDarkMaterial);
    shipEngine.position.z = 0.108;
    shipEngine.rotation.x = Math.PI / 2;
    shipEngine.userData.projectId = 'spaceflight-sim-3d';
    const shipEngineLeft = new THREE.Mesh(shipEngineSideGeometry, shipDarkMaterial);
    shipEngineLeft.position.set(-0.022, -0.004, 0.1);
    shipEngineLeft.rotation.x = Math.PI / 2;
    shipEngineLeft.userData.projectId = 'spaceflight-sim-3d';
    const shipEngineRight = shipEngineLeft.clone();
    shipEngineRight.position.x = 0.022;
    shipEngineRight.userData.projectId = 'spaceflight-sim-3d';
    spaceShip.add(shipEngine, shipEngineLeft, shipEngineRight);
    objects.push(shipEngine, shipEngineLeft, shipEngineRight);

    const shipEngineGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 12, 12),
        new THREE.MeshStandardMaterial({
            color: 0x89c7ff,
            emissive: 0x89c7ff,
            emissiveIntensity: 0,
            transparent: true,
            opacity: 0.35
        })
    );
    shipEngineGlow.position.set(0, 0, 0.136);
    shipEngineGlow.userData.projectId = 'spaceflight-sim-3d';
    spaceShip.add(shipEngineGlow);
    shipEngineGlowMaterial = shipEngineGlow.material;
    objects.push(shipEngineGlow);

    const shipSideGlowGeometry = new THREE.SphereGeometry(0.007, 10, 10);
    const shipSideGlowMaterial = new THREE.MeshStandardMaterial({
        color: 0x89c7ff,
        emissive: 0x89c7ff,
        emissiveIntensity: 0.32,
        transparent: true,
        opacity: 0.32
    });
    const shipSideGlowLeft = new THREE.Mesh(shipSideGlowGeometry, shipSideGlowMaterial);
    shipSideGlowLeft.position.set(-0.022, -0.004, 0.126);
    shipSideGlowLeft.userData.projectId = 'spaceflight-sim-3d';
    const shipSideGlowRight = shipSideGlowLeft.clone();
    shipSideGlowRight.position.x = 0.022;
    shipSideGlowRight.userData.projectId = 'spaceflight-sim-3d';
    spaceShip.add(shipSideGlowLeft, shipSideGlowRight);
    objects.push(shipSideGlowLeft, shipSideGlowRight);

    const shipAntenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0022, 0.0022, 0.045, 8),
        shipDarkMaterial
    );
    shipAntenna.position.set(0, 0.032, -0.02);
    shipAntenna.rotation.x = Math.PI / 12;
    shipAntenna.userData.projectId = 'spaceflight-sim-3d';
    const shipAntennaTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.0042, 10, 10),
        shipAccentMaterial
    );
    shipAntennaTip.position.set(0, 0.053, -0.03);
    shipAntennaTip.userData.projectId = 'spaceflight-sim-3d';
    spaceShip.add(shipAntenna, shipAntennaTip);
    objects.push(shipAntenna, shipAntennaTip);

    shipEngineLight = new THREE.PointLight(0x7ec2ff, 0, 1.2, 2);
    shipEngineLight.position.set(0, 0, 0.145);
    spaceShip.add(shipEngineLight);

    const orbitPoints = [];
    const orbitSegments = 220;
    for (let i = 0; i <= orbitSegments; i += 1) {
        const angle = (i / orbitSegments) * TWO_PI;
        orbitPoints.push(
            new THREE.Vector3(
                Math.cos(angle) * spaceflightStationOrbitRadius,
                0,
                Math.sin(angle) * spaceflightStationOrbitRadius
            )
        );
    }
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
        color: spaceflightOrbitPathColor,
        transparent: true,
        opacity: spaceflightOrbitPathOpacity
    });
    const orbitRing = new THREE.LineLoop(orbitGeometry, orbitMaterial);
    spaceStationPivot.add(orbitRing);
}

function createEnemyDreadnought() {
    enemyDreadnought = new THREE.Group();
    enemyDreadnought.name = 'Enemy Dreadnought';

    const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x6a707d, roughness: 0.42, metalness: 0.76 });
    const armorMaterial = new THREE.MeshStandardMaterial({ color: 0x3d4452, roughness: 0.55, metalness: 0.64 });
    const lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xff8e47,
        emissive: 0xff5f21,
        emissiveIntensity: 0.68,
        roughness: 0.22,
        metalness: 0.16
    });
    const panelMaterial = new THREE.MeshStandardMaterial({
        color: 0x384d7f,
        emissive: 0x1b2f54,
        emissiveIntensity: 0.34,
        roughness: 0.46,
        metalness: 0.4
    });

    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.4, 20), hullMaterial);
    hull.rotation.z = Math.PI / 2;
    enemyDreadnought.add(hull);
    const hullFrontCap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 14), hullMaterial);
    hullFrontCap.position.x = 1.2;
    enemyDreadnought.add(hullFrontCap);
    const hullRearCap = hullFrontCap.clone();
    hullRearCap.position.x = -1.2;
    enemyDreadnought.add(hullRearCap);

    const spine = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.24, 0.24), armorMaterial);
    spine.position.y = 0.2;
    enemyDreadnought.add(spine);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.34), hullMaterial);
    bridge.position.set(0.74, 0.42, 0);
    enemyDreadnought.add(bridge);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.62, 12), armorMaterial);
    nose.position.x = 1.48;
    nose.rotation.z = -Math.PI / 2;
    enemyDreadnought.add(nose);

    const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.54), armorMaterial);
    engineBlock.position.x = -1.36;
    enemyDreadnought.add(engineBlock);

    [-0.19, 0, 0.19].forEach((zPos) => {
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.22, 14), armorMaterial);
        nozzle.position.set(-1.64, -0.03, zPos);
        nozzle.rotation.z = Math.PI / 2;
        enemyDreadnought.add(nozzle);

        const plume = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), lightMaterial);
        plume.position.set(-1.76, -0.03, zPos);
        enemyDreadnought.add(plume);
    });

    [-0.72, 0.72].forEach((zPos) => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.36), armorMaterial);
        wing.position.set(0.02, 0, zPos);
        enemyDreadnought.add(wing);

        const wingPanel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.028, 0.26), panelMaterial);
        wingPanel.position.set(0.02, 0.04, zPos);
        enemyDreadnought.add(wingPanel);
    });

    [0.2, 0.65, 1.1].forEach((xPos) => {
        const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.06, 12), armorMaterial);
        turretBase.position.set(xPos, 0.3, 0);
        enemyDreadnought.add(turretBase);

        const turretBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 10), armorMaterial);
        turretBarrel.position.set(xPos + 0.13, 0.3, 0);
        turretBarrel.rotation.z = Math.PI / 2;
        enemyDreadnought.add(turretBarrel);
    });

    enemyDreadnought.scale.setScalar(0.9);
    enemyDreadnought.visible = false;
    scene.add(enemyDreadnought);
}

function getRandomEnemyPathPoint(target) {
    if (!homeSphere) {
        target.set(0, 0, 0);
        return target;
    }
    homeSphere.getWorldPosition(enemyOrbitCenter);
    const radius = 22 + Math.random() * 14;
    const azimuth = Math.random() * TWO_PI;
    const elevation = THREE.MathUtils.degToRad(-22 + Math.random() * 44);
    const flatRadius = Math.cos(elevation) * radius;
    target.set(
        Math.cos(azimuth) * flatRadius,
        Math.sin(elevation) * radius,
        Math.sin(azimuth) * flatRadius
    );
    target.add(enemyOrbitCenter);
    return target;
}

function setEnemyEncounterActive(active) {
    enemyEncounterActive = active;
    if (!enemyDreadnought) {
        return;
    }

    if (!active || !enemyAlive) {
        enemyDreadnought.visible = false;
        enemyPathTarget.set(0, 0, 0);
        for (let i = missiles.length - 1; i >= 0; i -= 1) {
            scene.remove(missiles[i].mesh);
            missiles.splice(i, 1);
        }
        for (let i = enemyProjectiles.length - 1; i >= 0; i -= 1) {
            scene.remove(enemyProjectiles[i].mesh);
            enemyProjectiles.splice(i, 1);
        }
        for (let i = explosions.length - 1; i >= 0; i -= 1) {
            scene.remove(explosions[i].mesh);
            explosions[i].mesh.material.dispose();
            explosions.splice(i, 1);
        }
        missileCooldownTimer = 0;
        enemyFireCooldownTimer = 0;
        return;
    }

    enemyDreadnought.visible = true;
    if (enemyPathTarget.lengthSq() === 0) {
        getRandomEnemyPathPoint(enemyOrbitPos);
        enemyDreadnought.position.copy(enemyOrbitPos);
        getRandomEnemyPathPoint(enemyPathTarget);
    }
}

function updateEnemyDreadnought(dt) {
    if (!enemyDreadnought || !enemyAlive || !homeSphere || !enemyEncounterActive) {
        return;
    }
    if (enemyPathTarget.lengthSq() === 0) {
        getRandomEnemyPathPoint(enemyPathTarget);
    }

    enemyOrbitPos.copy(enemyPathTarget).sub(enemyDreadnought.position);
    const distanceToTarget = enemyOrbitPos.length();
    if (distanceToTarget <= enemyNavState.arrivalThreshold) {
        getRandomEnemyPathPoint(enemyPathTarget);
        enemyOrbitPos.copy(enemyPathTarget).sub(enemyDreadnought.position);
    }

    const moveDistance = Math.min(enemyNavState.speed * dt, enemyOrbitPos.length());
    if (moveDistance > 0) {
        enemyOrbitPos.normalize();
        enemyDreadnought.position.addScaledVector(enemyOrbitPos, moveDistance);
        enemyOrbitLookPos.copy(enemyDreadnought.position).addScaledVector(enemyOrbitPos, 1.2);
    } else {
        enemyOrbitLookPos.copy(enemyPathTarget);
    }
    enemyDreadnought.lookAt(enemyOrbitLookPos);
}

function updateEnemyHealthUI() {
    if (!enemyHealthUI) {
        return;
    }
    if (!enemyAlive || !enemyEncounterActive) {
        enemyHealthUI.style.display = 'none';
        return;
    }
    if (!enemyDreadnought || !spaceShip) {
        enemyHealthUI.style.display = 'none';
        return;
    }

    enemyDreadnought.getWorldPosition(enemyOrbitPos);
    spaceShip.getWorldPosition(shipWorldPos);
    enemyToShipDelta.subVectors(enemyOrbitPos, shipWorldPos);
    if (enemyToShipDelta.lengthSq() > enemyHealthUIRange * enemyHealthUIRange) {
        enemyHealthUI.style.display = 'none';
        return;
    }

    enemyHealthUI.style.display = 'block';
    const healthPct = THREE.MathUtils.clamp(enemyHealth / enemyMaxHealth, 0, 1);
    enemyHealthFill.style.width = `${(healthPct * 100).toFixed(2)}%`;
    enemyHealthValue.textContent = `${Math.max(0, Math.ceil(enemyHealth))}/${enemyMaxHealth}`;
}

function updateAmmoCounter() {
    if (!simAmmoCounter) {
        return;
    }
    if (!shipControlActive) {
        simAmmoCounter.style.display = 'none';
        return;
    }
    simAmmoCounter.style.display = 'block';
    simAmmoValue.textContent = `${Math.max(0, Math.floor(shipAmmo))}`;
}

function selectMissileLoadout(loadoutId) {
    if (!(loadoutId in missileLoadouts)) {
        return;
    }
    activeMissileLoadoutId = loadoutId;
    updateMissileInventoryUI();
}

function updateMissileInventoryUI() {
    if (!missileInventoryUI) {
        return;
    }
    if (!shipControlActive) {
        missileInventoryUI.style.display = 'none';
        return;
    }
    missileInventoryUI.style.display = 'block';
    missileLoadoutOrder.forEach((loadoutId) => {
        const isActive = loadoutId === activeMissileLoadoutId;
        missileSlotElements[loadoutId].classList.toggle('active', isActive);
    });
}

function spawnExplosion(position, color = 0xffa356, baseScale = 1) {
    const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.95,
        roughness: 0.28,
        metalness: 0.05
    });
    const mesh = new THREE.Mesh(explosionGeometry, material);
    mesh.position.copy(position);
    mesh.scale.setScalar(0.35 * baseScale);
    scene.add(mesh);
    explosions.push({
        mesh,
        age: 0,
        lifetime: 0.45 + 0.35 * baseScale,
        growthRate: 3.6 * baseScale
    });
}

function updateExplosions(dt) {
    for (let i = explosions.length - 1; i >= 0; i -= 1) {
        const explosion = explosions[i];
        explosion.age += dt;
        const t = THREE.MathUtils.clamp(explosion.age / explosion.lifetime, 0, 1);
        const scale = 0.35 + explosion.growthRate * t;
        explosion.mesh.scale.setScalar(scale);
        explosion.mesh.material.opacity = (1 - t) * 0.95;
        explosion.mesh.material.emissiveIntensity = 1.2 * (1 - t);
        if (t >= 1) {
            scene.remove(explosion.mesh);
            explosion.mesh.material.dispose();
            explosions.splice(i, 1);
        }
    }
}

function fireShipMissile() {
    if (!shipControlActive || shipDocked || shipAutoDockActive || !spaceShip || !enemyAlive || !enemyEncounterActive || shipCrashed) {
        return;
    }
    if (missileCooldownTimer > 0) {
        return;
    }
    if (shipAmmo <= 0) {
        return;
    }
    const loadout = missileLoadouts[activeMissileLoadoutId];
    if (!loadout) {
        return;
    }

    spaceShip.getWorldPosition(missileSpawnPos);
    spaceShip.getWorldQuaternion(shipWorldQuat);
    missileVelocityWorld.copy(shipForwardAxis).applyQuaternion(shipWorldQuat).normalize();
    missileSpawnPos.addScaledVector(missileVelocityWorld, 0.18);

    const missileMesh = new THREE.Mesh(missileGeometry, missileMaterials[activeMissileLoadoutId]);
    missileMesh.position.copy(missileSpawnPos);
    missileMesh.quaternion.copy(shipWorldQuat);
    missileMesh.userData.projectId = 'spaceflight-sim-3d';
    scene.add(missileMesh);

    missiles.push({
        mesh: missileMesh,
        life: loadout.lifetimeSeconds,
        velocity: missileVelocityWorld.clone().multiplyScalar(loadout.speed),
        damage: loadout.damage,
        radius: loadout.radius
    });
    missileCooldownTimer = loadout.cooldownSeconds;
    shipAmmo -= 1;
}

function updateMissiles(dt) {
    if (missileCooldownTimer > 0) {
        missileCooldownTimer = Math.max(0, missileCooldownTimer - dt);
    }
    if (missiles.length === 0) {
        return;
    }

    if (enemyDreadnought && enemyAlive && enemyEncounterActive) {
        enemyDreadnought.getWorldPosition(enemyOrbitPos);
    }

    for (let i = missiles.length - 1; i >= 0; i -= 1) {
        const missile = missiles[i];
        missile.life -= dt;
        missile.mesh.position.addScaledVector(missile.velocity, dt);

        if (missile.life <= 0) {
            scene.remove(missile.mesh);
            missiles.splice(i, 1);
            continue;
        }

        if (!enemyAlive || !enemyDreadnought || !enemyEncounterActive) {
            continue;
        }

        missileEnemyDelta.subVectors(missile.mesh.position, enemyOrbitPos);
        const hitRadius = enemyHitRadius + missile.radius;
        if (missileEnemyDelta.lengthSq() <= hitRadius * hitRadius) {
            spawnExplosion(missile.mesh.position, 0xffb56f, 0.8);
            enemyHealth = Math.max(0, enemyHealth - missile.damage);
            scene.remove(missile.mesh);
            missiles.splice(i, 1);

            if (enemyHealth <= 0) {
                enemyAlive = false;
                enemyDreadnought.visible = false;
                enemyEncounterActive = false;
                spawnExplosion(enemyOrbitPos, 0xff9954, 2.2);
            }
        }
    }
}

function fireEnemyProjectile() {
    if (!enemyAlive || !enemyEncounterActive || !enemyDreadnought || !spaceShip || shipDocked || shipCrashed) {
        return;
    }
    if (enemyFireCooldownTimer > 0) {
        return;
    }

    enemyDreadnought.getWorldPosition(enemyOrbitPos);
    spaceShip.getWorldPosition(shipWorldPos);
    enemyToShipDelta.subVectors(shipWorldPos, enemyOrbitPos);
    if (enemyToShipDelta.lengthSq() > enemyFireRange * enemyFireRange) {
        return;
    }

    const shotDir = enemyToShipDelta.normalize();
    shotDir.x += (Math.random() - 0.5) * enemyProjectileAimJitter;
    shotDir.y += (Math.random() - 0.5) * enemyProjectileAimJitter;
    shotDir.z += (Math.random() - 0.5) * enemyProjectileAimJitter;
    shotDir.normalize();
    const projectile = new THREE.Mesh(enemyProjectileGeometry, enemyProjectileMaterial);
    projectile.position.copy(enemyOrbitPos).addScaledVector(shotDir, 1.7);
    scene.add(projectile);
    enemyProjectiles.push({
        mesh: projectile,
        life: enemyProjectileLifetimeSeconds,
        velocity: shotDir.clone().multiplyScalar(enemyProjectileSpeed)
    });
    enemyFireCooldownTimer = enemyFireCooldownSeconds;
}

function updateEnemyProjectiles(dt) {
    if (enemyFireCooldownTimer > 0) {
        enemyFireCooldownTimer = Math.max(0, enemyFireCooldownTimer - dt);
    }

    if (enemyEncounterActive && enemyAlive) {
        fireEnemyProjectile();
    }

    if (enemyProjectiles.length === 0 || !spaceShip) {
        return;
    }

    spaceShip.getWorldPosition(shipWorldPos);
    for (let i = enemyProjectiles.length - 1; i >= 0; i -= 1) {
        const shot = enemyProjectiles[i];
        shot.life -= dt;
        shot.mesh.position.addScaledVector(shot.velocity, dt);

        if (shot.life <= 0) {
            scene.remove(shot.mesh);
            enemyProjectiles.splice(i, 1);
            continue;
        }

        if (shipDocked || shipCrashed) {
            continue;
        }

        missileEnemyDelta.subVectors(shot.mesh.position, shipWorldPos);
        const hitRadius = enemyProjectileDamageRadius + shipCollisionRadius;
        if (missileEnemyDelta.lengthSq() <= hitRadius * hitRadius) {
            spawnExplosion(shot.mesh.position, 0xff6a3f, 0.9);
            scene.remove(shot.mesh);
            enemyProjectiles.splice(i, 1);
            triggerShipCrash();
        }
    }
}

function resetShipControlState() {
    Object.keys(shipControlState).forEach((key) => {
        shipControlState[key] = false;
    });
}

function resetShipTurnState() {
    shipPendingYaw = 0;
    shipPendingPitch = 0;
    shipAngularVelocity.set(0, 0);
}

function setShipCrashOverlayVisible(visible) {
    shipCrashOverlay.style.display = visible ? 'flex' : 'none';
}

function undockSpaceShip() {
    if (!spaceShip || !spaceStation || !earthTiltGroup || !shipDocked || shipAutoDockActive) {
        return;
    }
    earthTiltGroup.attach(spaceShip);
    shipDocked = false;
    shipAutoDockActive = false;
    shipOrbitVelocityLocal.set(
        -Math.sin(spaceflightStationOrbitAngle) * spaceflightStationOrbitRadius * spaceflightStationAngularSpeed,
        0,
        Math.cos(spaceflightStationOrbitAngle) * spaceflightStationOrbitRadius * spaceflightStationAngularSpeed
    );
    shipOrbitVelocityTiltLocal.copy(shipOrbitVelocityLocal).applyQuaternion(spaceStationPivot.quaternion);
    shipOrbitVelocityWorld.copy(shipOrbitVelocityTiltLocal).applyQuaternion(earthTiltGroup.quaternion);
    shipVelocity.copy(shipOrbitVelocityWorld);
    shipUndockCollisionGraceTimer = shipUndockCollisionGraceSeconds;
    shipCrashed = false;
}

function activateSpaceflightControl() {
    if (!spaceShip) {
        return;
    }
    if (freecamEnabled) {
        disableFreecam();
    }
    shipControlActive = true;
    trackedObject = null;
    trackedFollowInitialized = false;
    controls.enabled = false;
    document.body.style.cursor = 'none';
    if (document.pointerLockElement !== renderer.domElement && renderer.domElement.requestPointerLock) {
        renderer.domElement.requestPointerLock();
    }
    updateMissileInventoryUI();
}

function deactivateSpaceflightControl() {
    if (!shipControlActive) {
        return;
    }
    shipControlActive = false;
    shipAutoDockActive = false;
    missileTriggerHeld = false;
    shipVelocity.multiplyScalar(0.94);
    resetShipControlState();
    resetShipTurnState();
    controls.enabled = true;
    shipThrottleLevel = 0;
    shipThrottleCommand = 0;
    document.body.style.cursor = '';
    if (document.pointerLockElement === renderer.domElement && document.exitPointerLock) {
        document.exitPointerLock();
    }
    updateMissileInventoryUI();
}

function getDockDistanceToShip() {
    if (!spaceShip || !spaceStation) {
        return Infinity;
    }
    spaceShip.getWorldPosition(shipWorldPos);
    shipDockWorldPos.copy(shipDockOffset);
    spaceStation.localToWorld(shipDockWorldPos);
    return shipWorldPos.distanceTo(shipDockWorldPos);
}

function completeShipDocking() {
    if (!spaceShip || !spaceStation) {
        return;
    }
    spaceStation.attach(spaceShip);
    spaceShip.position.copy(shipDockOffset);
    spaceShip.quaternion.identity();
    shipVelocity.set(0, 0, 0);
    shipDocked = true;
    shipAutoDockActive = false;
    shipAmmo = shipMaxAmmo;
    shipUndockCollisionGraceTimer = 0;
    resetShipTurnState();
}

function resetShipAfterCrash() {
    if (!spaceShip || !spaceStation) {
        return;
    }
    completeShipDocking();
    shipCrashed = false;
    setShipCrashOverlayVisible(false);
    activateSpaceflightControl();
    updateSpaceShipCamera();
    updateThrottleMeter();
    updateSpeedometer();
}

function triggerShipCrash() {
    if (shipCrashed) {
        return;
    }
    shipCrashed = true;
    missileTriggerHeld = false;
    shipAutoDockActive = false;
    shipVelocity.set(0, 0, 0);
    shipThrottleCommand = 0;
    shipThrottleLevel = 0;
    resetShipControlState();
    resetShipTurnState();
    if (spaceShip) {
        spaceShip.getWorldPosition(shipWorldPos);
        spawnExplosion(shipWorldPos, 0xff8f63, 1.2);
    }
    deactivateSpaceflightControl();
    setShipCrashOverlayVisible(true);
    trackedObject = spaceShip || spaceStation || sasCube;
    focusOnObject(trackedObject, 5.5);
}

function checkShipCollisionAlongPath(startWorld, endWorld) {
    const colliderRoots = [
        { object: homeSphere, grace: false },
        { object: pokeball, grace: false },
        { object: sasCube, grace: false },
        { object: spaceStation, grace: true },
        { object: enemyAlive && enemyEncounterActive ? enemyDreadnought : null, grace: false }
    ];

    scene.updateMatrixWorld(true);
    shipCollisionSegment.subVectors(endWorld, startWorld);
    const segmentLenSq = shipCollisionSegment.lengthSq();

    for (const collider of colliderRoots) {
        if (!collider.object) {
            continue;
        }
        if (collider.grace && shipUndockCollisionGraceTimer > 0) {
            continue;
        }

        shipCollisionMeshes.length = 0;
        collider.object.traverse((node) => {
            if (node.isMesh && node.geometry) {
                shipCollisionMeshes.push(node);
            }
        });

        for (const mesh of shipCollisionMeshes) {
            if (!mesh.geometry.boundingSphere) {
                mesh.geometry.computeBoundingSphere();
            }
            if (!mesh.geometry.boundingSphere) {
                continue;
            }

            shipCollisionMeshCenter.copy(mesh.geometry.boundingSphere.center).applyMatrix4(mesh.matrixWorld);
            shipCollisionMeshScale.setFromMatrixScale(mesh.matrixWorld);
            const meshRadius =
                mesh.geometry.boundingSphere.radius *
                Math.max(shipCollisionMeshScale.x, shipCollisionMeshScale.y, shipCollisionMeshScale.z);
            const combinedRadius = shipCollisionRadius + meshRadius;

            if (segmentLenSq < 1e-8) {
                if (startWorld.distanceToSquared(shipCollisionMeshCenter) <= combinedRadius * combinedRadius) {
                    return true;
                }
                continue;
            }

            shipCollisionToCenter.subVectors(shipCollisionMeshCenter, startWorld);
            const t = THREE.MathUtils.clamp(
                shipCollisionToCenter.dot(shipCollisionSegment) / segmentLenSq,
                0,
                1
            );
            shipCollisionClosestPoint.copy(startWorld).addScaledVector(shipCollisionSegment, t);
            if (shipCollisionClosestPoint.distanceToSquared(shipCollisionMeshCenter) <= combinedRadius * combinedRadius) {
                return true;
            }
        }
    }

    return false;
}

function attemptShipRelatch() {
    if (!shipControlActive || !spaceShip || !spaceStation || !earthTiltGroup || shipDocked || shipAutoDockActive) {
        return;
    }
    if (getDockDistanceToShip() > shipLatchRange) {
        return;
    }
    shipAutoDockActive = true;
    shipThrottleCommand = 0;
    shipVelocity.set(0, 0, 0);
    resetShipControlState();
}

function updateShipAutoDock(dt) {
    if (!shipAutoDockActive || !spaceShip || !spaceStation || !earthTiltGroup) {
        return;
    }

    shipDockWorldPos.copy(shipDockOffset);
    spaceStation.localToWorld(shipDockWorldPos);
    shipDockLocalPos.copy(shipDockWorldPos);
    earthTiltGroup.worldToLocal(shipDockLocalPos);

    const toDockDist = spaceShip.position.distanceTo(shipDockLocalPos);
    const moveStep = shipAutoDockSpeed * dt;
    if (toDockDist <= moveStep || toDockDist < 0.03) {
        completeShipDocking();
        return;
    }
    spaceShip.position.lerp(shipDockLocalPos, moveStep / toDockDist);

    spaceStation.getWorldQuaternion(shipTargetWorldQuat);
    earthTiltGroup.getWorldQuaternion(shipParentWorldQuat);
    shipParentWorldQuat.invert();
    shipTargetLocalQuat.copy(shipParentWorldQuat).multiply(shipTargetWorldQuat);
    spaceShip.quaternion.slerp(shipTargetLocalQuat, shipAutoDockRotateLerp);
}

function updateThrottleMeter() {
    if (!simThrottleMeter) {
        return;
    }

    if (!shipControlActive) {
        simThrottleMeter.style.display = 'none';
        return;
    }

    simThrottleMeter.style.display = 'block';
    const percent = Math.round(THREE.MathUtils.clamp(shipThrottleCommand, 0, 1) * 100);
    simThrottleFill.style.width = `${percent}%`;
    simThrottleValue.textContent = `${percent}%`;
}

function updateShipEngineVisuals(dt, targetThrottleLevel) {
    const target = THREE.MathUtils.clamp(targetThrottleLevel, 0, 1);
    const blend = 1 - Math.exp(-shipThrottleLerpSpeed * dt);
    shipThrottleLevel += (target - shipThrottleLevel) * blend;

    if (shipEngineGlowMaterial) {
        shipEngineGlowMaterial.emissiveIntensity = 0.08 + shipThrottleLevel * 3.2;
        shipEngineGlowMaterial.opacity = 0.26 + shipThrottleLevel * 0.62;
    }
    if (shipEngineLight) {
        shipEngineLight.intensity = shipThrottleLevel * 3.8;
    }
}

function updateSpeedometer() {
    if (!simSpeedometer) {
        return;
    }

    if (!shipControlActive) {
        simSpeedometer.style.display = 'none';
        return;
    }

    simSpeedometer.style.display = 'block';
    const speed = shipVelocity.length();
    simSpeedValue.textContent = speed.toFixed(2);
}

function adjustManualThrottle(delta) {
    shipThrottleCommand = THREE.MathUtils.clamp(shipThrottleCommand + delta, 0, 1);
}

function updateSpaceShipControl(dt) {
    if (!shipControlActive || !spaceShip) {
        return;
    }
    shipUndockCollisionGraceTimer = Math.max(0, shipUndockCollisionGraceTimer - dt);
    if (shipAutoDockActive) {
        updateShipAutoDock(dt);
        updateShipEngineVisuals(dt, 0);
        return;
    }
    if (shipDocked) {
        updateShipEngineVisuals(dt, shipThrottleCommand);
        return;
    }

    const speedBeforeTurn = shipVelocity.length();
    const speedRatioBeforeTurn = THREE.MathUtils.clamp(speedBeforeTurn / shipMaxSpeed, 0, 1);
    const turnAuthority = THREE.MathUtils.lerp(
        1,
        shipHighSpeedTurnAuthorityMin,
        speedRatioBeforeTurn * speedRatioBeforeTurn
    );

    if (shipPendingYaw || shipPendingPitch) {
        shipAngularVelocity.x += shipPendingYaw * shipTurnImpulseGain;
        shipAngularVelocity.y += shipPendingPitch * shipTurnImpulseGain;
        shipPendingYaw = 0;
        shipPendingPitch = 0;
    }
    shipAngularVelocity.multiplyScalar(Math.exp(-shipTurnDampingPerSecond * dt));
    shipAngularVelocity.x = THREE.MathUtils.clamp(shipAngularVelocity.x, -shipMaxTurnRate, shipMaxTurnRate);
    shipAngularVelocity.y = THREE.MathUtils.clamp(shipAngularVelocity.y, -shipMaxTurnRate, shipMaxTurnRate);
    if (shipAngularVelocity.x !== 0) {
        spaceShip.rotateY(shipAngularVelocity.x * turnAuthority * dt);
    }
    if (shipAngularVelocity.y !== 0) {
        spaceShip.rotateX(shipAngularVelocity.y * turnAuthority * dt);
    }

    shipForwardWorld.copy(shipForwardAxis).applyQuaternion(spaceShip.quaternion).normalize();

    const thrustInput = shipThrottleCommand;

    if (thrustInput !== 0) {
        const boost = shipControlState.ShiftLeft ? shipBoostMultiplier : 1;
        shipVelocity.addScaledVector(shipForwardWorld, shipAcceleration * boost * thrustInput * dt);
    }

    const forwardSpeed = shipVelocity.dot(shipForwardWorld);
    shipVelocityForwardComponent.copy(shipForwardWorld).multiplyScalar(forwardSpeed);
    shipVelocityLateralComponent.copy(shipVelocity).sub(shipVelocityForwardComponent);
    const speedRatio = THREE.MathUtils.clamp(shipVelocity.length() / shipMaxSpeed, 0, 1);
    const lateralDamping = THREE.MathUtils.lerp(shipLateralDampingBase, shipLateralDampingAtMaxSpeed, speedRatio);
    shipVelocityLateralComponent.multiplyScalar(Math.exp(-lateralDamping * dt));
    shipVelocity.copy(shipVelocityForwardComponent).add(shipVelocityLateralComponent);

    const throttleMomentumDamp = (1 - shipThrottleCommand) * shipLowThrottleDragPerSecond;
    const drag = shipControlState.Space
        ? shipBrakeDragPerSecond
        : shipDragPerSecond + throttleMomentumDamp;
    shipVelocity.multiplyScalar(Math.exp(-drag * dt));
    if (shipVelocity.lengthSq() > shipMaxSpeed * shipMaxSpeed) {
        shipVelocity.setLength(shipMaxSpeed);
    }

    spaceShip.getWorldPosition(shipCollisionStartWorld);
    spaceShip.position.addScaledVector(shipVelocity, dt);
    spaceShip.getWorldPosition(shipCollisionEndWorld);
    if (checkShipCollisionAlongPath(shipCollisionStartWorld, shipCollisionEndWorld)) {
        triggerShipCrash();
        return;
    }

    updateShipEngineVisuals(dt, Math.min(1, thrustInput * (shipControlState.ShiftLeft ? 1 : 0.75)));
}

function updateSpaceShipCamera() {
    if (!shipControlActive || !spaceShip) {
        return;
    }

    spaceShip.getWorldPosition(shipWorldPos);
    spaceShip.getWorldQuaternion(shipWorldQuat);
    shipForwardWorld.copy(shipForwardAxis).applyQuaternion(shipWorldQuat).normalize();
    shipUpWorld.copy(shipUpAxis).applyQuaternion(shipWorldQuat).normalize();

    shipCameraDesiredPos
        .copy(shipWorldPos)
        .addScaledVector(shipForwardWorld, -shipCameraBackOffset)
        .addScaledVector(shipUpWorld, shipCameraUpOffset);
    shipCameraLookTarget.copy(shipWorldPos).addScaledVector(shipForwardWorld, shipCameraLookAhead);
    camera.up.copy(shipUpWorld);
    camera.position.copy(shipCameraDesiredPos);
    camera.lookAt(shipCameraLookTarget);
}

function createHomeSphere() {
    const homeGeom = new THREE.SphereGeometry(1.15, 48, 48);
    const homeMat = new THREE.MeshBasicMaterial({
        color: 0xfff35c
    });
    homeMat.toneMapped = false;
    homeSphere = new THREE.Mesh(homeGeom, homeMat);
    homeSphere.position.set(0, 0, 0);
    homeSphere.name = 'Home';
    homeSphere.userData.projectId = 'home';
    scene.add(homeSphere);
    objects.push(homeSphere);

    // Slightly softer falloff keeps Earth lit more comparably to closer orbiting objects.
    sunLight = new THREE.PointLight(0xfff1cc, 1200, 0, 1.2);
    sunLight.castShadow = false;
    homeSphere.add(sunLight);

    textureLoader.load(
        'https://www.solarsystemscope.com/textures/download/2k_sun.jpg',
        (sunTexture) => {
            sunTexture.encoding = THREE.sRGBEncoding;
            sunTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            homeMat.map = sunTexture;
            homeMat.needsUpdate = true;
        },
        undefined,
        () => {
            console.warn('Sun texture failed to load; using fallback sphere color.');
        }
    );

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const glowCtx = glowCanvas.getContext('2d');
    const glowGradient = glowCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    glowGradient.addColorStop(0.0, 'rgba(255, 250, 170, 0.96)');
    glowGradient.addColorStop(0.22, 'rgba(255, 246, 120, 0.68)');
    glowGradient.addColorStop(0.52, 'rgba(255, 236, 70, 0.28)');
    glowGradient.addColorStop(1.0, 'rgba(255, 220, 40, 0)');
    glowCtx.fillStyle = glowGradient;
    glowCtx.fillRect(0, 0, 256, 256);

    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    glowTexture.colorSpace = THREE.SRGBColorSpace;
    const innerGlowMat = new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xfff170,
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    innerGlowMat.toneMapped = false;
    const outerGlowMat = new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xffe746,
        transparent: true,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    outerGlowMat.toneMapped = false;
    sunGlowLayer = new THREE.Group();
    const innerGlow = new THREE.Sprite(innerGlowMat);
    innerGlow.scale.set(3.8, 3.8, 1);
    const outerGlow = new THREE.Sprite(outerGlowMat);
    outerGlow.scale.set(5.8, 5.8, 1);
    sunGlowLayer.add(outerGlow);
    sunGlowLayer.add(innerGlow);
    homeSphere.add(sunGlowLayer);
}

// create a simple pokeball made from two hemispheres, a ring and a button
function createPokeball() {
    const radius = 1.2;
    // top (red) hemisphere
    const topGeom = new THREE.SphereGeometry(radius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff1f1f, roughness: 0.62, metalness: 0.0 });
    const top = new THREE.Mesh(topGeom, redMat);
    // don't flip; red should face upward
    top.position.y = 0.001; // nudge up to avoid z-fighting with white half

    // bottom (white) hemisphere
    const bottomGeom = new THREE.SphereGeometry(radius, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.48, metalness: 0.0 });
    const bottom = new THREE.Mesh(bottomGeom, whiteMat);
    bottom.position.y = -0.001; // nudge down to prevent z-fighting

    // middle black ring
    const ringGeom = new THREE.CylinderGeometry(1.23, 1.23, 0.15, 32, 1);
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, metalness: 0.0 });
    const ring = new THREE.Mesh(ringGeom, blackMat);
    ring.rotation.x = 0;

    // front button (placed on the sphere's face, not top)
    const buttonGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 32);
    const buttonMat = new THREE.MeshStandardMaterial({ color: 0xf7f7f7, roughness: 0.35, metalness: 0.0 });
    const button = new THREE.Mesh(buttonGeom, buttonMat);
    const buttonBorderGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.11, 32);
    const buttonBorderMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.82, metalness: 0.0 });
    const buttonBorder = new THREE.Mesh(buttonBorderGeom, buttonBorderMat);
    // position along z-axis outward by radius
    buttonBorder.position.set(0, 0, radius - 0.01);
    button.position.set(0, 0, radius + 0.01); 
    // rotate so the button faces outward from the front of the pokeball
    button.rotation.x = Math.PI / 2;
    buttonBorder.rotation.x = Math.PI / 2;
    button.rotation.z = 0;
    // group for easier raycasting
    pokeball = new THREE.Group();
    pokeball.add(top, bottom, ring, buttonBorder, button);
    pokeball.scale.setScalar(0.4);
    pokeball.name = 'Pokeball';
    pokeball.userData.projectId = 'cobblemon-more-cosmetics';
    scene.add(pokeball);
    objects.push(pokeball);
}

function normalizeAngleRad(rad) {
    return ((rad % TWO_PI) + TWO_PI) % TWO_PI;
}

function solveEccentricAnomaly(meanAnomalyRad, eccentricity) {
    const M = normalizeAngleRad(meanAnomalyRad);
    let E = eccentricity < 0.8 ? M : Math.PI;

    for (let i = 0; i < 7; i += 1) {
        const f = E - eccentricity * Math.sin(E) - M;
        const fPrime = 1 - eccentricity * Math.cos(E);
        E -= f / fPrime;
    }

    return E;
}

function getTrueAnomalyFromEccentric(E, eccentricity) {
    const sinHalf = Math.sin(E / 2);
    const cosHalf = Math.cos(E / 2);
    return 2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * sinHalf,
        Math.sqrt(1 - eccentricity) * cosHalf
    );
}

function getOrbitPositionForTrueAnomaly(orbit, trueAnomalyRad, target) {
    const oneMinusEsq = 1 - orbit.eccentricity * orbit.eccentricity;
    const radius = (orbit.semiMajorAxis * oneMinusEsq) / (1 + orbit.eccentricity * Math.cos(trueAnomalyRad));

    target.set(radius * Math.cos(trueAnomalyRad), 0, radius * Math.sin(trueAnomalyRad));
    target.applyAxisAngle(orbitUpAxis, orbit.argumentOfPeriapsisRad);
    target.applyAxisAngle(orbitPitchAxis, orbit.inclinationRad);
    target.applyAxisAngle(orbitUpAxis, orbit.longitudeOfAscendingNodeRad);
    return target;
}

function createOrbitPath(orbit, color, opacity) {
    const points = [];
    for (let i = 0; i <= orbitPathConfig.segments; i += 1) {
        const trueAnomalyRad = (i / orbitPathConfig.segments) * TWO_PI;
        const point = new THREE.Vector3();
        getOrbitPositionForTrueAnomaly(orbit, trueAnomalyRad, point);
        points.push(point);
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity
    });
    return new THREE.LineLoop(geometry, material);
}

function createOrbitPaths() {
    if (!homeSphere) {
        return;
    }

    if (orbitPathGroup) {
        homeSphere.remove(orbitPathGroup);
    }

    orbitPathGroup = new THREE.Group();
    orbitPathGroup.name = 'OrbitPaths';

    orbitPathGroup.add(
        createOrbitPath(
            orbitConfig.pokeball,
            orbitPathConfig.pokeball.color,
            orbitPathConfig.pokeball.opacity
        )
    );

    orbitPathGroup.add(
        createOrbitPath(
            orbitConfig.sas,
            orbitPathConfig.sas.color,
            orbitPathConfig.sas.opacity
        )
    );

    homeSphere.add(orbitPathGroup);
}

function updateOrbitPositions(dt) {
    if (!homeSphere) {
        return;
    }

    homeSphere.getWorldPosition(orbitCenter);

    if (pokeball) {
        const pokeballMeanMotion = TWO_PI / orbitConfig.pokeball.periodSeconds;
        orbitConfig.pokeball.meanAnomalyRad += pokeballMeanMotion * dt;
        const pokeballEccentricAnomaly = solveEccentricAnomaly(
            orbitConfig.pokeball.meanAnomalyRad,
            orbitConfig.pokeball.eccentricity
        );
        const pokeballTrueAnomaly = getTrueAnomalyFromEccentric(
            pokeballEccentricAnomaly,
            orbitConfig.pokeball.eccentricity
        );
        getOrbitPositionForTrueAnomaly(orbitConfig.pokeball, pokeballTrueAnomaly, pokeballOrbitPos);
        pokeball.position.set(
            orbitCenter.x + pokeballOrbitPos.x,
            orbitCenter.y + pokeballOrbitPos.y,
            orbitCenter.z + pokeballOrbitPos.z
        );
    }

    if (sasCube) {
        const earthMeanAnomaly = getEarthMeanAnomaly(new Date());
        const earthEccentricAnomaly = solveEccentricAnomaly(earthMeanAnomaly, orbitConfig.sas.eccentricity);
        const earthTrueAnomaly = getTrueAnomalyFromEccentric(earthEccentricAnomaly, orbitConfig.sas.eccentricity);
        getOrbitPositionForTrueAnomaly(orbitConfig.sas, earthTrueAnomaly, sasOrbitPos);
        earthTiltGroup.position.set(
            orbitCenter.x + sasOrbitPos.x,
            orbitCenter.y + sasOrbitPos.y,
            orbitCenter.z + sasOrbitPos.z
        );
    }
}

function getEarthMeanAnomaly(date) {
    const elapsedDays = (date.getTime() - earthOrbitConfig.perihelionReferenceUtcMs) / 86400000;
    const orbitProgress = ((elapsedDays / earthOrbitConfig.siderealYearDays) % 1 + 1) % 1;
    return orbitConfig.sas.meanAnomalyAtReferenceRad + orbitProgress * TWO_PI;
}

function normalizeLongitudeDegrees(deg) {
    return ((deg + 540) % 360) - 180;
}

function getSubsolarLongitudeDeg(date) {
    if (earthClockSyncConfig.mode === 'reference-image') {
        return earthClockSyncConfig.referenceSubsolarLongitudeDeg;
    }

    const timeParts = earthSyncTimePartsFormatter.formatToParts(date);
    const hour = Number(timeParts.find((part) => part.type === 'hour')?.value ?? 0);
    const minute = Number(timeParts.find((part) => part.type === 'minute')?.value ?? 0);
    const second = Number(timeParts.find((part) => part.type === 'second')?.value ?? 0);

    const localHours = hour + minute / 60 + second / 3600;
    const hourAngleDeg = (localHours - 12) * 15;
    return normalizeLongitudeDegrees(earthClockSyncConfig.longitudeDeg - hourAngleDeg);
}

function getEarthAxialRotationForDate(date) {
    if (!earthTiltGroup) {
        return 0;
    }

    const subsolarLongitudeDeg = getSubsolarLongitudeDeg(date);
    const sunDirectionWorld = orbitCenter.clone().sub(earthTiltGroup.position).normalize();
    const sunDirectionTiltLocal = sunDirectionWorld.applyQuaternion(
        earthTiltGroup.quaternion.clone().invert()
    );
    const sunAzimuthRad = Math.atan2(sunDirectionTiltLocal.x, sunDirectionTiltLocal.z);

    // Include texture alignment offset so day/night tracks real time with the current Earth texture orientation.
    return (
        sunAzimuthRad -
        THREE.MathUtils.degToRad(subsolarLongitudeDeg - earthClockSyncConfig.textureLongitudeOffsetDeg)
    );
}

createHomeSphere();
createPokeball();
createSASCube();
createSpaceflightSimDisplay();
createEnemyDreadnought();
createOrbitPaths();
updateOrbitPositions(0);

// use OrbitControls for navigation
let controls;
let pointerControls;

// create controls after camera and renderer setup
controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth motion
controls.dampingFactor = 0.05;
controls.minDistance = orbitDefaultMinDistance;
controls.maxDistance = 55;
controls.enablePan = false; // optional

if (THREE.PointerLockControls) {
    pointerControls = new THREE.PointerLockControls(camera, document.body);
}

function resetFreecamMoveState() {
    Object.keys(freecamMoveState).forEach((key) => {
        freecamMoveState[key] = false;
    });
}

function syncOrbitTargetFromCamera() {
    if (!controls) {
        return;
    }
    camera.getWorldDirection(freecamLookDirection);
    freecamTarget.copy(camera.position).add(freecamLookDirection.multiplyScalar(8));
    controls.target.copy(freecamTarget);
    controls.update();
}

function disableFreecam({ unlockPointer = true } = {}) {
    if (!freecamEnabled) {
        return;
    }

    freecamEnabled = false;
    resetFreecamMoveState();
    syncOrbitTargetFromCamera();
    controls.enabled = true;

    if (unlockPointer && pointerControls && pointerControls.isLocked) {
        pointerControls.unlock();
    }
}

function enableFreecam() {
    if (!pointerControls || freecamEnabled) {
        return;
    }

    trackedObject = null;
    freecamEnabled = true;
    controls.enabled = false;
    pointerControls.lock();
}

function toggleFreecam() {
    if (freecamEnabled) {
        disableFreecam();
        return;
    }
    enableFreecam();
}

if (pointerControls) {
    pointerControls.addEventListener('unlock', () => {
        if (freecamEnabled) {
            disableFreecam({ unlockPointer: false });
        }
    });
}

const projects = {
    'home': {
        object: () => homeSphere,
        zoomDistance: 6
    },
    'cobblemon-more-cosmetics': {
        object: () => pokeball,
        zoomDistance: 7
    },
    'sas': {
        object: () => sasCube,
        zoomDistance: 5
    },
    'spaceflight-sim-3d': {
        object: () => spaceStation || sasCube,
        zoomDistance: 4.5
    }
};

function handleProjectSelection(projectId, options = {}) {
    const { zoomIn = false } = options;
    deactivateSpaceflightControl();
    setEnemyEncounterActive(projectId === 'spaceflight-sim-3d');
    const project = projects[projectId];
    if (!project) {
        return;
    }

    const object3D = project.object();
    if (!object3D) {
        return;
    }

    showPokeballLink = false;
    showSASLink = false;
    pokeballLinkPopup.style.display = 'none';
    sasLinkPopup.style.display = 'none';
    setShipCrashOverlayVisible(false);
    controls.minDistance = projectId === 'spaceflight-sim-3d'
        ? orbitStationMinDistance
        : orbitDefaultMinDistance;

    trackedObject = object3D;
    trackedFollowInitialized = false;
    focusOnObject(object3D, zoomIn ? project.zoomDistance : null);

    if (projectId === 'cobblemon-more-cosmetics') {
        showPokeballLink = true;
        updatePokeballLinkLabelPosition();
        return;
    }

    if (projectId === 'sas') {
        showSASLink = true;
        updateSASLinkLabelPosition();
    }
}

document.querySelectorAll('.project-item').forEach((button) => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const projectId = e.currentTarget.dataset.project;
        handleProjectSelection(projectId, { zoomIn: true });
        projectsDropdownMenu.classList.remove('open');
        projectsDropdownToggle.setAttribute('aria-expanded', 'false');
    });
});

handleProjectSelection('home', { zoomIn: true });
todoSections = loadTodoSections();
renderTodoSections();
updateCityTimes();
setInterval(updateCityTimes, 1000);

// raycaster for clicking the pokeball
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('click', (e) => {
    if (shipControlActive && document.pointerLockElement !== renderer.domElement && renderer.domElement.requestPointerLock) {
        renderer.domElement.requestPointerLock();
        return;
    }

    if (freecamEnabled && pointerControls && !pointerControls.isLocked) {
        pointerControls.lock();
        return;
    }

    if (!e.target.closest('#projects-sidebar, #todo-sidebar')) {
        projectsDropdownMenu.classList.remove('open');
        projectsDropdownToggle.setAttribute('aria-expanded', 'false');
        todoDropdownMenu.classList.remove('open');
        todoDropdownToggle.setAttribute('aria-expanded', 'false');
    }
    if (!e.target.closest('#sas-link-popup')) {
        sasLinksList.classList.remove('open');
    }

    if (e.target.closest('#pokeball-link-popup, #sas-link-popup, #projects-sidebar, #todo-sidebar, #info-panel, #time-widget')) {
        return;
    }
    if (shipControlActive || trackedObject) {
        return;
    }

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(objects, true);
    if (hits.length > 0) {
        let hitObject = hits[0].object;
        while (hitObject) {
            if (hitObject.userData && hitObject.userData.projectId) {
                handleProjectSelection(hitObject.userData.projectId);
                return;
            }
            hitObject = hitObject.parent;
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (!shipControlActive && trackedObject && !freecamEnabled && e.code === 'Escape') {
        e.preventDefault();
        trackedObject = null;
        trackedFollowInitialized = false;
        setEnemyEncounterActive(false);
        controls.minDistance = orbitDefaultMinDistance;
        showPokeballLink = false;
        showSASLink = false;
        pokeballLinkPopup.style.display = 'none';
        sasLinkPopup.style.display = 'none';
        sasLinksList.classList.remove('open');
        return;
    }

    if (!shipControlActive && !freecamEnabled && e.code === 'KeyP' && trackedObject === spaceStation) {
        e.preventDefault();
        if (shipCrashed) {
            setShipCrashOverlayVisible(true);
            return;
        }
        activateSpaceflightControl();
        updateSpaceShipCamera();
        updateThrottleMeter();
        updateSpeedometer();
        return;
    }

    if (
        !shipControlActive &&
        !freecamEnabled &&
        e.code === 'KeyL' &&
        (trackedObject === spaceStation || trackedObject === spaceShip)
    ) {
        e.preventDefault();
        if (shipCrashed) {
            setShipCrashOverlayVisible(true);
            return;
        }
        activateSpaceflightControl();
        if (shipDocked) {
            undockSpaceShip();
        } else {
            attemptShipRelatch();
        }
        updateSpaceShipCamera();
        updateThrottleMeter();
        updateSpeedometer();
        return;
    }

    if (shipControlActive && /^Digit[0-9]$/.test(e.code)) {
        e.preventDefault();
        const digit = Number(e.code.slice(5));
        shipThrottleCommand = digit === 0 ? 0 : digit * 0.1;
        updateThrottleMeter();
        return;
    }

    if (shipControlActive && e.code === 'KeyO') {
        e.preventDefault();
        selectMissileLoadout('short');
        return;
    }

    if (shipControlActive && e.code === 'KeyP') {
        e.preventDefault();
        selectMissileLoadout('long');
        return;
    }

    if (shipControlActive && e.code === 'KeyM') {
        e.preventDefault();
        missileTriggerHeld = true;
        if (!e.repeat) {
            fireShipMissile();
        }
        return;
    }

    if (shipControlActive && (e.code === 'KeyW' || e.code === 'KeyS')) {
        e.preventDefault();
        if (!e.repeat) {
            const step = e.shiftKey ? shipThrottleFineStep : shipThrottleStep;
            if (e.code === 'KeyW') {
                adjustManualThrottle(step);
            } else {
                adjustManualThrottle(-step);
            }
            updateThrottleMeter();
        }
        return;
    }

    if (shipControlActive && e.code in shipControlState) {
        e.preventDefault();
        shipControlState[e.code] = true;
        return;
    }

    if (shipControlActive && e.code === 'KeyL') {
        e.preventDefault();
        if (shipDocked) {
            undockSpaceShip();
        } else {
            attemptShipRelatch();
        }
        return;
    }

    if (shipControlActive && e.code === 'Escape') {
        e.preventDefault();
        deactivateSpaceflightControl();
        trackedObject = spaceShip || spaceStation || sasCube;
        trackedFollowInitialized = false;
        focusOnObject(trackedObject, 5.5);
        return;
    }

    if (e.code === 'KeyF' && pointerControls) {
        e.preventDefault();
        toggleFreecam();
        return;
    }

    if (e.code === 'Escape' && freecamEnabled) {
        e.preventDefault();
        disableFreecam();
        return;
    }

    if (freecamEnabled && e.code in freecamMoveState) {
        e.preventDefault();
        freecamMoveState[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyM') {
        missileTriggerHeld = false;
    }
    if (e.code in shipControlState) {
        shipControlState[e.code] = false;
    }
    if (e.code in freecamMoveState) {
        freecamMoveState[e.code] = false;
    }
});

document.addEventListener('mousemove', (e) => {
    if (!shipControlActive || !spaceShip || shipDocked || shipAutoDockActive) {
        return;
    }
    if (document.pointerLockElement !== renderer.domElement) {
        return;
    }

    if (e.movementX) {
        shipPendingYaw += -e.movementX * shipMouseYawSensitivity;
    }
    if (e.movementY) {
        shipPendingPitch += -e.movementY * shipMousePitchSensitivity;
    }
});

shipCrashRespawnButton.addEventListener('click', (e) => {
    e.stopPropagation();
    resetShipAfterCrash();
});

document.addEventListener('pointerlockchange', () => {
    if (!shipControlActive) {
        return;
    }
    if (document.pointerLockElement !== renderer.domElement) {
        document.body.style.cursor = '';
    } else {
        document.body.style.cursor = 'none';
    }
});

function updateFreecamMovement(dt) {
    if (!freecamEnabled || !pointerControls || !pointerControls.isLocked) {
        return;
    }

    const horizontalSpeed = freecamSpeed * dt;
    if (freecamMoveState.KeyW) {
        pointerControls.moveForward(horizontalSpeed);
    }
    if (freecamMoveState.KeyS) {
        pointerControls.moveForward(-horizontalSpeed);
    }
    if (freecamMoveState.KeyD) {
        pointerControls.moveRight(horizontalSpeed);
    }
    if (freecamMoveState.KeyA) {
        pointerControls.moveRight(-horizontalSpeed);
    }

    const verticalSpeed = freecamSpeed * dt;
    if (freecamMoveState.Space) {
        camera.position.y += verticalSpeed;
    }
    if (freecamMoveState.ShiftLeft) {
        camera.position.y -= verticalSpeed;
    }
}

let spaceflightStationOrbitAngle = 0;
function updateSpaceflightSim(dt) {
    if (!spaceStationPivot || !spaceStation || !sasCube) {
        return;
    }

    spaceflightStationOrbitAngle += spaceflightStationAngularSpeed * dt;
    spaceStation.position.set(
        Math.cos(spaceflightStationOrbitAngle) * spaceflightStationOrbitRadius,
        0,
        Math.sin(spaceflightStationOrbitAngle) * spaceflightStationOrbitRadius
    );
    sasCube.getWorldPosition(spaceStationTargetPos);
    spaceStation.lookAt(spaceStationTargetPos);
    spaceStation.rotateY(Math.PI / 2);
    updateEnemyDreadnought(dt);
    updateSpaceShipControl(dt);
    if (shipControlActive && missileTriggerHeld) {
        fireShipMissile();
    }
    updateMissiles(dt);
    updateEnemyProjectiles(dt);
    updateExplosions(dt);
    updateEnemyHealthUI();
    updateAmmoCounter();
    updateMissileInventoryUI();
    updateThrottleMeter();
    updateSpeedometer();
}


let lastTime=performance.now();
let earthAxialSpinOffset = 0;
function animate(){
    requestAnimationFrame(animate);
    const now=performance.now();
    const nowDate = new Date();
    const dt=(now-lastTime)/1000; lastTime=now;
    updateOrbitPositions(dt);
    updateSpaceflightSim(dt);
    // Spin at real-world rates using elapsed time in seconds.
    if(homeSphere){
        homeSphere.rotation.y += sunRotationRadPerSecond * dt;
    }
    if(pokeball){
        pokeball.rotation.y += 0.01;
    }
    if(sasCube){
        earthAxialSpinOffset += earthAxialDriftRadPerSecond * dt;
        sasCube.rotation.y = getEarthAxialRotationForDate(nowDate) + earthAxialSpinOffset;
    }
    earthCloudLayers.forEach((cloudLayer, index) => {
        const speedMultiplier = earthCloudLayerSpeedMultipliers[index] ?? earthCloudLayerSpeedMultipliers[0];
        cloudLayer.rotation.y += earthRotationRadPerSecond * speedMultiplier * dt;
    });
    if (!freecamEnabled) {
        updateTrackedCameraFollow();
    }
    updateSpaceShipCamera();
    updateFreecamMovement(dt);
    // update controls if present
    if(controls && controls.enabled){
        controls.update();
    }
    updatePokeballLinkLabelPosition();
    updateSASLinkLabelPosition();
    renderer.render(scene,camera);
}
animate();

window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
    updatePokeballLinkLabelPosition();
    updateSASLinkLabelPosition();
});
