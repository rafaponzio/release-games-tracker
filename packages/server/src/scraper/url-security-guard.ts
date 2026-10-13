export interface UrlSecurityOptions {
  allowedHostnames?: string[];
  allowHttp?: boolean;
}

export class UrlSecurityGuard {
  private allowedHostnames: Set<string>;
  private allowHttp: boolean;

  constructor(options: UrlSecurityOptions = {}) {
    this.allowedHostnames = new Set(
      (options.allowedHostnames || ['en.wikipedia.org', 'wikipedia.org']).map((h) => h.toLowerCase())
    );
    this.allowHttp = options.allowHttp ?? false;
  }

  validateUrl(urlString: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      throw new Error(`Invalid URL format: ${urlString}`);
    }

    // Protocol check
    if (!this.allowHttp && parsed.protocol !== 'https:') {
      throw new Error(`Only HTTPS protocol is permitted, got: ${parsed.protocol}`);
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }

    // Disallow credentials in URL
    if (parsed.username || parsed.password) {
      throw new Error('Credentials not permitted in target URL');
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check private & loopback IPs (SSRF guard)
    if (this.isPrivateOrLoopback(hostname)) {
      throw new Error(`Access to private/internal network addresses is prohibited: ${hostname}`);
    }

    // Check allowlist
    if (this.allowedHostnames.size > 0 && !this.allowedHostnames.has(hostname)) {
      throw new Error(`Hostname not allowed by security policy: ${hostname}`);
    }

    return parsed;
  }

  isAllowed(urlString: string): boolean {
    try {
      this.validateUrl(urlString);
      return true;
    } catch {
      return false;
    }
  }

  private isPrivateOrLoopback(hostname: string): boolean {
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      return true;
    }

    // IPv4 patterns
    // 127.0.0.0/8 (Loopback)
    if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    // 10.0.0.0/8 (Private)
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    // 172.16.0.0/12 (Private)
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    // 192.168.0.0/16 (Private)
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata)
    if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    // 0.0.0.0
    if (hostname === '0.0.0.0') return true;

    // IPv6 loopback / unique local
    if (hostname === '::1' || hostname === '[::1]' || hostname.startsWith('fe80:') || hostname.startsWith('fc00:') || hostname.startsWith('fd00:')) {
      return true;
    }

    return false;
  }
}
