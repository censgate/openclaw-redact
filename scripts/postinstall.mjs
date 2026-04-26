#!/usr/bin/env node
import { existsSync, realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const nm = `${sep}node_modules${sep}`;

function inGitWorkTree(dir) {
  let d = dir;
  for (;;) {
    if (existsSync(resolve(d, ".git"))) {
      return true;
    }
    const p = dirname(d);
    if (p === d) {
      return false;
    }
    d = p;
  }
}

const root = fileURLToPath(new URL("..", import.meta.url));
let realRoot;
try {
  realRoot = realpathSync(root);
} catch {
  process.exit(0);
}
if (realRoot.includes(nm)) {
  process.exit(0);
}
if (!inGitWorkTree(realRoot)) {
  process.exit(0);
}

const sync = resolve(root, "scripts", "sync-openclaw-plugin-version.mjs");
const r = spawnSync(process.execPath, [sync], { stdio: "inherit" });
process.exit(r.status ?? 1);
