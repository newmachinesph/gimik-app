import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');
const { expo } = JSON.parse(readFileSync(resolve(root, 'app.json'), 'utf8'));
const eas = JSON.parse(readFileSync(resolve(root, 'eas.json'), 'utf8'));

describe('Gimik iOS release configuration', () => {
  it('uses the Gimik PNG instead of the Expo sample icon override', () => {
    expect(expo.ios.icon).toBe('./assets/images/icon.png');
    expect(expo.ios.icon).toBe(expo.icon);
    const png = readFileSync(resolve(root, expo.ios.icon));
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.readUInt32BE(16)).toBe(1024);
    expect(png.readUInt32BE(20)).toBe(1024);
  });

  it('declares the reviewed OS-only encryption configuration', () => {
    // Reassess this declaration before adding application-level encryption.
    expect(expo.ios.config.usesNonExemptEncryption).toBe(false);
  });

  it('targets only the Gimik bundle and App Store record', () => {
    expect(expo.ios.bundleIdentifier).toBe('com.sumnora.gimik');
    expect(eas.submit.production.ios.ascAppId).toBe('6813533953');
  });

  it('isolates screenshot builds from store signing and version increments', () => {
    expect(eas.build.screenshots.extends).toBe('production');
    expect(eas.build.screenshots.ios.simulator).toBe(true);
    expect(eas.build.screenshots.developmentClient).toBe(false);
    expect(eas.build.screenshots.withoutCredentials).toBe(true);
    expect(eas.build.screenshots.autoIncrement).toBe(false);
    expect(eas.build.screenshots.distribution).toBe('internal');
    expect(eas.build.production.ios?.simulator).not.toBe(true);
    expect(eas.build.production.autoIncrement).toBe(true);
  });

  it('creates the screenshot simulator before the Maestro job selects it', () => {
    for (const name of ['ios-screenshots.yml', 'ios-screenshots-existing.yml']) {
      const workflow = readFileSync(resolve(root, '.eas/workflows', name), 'utf8');
      expect(workflow).toContain('image: latest');
      expect(workflow).toContain('device_identifier: Gimik Screenshots');
      expect(workflow).toMatch(/after_checkout:\s+- name: Prepare screenshot fixture and iPhone\s+run: node scripts\/prepare-ios-screenshots\.cjs/);
      expect(workflow).not.toContain('before_maestro_tests:');
    }
  });
});
