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
let homeCorona = null;
let pokeball = null;
let sasCube = null;
let earthTiltGroup = null;
let showPokeballLink = false;
let showSASLink = false;
const pokeballScreenPos = new THREE.Vector3();
const sasScreenPos = new THREE.Vector3();
const focusTarget = new THREE.Vector3();
const orbitCenter = new THREE.Vector3();
const trackedWorldQuat = new THREE.Quaternion();
const trackedForward = new THREE.Vector3(0, 0, 1);
const trackedCameraPos = new THREE.Vector3();
let trackedObject = null;
let trackedDistance = 8;
let trackedHeightOffset = 1.2;
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
const orbitConfig = {
    pokeball: { radius: 18.5, speed: 0.24, angle: Math.PI * 0.15, y: 0.0 },
    sas: { radius: 27.5, speed: -0.15, angle: Math.PI * 1.2, y: 1.4 }
};
const earthOrbitConfig = {
    // Keep Jan 3 (approx perihelion) near +X for a stable yearly reference.
    perihelionDayOfYear: 3
};
const earthAxialTiltRad = THREE.MathUtils.degToRad(23.44);
const planetRotationConfig = {
    // Approximate sidereal rotation periods.
    sunSecondsPerRotation: 25.38 * 24 * 60 * 60,
    earthSecondsPerRotation: 86164.0905
};
const sunRotationRadPerSecond = (Math.PI * 2) / planetRotationConfig.sunSecondsPerRotation;
const earthRotationRadPerSecond = -((Math.PI * 2) / planetRotationConfig.earthSecondsPerRotation);
const sunVisualConfig = {
    coronaScale: 1.16,
    coronaPulseAmplitude: 0.018,
    coronaPulseSpeed: 0.65
};

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
    const isOpen = projectsDropdownMenu.classList.toggle('open');
    projectsDropdownToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

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
        return;
    }

    trackedObject.getWorldPosition(focusTarget);
    trackedObject.getWorldQuaternion(trackedWorldQuat);

    const forwardWorld = trackedForward.clone().applyQuaternion(trackedWorldQuat).normalize();
    trackedCameraPos.copy(focusTarget).add(forwardWorld.multiplyScalar(trackedDistance));
    trackedCameraPos.y += trackedHeightOffset;

    camera.position.copy(trackedCameraPos);
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
}

