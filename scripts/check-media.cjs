// Valida os IDs de exerciseMedia.ts contra o free-exercise-db local.
const fs = require("fs");
const path = require("path");
const db = require(path.join(process.env.TEMP, "exercises-db.json"));
const set = new Set(db.map((x) => x.id));
const src = fs.readFileSync(path.join(__dirname, "../src/data/exerciseMedia.ts"), "utf8");
const ids = [...src.matchAll(/: "([^"]+)",/g)].map((m) => m[1]);
const missing = ids.filter((i) => !set.has(i));
console.log("total mapeados:", ids.length, "| invalidos:", missing.length);
missing.forEach((m) => console.log("MISSING:", m));
process.exit(missing.length ? 1 : 0);
