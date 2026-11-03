import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WAYPOINTS, AGENT_HOME_NODE, SCENIC_NODES, findWaypointPath } from './WaypointSystem';

export interface EcosystemAgent {
  id: string;
  name: string;
  shortName: string;
  role: string;
  floor: number;
  position: [number, number, number];
  color: string;
  status: string;
  statusText: string;
  progress: number;
  provider: string;
  model: string;
  lastError: { code: string; message: string; timestamp?: string } | null;
  logs: { id: string; time: string; text: string; type: string }[];
  chatHistory: { id: string; sender: string; text: string; time: string; provider?: string; model?: string; file?: any }[];
}

export interface DataBeamEvent {
  id: string;
  from: string;
  to: string;
  label: string;
  timestamp: number;
}

interface ThreeOfficeCanvasProps {
  agents: Record<string, EcosystemAgent>;
  selectedAgentId: string | null;
  onSelectAgent: (id: string | null) => void;
  activeBeam: DataBeamEvent | null;
  timeOfDay: 'day' | 'sunset' | 'night';
  manualTargetByAgent: Record<string, { target: string; ts: number }>;
}

interface AvatarRig {
  id: string;
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  visorMat: THREE.MeshBasicMaterial;
  chestCoreMat: THREE.MeshBasicMaterial;
  currentNode: string;
  targetNode: string;
  pathQueue: string[];
  pos: THREE.Vector3;
  rotY: number;
  pose: 'walking' | 'sitting' | 'standing' | 'looking_clouds';
  walkCycle: number;
  nextWanderTime: number;
  lastManualTs: number;
  activityLabel: string;
}

interface WorkstationRig {
  id: string;
  screenMat: THREE.MeshStandardMaterial;
  screenGlowMat: THREE.MeshBasicMaterial;
  ringMat: THREE.MeshBasicMaterial;
  barsGroup: THREE.Group;
  chairGroup: THREE.Group;
}

