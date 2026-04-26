#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const { version } = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const pluginPath = resolve(root, "openclaw.plugin.json");
const text = readFileSync(pluginPath, "utf8");
const re = /^(\s*"version"\s*:\s*")[^"]*(")/m;
if (!re.test(text)) {
  throw new Error('openclaw.plugin.json: missing top-level "version" field');
}
const next = text.replace(re, `$1${version}$2`);
if (next !== text) {
  writeFileSync(pluginPath, next, "utf8");
}
