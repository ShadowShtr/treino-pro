// Lista exercícios do app sem mídia mapeada em exerciseMedia.ts
const fs = require("fs");
const path = require("path");
const exSrc = fs.readFileSync(path.join(__dirname, "../src/data/exercises.ts"), "utf8");
const mediaSrc = fs.readFileSync(path.join(__dirname, "../src/data/exerciseMedia.ts"), "utf8");
const appNames = [...exSrc.matchAll(/^\s+"([^"]+)",$/gm)].map((m) => m[1]);
const mapped = new Set([...mediaSrc.matchAll(/^\s+"([^"]+)": "/gm)].map((m) => m[1]));
const missing = [...new Set(appNames)].filter((n) => !mapped.has(n));
console.log("exercicios no app:", new Set(appNames).size, "| sem midia:", missing.length);
missing.forEach((m) => console.log("SEM MIDIA:", m));
