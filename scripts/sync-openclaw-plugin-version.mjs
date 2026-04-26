#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packageJsonPath = resolve(root, "package.json");
const openclawInstalledPath = resolve(root, "node_modules/openclaw/package.json");
const pluginPath = resolve(root, "openclaw.plugin.json");

const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const { version } = pkg;

const pluginText = readFileSync(pluginPath, "utf8");
const re = /^(\s*"version"\s*:\s*")[^"]*(")/m;
if (!re.test(pluginText)) {
  throw new Error('openclaw.plugin.json: missing top-level "version" field');
}
const nextPlugin = pluginText.replace(re, `$1${version}$2`);
if (nextPlugin !== pluginText) {
  writeFileSync(pluginPath, nextPlugin, "utf8");
}

let openclawVersion;
try {
  openclawVersion = JSON.parse(readFileSync(openclawInstalledPath, "utf8")).version;
} catch {
  throw new Error(
    "sync-openclaw-plugin-version: could not read openclaw from node_modules/openclaw/package.json. Run `npm install` first."
  );
}
if (typeof openclawVersion !== "string" || !openclawVersion) {
  throw new Error('node_modules/openclaw/package.json: missing or empty "version"');
}

if (!pkg.openclaw) {
  throw new Error('package.json: missing top-level "openclaw" field');
}
if (!pkg.openclaw.compat) {
  pkg.openclaw.compat = {};
}
if (!pkg.openclaw.build) {
  pkg.openclaw.build = {};
}
pkg.openclaw.compat.pluginApi = `>=${openclawVersion}`;
pkg.openclaw.compat.minGatewayVersion = openclawVersion;
pkg.openclaw.build.openclawVersion = openclawVersion;
pkg.openclaw.build.pluginSdkVersion = openclawVersion;

const nextPackageJson = `${JSON.stringify(pkg, null, 2)}\n`;
const currentPackageJson = readFileSync(packageJsonPath, "utf8");
if (nextPackageJson !== currentPackageJson) {
  writeFileSync(packageJsonPath, nextPackageJson, "utf8");
}
