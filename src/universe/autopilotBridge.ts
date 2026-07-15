// Re-render-free channel between the DOM autopilot driver and the in-canvas
// orbit cameras. Written imperatively by the driver, read inside useFrame.
export const autopilotBridge = {
  // performance.now() when the current tour step began. The orbit cameras hold
  // still until the scene's entry framing has settled, so a slow drift never
  // fights the arrival animation.
  lastStepAt: 0,
  settleMs: 2200,
};