export const ThreeOfficeCanvas: React.FC<ThreeOfficeCanvasProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  activeBeam,
  timeOfDay,
  manualTargetByAgent,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef(agents);
  const selectedIdRef = useRef(selectedAgentId);
  const activeBeamRef = useRef(activeBeam);
  const manualTargetRef = useRef(manualTargetByAgent);
  const timeOfDayRef = useRef(timeOfDay);

  agentsRef.current = agents;
  selectedIdRef.current = selectedAgentId;
  activeBeamRef.current = activeBeam;
  manualTargetRef.current = manualTargetByAgent;
  timeOfDayRef.current = timeOfDay;

  // Store 2D projected screen coordinates for crisp floating HTML badges
  const [badgeCoords, setBadgeCoords] = useState<
    Record<string, { x: number; y: number; visible: boolean; pose: string; activityLabel: string }>
  >({});

  // Camera transition target refs
  const camTargetPosRef = useRef(new THREE.Vector3(0, 12.5, 22.5));
  const camTargetLookRef = useRef(new THREE.Vector3(0, 2.3, 0));
  const isCamTransitioningRef = useRef(false);

  // Trigger smooth camera fly-to when selectedAgentId changes
  useEffect(() => {
    const id = selectedAgentId;
    if (!id || !agentsRef.current[id]) {
      camTargetPosRef.current.set(0, 12.5, 22.5);
      camTargetLookRef.current.set(0, 2.3, 0);
      isCamTransitioningRef.current = true;
      return;
    }
    const ag = agentsRef.current[id];
    const [ax, ay, az] = ag.position;
    camTargetPosRef.current.set(ax * 0.85, ay + 2.5, az + 4.4);
    camTargetLookRef.current.set(ax, ay + 1.0, az - 0.5);
    isCamTransitioningRef.current = true;
  }, [selectedAgentId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. WebGLRenderer (Optimized 60 FPS)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // 2. Scene & Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#7dd3fc');
    scene.fog = new THREE.Fog('#bae6fd', 32, 95);

    // 3. Camera & OrbitControls
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 12.5, 22.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2.3, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 42;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;

    // Stop automatic fly-to if user drags the orbit controls manually
    const onControlStart = () => {
      isCamTransitioningRef.current = false;
    };
    controls.addEventListener('start', onControlStart);

    // 4. Lighting Setup (Day / Sunset / Night responsive)
    const ambientLight = new THREE.AmbientLight('#f0f9ff', 1.15);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#e0f2fe', '#fed7aa', 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 2.2);
    sunLight.position.set(18, 28, 16);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 65;
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 16;
    sunLight.shadow.camera.bottom = -16;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.65);
    rimLight.position.set(-16, 12, -14);
    scene.add(rimLight);

    const interiorLight1 = new THREE.PointLight('#fef3c7', 0.9, 24);
    interiorLight1.position.set(0, 3.8, 1.0);
    scene.add(interiorLight1);

    const interiorLight2 = new THREE.PointLight('#e0f2fe', 0.85, 20);
    interiorLight2.position.set(0, 7.6, -1.5);
    scene.add(interiorLight2);

    // 5. Build the Complete Scandinavian-Tech Mountain Summit Office
    const clickableWorkstations = new Map<THREE.Object3D, string>();

    // Shared Materials
    const rockDarkMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.88, metalness: 0.12, flatShading: true });
    const rockMidMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.82, metalness: 0.15, flatShading: true });
    const snowMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.5, metalness: 0.05 });
    const oakFloorMat = new THREE.MeshStandardMaterial({ color: '#d6b88e', roughness: 0.45, metalness: 0.08 });
    const woodSlatMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.55, metalness: 0.1 });
    const terraceDeckMat = new THREE.MeshStandardMaterial({ color: '#b48a5a', roughness: 0.65, metalness: 0.08 });
    const concreteWhiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35, metalness: 0.08 });
    const frameDarkMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.25, metalness: 0.82 });
    const glassClearMat = new THREE.MeshStandardMaterial({
      color: '#bae6fd',
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      metalness: 0.25,
      depthWrite: false,
    });
    const warmLedMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    const cyanLedMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const sofaFabricMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.85 });
    const cushionAccentMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.7 });
    const plantLeafMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.5 });

    // Helper to add a box mesh quickly
    const addBox = (
      parent: THREE.Object3D,
      size: [number, number, number],
      pos: [number, number, number],
      mat: THREE.Material,
      castShadow = false,
      receiveShadow = false,
      rot?: [number, number, number]
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      parent.add(mesh);
      return mesh;
    };

    // --- 5A. Mountain Summit Peak & Distant Horizon ---
    const mountainGroup = new THREE.Group();
    scene.add(mountainGroup);

    const mainPeak = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 17, 14, 9), rockDarkMat);
    mainPeak.position.set(0, -7.2, 0.5);
    mainPeak.receiveShadow = true;
    mountainGroup.add(mainPeak);

    const westRidge = new THREE.Mesh(new THREE.ConeGeometry(9, 13, 7), rockMidMat);
    westRidge.position.set(-9.5, -7.8, -1.5);
    westRidge.rotation.set(0.1, 0.4, 0.15);
    mountainGroup.add(westRidge);

    const eastRidge = new THREE.Mesh(new THREE.ConeGeometry(8.5, 12, 7), rockMidMat);
    eastRidge.position.set(9.8, -7.5, 1.5);
    eastRidge.rotation.set(-0.08, 0.8, -0.12);
    mountainGroup.add(eastRidge);

    // Distant horizon mountain peaks emerging above the sea of clouds
    const distantSpecs: { pos: [number, number, number]; r: number; h: number }[] = [
      { pos: [-38, -8, -36], r: 16, h: 24 },
      { pos: [35, -9, -38], r: 18, h: 26 },
      { pos: [0, -11, -50], r: 22, h: 30 },
      { pos: [-45, -10, 12], r: 15, h: 20 },
      { pos: [46, -10, 16], r: 16, h: 22 },
    ];
    distantSpecs.forEach((pk) => {
      const g = new THREE.Group();
      g.position.set(pk.pos[0], pk.pos[1], pk.pos[2]);
      const baseCone = new THREE.Mesh(new THREE.ConeGeometry(pk.r, pk.h, 7), rockMidMat);
      g.add(baseCone);
      const snowCap = new THREE.Mesh(new THREE.ConeGeometry(pk.r * 0.43, pk.h * 0.42, 7), snowMat);
      snowCap.position.set(0, pk.h * 0.3, 0);
      g.add(snowCap);
      mountainGroup.add(g);
    });

    // --- 5B. Animated Sea of Clouds ---
    const cloudsGroup = new THREE.Group();
    scene.add(cloudsGroup);
    const cloudMat1 = new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.92 });
    const cloudMat2 = new THREE.MeshLambertMaterial({ color: '#f0f9ff', transparent: true, opacity: 0.84 });

    const cloudClusters: { group: THREE.Group; baseX: number; baseY: number; speed: number; phase: number }[] = [];
    const cloudPositions: { pos: [number, number, number]; scale: number; speed: number }[] = [
      { pos: [-22, -3.2, 14], scale: 1.5, speed: 0.14 },
      { pos: [20, -2.8, 15], scale: 1.4, speed: 0.11 },
      { pos: [0, -3.5, 22], scale: 1.9, speed: 0.09 },
      { pos: [-16, -2.9, -18], scale: 1.4, speed: 0.12 },
      { pos: [18, -3.2, -16], scale: 1.6, speed: 0.1 },
      { pos: [-30, -3.8, -2], scale: 1.7, speed: 0.08 },
      { pos: [30, -3.6, 2], scale: 1.7, speed: 0.11 },
      { pos: [11, -3.3, 27], scale: 1.5, speed: 0.13 },
      { pos: [-12, -3.4, 26], scale: 1.6, speed: 0.1 },
      { pos: [0, -4.0, -28], scale: 2.1, speed: 0.07 },
    ];
    const sphereGeo = new THREE.SphereGeometry(2.6, 12, 10);
    cloudPositions.forEach((c, idx) => {
      const cg = new THREE.Group();
      cg.position.set(c.pos[0], c.pos[1], c.pos[2]);
      cg.scale.setScalar(c.scale);
      const m1 = new THREE.Mesh(sphereGeo, idx % 2 === 0 ? cloudMat1 : cloudMat2);
      const m2 = new THREE.Mesh(sphereGeo, cloudMat1);
      m2.position.set(2.2, -0.3, 0.6);
      m2.scale.setScalar(0.8);
      const m3 = new THREE.Mesh(sphereGeo, cloudMat2);
      m3.position.set(-2.1, -0.35, -0.4);
      m3.scale.setScalar(0.76);
      const m4 = new THREE.Mesh(sphereGeo, cloudMat1);
      m4.position.set(0.6, 0.5, -1.6);
      m4.scale.setScalar(0.68);
      cg.add(m1, m2, m3, m4);
      cloudsGroup.add(cg);
      cloudClusters.push({ group: cg, baseX: c.pos[0], baseY: c.pos[1], speed: c.speed, phase: idx * 1.4 });
    });

    // --- 5C. Level 1 Studio Architecture, Terrace & Interior ---
    const studioGroup = new THREE.Group();
    scene.add(studioGroup);

    // Concrete foundation & oak floor
    addBox(studioGroup, [17.4, 0.4, 11.4], [0, -0.2, 0.2], concreteWhiteMat, false, true);
    addBox(studioGroup, [16.8, 0.08, 10.8], [0, 0.04, 0.2], oakFloorMat, false, true);

    // Parquet floor subtle plank lines
    const plankLineMat = new THREE.MeshBasicMaterial({ color: '#b48a5a', transparent: true, opacity: 0.32 });
    [-6, -4, -2, 0, 2, 4, 6].forEach((x) => {
      addBox(studioGroup, [0.02, 0.01, 10.6], [x, 0.085, 0.2], plankLineMat);
    });

    // Outdoor Cantilevered Cloud Balcony (South Z = +5.6 to +7.8)
    addBox(studioGroup, [13.2, 0.25, 2.8], [0, -0.1, 6.6], terraceDeckMat, false, true);
    addBox(studioGroup, [13.2, 1.05, 0.06], [0, 0.55, 7.95], glassClearMat);
    addBox(studioGroup, [0.06, 1.05, 2.8], [-6.55, 0.55, 6.6], glassClearMat);
    addBox(studioGroup, [0.06, 1.05, 2.8], [6.55, 0.55, 6.6], glassClearMat);
    addBox(studioGroup, [13.3, 0.06, 0.08], [0, 1.08, 7.95], frameDarkMat);
    addBox(studioGroup, [13.0, 0.05, 0.05], [0, 0.04, 7.9], cyanLedMat);

    // Outdoor Lounge Chairs on the Cloud Balcony
    [-3.6, 3.6].forEach((x) => {
      const chairG = new THREE.Group();
      chairG.position.set(x, 0.05, 6.7);
      addBox(chairG, [1.1, 0.12, 1.1], [0, 0.25, 0], frameDarkMat);
      addBox(chairG, [1.0, 0.14, 1.0], [0, 0.35, 0], sofaFabricMat);
      addBox(chairG, [1.0, 0.55, 0.16], [0, 0.62, -0.44], sofaFabricMat, false, false, [-0.18, 0, 0]);
      studioGroup.add(chairG);
    });

    // North Back Wall & Acoustic Wood Slats
    addBox(studioGroup, [17.2, 8.4, 0.35], [0, 4.2, -5.3], concreteWhiteMat, false, true);
    [-7.2, -6.6, -6.0, -5.4, -4.8, 4.8, 5.4, 6.0, 6.6, 7.2].forEach((x) => {
      addBox(studioGroup, [0.18, 8.0, 0.12], [x, 4.2, -5.08], woodSlatMat);
    });

    // Illuminated H.E.L.E.N.A. Brand Emblem Wall Feature
    addBox(studioGroup, [7.8, 2.2, 0.12], [0, 6.3, -5.06], frameDarkMat);
    addBox(studioGroup, [7.4, 0.06, 0.06], [0, 7.3, -4.98], cyanLedMat);
    addBox(studioGroup, [7.4, 0.06, 0.06], [0, 5.3, -4.98], warmLedMat);

    // Glass Side Walls & Structural Steel Mullions
    addBox(studioGroup, [0.1, 8.4, 10.8], [-8.55, 4.2, 0.2], glassClearMat);
    addBox(studioGroup, [0.1, 8.4, 10.8], [8.55, 4.2, 0.2], glassClearMat);
    [-8.55, -4.2, 0, 4.2, 8.55].forEach((x) => {
      addBox(studioGroup, [0.22, 8.4, 0.22], [x, 4.2, -5.15], frameDarkMat);
      addBox(studioGroup, [0.18, 8.4, 0.18], [x, 4.2, 5.5], frameDarkMat);
    });
    [-5.15, -1.5, 2.0, 5.5].forEach((z) => {
      addBox(studioGroup, [0.2, 8.4, 0.2], [-8.55, 4.2, z], frameDarkMat);
      addBox(studioGroup, [0.2, 8.4, 0.2], [8.55, 4.2, z], frameDarkMat);
    });

    // --- 5D. Lounge Sofa Area (West Corner) ---
    const loungeG = new THREE.Group();
    loungeG.position.set(-6.4, 0.08, -3.1);
    studioGroup.add(loungeG);
    addBox(loungeG, [3.2, 0.02, 2.6], [0.2, 0.01, 0.2], new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.9 }));
    addBox(loungeG, [2.6, 0.38, 0.85], [0.2, 0.19, -0.6], sofaFabricMat, true, true);
    addBox(loungeG, [2.6, 0.45, 0.2], [0.2, 0.55, -0.92], sofaFabricMat, true);
    addBox(loungeG, [0.85, 0.38, 1.6], [-0.68, 0.19, 0.2], sofaFabricMat, true, true);
    addBox(loungeG, [0.2, 0.45, 1.6], [-1.0, 0.55, 0.2], sofaFabricMat, true);
    addBox(loungeG, [0.4, 0.3, 0.4], [-0.4, 0.48, -0.65], cushionAccentMat, false, false, [0, 0.2, 0]);
    addBox(loungeG, [0.4, 0.3, 0.4], [0.9, 0.48, -0.65], cushionAccentMat, false, false, [0, -0.2, 0]);
    const coffeeTable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.32, 20),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.2 })
    );
    coffeeTable.position.set(0.45, 0.16, 0.35);
    loungeG.add(coffeeTable);

    // --- 5E. Espresso & Matcha Bar (East Corner) ---
    const barG = new THREE.Group();
    barG.position.set(6.5, 0.08, -3.4);
    studioGroup.add(barG);
    addBox(barG, [2.6, 0.95, 0.85], [0, 0.48, 0], frameDarkMat, true, true);
    addBox(barG, [2.7, 0.06, 0.92], [0, 0.98, 0], concreteWhiteMat);
    addBox(barG, [0.65, 0.48, 0.45], [-0.55, 1.25, -0.1], new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.85, roughness: 0.18 }));
    addBox(barG, [2.4, 0.08, 0.32], [0, 2.2, -0.65], woodSlatMat);
    addBox(barG, [2.3, 0.03, 0.05], [0, 2.14, -0.55], warmLedMat);
    [-0.6, 0.6].forEach((sx) => {
      const stool = new THREE.Group();
      stool.position.set(sx, 0, 0.72);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8), frameDarkMat);
      leg.position.set(0, 0.32, 0);
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), woodSlatMat);
      seat.position.set(0, 0.66, 0);
      stool.add(leg, seat);
      barG.add(stool);
    });

    // --- 5F. Biophilic Indoor Plants ---
    const plantLocations: [number, number, number][] = [
      [-7.8, 0.08, 4.6],
      [7.8, 0.08, 4.6],
      [-7.8, 0.08, -4.5],
      [-5.2, 4.28, -4.3],
      [5.2, 4.28, -4.3],
    ];
    plantLocations.forEach((pPos) => {
      const pg = new THREE.Group();
      pg.position.set(pPos[0], pPos[1], pPos[2]);
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.26, 0.65, 12),
        new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.4 })
      );
      pot.position.set(0, 0.32, 0);
      pg.add(pot);
      for (let i = 0; i < 4; i++) {
        const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), plantLeafMat);
        leaf.position.set(Math.sin(i * 1.6) * 0.18, 0.8 + (i % 2) * 0.25, Math.cos(i * 1.6) * 0.18);
        pg.add(leaf);
      }
      studioGroup.add(pg);
    });

    // --- 5G. Central Round Collaboration Table & Rotating Hologram ---
    const collabG = new THREE.Group();
    collabG.position.set(0, 0.08, 1.2);
    studioGroup.add(collabG);

    const rugMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.02, 32),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.85 })
    );
    rugMesh.position.set(0, 0.01, 0);
    rugMesh.receiveShadow = true;
    collabG.add(rugMesh);

    const tablePillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 0.72, 20), frameDarkMat);
    tablePillar.position.set(0, 0.36, 0);
    tablePillar.castShadow = true;
    collabG.add(tablePillar);

    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.08, 32), concreteWhiteMat);
    tableTop.position.set(0, 0.74, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    collabG.add(tableTop);

    const holoBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 24), cyanLedMat);
    holoBase.position.set(0, 0.79, 0);
    collabG.add(holoBase);

    const holoCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshBasicMaterial({ color: '#38bdf8', wireframe: true })
    );
    holoCrystal.position.set(0, 1.32, 0);
    collabG.add(holoCrystal);

    // --- 5H. Level 2 Mezzanine & Floating Staircase ---
    addBox(studioGroup, [15.2, 0.28, 6.2], [0, 4.1, -2.1], concreteWhiteMat, false, true);
    addBox(studioGroup, [14.8, 0.06, 5.8], [0, 4.26, -2.1], oakFloorMat, false, true);
    addBox(studioGroup, [14.8, 0.08, 0.08], [0, 3.95, 0.98], warmLedMat);
    addBox(studioGroup, [14.6, 1.05, 0.06], [0, 4.8, 0.95], glassClearMat);
    addBox(studioGroup, [14.8, 0.06, 0.1], [0, 5.34, 0.95], woodSlatMat);

    // Executive Bookshelf on Floor 2
    const shelfG = new THREE.Group();
    shelfG.position.set(4.5, 4.28, -4.65);
    addBox(shelfG, [2.6, 2.2, 0.45], [0, 1.1, 0], frameDarkMat);
    [0.45, 0.95, 1.45, 1.95].forEach((sy) => {
      addBox(shelfG, [2.45, 0.05, 0.42], [0, sy, 0], woodSlatMat);
    });
    addBox(shelfG, [0.45, 0.32, 0.28], [-0.7, 1.15, 0], cushionAccentMat);
    addBox(shelfG, [0.35, 0.35, 0.28], [0.5, 1.65, 0], new THREE.MeshStandardMaterial({ color: '#f59e0b' }));
    studioGroup.add(shelfG);

    // Floating Staircase (West Side)
    for (let idx = 0; idx < 12; idx++) {
      const sy = 0.35 + idx * 0.33;
      const sz = 3.2 - idx * 0.36;
      addBox(studioGroup, [1.55, 0.09, 0.42], [-6.5, sy, sz], oakFloorMat, true, true);
      addBox(studioGroup, [1.4, 0.02, 0.04], [-6.5, sy - 0.05, sz + 0.18], warmLedMat);
    }

    // Roof Canopy & Skylight Pergola
    addBox(studioGroup, [17.6, 0.32, 11.6], [0, 8.4, 0.2], concreteWhiteMat);
    [-6, -3, 0, 3, 6].forEach((x) => {
      addBox(studioGroup, [0.22, 0.18, 10.8], [x, 8.18, 0.2], woodSlatMat);
    });
    [-3.8, 0, 3.8].forEach((x) => {
      addBox(studioGroup, [2.4, 0.05, 0.14], [x, 8.21, -2.2], warmLedMat);
      addBox(studioGroup, [2.4, 0.05, 0.14], [x, 8.21, 2.2], warmLedMat);
    });

    // --- 5I. 5 Designer Workstations ---
    const workstationRigs: Record<string, WorkstationRig> = {};
    const deskPositions: Record<string, [number, number, number]> = {
      orchestrator: [0, 4.2, -2.2],
      academic: [-4.8, 0, -1.8],
      builder: [4.8, 0, -1.8],
      archivist: [-4.8, 0, 2.8],
      reviewer: [4.8, 0, 2.8],
    };

    const deskOakMat = new THREE.MeshStandardMaterial({ color: '#e5c494', roughness: 0.4, metalness: 0.08 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.78 });
    const kbBodyMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4, metalness: 0.5 });

    Object.entries(deskPositions).forEach(([agentId, pos]) => {
      const wg = new THREE.Group();
      wg.position.set(pos[0], pos[1], pos[2]);
      studioGroup.add(wg);

      // Register hitbox for raycaster click selection
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 2.6, 2.4),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.set(0, 1.2, 0.2);
      wg.add(hitbox);
      clickableWorkstations.set(hitbox, agentId);

      // Floor indicator ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.5, 32), ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(0, 0.02, 0.2);
      wg.add(ringMesh);

      // Desk surface & legs
      addBox(wg, [2.8, 0.08, 1.25], [0, 0.76, 0], deskOakMat, true, true);
      addBox(wg, [2.82, 0.03, 1.27], [0, 0.72, 0], darkMetalMat);
      addBox(wg, [0.08, 0.74, 1.05], [-1.25, 0.37, 0], darkMetalMat, true);
      addBox(wg, [0.08, 0.74, 1.05], [1.25, 0.37, 0], darkMetalMat, true);
      addBox(wg, [1.6, 0.02, 0.55], [-0.15, 0.81, 0.18], kbBodyMat);

      // Ultrawide Curved Primary Monitor + Secondary Vertical Monitor
      addBox(wg, [0.1, 0.45, 0.1], [-0.15, 0.98, -0.38], darkMetalMat);
      addBox(wg, [0.42, 0.03, 0.28], [-0.15, 0.81, -0.35], darkMetalMat);

      const screenMat = new THREE.MeshStandardMaterial({
        color: '#0f172a',
        emissive: '#38bdf8',
        emissiveIntensity: 0.35,
        roughness: 0.2,
      });
      const screenGlowMat = new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.9,
      });

      // Center & side panels of ultrawide monitor
      const monGroup = new THREE.Group();
      monGroup.position.set(-0.15, 1.28, -0.28);
      wg.add(monGroup);
      addBox(monGroup, [1.15, 0.58, 0.04], [0, 0, 0], darkMetalMat);
      addBox(monGroup, [1.09, 0.52, 0.01], [0, 0, 0.026], screenMat);

      // Animated code bars on primary monitor
      const barsGroup = new THREE.Group();
      barsGroup.position.set(0, 0, 0.035);
      monGroup.add(barsGroup);
      addBox(barsGroup, [0.45, 0.04, 0.005], [-0.2, 0.12, 0], screenGlowMat);
      addBox(barsGroup, [0.65, 0.04, 0.005], [0.05, 0.0, 0], screenGlowMat);
      addBox(barsGroup, [0.35, 0.04, 0.005], [-0.1, -0.12, 0], screenGlowMat);

      // Left & right angled wing monitors
      const leftWing = new THREE.Group();
      leftWing.position.set(-0.78, 0, 0.09);
      leftWing.rotation.y = 0.28;
      addBox(leftWing, [0.48, 0.54, 0.04], [0, 0, 0], darkMetalMat);
      addBox(leftWing, [0.44, 0.48, 0.01], [0, 0, 0.025], screenMat);
      monGroup.add(leftWing);

      const rightWing = new THREE.Group();
      rightWing.position.set(0.82, 0.02, 0.14);
      rightWing.rotation.y = -0.35;
      addBox(rightWing, [0.42, 0.68, 0.04], [0, 0, 0], darkMetalMat);
      addBox(rightWing, [0.38, 0.62, 0.01], [0, 0, 0.025], screenMat);
      monGroup.add(rightWing);

      // Keyboard, Mouse, Speakers, Succulent & PC Tower
      addBox(wg, [0.52, 0.025, 0.18], [-0.15, 0.83, 0.22], kbBodyMat);
      addBox(wg, [0.48, 0.01, 0.14], [-0.15, 0.845, 0.22], screenGlowMat);
      addBox(wg, [0.09, 0.025, 0.14], [0.28, 0.83, 0.22], kbBodyMat);
      addBox(wg, [0.12, 0.2, 0.12], [-1.05, 0.9, -0.25], darkMetalMat);
      addBox(wg, [0.12, 0.2, 0.12], [0.75, 0.9, -0.25], darkMetalMat);
      addBox(wg, [0.24, 0.48, 0.48], [1.08, 1.04, -0.15], darkMetalMat, true);
      addBox(wg, [0.02, 0.38, 0.38], [0.955, 1.04, -0.15], screenGlowMat);

      // Ergonomic Chair
      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, 0.85);
      wg.add(chairGroup);
      const chairPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.44, 10), darkMetalMat);
      chairPedestal.position.set(0, 0.24, 0);
      chairGroup.add(chairPedestal);
      addBox(chairGroup, [0.56, 0.08, 0.54], [0, 0.46, 0], kbBodyMat, true);
      addBox(chairGroup, [0.52, 0.68, 0.08], [0, 0.84, 0.24], kbBodyMat, true);
      addBox(chairGroup, [0.44, 0.42, 0.015], [0, 0.86, 0.195], screenGlowMat);

      workstationRigs[agentId] = {
        id: agentId,
        screenMat,
        screenGlowMat,
        ringMat,
        barsGroup,
        chairGroup,
      };
    });

    // --- 5J. 5 Articulated Walking 3D Avatars ---
    const avatarRigs: Record<string, AvatarRig> = {};
    const agentInitIds = ['orchestrator', 'academic', 'builder', 'archivist', 'reviewer'];
    const suitDarkMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4, metalness: 0.3 });
    const skinHeadMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25, metalness: 0.2 });

    agentInitIds.forEach((agentId, idx) => {
      const homeKey = AGENT_HOME_NODE[agentId] || 'collab_hub';
      const homeWp = WAYPOINTS[homeKey];

      const root = new THREE.Group();
      root.position.set(homeWp.pos[0], homeWp.pos[1], homeWp.pos[2]);
      scene.add(root);

      // Clickable avatar capsule hitbox
      const avHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 1.7, 0.85),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      avHitbox.position.set(0, 0.8, 0);
      root.add(avHitbox);
      clickableWorkstations.set(avHitbox, agentId);

      const body = new THREE.Group();
      body.position.set(0, 0.44, 0);
      root.add(body);

      const accentColor = agentsRef.current[agentId]?.color || '#38bdf8';
      const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.3, metalness: 0.4 });
      const visorMat = new THREE.MeshBasicMaterial({ color: accentColor });
      const chestCoreMat = new THREE.MeshBasicMaterial({ color: accentColor });

      // Torso + Jacket Collar + Glowing Core
      addBox(body, [0.42, 0.52, 0.26], [0, 0.26, 0], suitDarkMat, true);
      addBox(body, [0.44, 0.18, 0.28], [0, 0.43, 0], accentMat);
      addBox(body, [0.16, 0.1, 0.02], [0, 0.32, -0.14], chestCoreMat);

      // Head + Glowing Visor + Headset
      const head = new THREE.Group();
      head.position.set(0, 0.72, 0);
      body.add(head);
      addBox(head, [0.34, 0.34, 0.34], [0, 0, 0], skinHeadMat, true);
      addBox(head, [0.28, 0.11, 0.03], [0, 0.02, -0.175], visorMat);
      addBox(head, [0.38, 0.06, 0.1], [0, 0.16, 0], accentMat);

      // Articulated Left & Right Arms
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.28, 0.46, 0);
      addBox(leftArm, [0.12, 0.42, 0.12], [0, -0.18, 0], accentMat, true);
      addBox(leftArm, [0.1, 0.1, 0.1], [0, -0.4, 0], skinHeadMat);
      body.add(leftArm);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.28, 0.46, 0);
      addBox(rightArm, [0.12, 0.42, 0.12], [0, -0.18, 0], accentMat, true);
      addBox(rightArm, [0.1, 0.1, 0.1], [0, -0.4, 0], skinHeadMat);
      body.add(rightArm);

      // Articulated Left & Right Legs
      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.11, 0.02, 0);
      addBox(leftLeg, [0.14, 0.38, 0.14], [0, -0.19, 0], suitDarkMat, true);
      addBox(leftLeg, [0.15, 0.08, 0.22], [0, -0.4, -0.04], skinHeadMat);
      body.add(leftLeg);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.11, 0.02, 0);
      addBox(rightLeg, [0.14, 0.38, 0.14], [0, -0.19, 0], suitDarkMat, true);
      addBox(rightLeg, [0.15, 0.08, 0.22], [0, -0.4, -0.04], skinHeadMat);
      body.add(rightLeg);

      avatarRigs[agentId] = {
        id: agentId,
        root,
        body,
        head,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        visorMat,
        chestCoreMat,
        currentNode: homeKey,
        targetNode: homeKey,
        pathQueue: [],
        pos: new THREE.Vector3(...homeWp.pos),
        rotY: 0,
        pose: 'sitting',
        walkCycle: idx * 1.3,
        nextWanderTime: 5 + idx * 3.5,
        lastManualTs: 0,
        activityLabel: homeWp.label,
      };
    });

    // --- 5K. 3D Curved DataBeam Link Packet Between Collaborating Agents ---
    const beamGroup = new THREE.Group();
    beamGroup.visible = false;
    scene.add(beamGroup);

    const beamLineGeo = new THREE.BufferGeometry();
    const beamLineMat = new THREE.LineBasicMaterial({ color: '#facc15', transparent: true, opacity: 0.85 });
    const beamLine = new THREE.Line(beamLineGeo, beamLineMat);
    beamGroup.add(beamLine);

    const packetOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 14, 14),
      new THREE.MeshBasicMaterial({ color: '#fde047' })
    );
    beamGroup.add(packetOrb);
    let currentBeamId = '';
    let currentBeamCurve: THREE.QuadraticBezierCurve3 | null = null;

    // 6. Raycaster for clicking Agents / Workstations in 3D
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (e: MouseEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const handlePointerUp = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 6) return; // Ignore drag movements

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hitboxes = Array.from(clickableWorkstations.keys());
      const intersects = raycaster.intersectObjects(hitboxes, false);
      if (intersects.length > 0) {
        const hitAgentId = clickableWorkstations.get(intersects[0].object);
        if (hitAgentId) {
          onSelectAgent(hitAgentId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // 7. Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 8. Main Animation Loop (60 FPS)
    const clock = new THREE.Clock();
    let animFrameId = 0;
    let badgeTick = 0;

    const navigateAvatarTo = (rig: AvatarRig, destinationKey: string) => {
      if (!WAYPOINTS[destinationKey]) return;
      if (rig.targetNode === destinationKey && rig.pathQueue.length > 0) return;
      if (rig.currentNode === destinationKey && rig.pathQueue.length === 0) return;

      const path = findWaypointPath(rig.currentNode, destinationKey);
      rig.targetNode = destinationKey;
      rig.pathQueue = path.slice(1);
      rig.pose = 'walking';
      rig.activityLabel = `Indo para ${WAYPOINTS[destinationKey].label}...`;
    };

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      // Pause WebGL rendering when window/tab is minimized or hidden (Section 14 Performance Optimization)
      if (typeof document !== 'undefined' && document.hidden) {
        clock.getDelta();
        return;
      }
      const dt = Math.min(clock.getDelta(), 0.1);
      const t = clock.getElapsedTime();

      // A. Update Sky, Fog & Lighting for Day / Sunset / Night
      const tod = timeOfDayRef.current;
      if (tod === 'day') {
        scene.background = new THREE.Color('#7dd3fc');
        (scene.fog as THREE.Fog).color.set('#bae6fd');
        ambientLight.color.set('#f0f9ff');
        ambientLight.intensity = 1.15;
        sunLight.color.set('#fffbeb');
        sunLight.intensity = 2.2;
      } else if (tod === 'sunset') {
        scene.background = new THREE.Color('#fb923c');
        (scene.fog as THREE.Fog).color.set('#fed7aa');
        ambientLight.color.set('#ffedd5');
        ambientLight.intensity = 0.95;
        sunLight.color.set('#f97316');
        sunLight.intensity = 1.9;
      } else {
        scene.background = new THREE.Color('#090d16');
        (scene.fog as THREE.Fog).color.set('#0f172a');
        ambientLight.color.set('#1e293b');
        ambientLight.intensity = 0.7;
        sunLight.color.set('#38bdf8');
        sunLight.intensity = 0.9;
      }

      // B. Camera Smooth Fly-To Transition
      if (isCamTransitioningRef.current) {
        camera.position.lerp(camTargetPosRef.current, dt * 4.2);
        controls.target.lerp(camTargetLookRef.current, dt * 4.8);
        if (
          camera.position.distanceTo(camTargetPosRef.current) < 0.08 &&
          controls.target.distanceTo(camTargetLookRef.current) < 0.08
        ) {
          isCamTransitioningRef.current = false;
        }
      }
      controls.update();

      // C. Animate Sea of Clouds & Central Hologram
      cloudClusters.forEach((c) => {
        c.group.position.x = c.baseX + Math.sin(t * c.speed + c.phase) * 2.2;
        c.group.position.y = c.baseY + Math.cos(t * (c.speed * 0.8) + c.phase) * 0.25;
      });
      holoCrystal.rotation.y = t * 0.8;
      holoCrystal.rotation.x = Math.sin(t * 0.9) * 0.2;
      holoCrystal.position.y = 1.32 + Math.sin(t * 2.0) * 0.08;

      // D. Update Workstations & Walking Avatars
      const liveAgents = agentsRef.current;
      const selId = selectedIdRef.current;

      Object.values(avatarRigs).forEach((rig) => {
        const ag = liveAgents[rig.id];
        if (!ag) return;

        const isWorking =
          ag.status === 'working' ||
          ag.status === 'connecting' ||
          ag.status === 'processing' ||
          ag.status === 'organizing' ||
          ag.status === 'writing' ||
          ag.status === 'researching';
        const isError = ag.status === 'error';
        const homeKey = AGENT_HOME_NODE[rig.id] || 'collab_hub';

        // Update Workstation screen colors & animations
        const ws = workstationRigs[rig.id];
        if (ws) {
          const screenColor = isError
            ? '#ef4444'
            : isWorking
            ? '#facc15'
            : ag.status === 'completed'
            ? '#10b981'
            : ag.color || '#38bdf8';
          ws.screenMat.emissive.set(screenColor);
          ws.screenMat.emissiveIntensity = isWorking ? 0.55 + Math.sin(t * 6) * 0.15 : 0.3;
          ws.screenGlowMat.color.set(screenColor);
          ws.ringMat.color.set(selId === rig.id ? '#facc15' : ag.color || '#38bdf8');
          ws.ringMat.opacity = selId === rig.id ? 0.75 : isWorking ? 0.45 : 0.18;
          ws.chairGroup.rotation.y = isWorking ? Math.sin(t * 2.2) * 0.1 : Math.sin(t * 0.5) * 0.03;

          if (isWorking) {
            ws.barsGroup.children.forEach((bar, bIdx) => {
              bar.scale.x = 0.65 + Math.sin(t * 7 + bIdx * 1.5) * 0.3;
            });
          }
        }

        // Check manual walk command from user
        const manualCmd = manualTargetRef.current[rig.id];
        if (manualCmd && manualCmd.ts > rig.lastManualTs) {
          rig.lastManualTs = manualCmd.ts;
          navigateAvatarTo(rig, manualCmd.target);
        }

        // Return to desk when working; wander scenically when idle
        if (isWorking) {
          if (rig.targetNode !== homeKey) {
            navigateAvatarTo(rig, homeKey);
          }
        } else if (t > rig.nextWanderTime && rig.pathQueue.length === 0) {
          const goScenic = Math.random() < 0.65;
          if (goScenic) {
            const pick = SCENIC_NODES[Math.floor(Math.random() * SCENIC_NODES.length)];
            navigateAvatarTo(rig, pick);
          } else {
            navigateAvatarTo(rig, homeKey);
          }
          rig.nextWanderTime = t + 14 + Math.random() * 14;
        }

        // Waypoint movement physics
        if (rig.pathQueue.length > 0) {
          const nextKey = rig.pathQueue[0];
          const nextWp = WAYPOINTS[nextKey];
          if (nextWp) {
            const targetVec = new THREE.Vector3(...nextWp.pos);
            const dir = targetVec.clone().sub(rig.pos);
            const dist = dir.length();
            const speed = 2.45;

            if (dist <= speed * dt) {
              rig.pos.copy(targetVec);
              rig.currentNode = nextKey;
              rig.pathQueue.shift();

              if (rig.pathQueue.length === 0) {
                rig.pose = nextWp.pose || 'standing';
                rig.activityLabel = nextWp.label;
                if (nextWp.lookAt) {
                  const dx = nextWp.lookAt[0] - rig.pos.x;
                  const dz = nextWp.lookAt[2] - rig.pos.z;
                  rig.rotY = Math.atan2(dx, dz) + Math.PI;
                }
              }
            } else {
              dir.normalize();
              rig.pos.addScaledVector(dir, speed * dt);
              rig.rotY = Math.atan2(dir.x, dir.z) + Math.PI;
              rig.pose = 'walking';
            }
          }
        }

        rig.root.position.copy(rig.pos);
        rig.root.rotation.y = THREE.MathUtils.lerp(rig.root.rotation.y, rig.rotY, dt * 8);

        // Articulated limb poses
        const visorColor = isError ? '#ef4444' : isWorking ? '#facc15' : ag.color || '#38bdf8';
        rig.visorMat.color.set(visorColor);
        rig.chestCoreMat.color.set(visorColor);

        if (rig.pose === 'walking') {
          rig.walkCycle += dt * 9.5;
          const s = Math.sin(rig.walkCycle);
          rig.body.position.set(0, 0.44 + Math.abs(Math.cos(rig.walkCycle)) * 0.04, 0);
          rig.leftLeg.rotation.x = s * 0.55;
          rig.rightLeg.rotation.x = -s * 0.55;
          rig.leftArm.rotation.set(-s * 0.45, 0, 0);
          rig.rightArm.rotation.set(s * 0.45, 0, 0);
          rig.head.rotation.set(0, Math.sin(t * 1.5) * 0.08, 0);
        } else if (rig.pose === 'sitting') {
          rig.body.position.set(0, 0.34, 0.08);
          rig.leftLeg.rotation.x = -1.35;
          rig.rightLeg.rotation.x = -1.35;
          if (isWorking) {
            rig.leftArm.rotation.set(-1.05 + Math.sin(t * 14) * 0.14, 0.15, 0);
            rig.rightArm.rotation.set(-1.05 + Math.cos(t * 14) * 0.14, -0.15, 0);
            rig.head.rotation.set(Math.sin(t * 3) * 0.05, Math.sin(t * 2) * 0.14, 0);
          } else {
            rig.leftArm.rotation.set(-0.75, 0.1, 0);
            rig.rightArm.rotation.set(-0.75, -0.1, 0);
            rig.head.rotation.set(0, Math.sin(t * 0.8) * 0.12, 0);
          }
        } else if (rig.pose === 'looking_clouds') {
          rig.body.position.set(0, 0.44 + Math.sin(t * 1.5) * 0.015, 0);
          rig.leftLeg.rotation.x = 0;
          rig.rightLeg.rotation.x = 0;
          rig.leftArm.rotation.set(-0.3, 0, 0.12);
          rig.rightArm.rotation.set(-0.3, 0, -0.12);
          rig.head.rotation.set(-0.12, Math.sin(t * 0.7) * 0.38, 0);
        } else {
          rig.body.position.set(0, 0.44 + Math.sin(t * 2) * 0.015, 0);
          rig.leftLeg.rotation.x = 0;
          rig.rightLeg.rotation.x = 0;
          rig.leftArm.rotation.set(Math.sin(t * 1.5) * 0.08, 0, 0.06);
          rig.rightArm.rotation.set(-Math.sin(t * 1.5) * 0.08, 0, -0.06);
          rig.head.rotation.set(0, Math.sin(t * 1.1) * 0.22, 0);
        }
      });

      // E. Update 3D DataBeam Link between Collaborating Agents
      const beam = activeBeamRef.current;
      if (beam && liveAgents[beam.from] && liveAgents[beam.to]) {
        beamGroup.visible = true;
        if (beam.id !== currentBeamId) {
          currentBeamId = beam.id;
          const fPos = avatarRigs[beam.from]?.pos || new THREE.Vector3(...liveAgents[beam.from].position);
          const tPos = avatarRigs[beam.to]?.pos || new THREE.Vector3(...liveAgents[beam.to].position);
          const start = fPos.clone().add(new THREE.Vector3(0, 1.3, 0));
          const end = tPos.clone().add(new THREE.Vector3(0, 1.3, 0));
          const mid = start.clone().lerp(end, 0.5);
          mid.y += 2.6;
          currentBeamCurve = new THREE.QuadraticBezierCurve3(start, mid, end);
          beamLineGeo.setFromPoints(currentBeamCurve.getPoints(32));
        }
        if (currentBeamCurve) {
          const u = (t * 0.85) % 1;
          packetOrb.position.copy(currentBeamCurve.getPoint(u));
        }
      } else {
        beamGroup.visible = false;
      }

      // F. Render Scene
      renderer.render(scene, camera);

      // G. Update 2D projected coordinates for crisp HTML overlay badges (~15 Hz to keep React ultra-fast)
      badgeTick++;
      if (badgeTick % 4 === 0) {
        const nextCoords: Record<
          string,
          { x: number; y: number; visible: boolean; pose: string; activityLabel: string }
        > = {};
        const width = container.clientWidth;
        const height = container.clientHeight;

        Object.values(avatarRigs).forEach((rig) => {
          const worldPos = rig.pos.clone().add(new THREE.Vector3(0, 2.05, 0));
          worldPos.project(camera);
          const visible = worldPos.z < 1.0 && worldPos.x >= -1.05 && worldPos.x <= 1.05 && worldPos.y >= -1.05 && worldPos.y <= 1.05;
          const x = (worldPos.x * 0.5 + 0.5) * width;
          const y = (-(worldPos.y * 0.5) + 0.5) * height;
          nextCoords[rig.id] = {
            x,
            y,
            visible,
            pose: rig.pose,
            activityLabel: rig.activityLabel,
          };
        });
        setBadgeCoords(nextCoords);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* Three.js WebGL Viewport */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Crisp Floating HTML Status Badges over each 3D Avatar */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Object.values(agents).map((agent) => {
          const coord = badgeCoords[agent.id];
          if (!coord || !coord.visible) return null;

          const isSelected = selectedAgentId === agent.id;
          const isWorking =
            agent.status === 'working' ||
            agent.status === 'connecting' ||
            agent.status === 'processing' ||
            agent.status === 'organizing' ||
            agent.status === 'writing' ||
            agent.status === 'researching';
          const isError = agent.status === 'error';

          return (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              style={{
                transform: `translate3d(${Math.round(coord.x)}px, ${Math.round(coord.y)}px, 0) translate(-50%, -100%)`,
              }}
              className={`pointer-events-auto absolute top-0 left-0 cursor-pointer transition-shadow duration-200 rounded-xl px-2.5 py-1.5 bg-slate-950/90 border shadow-lg min-w-[148px] ${
                isSelected
                  ? 'border-amber-400 ring-2 ring-amber-400/30'
                  : isError
                  ? 'border-red-500/80'
                  : isWorking
                  ? 'border-amber-400/70'
                  : 'border-slate-700/80 hover:border-cyan-400/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isError
                        ? 'bg-red-500 animate-ping'
                        : isWorking
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span className="text-[10px] font-bold tracking-wider uppercase text-white truncate max-w-[105px]">
                    {agent.shortName || agent.name}
                  </span>
                </div>
                <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 uppercase">
                  {agent.provider}
                </span>
              </div>

              <div className="mt-0.5 text-[9px] text-slate-300 truncate max-w-[165px]">
                {isWorking
                  ? agent.statusText
                  : coord.pose === 'looking_clouds'
                  ? '☁️ Contemplando as nuvens'
                  : coord.pose === 'walking'
                  ? `🚶 ${coord.activityLabel}`
                  : agent.statusText}
              </div>

              {isWorking && (
                <div className="mt-1 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-cyan-400 transition-all duration-300"
                    style={{ width: `${Math.max(12, agent.progress || 35)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
