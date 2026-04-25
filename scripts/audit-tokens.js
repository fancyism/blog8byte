import fs from 'fs';
import path from 'path';

const tokensPath = path.resolve(process.cwd(), 'design-tokens.json');

function auditTokens() {
  console.log("🔍 Starting QA Token Audit...");
  
  if (!fs.existsSync(tokensPath)) {
    console.error("❌ ERROR: design-tokens.json not found.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(tokensPath, 'utf8');
  let tokens;
  try {
    tokens = JSON.parse(rawData);
  } catch (e) {
    console.error("❌ ERROR: design-tokens.json is not valid JSON.");
    process.exit(1);
  }

  const globalColors = tokens.blog8byte?.global?.color || {};
  const semanticColors = tokens.blog8byte?.semantic?.color || {};

  // Flatten global colors for easy lookup (e.g. "stone.900")
  const availableGlobalTokens = new Set();
  
  for (const [family, shades] of Object.entries(globalColors)) {
    if (shades.$value) {
      availableGlobalTokens.add(`{blog8byte.global.color.${family}}`);
    } else {
      for (const [shade, value] of Object.entries(shades)) {
        availableGlobalTokens.add(`{blog8byte.global.color.${family}.${shade}}`);
      }
    }
  }

  let errors = 0;

  // Audit Semantic tokens
  for (const [semanticName, modes] of Object.entries(semanticColors)) {
    for (const [mode, tokenDef] of Object.entries(modes)) {
      if (tokenDef.$type === 'color' && typeof tokenDef.$value === 'string') {
        const value = tokenDef.$value;
        if (value.startsWith('{') && value.endsWith('}')) {
          if (!availableGlobalTokens.has(value)) {
            console.error(`❌ ERROR: Semantic token '${semanticName}.${mode}' references undefined Global token '${value}'.`);
            errors++;
          }
        }
      }
    }
  }

  if (errors > 0) {
    console.error(`\n💥 Audit Failed: Found ${errors} missing references in tokens.`);
    process.exit(1);
  } else {
    console.log("✅ Audit Passed: All Semantic tokens reference valid Global tokens.");
    console.log("✨ Tokens are clean and ready for merge!");
  }
}

auditTokens();
