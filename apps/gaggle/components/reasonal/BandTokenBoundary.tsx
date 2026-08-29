"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  // Rendered if anything inside throws (R3F init, WebGL context loss, GLTF
  // load failure). Keeps the failure local so the homepage and its other live
  // canvases never white-screen because of the 3D token.
  fallback: ReactNode;
};

type State = { hasError: boolean };

export class BandTokenBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (typeof console !== "undefined") {
      console.warn("[BandTokenBoundary] 3D token failed, using fallback:", error);
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default BandTokenBoundary;
