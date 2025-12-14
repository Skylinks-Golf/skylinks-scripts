import fs from "fs";
import path from "path";

export function loadPhotoAsBlob(photoPath) {
  const resolved = path.resolve(photoPath);
  return fs.readFileSync(resolved);
}

export function exportPhotoBlob(blob, outputPath) {
  const resolved = path.resolve(outputPath);
  fs.writeFileSync(resolved, blob);
  return resolved;
}
