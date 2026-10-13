import { describe, it, expect } from 'vitest';
import { UrlSecurityGuard } from '../../src/scraper/url-security-guard.js';

describe('UrlSecurityGuard (SSRF Protection TDD)', () => {
  const guard = new UrlSecurityGuard({
    allowedHostnames: ['en.wikipedia.org', 'wikipedia.org'],
    allowHttp: false,
  });

  it('allows valid HTTPS URLs from whitelisted hostnames', () => {
    const valid = 'https://en.wikipedia.org/wiki/2026_in_video_games';
    expect(() => guard.validateUrl(valid)).not.toThrow();
    expect(guard.isAllowed(valid)).toBe(true);
  });

  it('rejects HTTP URLs when allowHttp is false', () => {
    const insecure = 'http://en.wikipedia.org/wiki/2026_in_video_games';
    expect(() => guard.validateUrl(insecure)).toThrow(/Only HTTPS/);
    expect(guard.isAllowed(insecure)).toBe(false);
  });

  it('rejects unauthorized external hostnames', () => {
    const malicious = 'https://malicious-site.com/payload';
    expect(() => guard.validateUrl(malicious)).toThrow(/Hostname not allowed/);
    expect(guard.isAllowed(malicious)).toBe(false);
  });

  it('blocks private IP addresses and loopback URLs (SSRF prevention)', () => {
    const targets = [
      'https://127.0.0.1/admin',
      'https://localhost:8080/internal',
      'https://169.254.169.254/latest/meta-data/',
      'https://10.0.0.1/secrets',
      'https://192.168.1.1/router',
      'https://172.16.0.1/db',
    ];

    for (const url of targets) {
      expect(() => guard.validateUrl(url)).toThrow();
      expect(guard.isAllowed(url)).toBe(false);
    }
  });

  it('rejects URLs with credentials embedded', () => {
    const credUrl = 'https://user:password@en.wikipedia.org/wiki/test';
    expect(() => guard.validateUrl(credUrl)).toThrow(/Credentials not permitted/);
  });
});
