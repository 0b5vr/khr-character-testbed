import { convertVRMToKHRCharacter } from '../converter/index.ts';
import './style.css';

const inputFile = document.getElementById('input-file');
const labelDnd = document.getElementById('label-dnd');
const spanDndMeta = document.getElementById('span-dnd-meta');
const buttonConvert = document.getElementById('button-convert');
const aDownload = document.getElementById('a-download');
const textareaLog = document.getElementById('textarea-log');
const checkboxAutoVisibility = document.getElementById('checkbox-auto-visibility');

let selectedFile: File | null = null;
let downloadUrl: string | null = null;

function appendLog(message: string): void {
  const timestamp = new Date().toLocaleTimeString();
  textareaLog.value += `[${timestamp}] ${message}\n`;
  textareaLog.scrollTop = textareaLog.scrollHeight;
}

function clearDownload(): void {
  if (downloadUrl) {
    URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
  }

  aDownload.removeAttribute('href');
  aDownload.removeAttribute('download');
}

function setSelectedFile(file: File | null): void {
  selectedFile = file;
  clearDownload();

  if (!file) {
    spanDndMeta.textContent = 'No file selected';
    buttonConvert.disabled = true;
    return;
  }

  spanDndMeta.textContent = file.name;
  buttonConvert.disabled = false;
}

function outputFileName(inputName: string): string {
  const name = inputName.replace(/\.(vrm|glb)$/i, '');
  return `${name}.khr-character.glb`;
}

function convert(input: Uint8Array): void {
  const { glb } = convertVRMToKHRCharacter(input, {
    autoVisibility: checkboxAutoVisibility.checked,
    verboseHandler: appendLog,
  });
  const blob = new Blob([glb], { type: 'model/gltf-binary' });
  downloadUrl = URL.createObjectURL(blob);

  aDownload.href = downloadUrl;
  aDownload.download = outputFileName(selectedFile?.name ?? 'output.glb');
}

inputFile.addEventListener('change', () => {
  setSelectedFile(inputFile.files?.[0] ?? null);
});

labelDnd.addEventListener('dragover', (event) => {
  event.preventDefault();
});

labelDnd.addEventListener('drop', (event) => {
  event.preventDefault();
  setSelectedFile(event.dataTransfer?.files[0] ?? null);
});

buttonConvert.addEventListener('click', async () => {
  if (!selectedFile) return;

  clearDownload();
  buttonConvert.disabled = true;
  appendLog('Converting...');

  try {
    const input = await selectedFile.arrayBuffer();
    convert(new Uint8Array(input));
    appendLog('Conversion successful');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog(message);
    appendLog('Conversion failed');
  } finally {
    buttonConvert.disabled = selectedFile == null;
  }
});

window.addEventListener('beforeunload', clearDownload);
