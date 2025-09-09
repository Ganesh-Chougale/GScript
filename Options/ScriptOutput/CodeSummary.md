Upload_Syncer\Code.gs:
```gs
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
```

Upload_Syncer\folders.html:
```html
<script type="application/json" id="folderData">
{
  "Music": {
    "Hindi": "18M6kEfEAL3badlT-dIVFFMkWJqp7DPmM",
    "Old Hindi": "1fJELbhMCdB-92hX8Vp8HvPKOQXeJ0rMx",
    "Marathi": "1g0jDrfMomCM_0jKUUoQKIwOD5yq1TtU5",
    "English": "1-rIKZd6If5DZV-fbDi_voDjn7pQKC0eG",
    "Hall Of PPV": "1C5sKWj5kaopL6v-t4iCfZAVo1NXb69ok",
    "Hall Of Theme": "1MNq5UyQQ4EISoidkcJVutWqaJDIhV8X7",
    "OST": "1qOOomw6CWy6d1sQM1umgMAn6a9t_t-Ga",
    "Meme": {
      "Songs": "17lybq6MvDPf7j8-wLQVTLFBtEvzhaS_u",
      "Sound": "1iwG9TxBx9NlAynSIAWDzB4zKEq_9XeVL"
    },
    "Nostalgia": "1sUsqDBb0mKO4YyeRg8ZkcJoVwk6b3nFp",
    "Phonk": "1L4EwAS5gNzwjFP04T1L_D7tMwaqZmiTc"
  },
  "Assets": {
    "Chad & wojaks": "1WNzUlwTWIZ89W_q7UB-vtqV2JFtMQEdw",
    "Devine Charm": "1Fsy3GtagzZPxyBshNkBxKp-YFa90HWsD",
    "Devine Face": "1_tikNv3COJHVFuCUueDQAgY9lSgEaUOq",
    "H Ard": "1rpwKEzXo3mtqcH3QU74XiyYrYkOHlpGT",
    "Mchux": "1yVIgwyQJUxb-TyC09rGXpr3iYLLnDKnZ",
    "JwelleryAll": {
      "Anklet": "1TcJ_QCe9NpAZPK-N4YzLatv8rS8mGBf7T",
      "Bangles": "1Mn-ubDtnt6s2ThxCey2gtpPiFVoaaAds",
      "Bindi": "1r2C6e7nGxMx-iwYGA2TFRghY0f33cRr1",
      "Chain": "1FNigv7pHyimlh7BmqYlMMM8_oxbfiFnr",
      "Clothing": "1Sadg7Bmmd5TcQUvD0QQyF9DQti79TxBe",
      "EarRings": "1mYYRwQ_OTlEZDfY4frtkg8neXvwbAvqj",
      "Necklace": "1M1iOiT6Ev3n8mItGEltDepSZopagbU31",
      "Mehendi": "1OK6Tzek0H3bLwYq4N794EUwRQ7HTLfbP",
      "Tikka": "1sIYZEuNZwgO7ginPpLs0pfbmLwt_LeDa"
    }
  }
}
</script>
```

Upload_Syncer\index.html:
```html
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <title>Drive Upload Syncer</title>
  <style>
    #dropZone { border: 2px dashed #aaa; padding: 20px; margin-top: 10px; cursor: pointer; }
    #dropZone.dragover { background-color: #eee; }
    progress { width: 100%; margin-top: 10px; }
    select { display: block; margin-top: 5px; }
  </style>
</head>
<body>
  <h1>Upload Files to Drive</h1>
  <div id="folderDropdown"></div>
  <div id="dropZone">Drop files here or click to select</div>
  <input type="file" id="file" multiple style="margin-top: 10px;">
  <button onclick="uploadFiles()">Upload</button>
  <progress id="progressBar" value="0" max="100"></progress>
  <div id="status"></div>
</body>
<script>
let folderConfig = {};
let selectedFolderId = null;
google.script.run.withSuccessHandler(htmlContent => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const jsonData = doc.getElementById('folderData').textContent;
  folderConfig = JSON.parse(jsonData);
  buildDropdown('folderDropdown', folderConfig);
}).getFolderConfigHtml();
function getNestedObj(obj, path) {
  return path.reduce((acc, key) => (acc && acc[key] ? acc[key] : null), obj);
}
function buildDropdown(containerId, obj, path=[]) {
  const container = document.getElementById(containerId);
  const select = document.createElement('select');
  select.innerHTML = '<option value="">--Select Folder--</option>';
  for (const key in obj) select.innerHTML += `<option value="${key}">${key}</option>`;
  container.appendChild(select);
  select.onchange = function() {
    const existing = Array.from(container.querySelectorAll('select'));
    const index = existing.indexOf(select);
    existing.slice(index+1).forEach(e => e.remove());
    const val = select.value;
    if (!val) { selectedFolderId = null; return; }
    const newPath = [...path, val];
    const nextObj = getNestedObj(folderConfig, newPath);
    if (typeof nextObj === 'string') {
      selectedFolderId = nextObj;
      console.log("Selected folder ID:", selectedFolderId);
    } else if (typeof nextObj === 'object') {
      buildDropdown(containerId, nextObj, newPath);
    }
  }
}
function uploadFiles(files=null) {
  const filesToUpload = files || document.getElementById('file').files;
  if (!selectedFolderId) { alert("Please select a folder!"); return; }
  if (!filesToUpload.length) { alert("Select at least one file!"); return; }
  const names = Array.from(filesToUpload).map(f => f.name).join('\n');
  if (!confirm("Upload these files?\n" + names)) return;
  const progress = document.getElementById('progressBar');
  let uploaded = 0;
  for (let f of filesToUpload) {
    const reader = new FileReader();
    reader.onload = function(e) {
      google.script.run.withSuccessHandler(msg => {
        document.getElementById('status').innerHTML += `<p>${msg}</p>`;
        uploaded++;
        progress.value = (uploaded / filesToUpload.length) * 100;
      }).uploadFile(f.name, e.target.result, f.type, selectedFolderId);
    };
    reader.readAsDataURL(f);
  }
}
const dropZone = document.getElementById('dropZone');
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
dropZone.ondragleave = (e) => { dropZone.classList.remove('dragover'); };
dropZone.ondrop = (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); uploadFiles(e.dataTransfer.files); };
dropZone.onclick = () => document.getElementById('file').click();
</script>
</html>
```