function createHomeSphere() {
    const homeGeom = new THREE.SphereGeometry(1.15, 48, 48);
    const homeMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xff9b2f,
        emissiveIntensity: 1.35,
        shininess: 20
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
            homeMat.emissiveMap = sunTexture;
            homeMat.needsUpdate = true;
        },
        undefined,
        () => {
            console.warn('Sun texture failed to load; using fallback sphere color.');
        }
    );

    const coronaGeom = new THREE.SphereGeometry(1.15 * sunVisualConfig.coronaScale, 48, 48);
    const coronaMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 }
        },
        vertexShader: `
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vNormalW = normalize(mat3(modelMatrix) * normal);
                vViewDir = normalize(cameraPosition - worldPos.xyz);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            varying vec3 vNormalW;
            varying vec3 vViewDir;
            void main() {
                float rim = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), 2.8);
                float flicker = 0.82 + 0.18 * sin(uTime * 2.3 + vNormalW.y * 10.0 + vNormalW.x * 8.0);
                vec3 color = vec3(1.0, 0.62, 0.18) * (rim * flicker);
                gl_FragColor = vec4(color, rim * 0.78);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
    });
    homeCorona = new THREE.Mesh(coronaGeom, coronaMat);
    homeSphere.add(homeCorona);
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

function updateOrbitPositions(dt) {
    if (!homeSphere) {
        return;
    }

    homeSphere.getWorldPosition(orbitCenter);

    if (pokeball) {
        orbitConfig.pokeball.angle += orbitConfig.pokeball.speed * dt;
        pokeball.position.set(
            orbitCenter.x + Math.cos(orbitConfig.pokeball.angle) * orbitConfig.pokeball.radius,
            orbitCenter.y + orbitConfig.pokeball.y,
            orbitCenter.z + Math.sin(orbitConfig.pokeball.angle) * orbitConfig.pokeball.radius
        );
    }

    if (sasCube) {
        orbitConfig.sas.angle = getEarthOrbitAngle(new Date());
        earthTiltGroup.position.set(
            orbitCenter.x + Math.cos(orbitConfig.sas.angle) * orbitConfig.sas.radius,
            orbitCenter.y + orbitConfig.sas.y,
            orbitCenter.z + Math.sin(orbitConfig.sas.angle) * orbitConfig.sas.radius
        );
    }
}

function getEarthOrbitAngle(date) {
    const year = date.getUTCFullYear();
    const yearStart = Date.UTC(year, 0, 1, 0, 0, 0);
    const nextYearStart = Date.UTC(year + 1, 0, 1, 0, 0, 0);
    const yearLengthMs = nextYearStart - yearStart;
    const yearProgress = ((date.getTime() - yearStart) / yearLengthMs + 1) % 1;

    const perihelionMs = Date.UTC(year, 0, earthOrbitConfig.perihelionDayOfYear, 0, 0, 0);
    const perihelionProgress = ((perihelionMs - yearStart) / yearLengthMs + 1) % 1;
    const orbitProgress = (yearProgress - perihelionProgress + 1) % 1;

    return orbitProgress * Math.PI * 2;
}

createHomeSphere();
createPokeball();
createSASCube();
updateOrbitPositions(0);

// use OrbitControls for navigation
let controls;
let pointerControls;

// create controls after camera and renderer setup
controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth motion
controls.dampingFactor = 0.05;
controls.minDistance = 2;
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
    }
};

function handleProjectSelection(projectId, options = {}) {
    const { zoomIn = false } = options;
    const project = projects[projectId];
    if (!project) {
        return;
    }

    const object3D = project.object();
    if (!object3D) {
        return;
    }

    trackedObject = object3D;
    focusOnObject(object3D, zoomIn ? project.zoomDistance : null);

    if (projectId === 'cobblemon-more-cosmetics') {
        showPokeballLink = true;
        showSASLink = false;
        sasLinkPopup.style.display = 'none';
        updatePokeballLinkLabelPosition();
        return;
    }

    if (projectId === 'sas') {
        showPokeballLink = false;
        pokeballLinkPopup.style.display = 'none';
        showSASLink = true;
        updateSASLinkLabelPosition();
        return;
    }

    if (projectId === 'home') {
        showPokeballLink = false;
        showSASLink = false;
        pokeballLinkPopup.style.display = 'none';
        sasLinkPopup.style.display = 'none';
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

handleProjectSelection('home');
updateCityTimes();
setInterval(updateCityTimes, 1000);

// raycaster for clicking the pokeball
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('click', (e) => {
    if (freecamEnabled && pointerControls && !pointerControls.isLocked) {
        pointerControls.lock();
        return;
    }

    if (!e.target.closest('#projects-sidebar')) {
        projectsDropdownMenu.classList.remove('open');
        projectsDropdownToggle.setAttribute('aria-expanded', 'false');
    }
    if (!e.target.closest('#sas-link-popup')) {
        sasLinksList.classList.remove('open');
    }

    if (e.target.closest('#pokeball-link-popup, #sas-link-popup, #projects-sidebar, #info-panel, #time-widget')) {
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
    if (e.code in freecamMoveState) {
        freecamMoveState[e.code] = false;
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


let lastTime=performance.now();
function animate(){
    requestAnimationFrame(animate);
    const now=performance.now();
    const dt=(now-lastTime)/1000; lastTime=now;
    updateOrbitPositions(dt);
    // Spin at real-world rates using elapsed time in seconds.
    if(homeSphere){
        homeSphere.rotation.y += sunRotationRadPerSecond * dt;
        if (homeCorona && homeCorona.material && homeCorona.material.uniforms) {
            homeCorona.material.uniforms.uTime.value = now * 0.001;
            const pulse = 1 + Math.sin(now * 0.001 * sunVisualConfig.coronaPulseSpeed) * sunVisualConfig.coronaPulseAmplitude;
            homeCorona.scale.setScalar(pulse);
        }
    }
    if(pokeball){
        pokeball.rotation.y += 0.01;
    }
    if(sasCube){
        sasCube.rotation.y += earthRotationRadPerSecond * dt;
    }
    if (!freecamEnabled) {
        updateTrackedCameraFollow();
    }
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
