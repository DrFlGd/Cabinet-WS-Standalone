import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CabinetDocument, CadPart, ViewPreset } from './types';
import type { KernelFaceGroup, KernelSelection, TessellatedPart } from './kernel/types';

export type CadViewportHandle = {
  setView: (preset: ViewPreset) => void;
  fit: () => void;
};

export type ViewportDisplayMode = 'shaded' | 'shaded-edges' | 'wireframe';
export type ViewportProjection = 'perspective' | 'orthographic';

type Props = {
  document: CabinetDocument;
  selectedId: string | null;
  selectedIds: Set<string>;
  hiddenIds: Set<string>;
  explode: number;
  displayMode: ViewportDisplayMode;
  projection: ViewportProjection;
  clipEnabled: boolean;
  clipZ: number;
  kernelParts?: TessellatedPart[];
  kernelSelection?: KernelSelection | null;
  onSelect: (part: CadPart | null, additive?: boolean) => void;
  onTopologySelect?: (selection: KernelSelection | null) => void;
  onDimensionChange: (key: 'width' | 'height' | 'depth', value: number) => void;
  onShelfPositionChange: (partId: string, nextZ: number) => void;
  onSectionDividerChange: (partId: string, delta: number) => void;
  onHideSelected: () => void;
  onIsolateSelected: () => void;
  onShowAll: () => void;
};

type PartObject = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

