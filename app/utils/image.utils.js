export function getImageUrl(req, fileId, fileName) {
  return `${req.protocol}://${req.get('host')}/images/${fileId}/${fileName}`;
}