import fs from 'fs';
import path from 'path';

export const saveAnnotatedScreenshot = (imagePath, violations) => {
  const annotatedPath = path.join(path.dirname(imagePath), path.basename(imagePath, path.extname(imagePath)) + '_annotated' + path.extname(imagePath));
  // For now, just copy; in real, annotate with canvas
  fs.copyFileSync(imagePath, annotatedPath);
  return annotatedPath;
};
