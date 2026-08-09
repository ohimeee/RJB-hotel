// Starts `next dev` and opens the app in a new browser window once the server
// is ready. Next has no --open flag, so we watch its stdout for the local URL.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// First match wins. All are Chromium-based, so --new-window behaves the same.
const BROWSERS = [
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const openBrowser = (url) => {
  const browser = BROWSERS.find((path) => existsSync(path));

  if (browser) {
    spawn(browser, ["--new-window", url], {
      detached: true,
      stdio: "ignore",
    }).unref();

    return;
  }

  // No known browser installed — hand off to the OS default.
  const [command, args] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];

  spawn(command, args, { detached: true, stdio: "ignore" }).unref();
};

const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const args = process.argv.slice(2);

// Fall back to the PATH-resolved binary if the expected location is missing
// (hoisting, pnpm layouts, etc).
const child = existsSync(nextBin)
  ? spawn(process.execPath, [nextBin, "dev", ...args], {
      cwd: projectRoot,
      stdio: ["inherit", "pipe", "inherit"],
    })
  : spawn("next", ["dev", ...args], {
      cwd: projectRoot,
      stdio: ["inherit", "pipe", "inherit"],
      shell: true,
    });

let opened = false;

const openOnce = (url) => {
  if (opened) return;

  opened = true;
  console.log(`\n  Opening ${url} in a new window...\n`);
  openBrowser(url);
};

child.stdout.on("data", (chunk) => {
  const text = chunk.toString();

  // Pass Next's output through untouched.
  process.stdout.write(text);

  // Next prints the resolved URL, which may not be port 3000 if it was taken.
  const match = text.match(/http:\/\/localhost:\d+/);

  if (match) openOnce(match[0]);
});

// Safety net in case Next's startup output ever changes shape.
const fallback = setTimeout(() => {
  openOnce(`http://localhost:${process.env.PORT ?? 3000}`);
}, 20_000);

// If this wrapper goes down, take `next dev` with it — otherwise an orphan
// keeps holding port 3000 and the next run silently starts a second server.
const stopChild = () => {
  if (child.exitCode !== null || child.killed) return;

  // `next dev` spawns its server as a grandchild, and Windows does not
  // propagate signals down a process tree. child.kill() would leave the
  // server alive on port 3000, so kill by pid with /T instead.
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  } else {
    child.kill();
  }
};

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) {
  process.on(signal, () => {
    stopChild();
    process.exit(0);
  });
}

process.on("exit", stopChild);

child.on("exit", (code, signal) => {
  clearTimeout(fallback);
  process.exit(code ?? (signal ? 1 : 0));
});