const CadViewport = forwardRef<CadViewportHandle, Props>(function CadViewport(
  {
    document: cadDocument,
    selectedId,
    selectedIds,
    hiddenIds,
    explode,
    displayMode,
    projection,
    clipEnabled,
    clipZ,
    kernelParts = [],
    kernelSelection = null,
    onSelect,
    onTopologySelect,
    onDimensionChange,
    onShelfPositionChange,
    onSectionDividerChange,
    onHideSelected,
    onIsolateSelected,
    onShowAll,
  },
  ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; partId: string } | null>(null);
  const runtime = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    model: THREE.Group;
    selectionBox: THREE.Box3Helper;
    raycaster: THREE.Raycaster;
    pointer: THREE.Vector2;
    fit: () => void;
    setView: (preset: ViewPreset) => void;
  } | null>(null);
  const latest = useRef({
    cadDocument,
    selectedId,
    selectedIds,
    hiddenIds,
    explode,
    displayMode,
    projection,
    clipEnabled,
    clipZ,
    kernelParts,
    kernelSelection,
    onSelect,
    onTopologySelect,
    onDimensionChange,
    onShelfPositionChange,
    onSectionDividerChange,
    onHideSelected,
    onIsolateSelected,
    onShowAll,
  });
  latest.current = {
    cadDocument,
    selectedId,
    selectedIds,
    hiddenIds,
    explode,
    displayMode,
    projection,
    clipEnabled,
    clipZ,
    kernelParts,
    kernelSelection,
    onSelect,
    onTopologySelect,
    onDimensionChange,
    onShelfPositionChange,
    onSectionDividerChange,
    onHideSelected,
    onIsolateSelected,
    onShowAll,
  };

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

    const camera: THREE.PerspectiveCamera | THREE.OrthographicCamera = projection === 'orthographic'
      ? new THREE.OrthographicCamera(-1000, 1000, 1000, -1000, 0.1, 30000)
      : new THREE.PerspectiveCamera(38, 1, 1, 20000);
    camera.up.set(0, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
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
    raycaster.params.Line.threshold = 6;
    const pointer = new THREE.Vector2();

    const fit = () => {
      const box = new THREE.Box3().setFromObject(model);
      if (box.isEmpty()) return;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const span = Math.max(size.x, size.y, size.z, 1);
      controls.target.copy(center);
      const direction = new THREE.Vector3(1.15, -1.55, 1.05).normalize();
      if (camera instanceof THREE.PerspectiveCamera) {
        const distance = span / (2 * Math.tan((camera.fov * Math.PI) / 360)) * 1.65;
        camera.position.copy(center).add(direction.multiplyScalar(distance));
        camera.near = Math.max(0.1, span / 1000);
        camera.far = Math.max(10000, span * 30);
      } else {
        const aspect = Math.max(0.25, container.clientWidth / Math.max(container.clientHeight, 1));
        const halfHeight = span * 0.82;
        camera.left = -halfHeight * aspect;
        camera.right = halfHeight * aspect;
        camera.top = halfHeight;
        camera.bottom = -halfHeight;
        camera.position.copy(center).add(direction.multiplyScalar(span * 2.5));
        camera.near = 0.1;
        camera.far = Math.max(10000, span * 30);
      }
      camera.updateProjectionMatrix();
      controls.update();
    };

    const setView = (preset: ViewPreset) => {
      const box = new THREE.Box3().setFromObject(model);
      if (box.isEmpty()) return;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const span = Math.max(size.x, size.y, size.z, 1);
      const vectors: Record<ViewPreset, THREE.Vector3> = {
        iso: new THREE.Vector3(1.15, -1.55, 1.05),
        front: new THREE.Vector3(0, -1, 0),
        right: new THREE.Vector3(1, 0, 0),
        top: new THREE.Vector3(0, 0, 1),
      };
      const direction = vectors[preset].clone().normalize();
      controls.target.copy(center);
      const distance = camera instanceof THREE.PerspectiveCamera
        ? span / (2 * Math.tan((camera.fov * Math.PI) / 360)) * 1.65
        : span * 2.5;
      if (camera instanceof THREE.OrthographicCamera) {
        const aspect = Math.max(0.25, container.clientWidth / Math.max(container.clientHeight, 1));
        const halfHeight = span * 0.82;
        camera.left = -halfHeight * aspect;
        camera.right = halfHeight * aspect;
        camera.top = halfHeight;
        camera.bottom = -halfHeight;
      }
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
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
      } else {
        const halfHeight = Math.max(1, (camera.top - camera.bottom) / 2);
        const aspect = width / height;
        camera.left = -halfHeight * aspect;
        camera.right = halfHeight * aspect;
      }
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
    let draggingDimension: {
      key: 'width' | 'height' | 'depth';
      axis: THREE.Vector3;
      plane: THREE.Plane;
      startPoint: THREE.Vector3;
      startValue: number;
    } | null = null;
    let draggingShelf: {
      partId: string;
      plane: THREE.Plane;
      startPoint: THREE.Vector3;
      startZ: number;
    } | null = null;
    let draggingDivider: {
      partId: string;
      axis: THREE.Vector3;
      plane: THREE.Plane;
      startPoint: THREE.Vector3;
      lastDelta: number;
    } | null = null;

    const setPointerFromEvent = (event: PointerEvent | MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
    };

    const interactionPlane = (point: THREE.Vector3) =>
      new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), point);

    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      setPointerFromEvent(event);

      const directHit = raycaster.intersectObjects(
        model.children.filter(object => object.userData.directHandleKind),
        false,
      )[0];
      if (directHit?.object.userData.directHandleKind === 'shelf') {
        const partId = String(directHit.object.userData.partId);
        const part = latest.current.cadDocument.parts.find(candidate => candidate.id === partId);
        if (part) {
          event.preventDefault();
          draggingShelf = { partId, plane: interactionPlane(directHit.point), startPoint: directHit.point.clone(), startZ: part.position.z };
          controls.enabled = false;
          down = null;
          return;
        }
      }
      if (directHit?.object.userData.directHandleKind === 'divider') {
        const partId = String(directHit.object.userData.partId);
        const axisName = directHit.object.userData.dividerAxis === 'x' ? 'x' : 'z';
        event.preventDefault();
        draggingDivider = {
          partId,
          axis: axisName === 'x' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1),
          plane: interactionPlane(directHit.point),
          startPoint: directHit.point.clone(),
          lastDelta: 0,
        };
        controls.enabled = false;
        down = null;
        return;
      }

      const handleHit = raycaster.intersectObjects(
        model.children.filter(object => object.userData.dimensionKey),
        false,
      )[0];
      const key = handleHit?.object.userData.dimensionKey as 'width' | 'height' | 'depth' | undefined;
      if (key) {
        event.preventDefault();
        const axis = key === 'width'
          ? new THREE.Vector3(1, 0, 0)
          : key === 'depth'
            ? new THREE.Vector3(0, 1, 0)
            : new THREE.Vector3(0, 0, 1);
        const startPoint = handleHit.point.clone();
        draggingDimension = {
          key,
          axis,
          plane: interactionPlane(startPoint),
          startPoint,
          startValue: latest.current.cadDocument.parameters[key],
        };
        controls.enabled = false;
        down = null;
        return;
      }
      down = { x: event.clientX, y: event.clientY };
    };

    const pointerMove = (event: PointerEvent) => {
      if (!draggingDimension && !draggingShelf && !draggingDivider) return;
      setPointerFromEvent(event);
      if (draggingDimension) {
        const point = raycaster.ray.intersectPlane(draggingDimension.plane, new THREE.Vector3());
        if (!point) return;
        const delta = point.clone().sub(draggingDimension.startPoint).dot(draggingDimension.axis);
        latest.current.onDimensionChange(draggingDimension.key, Math.max(50, draggingDimension.startValue + delta));
        return;
      }
      if (draggingShelf) {
        const point = raycaster.ray.intersectPlane(draggingShelf.plane, new THREE.Vector3());
        if (!point) return;
        const delta = point.z - draggingShelf.startPoint.z;
        latest.current.onShelfPositionChange(draggingShelf.partId, draggingShelf.startZ + delta);
        return;
      }
      if (draggingDivider) {
        const point = raycaster.ray.intersectPlane(draggingDivider.plane, new THREE.Vector3());
        if (!point) return;
        const total = point.clone().sub(draggingDivider.startPoint).dot(draggingDivider.axis);
        const incremental = total - draggingDivider.lastDelta;
        if (Math.abs(incremental) >= 0.2) {
          latest.current.onSectionDividerChange(draggingDivider.partId, incremental);
          draggingDivider.lastDelta = total;
        }
      }
    };

    const pointerUp = (event: PointerEvent) => {
      if (draggingDimension || draggingShelf || draggingDivider) {
        draggingDimension = null;
        draggingShelf = null;
        draggingDivider = null;
        controls.enabled = true;
        return;
      }
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

      if (event.shiftKey) {
        const edgeHit = raycaster.intersectObjects(
          model.children.filter(object => object instanceof THREE.LineSegments && object.userData.semanticEdgeId),
          false,
        )[0];
        const edgePartId = edgeHit?.object.userData.partId as string | undefined;
        const semanticEdgeId = edgeHit?.object.userData.semanticEdgeId as string | undefined;
        if (edgePartId && semanticEdgeId) {
          latest.current.onSelect(latest.current.cadDocument.parts.find(part => part.id === edgePartId) ?? null);
          latest.current.onTopologySelect?.({ partId: edgePartId, kind: 'edge', semanticId: semanticEdgeId });
          return;
        }
      }

      const hit = raycaster.intersectObjects(
        model.children.filter(object => object instanceof THREE.Mesh && object.userData.primaryPartMesh),
        false,
      )[0];
      const id = hit?.object.userData.partId as string | undefined;
      latest.current.onSelect(
        id ? latest.current.cadDocument.parts.find(part => part.id === id) ?? null : null,
        event.ctrlKey || event.metaKey,
      );

      const faceIndex = hit?.faceIndex;
      if (!id || faceIndex == null) {
        latest.current.onTopologySelect?.(null);
        return;
      }

      const groups = hit.object.userData.kernelFaceGroups as KernelFaceGroup[] | undefined;
      const indexOffset = faceIndex * 3;
      const semanticFace = groups?.find(group => indexOffset >= group.start && indexOffset < group.start + group.count);
      latest.current.onTopologySelect?.(
        semanticFace
          ? { partId: id, kind: 'face', semanticId: semanticFace.semanticId }
          : null,
      );
    };
    const contextMenu = (event: MouseEvent) => {
      event.preventDefault();
      setPointerFromEvent(event);
      const hit = raycaster.intersectObjects(
        model.children.filter(object => object instanceof THREE.Mesh && object.userData.primaryPartMesh),
        false,
      )[0];
      const id = hit?.object.userData.partId as string | undefined;
      if (!id) {
        setContextMenu(null);
        return;
      }
      latest.current.onSelect(latest.current.cadDocument.parts.find(part => part.id === id) ?? null, event.ctrlKey || event.metaKey);
      const rect = container.getBoundingClientRect();
      setContextMenu({ x: event.clientX - rect.left, y: event.clientY - rect.top, partId: id });
    };

    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('contextmenu', contextMenu);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('contextmenu', contextMenu);
      controls.dispose();
      disposeGroup(model);
      renderer.dispose();
      renderer.domElement.remove();
      runtime.current = null;
    };
  }, [projection]);

  useEffect(() => {
    const rt = runtime.current;
    if (!rt) return;
    disposeGroup(rt.model);
    rt.model.clear();

    const exactByPartId = new Map(kernelParts.map(part => [part.partId, part]));

    for (const part of cadDocument.parts) {
      if (hiddenIds.has(part.id) || !part.visible) continue;
      const exact = exactByPartId.get(part.id);
      const geometry = exact ? createKernelPartGeometry(part, exact) : createPartGeometry(part);
      const material = new THREE.MeshStandardMaterial({
        color: part.color,
        roughness: 0.72,
        metalness: part.category === 'hardware' ? 0.28 : 0,
        wireframe: displayMode === 'wireframe',
        clippingPlanes: clipEnabled ? [new THREE.Plane(new THREE.Vector3(0, 0, -1), clipZ)] : [],
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
      mesh.userData.exactKernel = Boolean(exact);
      if (exact) mesh.userData.kernelFaceGroups = exact.faceGroups;
      rt.model.add(mesh);

      if (exact) {
        addKernelEdges(rt.model, part, exact, partCenter, explodeVector, displayMode === 'shaded-edges');
      } else {
        const edges = new THREE.EdgesGeometry(geometry, 20);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: '#4d3828', transparent: true, opacity: 0.68 });
        const line = new THREE.LineSegments(edges, edgeMaterial);
        setBasePosition(line, partCenter, explodeVector);
        line.userData.decorative = true;
        line.userData.partId = part.id;
        line.visible = displayMode === 'shaded-edges';
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
    }

    const handleSize = Math.max(18, Math.min(42, Math.max(cadDocument.parameters.width, cadDocument.parameters.height, cadDocument.parameters.depth) * 0.035));
    const handleMaterial = () => new THREE.MeshStandardMaterial({ color: '#35d0ba', roughness: 0.4, metalness: 0.15, depthTest: false });
    const handles: Array<{ key: 'width' | 'height' | 'depth'; position: [number, number, number] }> = [
      { key: 'width', position: [cadDocument.parameters.width, cadDocument.parameters.depth / 2, cadDocument.parameters.height / 2] },
      { key: 'depth', position: [cadDocument.parameters.width / 2, cadDocument.parameters.depth, cadDocument.parameters.height / 2] },
      { key: 'height', position: [cadDocument.parameters.width / 2, cadDocument.parameters.depth / 2, cadDocument.parameters.height] },
    ];
    for (const spec of handles) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(handleSize, handleSize, handleSize), handleMaterial());
      handle.position.set(...spec.position);
      handle.renderOrder = 20;
      handle.userData.dimensionKey = spec.key;
      rt.model.add(handle);
    }

    const directSize = Math.max(12, handleSize * 0.6);
    const shelfHandleMaterial = () => new THREE.MeshStandardMaterial({ color: '#e5bd67', roughness: 0.45, depthTest: false });
    const dividerHandleMaterial = () => new THREE.MeshStandardMaterial({ color: '#6eb8e8', roughness: 0.45, depthTest: false });
    for (const part of cadDocument.parts) {
      if (hiddenIds.has(part.id) || !part.visible) continue;
      if (part.category === 'shelf' && Number(part.metadata?.shelfIndex ?? 0) > 0) {
        const handle = new THREE.Mesh(new THREE.SphereGeometry(directSize * 0.5, 12, 8), shelfHandleMaterial());
        handle.position.set(part.position.x + part.size.x / 2, Math.max(-directSize, part.position.y - directSize), part.position.z + part.size.z / 2);
        handle.renderOrder = 21;
        handle.userData.directHandleKind = 'shelf';
        handle.userData.partId = part.id;
        rt.model.add(handle);
      }
      if (part.category === 'divider' && part.metadata?.sectionDivider && (part.metadata?.dividerAxis === 'x' || part.metadata?.dividerAxis === 'z')) {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(directSize, directSize, directSize), dividerHandleMaterial());
        handle.position.set(part.position.x + part.size.x / 2, Math.max(-directSize, part.position.y - directSize), part.position.z + part.size.z / 2);
        handle.renderOrder = 21;
        handle.userData.directHandleKind = 'divider';
        handle.userData.partId = part.id;
        handle.userData.dividerAxis = part.metadata.dividerAxis;
        rt.model.add(handle);
      }
    }

    rt.fit();
  }, [cadDocument, hiddenIds, kernelParts, displayMode, clipEnabled, clipZ, projection]);

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
      const selected = selectedIds.has(String(object.userData.partId ?? ''));
      material.emissive.set(selected ? '#0d554c' : '#000000');
      material.emissiveIntensity = selected ? 0.9 : 0;
    }
  }, [selectedId, selectedIds, kernelSelection, cadDocument]);

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

  const contextPart = contextMenu
    ? cadDocument.parts.find(part => part.id === contextMenu.partId) ?? null
    : null;

  return <div className="cad-viewport-shell" onPointerDown={() => contextMenu && setContextMenu(null)}>
    <div className="cad-viewport" ref={host} />
    <div className="cad-direct-hint">Turquoise: W/D/H · gold: shelf height · blue: section divider · Ctrl-click multi-select · Shift-click edge</div>
    {contextMenu && contextPart && (
      <div className="cad-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onPointerDown={event => event.stopPropagation()}>
        <strong>{contextPart.name}</strong>
        <small>{contextPart.id}</small>
        <button type="button" onClick={() => { onIsolateSelected(); setContextMenu(null); }}>Isolate selection</button>
        <button type="button" onClick={() => { onHideSelected(); setContextMenu(null); }}>Hide selection</button>
        <button type="button" onClick={() => { onShowAll(); setContextMenu(null); }}>Show all parts</button>
      </div>
    )}
  </div>;
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


