const form = document.querySelector("#designForm");
const emptyState = document.querySelector("#emptyState");
const statusLine = document.querySelector("#status");
const historyList = document.querySelector("#historyList");
const promptPreview = document.querySelector("#promptPreview");
const resultGrid = document.querySelector("#resultGrid");
const referenceImageInput = document.querySelector("#referenceImage");
const referencePreview = document.querySelector("#referencePreview");
const referenceThumb = document.querySelector("#referenceThumb");
const referenceName = document.querySelector("#referenceName");
const clearReference = document.querySelector("#clearReference");
const referenceDropzone = document.querySelector("#referenceDropzone");
const modeInputs = Array.from(document.querySelectorAll('input[name="generationMode"]'));

const fields = {
  size: document.querySelector("#size"),
  quality: document.querySelector("#quality"),
  count: document.querySelector("#count"),
  primaryColor: document.querySelector("#primaryColor"),
  secondaryColor: document.querySelector("#secondaryColor"),
  backgroundColor: document.querySelector("#backgroundColor"),
  keywords: document.querySelector("#keywords"),
  usage: document.querySelector("#usage"),
  prompt: document.querySelector("#prompt"),
  density: document.querySelector("#density"),
  brightness: document.querySelector("#brightness"),
  contrast: document.querySelector("#contrast"),
  saturation: document.querySelector("#saturation")
};

const outputs = {
  density: document.querySelector("#densityValue"),
  brightness: document.querySelector("#brightnessValue"),
  contrast: document.querySelector("#contrastValue"),
  saturation: document.querySelector("#saturationValue")
};

const zh = {
  emptyHistory: "还没有生成记录。",
  generating: "正在生成图像，这可能需要一点时间...",
  failed: "生成失败，请稍后重试。",
  generated: "已生成",
  images: "张图像。",
  randomReady: "已填入一组随机灵感，可以直接生成。",
  exportFirst: "请先生成一张图像再导出。",
  readError: "无法读取当前图片。",
  exported: "PNG 已导出。",
  useImage: "切换到这张生成图",
  download: "下载",
  use: "选用",
  referenceLoaded: "已添加参考图，可以进行图生图。",
  referenceCleared: "已移除参考图。",
  referenceTooLarge: "参考图不要超过 25MB。",
  referenceReadFailed: "参考图读取失败，请换一张图试试。",
  referenceTypeError: "请选择图片文件。"
};

const promptIdeas = [
  "生成一张潮流抽象桌垫图案，横向构图，层次丰富，不要文字和 Logo。",
  "像艺术展周边一样有设计感，使用几何切片、斜向色块和细线。",
  "保留桌垫中央可用空间，边缘有网格、像素点和轨道线。",
  "有音乐可视化的节奏感，波形线条和彩色噪点，整体不要太暗。",
  "Y2K 灵感桌垫，气泡、星星、柔和网格、金属感贴片，不要幼稚。"
];

let history = [];
let activeImageId = null;
let referenceImageData = "";

function getGenerationMode() {
  return modeInputs.find((input) => input.checked)?.value || "text2img";
}

function getInput() {
  const mode = getGenerationMode();
  return {
    style: "custom",
    styleText: "",
    primaryColor: fields.primaryColor.value,
    secondaryColor: fields.secondaryColor.value,
    backgroundColor: fields.backgroundColor.value,
    keywords: fields.keywords.value,
    mode,
    usage: mode === "img2img" ? "图生图" : "文生图",
    prompt: fields.prompt.value,
    density: Number(fields.density.value),
    count: Number(fields.count.value),
    size: fields.size.value,
    quality: fields.quality.value,
    referenceImage: mode === "img2img" ? referenceImageData : ""
  };
}

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.classList.toggle("error", isError);
}

function updateRangeOutputs() {
  outputs.density.value = fields.density.value;
  outputs.brightness.value = fields.brightness.value;
  outputs.contrast.value = fields.contrast.value;
  outputs.saturation.value = fields.saturation.value;
}

function renderResults() {
  resultGrid.innerHTML = "";
  emptyState.hidden = history.length > 0;

  history.slice(0, 8).forEach((item) => {
    const card = document.createElement("article");
    card.className = "result-card";
    const image = document.createElement("img");
    image.className = "result-image";
    image.src = item.url;
    image.alt = "生成的图像";
    image.style.filter = [`brightness(${fields.brightness.value}%)`, `contrast(${fields.contrast.value}%)`, `saturate(${fields.saturation.value}%)`].join(" ");
    const actions = document.createElement("div");
    actions.className = "result-actions";
    const useButton = document.createElement("button");
    useButton.type = "button";
    useButton.className = "small-btn";
    useButton.textContent = zh.use;
    useButton.addEventListener("click", () => setActiveImage(item.id));
    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.className = "small-btn";
    downloadButton.textContent = zh.download;
    downloadButton.addEventListener("click", () => exportImage(item));
    actions.append(useButton, downloadButton);
    card.append(image, actions);
    resultGrid.append(card);
  });
}

