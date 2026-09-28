import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CabinetDocument, CadPart, ViewPreset } from './types';

export type CadViewportHandle = {
  setView: (preset: ViewPreset) => void;
  fit: () => void;
};

type Props = {
  document: CabinetDocument;
  selectedId: string | null;
  hiddenIds: Set<string>;
  explode: number;
  onSelect: (part: CadPart | null) => void;
};

type PartObject = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

const CadViewport = forwardRef<CadViewportHandle, Props>(function CadViewport(
  { document: cadDocument, selectedId, hiddenIds, explode, onSelect },
  ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    model: THREE.Group;
    selectionBox: THREE.Box3Helper;
    raycaster: THREE.Raycaster;
    pointer: THREE.Vector2;
    fit: () => void;
    setView: (preset: ViewPreset) => void;
  } | null>(null);
  const latest = useRef({ cadDocument, selectedId, hiddenIds, explode, onSelect });
  latest.current = { cadDocument, selectedId, hiddenIds, explode, onSelect };

  useImperativeHandle(ref, () => ({
    fit: () => runtime.current?.fit(),
    setView: preset => runtime.current?.setView(preset),
  }), []);

  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1c2024');
    scene.fog = new THREE.Fog('#1c2024', 3500, 9000);

    const camera = new THREE.PerspectiveCamera(38, 1, 1, 20000);
    camera.up.set(0, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;

    const hemi = new THREE.HemisphereLight('#ffffff', '#27323a', 2.4);
    scene.add(hemi);
    const key = new THREE.DirectionalLight('#fff5e5', 4.3);
    key.position.set(-1800, -2200, 3200);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight('#9fc9ff', 1.6);
    fill.position.set(2200, 1400, 1800);
    scene.add(fill);

    const grid = new THREE.GridHelper(6000, 60, '#53606a', '#30383f');
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.5;
    scene.add(grid);

    const axes = new THREE.AxesHelper(250);
    scene.add(axes);

    const model = new THREE.Group();
    scene.add(model);
    const selectionBox = new THREE.Box3Helper(new THREE.Box3(), '#35d0ba');
    selectionBox.visible = false;
    scene.add(selectionBox);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const fit = () => {
      const box = new THREE.Box3().setFromObject(model);
      if (box.isEmpty()) return;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const span = Math.max(size.x, size.y, size.z, 1);
      const distance = span / (2 * Math.tan((camera.fov * Math.PI) / 360)) * 1.65;
      controls.target.copy(center);
      camera.position.copy(center).add(new THREE.Vector3(1.15, -1.55, 1.05).normalize().multiplyScalar(distance));
      camera.near = Math.max(0.1, span / 1000);
      camera.far = Math.max(10000, span * 30);
      camera.updateProjectionMatrix();
      controls.update();
    };

    const setView = (preset: ViewPreset) => {
      const box = new THREE.Box3().setFromObject(model);
      if (box.isEmpty()) return;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const span = Math.max(size.x, size.y, size.z, 1);
      const distance = span / (2 * Math.tan((camera.fov * Math.PI) / 360)) * 1.65;
      const vectors: Record<ViewPreset, THREE.Vector3> = {
        iso: new THREE.Vector3(1.15, -1.55, 1.05),
        front: new THREE.Vector3(0, -1, 0),
        right: new THREE.Vector3(1, 0, 0),
        top: new THREE.Vector3(0, 0, 1),
      };
      const direction = vectors[preset].clone().normalize();
      controls.target.copy(center);
      camera.position.copy(center).add(direction.multiplyScalar(distance));
      if (preset === 'top') camera.up.set(0, 1, 0);
      else camera.up.set(0, 0, 1);
      camera.lookAt(center);
      camera.updateProjectionMatrix();
      controls.update();
    };

    runtime.current = { scene, camera, renderer, controls, model, selectionBox, raycaster, pointer, fit, setView };

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    let down: { x: number; y: number } | null = null;
    const pointerDown = (event: PointerEvent) => {
      if (event.button === 0) down = { x: event.clientX, y: event.clientY };
    };
    const pointerUp = (event: PointerEvent) => {
      if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) {
        down = null;
        return;
      }
      down = null;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(model.children.filter(object => object instanceof THREE.Mesh), false)[0];
      const id = hit?.object.userData.partId as string | undefined;
      latest.current.onSelect(id ? latest.current.cadDocument.parts.find(p => p.id === id) ?? null : null);
    };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      controls.dispose();
      disposeGroup(model);
      renderer.dispose();
      renderer.domElement.remove();
      runtime.current = null;
    };
  }, []);

  useEffect(() => {
    const rt = runtime.current;
    if (!rt) return;
    disposeGroup(rt.model);
    rt.model.clear();

    for (const part of cadDocument.parts) {
      if (hiddenIds.has(part.id) || !part.visible) continue;
      const geometry = createPartGeometry(part);
      const material = new THREE.MeshStandardMaterial({
        color: part.color,
        roughness: 0.72,
        metalness: 0,
      });
      const mesh: PartObject = new THREE.Mesh(geometry, material);
      const explodeVector = explodeOffset(part, explode, cadDocument.parameters.width, cadDocument.parameters.depth);
      const partCenter = {
        x: part.position.x + part.size.x / 2,
        y: part.position.y + part.size.y / 2,
        z: part.position.z + part.size.z / 2,
      };
      setBasePosition(mesh, partCenter, explodeVector);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.partId = part.id;
      mesh.userData.primaryPartMesh = true;
      rt.model.add(mesh);

      const edges = new THREE.EdgesGeometry(geometry, 20);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: '#4d3828', transparent: true, opacity: 0.68 });
      const line = new THREE.LineSegments(edges, edgeMaterial);
      setBasePosition(line, partCenter, explodeVector);
      line.userData.decorative = true;
      line.userData.partId = part.id;
      rt.model.add(line);

      for (const feature of part.renderFeatures ?? []) {
        const featureGeometry = new THREE.BoxGeometry(feature.size.x, feature.size.y, feature.size.z);
        const featureMaterial = new THREE.MeshStandardMaterial({
          color: feature.color ?? '#58402d',
          roughness: 0.9,
          metalness: 0,
          transparent: true,
          opacity: feature.opacity ?? 0.72,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        });
        const featureMesh = new THREE.Mesh(featureGeometry, featureMaterial);
        const featureCenter = {
          x: part.position.x + feature.position.x + feature.size.x / 2,
          y: part.position.y + feature.position.y + feature.size.y / 2,
          z: part.position.z + feature.position.z + feature.size.z / 2,
        };
        setBasePosition(featureMesh, featureCenter, explodeVector);
        featureMesh.userData.partId = part.id;
        featureMesh.userData.renderFeature = feature.kind;
        rt.model.add(featureMesh);
      }
    }
    rt.fit();
  }, [cadDocument, hiddenIds]);

  useEffect(() => {
    const rt = runtime.current;
    if (!rt) return;
    const mesh = selectedId
      ? rt.model.children.find(o => o instanceof THREE.Mesh && o.userData.partId === selectedId && o.userData.primaryPartMesh) as PartObject | undefined
      : undefined;
    rt.selectionBox.visible = !!mesh;
    if (mesh) rt.selectionBox.box.setFromObject(mesh);
    for (const object of rt.model.children) {
      if (!(object instanceof THREE.Mesh)) continue;
      const material = object.material as THREE.MeshStandardMaterial;
      material.emissive.set(object.userData.partId === selectedId ? '#0d554c' : '#000000');
      material.emissiveIntensity = object.userData.partId === selectedId ? 0.9 : 0;
    }
  }, [selectedId, cadDocument]);

  useEffect(() => {
    const rt = runtime.current;
    if (!rt) return;
    for (const object of rt.model.children) {
      const id = object.userData.partId as string | undefined;
      if (!id) continue;
      const part = cadDocument.parts.find(p => p.id === id);
      if (!part) continue;
      const offset = explodeOffset(part, explode, cadDocument.parameters.width, cadDocument.parameters.depth);
      const base = object.userData.basePosition as [number, number, number] | undefined;
      if (base) object.position.set(base[0] + offset.x, base[1] + offset.y, base[2] + offset.z);
    }
    const selectedMesh = selectedId
      ? rt.model.children.find(o => o instanceof THREE.Mesh && o.userData.partId === selectedId && o.userData.primaryPartMesh)
      : undefined;
    rt.selectionBox.visible = !!selectedMesh;
    if (selectedMesh) rt.selectionBox.box.setFromObject(selectedMesh);
  }, [explode, cadDocument, selectedId]);

  return <div className="cad-viewport" ref={host} />;
});