function createKernelPartGeometry(part: CadPart, exact: TessellatedPart) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(exact.vertices, 3));
  if (exact.normals.length === exact.vertices.length) {
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(exact.normals, 3));
  }
  geometry.setIndex(exact.triangles);
  geometry.translate(-part.size.x / 2, -part.size.y / 2, -part.size.z / 2);
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function addKernelEdges(
  model: THREE.Group,
  part: CadPart,
  exact: TessellatedPart,
  partCenter: { x: number; y: number; z: number },
  explodeVector: { x: number; y: number; z: number },
  visible: boolean,
) {
  for (const group of exact.edgeGroups) {
    const start = group.start * 3;
    const end = (group.start + group.count) * 3;
    const positions = exact.lines.slice(start, end);
    if (positions.length < 6) continue;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.translate(-part.size.x / 2, -part.size.y / 2, -part.size.z / 2);

    const material = new THREE.LineBasicMaterial({
      color: '#4d3828',
      transparent: true,
      opacity: 0.76,
    });
    const line = new THREE.LineSegments(geometry, material);
    setBasePosition(line, partCenter, explodeVector);
    line.userData.partId = part.id;
    line.userData.decorative = true;
    line.userData.exactKernel = true;
    line.userData.semanticEdgeId = group.semanticId;
    line.visible = visible;
    model.add(line);
  }
}
