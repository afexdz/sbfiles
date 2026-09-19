"use client";
// Loaded only via dynamic import (ssr: false) — desktop only.

import { useRef, useEffect } from "react";
import * as THREE from "three";

interface Props {
  isThinking: boolean;
  isHovered:  boolean;
  onClick:    () => void;
}

export function RobotScene({ isThinking, onClick, isHovered }: Props) {
  const mountRef     = useRef<HTMLDivElement>(null);
  // Keep latest prop values reachable from inside the RAF loop (no stale closures)
  const thinkingRef  = useRef(isThinking);
  const hoveredRef   = useRef(isHovered);
  useEffect(() => { thinkingRef.current = isThinking; }, [isThinking]);
  useEffect(() => { hoveredRef.current  = isHovered;  }, [isHovered]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // ── Renderer ─────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const aspect = W / H;
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    camera.position.set(0, 0.05, 3.2);

    // ── Colors ────────────────────────────────────────────────────────────────
    const CYAN  = new THREE.Color(0x00c4ff);
    const WHITE = new THREE.Color(0xf8fafc);

    // ── Material factories ────────────────────────────────────────────────────
    function mkBody() {
      return new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.4, metalness: 0.08 });
    }
    function mkAccent(intensity = 2.2) {
      return new THREE.MeshStandardMaterial({
        color: CYAN, emissive: CYAN, emissiveIntensity: intensity,
        roughness: 0.25, metalness: 0.1,
      });
    }

    const bodyMat      = mkBody();
    const neckMat      = mkAccent();
    const chestMat     = mkAccent();
    const leftEyeMat   = mkAccent();
    const rightEyeMat  = mkAccent();
    const shoulderMat  = mkAccent(1.8);
    const antennaMat   = mkAccent();
    const earMat       = mkAccent(1.6);
    const allAccentMats = [neckMat, chestMat, leftEyeMat, rightEyeMat, shoulderMat, antennaMat, earMat];
    const allMats       = [bodyMat, ...allAccentMats];

    // ── Geometry shortcuts ────────────────────────────────────────────────────
    const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
    const sph = (r: number, w = 14, h = 10)       => new THREE.SphereGeometry(r, w, h);
    const cyl = (rt: number, rb: number, height: number, s = 10) =>
      new THREE.CylinderGeometry(rt, rb, height, s);
    const allGeos: THREE.BufferGeometry[] = [];
    function mesh<G extends THREE.BufferGeometry, M extends THREE.Material>(
      geo: G, mat: M,
    ): THREE.Mesh<G, M> {
      allGeos.push(geo);
      return new THREE.Mesh(geo, mat);
    }

    // ── Body ──────────────────────────────────────────────────────────────────
    const bodyMesh = mesh(box(0.88, 1.0, 0.52), bodyMat);
    bodyMesh.position.set(0, -0.22, 0);
    scene.add(bodyMesh);

    // Chest emissive band
    const chestBand = mesh(box(0.62, 0.11, 0.02), chestMat);
    chestBand.position.set(0, -0.06, 0.27);
    scene.add(chestBand);

    // Shoulder accent spheres
    const shoulderL = mesh(sph(0.072, 8, 6), shoulderMat);
    shoulderL.position.set(-0.5, 0.27, 0);
    scene.add(shoulderL);
    const shoulderR = mesh(sph(0.072, 8, 6), shoulderMat);
    shoulderR.position.set(0.5, 0.27, 0);
    scene.add(shoulderR);

    // ── Neck ─────────────────────────────────────────────────────────────────
    const neckMesh = mesh(cyl(0.088, 0.1, 0.15), neckMat);
    neckMesh.position.set(0, 0.32, 0);
    scene.add(neckMesh);

    // ── Head group (rotates to follow cursor) ─────────────────────────────────
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.72, 0);
    scene.add(headGroup);

    const headMesh = mesh(box(0.72, 0.64, 0.5), bodyMat);
    headGroup.add(headMesh);

    const leftEye = mesh(sph(0.092), leftEyeMat);
    leftEye.position.set(-0.17, 0.06, 0.26);
    headGroup.add(leftEye);

    const rightEye = mesh(sph(0.092), rightEyeMat);
    rightEye.position.set(0.17, 0.06, 0.26);
    headGroup.add(rightEye);

    // Ear accent dots
    const earL = mesh(sph(0.042, 8, 6), earMat);
    earL.position.set(-0.37, 0.06, 0);
    headGroup.add(earL);
    const earR = mesh(sph(0.042, 8, 6), earMat);
    earR.position.set(0.37, 0.06, 0);
    headGroup.add(earR);

    // Antenna nub
    const antennaBase = mesh(cyl(0.04, 0.04, 0.12, 8), bodyMat);
    antennaBase.position.set(0, 0.38, 0);
    headGroup.add(antennaBase);
    const antennaTip = mesh(sph(0.058, 8, 6), antennaMat);
    antennaTip.position.set(0, 0.46, 0);
    headGroup.add(antennaTip);

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, -1, 2);
    scene.add(fillLight);
    // Blue halo point light in front of the robot
    const blueLight = new THREE.PointLight(0x00c4ff, 1.0, 6, 2);
    blueLight.position.set(0, 0.3, 1.8);
    scene.add(blueLight);

    // ── Animation state ────────────────────────────────────────────────────────
    const mouseNorm = { x: 0, y: 0 };           // normalised [-1,+1]
    const headRot   = { x: 0, y: 0, z: 0 };     // current lerped rotation

    const blinkState = {
      blinking:  false,
      timer:     0,
      nextBlink: 2 + Math.random() * 2,
    };
    const tiltState = {
      active: false,
      timer:  0,
      next:   4 + Math.random() * 4,
      target: 0,
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();
    let rafId = 0;

    // ── RAF loop ──────────────────────────────────────────────────────────────
    function animate() {
      rafId = requestAnimationFrame(animate);
      const delta   = Math.min(clock.getDelta(), 0.05); // cap delta for tab-unfocus spikes
      const t       = clock.getElapsedTime();
      const thinking = thinkingRef.current;
      const hov      = hoveredRef.current;

      // Accent emissive pulse
      const pulseFreq = thinking ? 6 : 1.2;
      const baseI     = thinking ? 3.8 : 2.2;
      const amp       = thinking ? 1.6 : 0.7;
      const pulse     = baseI + Math.sin(t * pulseFreq * Math.PI * 2) * amp;
      for (const m of allAccentMats) m.emissiveIntensity = pulse;
      blueLight.intensity = thinking
        ? 1.8 + Math.sin(t * pulseFreq * Math.PI * 2) * 0.8
        : 0.9;

      if (!reducedMotion) {
        // ── Breathing ─────────────────────────────────────────────────────────
        bodyMesh.position.y = -0.22 + Math.sin(t * 0.85) * 0.018;
        chestBand.position.y = -0.06 + Math.sin(t * 0.85) * 0.018;

        // ── Mouse tracking ─────────────────────────────────────────────────────
        const tY = mouseNorm.x * 0.44;   // ±25 deg
        const tX = -mouseNorm.y * 0.32;  // ±18 deg
        const k  = Math.min(1, delta * 4);
        headRot.x += (tX - headRot.x) * k;
        headRot.y += (tY - headRot.y) * k;
        headGroup.rotation.x = headRot.x;
        headGroup.rotation.y = headRot.y;

        // ── Blink ──────────────────────────────────────────────────────────────
        if (!blinkState.blinking) {
          blinkState.timer += delta;
          if (blinkState.timer >= blinkState.nextBlink) {
            blinkState.blinking  = true;
            blinkState.timer     = 0;
            blinkState.nextBlink = 2.5 + Math.random() * 4;
          }
        } else {
          blinkState.timer += delta;
          const p = blinkState.timer / 0.18; // 180 ms blink
          // Eyelid: close in first half, open in second half
          const scaleY = p < 0.5
            ? Math.max(0.05, 1 - p * 2)
            : Math.min(1,   (p - 0.5) * 2);
          leftEye.scale.y  = scaleY;
          rightEye.scale.y = scaleY;
          if (blinkState.timer >= 0.18) {
            blinkState.blinking = false;
            blinkState.timer    = 0;
            leftEye.scale.y = rightEye.scale.y = 1;
          }
        }

        // ── Hover eye enlarge ──────────────────────────────────────────────────
        const eyeTarget = hov ? 1.3 : 1.0;
        const ek = Math.min(1, delta * 9);
        leftEye.scale.x  += (eyeTarget - leftEye.scale.x)  * ek;
        leftEye.scale.z  += (eyeTarget - leftEye.scale.z)  * ek;
        rightEye.scale.x += (eyeTarget - rightEye.scale.x) * ek;
        rightEye.scale.z += (eyeTarget - rightEye.scale.z) * ek;

        // ── Idle head tilt ─────────────────────────────────────────────────────
        if (!tiltState.active) {
          tiltState.next -= delta;
          if (tiltState.next <= 0) {
            tiltState.active = true;
            tiltState.timer  = 0;
            tiltState.target = (Math.random() - 0.5) * 0.28; // ±~8 deg
            tiltState.next   = 5 + Math.random() * 6;
          }
        } else {
          tiltState.timer += delta;
          const phase = tiltState.timer / 1.2;
          if (phase <= 1) {
            headGroup.rotation.z = Math.sin(phase * Math.PI) * tiltState.target;
          } else {
            headGroup.rotation.z = 0;
            tiltState.active     = false;
          }
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    // ── Window mouse tracking ─────────────────────────────────────────────────
    let idleTimer: ReturnType<typeof setTimeout>;

    function onMouseMove(e: MouseEvent) {
      mouseNorm.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouseNorm.y = -((e.clientY / window.innerHeight) * 2 - 1);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { mouseNorm.x = 0; mouseNorm.y = 0; }, 3000);
    }
    function onMouseLeave() {
      clearTimeout(idleTimer);
      mouseNorm.x = 0;
      mouseNorm.y = 0;
    }

    if (!reducedMotion) {
      window.addEventListener("mousemove",  onMouseMove);
      window.addEventListener("mouseleave", onMouseLeave);
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(idleTimer);
      window.removeEventListener("mousemove",  onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      renderer.dispose();
      for (const g of allGeos) g.dispose();
      for (const m of allMats)  m.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []); // intentionally empty — mutable refs carry live prop values

  return (
    <div
      ref={mountRef}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      aria-label="Ouvrir l'assistant IA"
      className="w-24 h-28 cursor-pointer select-none focus-visible:outline-none"
      style={{
        filter: "drop-shadow(0 6px 22px rgba(0,196,255,0.38))",
      }}
    />
  );
}
