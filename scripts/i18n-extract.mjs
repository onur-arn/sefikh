// Inventaire des textes de l'interface.
//   node scripts/i18n-extract.mjs            écrit client-keys.json et vérifie les catalogues
//   node scripts/i18n-extract.mjs --missing  affiche les textes non traduits
// La clé d'un texte est sa version anglaise : voir src/i18n/config.ts.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const DIR = "src/i18n/messages";
const LOCALES = ["fr", "it", "es", "zh"];
// Textes de données affichés via tr(variable).
const DATA_PROPS = new Set(["label", "title", "description", "text", "heading", "hint", "subtitle", "eyebrow", "cta", "body", "excerpt", "category", "tagline", "name", "q", "a", "copy", "who", "note", "sub"]);
const ERROR_PROPS = new Set(["error", "success", "message"]);
const DATA_FILES = new Set(["src/lib/constants.ts", "src/lib/plans.ts", "src/lib/journal.ts"]);
const SKIP_ARRAYS = new Set(["synonyms", "keywords"]);
const SKIP_DIRS = [/^src\/i18n\//, /^src\/app\/dev\//];

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(p) && !SKIP_DIRS.some((r) => r.test(p))) files.push(p);
  }
})("src");

const isText = (s) => /\p{L}{2}/u.test(s) && (s.split(" ").length > 4 || !/^(\/|https?:|[a-z]+[-_:.][a-z-]|[A-Z_]{3,}$)/.test(s));
const all = new Set();
const client = new Set();

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const isClient = src.trimStart().startsWith('"use client"');
  const isData = DATA_FILES.has(file);
  const take = (s, shared = false) => {
    if (!isText(s)) return;
    all.add(s);
    if (isClient || shared) client.add(s);
  };
  (function visit(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "tr") {
      const a = n.arguments[0];
      const lits = [];
      (function collect(x) {
        if (!x) return;
        if (ts.isStringLiteralLike(x)) lits.push(x.text);
        else if (ts.isConditionalExpression(x)) [x.whenTrue, x.whenFalse].forEach(collect);
        else if (ts.isParenthesizedExpression(x)) collect(x.expression);
      })(a);
      lits.forEach((s) => take(s));
    }
    // Erreurs et confirmations renvoyées par le serveur : affichées côté client.
    if (ts.isReturnStatement(n) && n.expression && ts.isStringLiteralLike(n.expression) && /^Please /.test(n.expression.text)) take(n.expression.text, true);
    if (ts.isPropertyAssignment(n) && ERROR_PROPS.has(n.name.getText()) && ts.isStringLiteralLike(n.initializer)) take(n.initializer.text, true);
    if (ts.isCallExpression(n) && /Error$/.test(n.expression.getText?.() ?? "") && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])) take(n.arguments[0].text, true);
    if (ts.isNewExpression(n) && /Error$/.test(n.expression.getText()) && n.arguments?.[0] && ts.isStringLiteralLike(n.arguments[0])) take(n.arguments[0].text, true);
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && ["min", "max", "email", "regex", "url", "refine"].includes(n.expression.name.text)) {
      for (const a of n.arguments) if (ts.isStringLiteralLike(a)) take(a.text, true);
    }
    // Données de module : options, offres, vocabulaire, articles.
    if (ts.isPropertyAssignment(n) && DATA_PROPS.has(n.name.getText()) && ts.isStringLiteralLike(n.initializer)) {
      const inFn = (() => { for (let p = n.parent; p; p = p.parent) if (ts.isFunctionLike(p)) return true; return false; })();
      if (!inFn && (isData || file.endsWith("x"))) take(n.initializer.text, isData && !file.endsWith("journal.ts"));
    }
    if (ts.isArrayLiteralExpression(n)) {
      const owner = n.parent;
      const ownerName = ts.isPropertyAssignment(owner) ? owner.name.getText() : "";
      const inFn = (() => { for (let p = n.parent; p; p = p.parent) if (ts.isFunctionLike(p)) return true; return false; })();
      if (!SKIP_ARRAYS.has(ownerName) && !inFn && (isData || (file.endsWith("x") && !ownerName.startsWith("x")))) {
        for (const e of n.elements) if (ts.isStringLiteralLike(e)) take(e.text, isData && !file.endsWith("journal.ts"));
      }
    }
    ts.forEachChild(n, visit);
  })(sf);
}

const keys = [...all].sort();
fs.writeFileSync(`${DIR}/client-keys.json`, JSON.stringify([...client].sort(), null, 0) + "\n");
const report = {};
let bad = 0;
for (const l of LOCALES) {
  const cat = JSON.parse(fs.readFileSync(`${DIR}/${l}.json`, "utf8"));
  const missing = keys.filter((k) => !cat[k]);
  const stale = Object.keys(cat).filter((k) => !all.has(k));
  const vars = keys.filter((k) => cat[k] && [...k.matchAll(/\{\w+\}/g)].some(([v]) => !cat[k].includes(v)));
  report[l] = { total: keys.length, missing: missing.length, stale: stale.length, brokenPlaceholders: vars.length };
  bad += missing.length + vars.length;
  if (process.argv.includes("--missing") && l === (process.argv[3] ?? "fr")) console.log(JSON.stringify(missing, null, 0));
}
if (!process.argv.includes("--missing")) console.table(report);
console.log("clés client :", client.size, "/", keys.length);
process.exitCode = process.argv.includes("--check") && bad ? 1 : 0;
