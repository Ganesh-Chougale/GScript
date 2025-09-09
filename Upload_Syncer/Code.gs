function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
                     .setTitle("Drive Upload Syncer");
}
function uploadFile(name, data, folderId, fileType) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName(name);
    
    // Decode the Base64 string to a byte array.
    const decodedData = Utilities.base64Decode(data.split(',')[1]);
    
    // Use Utilities.newBlob() to convert the byte array into a Blob.
    // Use the dynamic fileType parameter instead of a hardcoded MimeType.
    const fileBlob = Utilities.newBlob(decodedData, fileType, name);
    
    const newSize = fileBlob.getBytes().length;
    
    if (files.hasNext()) {
      const existingFile = files.next();
      const existingSize = existingFile.getSize();
      
      if (existingSize === newSize) {
        return `Duplicate detected: ${name} (same size). Skipped upload.`;
      } else {
        existingFile.setTrashed(true);
        folder.createFile(fileBlob);
        return `Replaced: ${name} (new size uploaded).`;
      }
    } else {
      folder.createFile(fileBlob);
      return `Uploaded: ${name}`;
    }
  } catch (e) {
    return `Error uploading ${name}: ${e.message}`;
  }
}
function getFolderConfigHtml() {
  return HtmlService.createHtmlOutputFromFile('folders').getContent();
}