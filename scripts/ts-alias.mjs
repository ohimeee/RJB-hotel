// Registers the resolution hooks that let plain Node import the app's modules,
// so a script can call the real booking code without a running server or a
// test-only route sitting in the app. See scripts/ts-alias-hooks.mjs.
//
// Used as:  node --import ./scripts/ts-alias.mjs <script>
import { register } from "node:module";

register("./ts-alias-hooks.mjs", import.meta.url);
