import { FhevmRelayerSDKType, FhevmWindowType } from "./fhevmTypes";
import { SDK_CDN_URL } from "./constants";

type TraceType = (message?: unknown, ...optionalParams: unknown[]) => void;

export class RelayerSDKLoader {
  private _trace?: TraceType;

  constructor(options: { trace?: TraceType } = {}) {
    this._trace = options.trace;
  }

  public isLoaded(): boolean {
    if (typeof window === "undefined") {
      throw new Error("RelayerSDKLoader: can only be used in the browser.");
    }
    return this.isFhevmWindowType(window);
  }

  public load(): Promise<void> {
    console.log("[RelayerSDKLoader] load...");
    // Ensure this only runs in the browser
    if (typeof window === "undefined") {
      console.log("[RelayerSDKLoader] window === undefined");
      return Promise.reject(
        new Error("RelayerSDKLoader: can only be used in the browser.")
      );
    }

    if ("relayerSDK" in window) {
      if (!this.isValidRelayerSDK(window.relayerSDK)) {
        console.log("[RelayerSDKLoader] window.relayerSDK === undefined");
        throw new Error("RelayerSDKLoader: Unable to load FHEVM Relayer SDK");
      }
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${SDK_CDN_URL}"]`
      );
      if (existingScript) {
        if (!this.isFhevmWindowType(window)) {
          reject(
            new Error(
              "RelayerSDKLoader: window object does not contain a valid relayerSDK object."
            )
          );
        }
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;

      script.onload = () => {
        if (!this.isFhevmWindowType(window)) {
          console.log("[RelayerSDKLoader] script onload FAILED...");
          reject(
            new Error(
              `RelayerSDKLoader: Relayer SDK script has been successfully loaded from ${SDK_CDN_URL}, however, the window.relayerSDK object is invalid.`
            )
          );
        }
        resolve();
      };

      script.onerror = () => {
        console.log("[RelayerSDKLoader] script onerror... ");
        reject(
          new Error(
            `RelayerSDKLoader: Failed to load Relayer SDK from ${SDK_CDN_URL}`
          )
        );
      };

      console.log("[RelayerSDKLoader] add script to DOM...");
      document.head.appendChild(script);
      console.log("[RelayerSDKLoader] script added!");
    });
  }

  public isValidRelayerSDK(sdk: unknown): sdk is FhevmRelayerSDKType {
    if (typeof sdk === "undefined") {
      this._trace?.("RelayerSDKLoader: relayerSDK is undefined");
      return false;
    }
    if (sdk === null) {
      this._trace?.("RelayerSDKLoader: relayerSDK is null");
      return false;
    }
    if (typeof sdk !== "object") {
      this._trace?.("RelayerSDKLoader: relayerSDK is not an object");
      return false;
    }
    if (!this.hasProperty(sdk, "initSDK", "function")) {
      this._trace?.("RelayerSDKLoader: relayerSDK.initSDK is invalid");
      return false;
    }
    if (!this.hasProperty(sdk, "createInstance", "function")) {
      this._trace?.("RelayerSDKLoader: relayerSDK.createInstance is invalid");
      return false;
    }
    if (!this.hasProperty(sdk, "SepoliaConfig", "object")) {
      this._trace?.("RelayerSDKLoader: relayerSDK.SepoliaConfig is invalid");
      return false;
    }
    if ("__initialized__" in sdk) {
      if (sdk.__initialized__ !== true && sdk.__initialized__ !== false) {
        this._trace?.("RelayerSDKLoader: relayerSDK.__initialized__ is invalid");
        return false;
      }
    }
    return true;
  }

  public isFhevmWindowType(win: unknown): win is FhevmWindowType {
    if (typeof win === "undefined") {
      this._trace?.("RelayerSDKLoader: window object is undefined");
      return false;
    }
    if (win === null) {
      this._trace?.("RelayerSDKLoader: window object is null");
      return false;
    }
    if (typeof win !== "object") {
      this._trace?.("RelayerSDKLoader: window is not an object");
      return false;
    }
    if (!("relayerSDK" in win)) {
      this._trace?.("RelayerSDKLoader: window does not contain 'relayerSDK' property");
      return false;
    }
    return this.isValidRelayerSDK((win as any).relayerSDK);
  }

  public hasProperty<
    T extends object,
    K extends PropertyKey,
    V extends string // "string", "number", etc.
  >(
    obj: T,
    propertyName: K,
    propertyType: V
  ): obj is T &
    Record<
      K,
      V extends "string"
        ? string
        : V extends "number"
        ? number
        : V extends "object"
        ? object
        : V extends "boolean"
        ? boolean
        : V extends "function"
        ? (...args: any[]) => any
        : unknown
    > {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    if (!(propertyName in obj)) {
      this._trace?.(`RelayerSDKLoader: missing ${String(propertyName)}.`);
      return false;
    }

    const value = (obj as Record<K, unknown>)[propertyName];

    if (value === null || value === undefined) {
      this._trace?.(`RelayerSDKLoader: ${String(propertyName)} is null or undefined.`);
      return false;
    }

    if (typeof value !== propertyType) {
      this._trace?.(
        `RelayerSDKLoader: ${String(propertyName)} is not a ${propertyType}.`
      );
      return false;
    }

    return true;
  }
}