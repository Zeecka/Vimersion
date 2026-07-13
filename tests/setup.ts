/**
 * jsdom shims for CodeMirror 6: CM measures layout via APIs jsdom doesn't
 * implement. These no-op stubs are enough for logic-level tests (vim keys,
 * goal checks) — rendering fidelity is covered by the Playwright QA scripts.
 */

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver ??= ResizeObserverStub

const zeroRect = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON() {},
} as DOMRect

Range.prototype.getBoundingClientRect = () => zeroRect
Range.prototype.getClientRects = () =>
  ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