export default CadViewport;

function explodeOffset(part: CadPart, explode: number, width: number, depth: number) {
  if (!explode) return { x: 0, y: 0, z: 0 };
  const cx = part.position.x + part.size.x / 2 - width / 2;
  const cy = part.position.y + part.size.y / 2 - depth / 2;
  const horizontal = Math.sign(cx) || 0;
  const foreAft = Math.sign(cy) || 0;
  const categoryScale = part.category === 'front' ? 1.5 : part.category === 'drawer' ? 1.25 : part.category === 'shelf' ? 0.6 : 1;
  return {
    x: horizontal * explode * categoryScale,
    y: (part.category === 'front' || part.category === 'drawer' ? -1 : foreAft) * explode * categoryScale,
    z: part.category === 'shelf' ? explode * 0.22 : 0,
  };
}

function disposeGroup(group: THREE.Group) {
  for (const object of group.children) {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => material.dispose());
    }
  }
}


function setBasePosition(
  object: THREE.Object3D,
  base: { x: number; y: number; z: number },
  explode: { x: number; y: number; z: number },
) {
  object.userData.basePosition = [base.x, base.y, base.z];
  object.position.set(base.x + explode.x, base.y + explode.y, base.z + explode.z);
}

function createPartGeometry(part: CadPart): THREE.BufferGeometry {
  if (!part.geometry || part.geometry.kind !== 'extruded-profile') {
    return new THREE.BoxGeometry(part.size.x, part.size.y, part.size.z);
  }

  const shape = new THREE.Shape();
  part.geometry.outline.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.u, point.v);
    else shape.lineTo(point.u, point.v);
  });
  shape.closePath();

  for (const hole of part.geometry.holes ?? []) {
    const path = new THREE.Path();
    if (hole.kind === 'circle') {
      path.absarc(hole.u, hole.v, hole.radius, 0, Math.PI * 2, false);
    } else {
      path.moveTo(hole.u, hole.v);
      path.lineTo(hole.u + hole.width, hole.v);
      path.lineTo(hole.u + hole.width, hole.v + hole.height);
      path.lineTo(hole.u, hole.v + hole.height);
      path.closePath();
    }
    shape.holes.push(path);
  }

  const depth = part.geometry.axis === 'x' ? part.size.x : part.size.z;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 16,
  });

  if (part.geometry.axis === 'x') {
    const mapYzToX = new THREE.Matrix4().set(
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 1,
    );
    geometry.applyMatrix4(mapYzToX);
  }

  geometry.translate(-part.size.x / 2, -part.size.y / 2, -part.size.z / 2);
  geometry.computeVertexNormals();
  return geometry;
}
