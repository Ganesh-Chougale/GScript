function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
                     .setTitle("Drive Upload Syncer");
}
function uploadFile(fileData, folderId) {
  try {
    const fileBlob = Utilities.newBlob(fileData.data, fileData.type, fileData.name);
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName(fileData.name);
    const newSize = fileBlob.getBytes().length;
    
    if (files.hasNext()) {
      const existingFile = files.next();
      const existingSize = existingFile.getSize();
      
      if (existingSize === newSize) {
        return `Duplicate detected: ${fileData.name} (same size). Skipped upload.`;
      } else {
        existingFile.setTrashed(true);
        folder.createFile(fileBlob);
        return `Replaced: ${fileData.name} (new size uploaded).`;
      }
    } else {
      folder.createFile(fileBlob);
      return `Uploaded: ${fileData.name}`;
    }
  } catch (e) {
    return `Error uploading ${fileData.name}: ${e.message}`;
  }
}
function getFolderConfigHtml() {
  return HtmlService.createHtmlOutputFromFile('folders').getContent();
}