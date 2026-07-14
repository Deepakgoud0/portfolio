import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import { focus } from "./focusStore";

type Vec3 = [number, number, number];

interface Options {
  /** Resting camera position — where the scene settles. */
  restEye: Vec3;
  /** Resting look-at target. */
  restTarget: Vec3;
  /**
   * When arriving by zooming OUT (from a smaller scale), the camera opens here —
   * on the object you were just inside, which is now a single point — then pulls
   * back to the resting frame. This is what makes a handoff feel like continuous
   * travel instead of a hard cut.
   */
  outAnchor: Vec3;
  /** Opening distance from outAnchor on an "out" entry. Keep it above the scene's
   *  return threshold so arriving doesn't immediately bounce back down. */
  outStartDist: number;
  /** On an "in" entry (zooming in from a bigger scale), open this many times the
   *  resting distance out, then rush in. Kept < the leave threshold / restDist. */
  inStartFactor?: number;
}

const _eye = new THREE.Vector3();
const _tgt = new THREE.Vector3();
const _anchor = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _start = new THREE.Vector3();

/**
 * Animates a scene's camera on mount so scale handoffs read as one continuous
 * flight. Zoom out and the new scale unfurls from the point you left; zoom in
 * and it rushes up to meet you. Direction comes from the focus store.
 */
export function useEntryTransition({
  restEye,
  restTarget,
  outAnchor,
  outStartDist,
  inStartFactor = 1.8,
}: Options) {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;

  useEffect(() => {
    if (!controls) return;
    _eye.set(...restEye);
    _tgt.set(...restTarget);
    const dir = focus.enterDir;

    // Instant final frame if we didn't arrive from an adjacent scale.
    if (dir !== "out" && dir !== "in") {
      controls.setLookAt(_eye.x, _eye.y, _eye.z, _tgt.x, _tgt.y, _tgt.z, false);
      return;
    }

    _dir.copy(_eye).sub(_tgt).normalize(); // resting view direction (target → eye)
    const restDist = _eye.distanceTo(_tgt);

    let startTx: number, startTy: number, startTz: number;
    if (dir === "out") {
      _anchor.set(...outAnchor);
      _start.copy(_anchor).addScaledVector(_dir, outStartDist);
      startTx = _anchor.x;
      startTy = _anchor.y;
      startTz = _anchor.z;
    } else {
      _start.copy(_tgt).addScaledVector(_dir, restDist * inStartFactor);
      startTx = _tgt.x;
      startTy = _tgt.y;
      startTz = _tgt.z;
    }

    // Grander sweep than normal zoom, restored once it settles.
    const prevSmooth = controls.smoothTime;
    controls.smoothTime = 0.6;
    controls.setLookAt(_start.x, _start.y, _start.z, startTx, startTy, startTz, false);

    const animate = setTimeout(
      () => controls.setLookAt(_eye.x, _eye.y, _eye.z, _tgt.x, _tgt.y, _tgt.z, true),
      30,
    );
    const restore = setTimeout(() => {
      controls.smoothTime = prevSmooth;
    }, 2000);

    return () => {
      clearTimeout(animate);
      clearTimeout(restore);
    };
  }, [controls]);
}

/** Component form, for dropping into a scene's <Canvas>. */
export function EntryTransition(props: Options) {
  useEntryTransition(props);
  return null;
}
