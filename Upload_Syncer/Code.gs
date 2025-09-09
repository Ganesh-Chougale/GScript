function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
                     .setTitle("Drive Upload Syncer");
}

function getExistingFilesBySize(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const filesBySize = {};
  
  while (files.hasNext()) {
    const file = files.next();
    const size = file.getSize();
    // Store the size and the file name(s)
    if (!filesBySize[size]) {
      filesBySize[size] = [];
    }
    filesBySize[size].push(file.getName());
  }
  
  return filesBySize;
}

function uploadFile(name, data, fileType, folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName(name);
    
    // Decode the Base64 string to a byte array and create a Blob.
    const decodedData = Utilities.base64Decode(data.split(',')[1]);
    const fileBlob = Utilities.newBlob(decodedData, fileType, name);
    
    const newSize = fileBlob.getBytes().length;
    
    // Check for a duplicate with the same name and size
    if (files.hasNext()) {
      const existingFile = files.next();
      if (existingFile.getSize() === newSize) {
        return `Duplicate detected: ${name} (same size). Skipped upload.`;
      }
    }
    
    // Check for a duplicate with a different name but same size
    const existingFilesBySize = getExistingFilesBySize(folderId);
    if (existingFilesBySize[newSize]) {
      const existingNames = existingFilesBySize[newSize].join(', ');
      return `Potential duplicate detected! File "${name}" has the same size as existing file(s): ${existingNames}. Please rename the file before uploading.`;
    }
    
    // No duplicate found, proceed with upload
    folder.createFile(fileBlob);
    return `Uploaded: ${name}`;

  } catch (e) {
    return `Error uploading ${name}: ${e.message}`;
  }
}

function getFolderConfigHtml() {
  return HtmlService.createHtmlOutputFromFile('folders').getContent();
}