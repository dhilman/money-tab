import type { AnalyticsEvent } from "~/app/api/t/route";

export type EventProperties = Record<string, string | number>;
export type EventNames = AnalyticsEvent["n"];

interface Config {
  maxQueueSize: number;
  flushInterval: number;
  debug: boolean;
  destinationUrl: string;
}

const DEFAULT_CONFIG: Config = {
  maxQueueSize: 10,
  flushInterval: 10000,
  debug: false,
  destinationUrl: "/api/t",
};

/**
 * A analytics tracking class that sends events to a destination URL.
 * - Events are queued and sent in batches.
 * - Dispatch on max queue size, interval, and unload (uses beacon).
 * - First pageview auto queued on page load.
 * - pageview() method to manually send (for client side navigation).
 * - Debug mode logs events to console.
 */
export class Analytics {
  private queue: AnalyticsEvent[] = [];
  private maxQueueSize: number;
  private flushInterval: number;
  private debug: boolean;
  private destinationUrl: string;

  private firstPageSent = false;
  private beaconSent = false;

  constructor(config: Partial<Config> = {}) {
    this.maxQueueSize = config.maxQueueSize || DEFAULT_CONFIG.maxQueueSize;
    this.flushInterval = config.flushInterval || DEFAULT_CONFIG.flushInterval;
    this.debug = config.debug || DEFAULT_CONFIG.debug;
    this.destinationUrl =
      config.destinationUrl || DEFAULT_CONFIG.destinationUrl;
  }

  public init() {
    console.log("Analytics initialized");
    this.queue.push(this._sessStartEvent());

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.sendBeacon();
      } else {
        this.beaconSent = false;
      }
    });
    window.addEventListener("beforeunload", this.sendBeacon);
    window.addEventListener("pagehide", this.sendBeacon);
    window.addEventListener("pageshow", () => {
      this.beaconSent = false;
    });

    // Send queued events on interval
    setInterval(this.flush, this.flushInterval);
    // Send first pageview
    this.firstPageview();
  }

  public track(name: EventNames, properties?: EventProperties) {
    if (typeof window === "undefined") return;
    const event: AnalyticsEvent = {
      n: name,
      url: window.location.href,
      t: new Date().toISOString(),
      p: properties,
    };
    if (this.debug) {
      console.log("[Analytics] Track", event);
    }
    this.enqueue(event);
  }

  public pageview() {
    this._pageview({});
  }

  private _pageview(data: Partial<AnalyticsEvent>) {
    const event: AnalyticsEvent = {
      n: "page",
      url: window.location.href,
      t: new Date().toISOString(),
      r: document.referrer,
      ...this.getViewportSize(),
      ...data,
    };
    if (this.debug) {
      console.log("[Analytics] Pageview", event);
    }
    this.enqueue(event);
  }

  private _sessStartEvent(): AnalyticsEvent {
    return {
      sess: "start",
      n: "sess",
      url: window.location.href,
      t: new Date().toISOString(),
      r: document.referrer,
    };
  }

  private _sessEndEvent(): AnalyticsEvent {
    return {
      sess: "end",
      n: "sess",
      url: window.location.href,
      t: new Date().toISOString(),
      r: document.referrer,
    };
  }

  private firstPageview() {
    if (document.readyState === "complete") {
      const [entry] = performance.getEntriesByType(
        "navigation",
      ) as PerformanceNavigationTiming[];
      this._pageview(this.getTiming(entry));
      return;
    }
    const loadListener = () => {
      if (this.firstPageSent) {
        window.removeEventListener("load", loadListener);
        return;
      }
      const [entry] = performance.getEntriesByType(
        "navigation",
      ) as PerformanceNavigationTiming[];
      this._pageview(this.getTiming(entry));
      window.removeEventListener("load", loadListener);
      this.firstPageSent = true;
    };
    const observer = new PerformanceObserver((list) => {
      if (this.firstPageSent) return;
      const [entry] = list.getEntries() as PerformanceNavigationTiming[];
      if (!entry) return;
      if (!entry.loadEventEnd) return;
      this._pageview(this.getTiming(entry));
      observer.disconnect();
      this.firstPageSent = true;
    });
    window.addEventListener("load", loadListener);
    observer.observe({ type: "navigation", buffered: true });
  }

  private getTiming(entry?: PerformanceNavigationTiming) {
    if (!entry) return {};
    return {
      plt: Math.round(entry.loadEventStart - entry.startTime),
      pit: Math.round(entry.domInteractive - entry.startTime),
    };
  }

  private getViewportSize() {
    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
    };
  }

  private sendBeacon = () => {
    if (this.beaconSent) return;
    this.queue.push(this._sessEndEvent());
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.destinationUrl, JSON.stringify(this.queue));
      this.queue = [];
    } else {
      this.flush();
    }
    this.beaconSent = true;
  };

  private flush = () => {
    if (this.queue.length === 0) return;

    if (this.debug) {
      console.log("[Analytics] Flushing", this.queue);
    }

    void fetch(this.destinationUrl, {
      method: "POST",
      body: JSON.stringify(this.queue),
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((err) => {
      if (this.debug) {
        console.error("[Analytics] Error flushing", err);
      }
    });
    this.queue = [];
  };

  private enqueue(event: AnalyticsEvent) {
    this.queue.push(event);
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }
}