function setActiveImage(id) {
  const image = history.find((item) => item.id === id);
  if (!image) return;
  activeImageId = id;
  promptPreview.textContent = image.prompt;
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  if (!history.length) {
    const empty = document.createElement("p");
    empty.className = "status-line-inline";
    empty.textContent = zh.emptyHistory;
    historyList.append(empty);
    return;
  }
  history.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `history-item${item.id === activeImageId ? " active" : ""}`;
    button.style.backgroundImage = `url("${item.url}")`;
    button.setAttribute("aria-label", zh.useImage);
    button.addEventListener("click", () => setActiveImage(item.id));
    historyList.append(button);
  });
}

async function generateDesign(event) {
  event.preventDefault();
  if (getGenerationMode() === "img2img" && !referenceImageData) {
    setStatus("请先上传参考图再进行图生图。", true);
    return;
  }
  form.classList.add("is-loading");
  setStatus(zh.generating);
  try {
    const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(getInput()) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || zh.failed);
    const nextImages = result.images.map((image) => ({ ...image, prompt: result.revisedPrompt || result.prompt }));
    history = [...nextImages, ...history].slice(0, 12);
    activeImageId = nextImages[0].id;
    promptPreview.textContent = nextImages[0].prompt;
    renderResults();
    renderHistory();
    setStatus(`${zh.generated} ${nextImages.length} ${zh.images}`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    form.classList.remove("is-loading");
  }
}

function randomize() {
  fields.prompt.value = promptIdeas[Math.floor(Math.random() * promptIdeas.length)];
  fields.density.value = String(35 + Math.floor(Math.random() * 50));
  updateRangeOutputs();
  setStatus(zh.randomReady);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(zh.readError));
    image.src = url;
  });
}

async function exportImage(item) {
  if (!item) return setStatus(zh.exportFirst, true);
  try {
    const image = await loadImage(item.url);
    const [width, height] = fields.size.value.split("x").map(Number);
    const canvas = document.createElement("canvas");
    canvas.width = width || 2048;
    canvas.height = height || 1152;
    const context = canvas.getContext("2d");
    context.filter = [`brightness(${fields.brightness.value}%)`, `contrast(${fields.contrast.value}%)`, `saturate(${fields.saturation.value}%)`].join(" ");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const link = document.createElement("a");
    link.download = `deskmat-pattern-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setStatus(zh.exported);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function exportActiveImage() {
  exportImage(history.find((item) => item.id === activeImageId));
}

function handleReferenceFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return setStatus(zh.referenceTypeError, true);
  if (file.size > 25 * 1024 * 1024) return setStatus(zh.referenceTooLarge, true);
  setStatus("正在处理参考图...");
  compressReferenceImage(file).then((dataUrl) => {
    referenceImageData = dataUrl;
    referenceThumb.src = dataUrl;
    referenceName.textContent = file.name || "粘贴的图片";
    referencePreview.hidden = false;
    setStatus(zh.referenceLoaded);
  }).catch((error) => setStatus(error.message, true));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(zh.referenceReadFailed));
    reader.readAsDataURL(file);
  });
}

function loadReferenceImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(zh.referenceReadFailed));
    image.src = url;
  });
}

async function compressReferenceImage(file) {
  const originalUrl = await readFileAsDataUrl(file);
  const image = await loadReferenceImage(originalUrl);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

form.addEventListener("submit", generateDesign);
document.querySelector("#randomize").addEventListener("click", randomize);
document.querySelector("#exportPng").addEventListener("click", exportActiveImage);
referenceImageInput.addEventListener("change", () => handleReferenceFile(referenceImageInput.files?.[0]));
referenceDropzone.addEventListener("dragover", (event) => { event.preventDefault(); referenceDropzone.classList.add("is-dragover"); });
referenceDropzone.addEventListener("dragleave", () => referenceDropzone.classList.remove("is-dragover"));
referenceDropzone.addEventListener("drop", (event) => { event.preventDefault(); referenceDropzone.classList.remove("is-dragover"); handleReferenceFile(event.dataTransfer.files?.[0]); });
document.addEventListener("paste", (event) => { const file = Array.from(event.clipboardData?.files || []).find((item) => item.type.startsWith("image/")); if (file) handleReferenceFile(file); });
clearReference.addEventListener("click", () => { referenceImageData = ""; referenceImageInput.value = ""; referenceThumb.removeAttribute("src"); referenceName.textContent = ""; referencePreview.hidden = true; setStatus(zh.referenceCleared); });
["density", "brightness", "contrast", "saturation"].forEach((key) => fields[key].addEventListener("input", () => { updateRangeOutputs(); renderResults(); }));
fields.prompt.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") form.requestSubmit(); });
updateRangeOutputs();
renderHistory();
