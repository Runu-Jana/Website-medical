import JSZip from 'jszip';

// Resolve a relationship Target (possibly "../drawings/drawing1.xml") against a
// base directory, collapsing "." and "..".
function resolvePath(baseDir, target) {
  if (target.startsWith('/')) return target.replace(/^\/+/, '');
  const stack = [];
  for (const part of `${baseDir}/${target}`.split('/')) {
    if (part === '..') stack.pop();
    else if (part && part !== '.') stack.push(part);
  }
  return stack.join('/');
}

/**
 * Extract images embedded in the FIRST worksheet of an .xlsx and map each to the
 * 1-based spreadsheet row its top-left corner is anchored to.
 *
 * Returns a Map<rowNumber, Array<{ buffer, ext }>>. Returns an empty Map for
 * non-xlsx input (e.g. .csv/.xls) or sheets with no embedded pictures — so the
 * caller can always call it safely.
 *
 * Row numbering matches the importer: header is row 1, the first product row is
 * row 2, and so on.
 */
export async function extractSheetImages(buffer) {
  const out = new Map();
  let zip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return out; // not a zip (csv / legacy xls) — nothing embedded
  }

  const readText = async (p) => {
    const f = zip.file(p);
    return f ? f.async('string') : '';
  };
  const relTarget = (relsXml, id) => {
    const m = new RegExp(`<Relationship\\b[^>]*Id="${id}"[^>]*Target="([^"]+)"`, 'i').exec(relsXml)
      || new RegExp(`<Relationship\\b[^>]*Target="([^"]+)"[^>]*Id="${id}"`, 'i').exec(relsXml);
    return m ? m[1] : '';
  };

  try {
    // 1) First worksheet file (workbook.xml → its rels).
    const workbookXml = await readText('xl/workbook.xml');
    const workbookRels = await readText('xl/_rels/workbook.xml.rels');
    const firstSheet = workbookXml.match(/<sheet\b[^>]*r:id="([^"]+)"/i);
    if (!firstSheet) return out;
    const sheetTarget = relTarget(workbookRels, firstSheet[1]);
    if (!sheetTarget) return out;
    const sheetPath = resolvePath('xl', sheetTarget); // e.g. xl/worksheets/sheet1.xml

    // 2) Worksheet → its drawing.
    const sheetXml = await readText(sheetPath);
    const drawingRefId = sheetXml.match(/<drawing\b[^>]*r:id="([^"]+)"/i);
    if (!drawingRefId) return out; // no drawings on this sheet
    const sheetDir = sheetPath.slice(0, sheetPath.lastIndexOf('/'));
    const sheetName = sheetPath.slice(sheetPath.lastIndexOf('/') + 1);
    const sheetRels = await readText(`${sheetDir}/_rels/${sheetName}.rels`);
    const drawingTarget = relTarget(sheetRels, drawingRefId[1]);
    if (!drawingTarget) return out;
    const drawingPath = resolvePath(sheetDir, drawingTarget); // xl/drawings/drawing1.xml

    // 3) Drawing rels: relationship id → media file path.
    const drawingXml = await readText(drawingPath);
    const drawingDir = drawingPath.slice(0, drawingPath.lastIndexOf('/'));
    const drawingName = drawingPath.slice(drawingPath.lastIndexOf('/') + 1);
    const drawingRels = await readText(`${drawingDir}/_rels/${drawingName}.rels`);
    const mediaByRel = {};
    for (const m of drawingRels.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/gi)) {
      mediaByRel[m[1]] = resolvePath(drawingDir, m[2]);
    }

    // 4) Each anchor: top-left row (0-based) + the image it embeds.
    const anchors = drawingXml.split(/<xdr:(?:twoCellAnchor|oneCellAnchor)\b/i).slice(1);
    for (const block of anchors) {
      const rowMatch = block.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/i);
      const blip = block.match(/<a:blip\b[^>]*r:embed="([^"]+)"/i);
      if (!rowMatch || !blip) continue;
      const mediaPath = mediaByRel[blip[1]];
      const mediaFile = mediaPath && zip.file(mediaPath);
      if (!mediaFile) continue;
      const imgBuf = await mediaFile.async('nodebuffer');
      const ext = (mediaPath.split('.').pop() || 'png').toLowerCase();
      const rowNum = parseInt(rowMatch[1], 10) + 1; // 0-based anchor row → 1-based sheet row
      if (!out.has(rowNum)) out.set(rowNum, []);
      out.get(rowNum).push({ buffer: imgBuf, ext });
    }
  } catch {
    return out; // any parse hiccup → behave as "no embedded images"
  }

  return out;
}
