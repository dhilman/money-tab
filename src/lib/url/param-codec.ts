export type ParsedUrlPath =
  | { type: "USER"; id: string }
  | { type: "GROUP"; id: string }
  | { type: "TX"; id: string; contribId?: string }
  | { type: "SUB"; id: string; contribId?: string };

abstract class UrlPathCodec {
  abstract version: string;
  abstract checkVersion(path: string): boolean;
  abstract encode(path: ParsedUrlPath): string;
  abstract decode(path: string): ParsedUrlPath | null;
}

class UrlPathCodecV1 extends UrlPathCodec {
  version = "v1";

  checkVersion(path: string): boolean {
    if (path.length !== 11) return false;
    if (path.includes("_")) return false;
    if (path.toLowerCase() !== path) return false;
    const validPrefixes = ["t", "u", "s", "g"];
    if (!validPrefixes.some((p) => path.startsWith(p))) {
      return false;
    }
    return true;
  }

  encode(path: ParsedUrlPath): string {
    path = shortedIds(path);
    let encoded = "";
    switch (path.type) {
      case "USER":
        encoded = `u${path.id}`;
        break;
      case "GROUP":
        encoded = `g${path.id}`;
        break;
      case "TX":
        encoded = `t${path.id}`;
        break;
      case "SUB":
        encoded = `s${path.id}`;
        break;
    }
    return encoded;
  }

  decode(path: string): ParsedUrlPath | null {
    const type = path[0];
    const id = path.slice(1);
    if (!type || !id) return null;

    switch (type) {
      case "u":
        return { type: "USER", id };
      case "g":
        return { type: "GROUP", id };
      case "t":
        return { type: "TX", id };
      case "s":
        return { type: "SUB", id };
      default:
        return null;
    }
  }
}

class UrlPathCodecV2 extends UrlPathCodec {
  version = "v2";

  checkVersion(path: string): boolean {
    return path.startsWith("v2-");
  }

  encode(input: ParsedUrlPath): string {
    const path = shortedIds(input);
    let encoded = "";
    switch (path.type) {
      case "USER":
        encoded = `u${path.id}`;
        break;
      case "GROUP":
        encoded = `g${path.id}`;
        break;
      case "TX":
        encoded = `t${path.id}`;
        if (path.contribId) encoded += `-${path.contribId}`;
        break;
      case "SUB":
        encoded = `s${path.id}`;
        if (path.contribId) encoded += `-${path.contribId}`;
        break;
    }
    return `${this.version}-${encoded}`;
  }

  decode(path: string): ParsedUrlPath | null {
    const [version = "", ...parts] = path.split("-");
    if (version !== this.version) {
      throw new Error(`Invalid version: ${version} (expected ${this.version})`);
    }

    const [typeAndId = "", contribId] = parts;
    const type = typeAndId[0];
    const id = typeAndId.slice(1);

    if (!type || !id) return null;

    switch (type) {
      case "u":
        return { type: "USER", id };
      case "g":
        return { type: "GROUP", id };
      case "t":
        return { type: "TX", id: id, contribId };
      case "s":
        return { type: "SUB", id: id, contribId };
      default:
        return null;
    }
  }
}

function shortedIds(p: ParsedUrlPath): ParsedUrlPath {
  switch (p.type) {
    case "USER":
    case "GROUP":
      return { ...p, id: p.id.slice(0, 10) };
    case "TX":
    case "SUB":
      return {
        ...p,
        id: p.id.slice(0, 10),
        contribId: p.contribId?.slice(0, 10),
      };
  }
}

class PathCodecFactory {
  private static codecs = [new UrlPathCodecV2(), new UrlPathCodecV1()] as const;
  private static latest = this.codecs[0];

  static encode(path: ParsedUrlPath): string {
    return this.latest.encode(path);
  }

  static decode(path: string): ParsedUrlPath | null {
    const codec = this.codecs.find((c) => c.checkVersion(path));
    if (!codec) return null;
    return codec.decode(path);
  }
}

export function encodeUrlPath(path: ParsedUrlPath): string {
  return PathCodecFactory.encode(path);
}

export function decodeUrlPath(path: string): ParsedUrlPath | null {
  return PathCodecFactory.decode(path);
}
