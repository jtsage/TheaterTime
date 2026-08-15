var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _createPiperPhonemize, _modelConfig, _ort, _ortSession, _progressCallback, _wasmPaths, _logger, _TtsSession_instances, setupWasmPaths_fn;
const HF_BASE = "https://huggingface.co/diffusionstudio/piper-voices/resolve/main";
const ONNX_BASE = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";
const PATH_MAP = {
  "cortana": "en_US-cortana-medium/cortana.onnx",
  "en_US-hfc_female-medium": "en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx",
  "en_US-hfc_male-medium": "en/en_US/hfc_male/medium/en_US-hfc_male-medium.onnx",
  "glados": "en_US-glados-medium/glados.onnx",
  "kronk-medium": "en_US-kronk-medium/kronk-medium.onnx"
};
async function writeBlob(url, blob) {
  if (!url.match("https://huggingface.co")) return;
  try {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle("piper", {
      create: true
    });
    const path = url.split("/").at(-1);
    const file = await dir.getFileHandle(path, { create: true });
    const writable = await file.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (e) {
    console.error(e);
  }
}
async function removeBlob(url) {
  try {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle("piper");
    const path = url.split("/").at(-1);
    const file = await dir.getFileHandle(path);
    await file.remove();
  } catch (e) {
    console.error(e);
  }
}
async function readBlob(url) {
  if (!url.match("https://huggingface.co")) return;
  try {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle("piper", {
      create: true
    });
    const path = url.split("/").at(-1);
    const file = await dir.getFileHandle(path);
    return await file.getFile();
  } catch (e) {
    return void 0;
  }
}
async function fetchBlob(url, callback) {
  var _a;
  const res = await fetch(url);
  const reader = (_a = res.body) == null ? void 0 : _a.getReader();
  const contentLength = +(res.headers.get("Content-Length") ?? 0);
  let receivedLength = 0;
  let chunks = [];
  while (reader) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
    receivedLength += value.length;
    callback == null ? void 0 : callback({
      url,
      total: contentLength,
      loaded: receivedLength
    });
  }
  return new Blob(chunks, { type: res.headers.get("Content-Type") ?? void 0 });
}
function pcm2wav(buffer, numChannels, sampleRate) {
  const bufferLength = buffer.length;
  const headerLength = 44;
  const view = new DataView(new ArrayBuffer(bufferLength * numChannels * 2 + headerLength));
  view.setUint32(0, 1179011410, true);
  view.setUint32(4, view.buffer.byteLength - 8, true);
  view.setUint32(8, 1163280727, true);
  view.setUint32(12, 544501094, true);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, numChannels * 2 * sampleRate, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 1635017060, true);
  view.setUint32(40, 2 * bufferLength, true);
  let p = headerLength;
  for (let i = 0; i < bufferLength; i++) {
    const v = buffer[i];
    if (v >= 1)
      view.setInt16(p, 32767, true);
    else if (v <= -1)
      view.setInt16(p, -32768, true);
    else
      view.setInt16(p, v * 32768 | 0, true);
    p += 2;
  }
  return view.buffer;
}
const DEFAULT_WASM_PATHS = {
  onnxWasm: ONNX_BASE,
  piperData: `${WASM_BASE}.data`,
  piperWasm: `${WASM_BASE}.wasm`
};
const _TtsSession = class _TtsSession {
  constructor({
    voiceId,
    progress,
    logger,
    wasmPaths,
    allowLocalModels,
    fallbackStrategy
  }) {
    __privateAdd(this, _TtsSession_instances);
    __publicField(this, "ready", false);
    __publicField(this, "voiceId", "en_US-hfc_female-medium");
    __publicField(this, "waitReady", false);
    __privateAdd(this, _createPiperPhonemize);
    __privateAdd(this, _modelConfig);
    __privateAdd(this, _ort);
    __privateAdd(this, _ortSession);
    __privateAdd(this, _progressCallback);
    __privateAdd(this, _wasmPaths, DEFAULT_WASM_PATHS);
    // @ts-ignore-next-line
    __privateAdd(this, _logger);
    var _a;
    if (_TtsSession._instance) {
      logger == null ? void 0 : logger("Reusing session for TTS!");
      _TtsSession._instance.voiceId = voiceId ?? _TtsSession._instance.voiceId;
      __privateSet(_TtsSession._instance, _progressCallback, progress ?? __privateGet(_TtsSession._instance, _progressCallback));
      return _TtsSession._instance;
    }
    logger == null ? void 0 : logger("New session");
    __privateSet(this, _logger, logger);
    this.voiceId = voiceId;
    __privateSet(this, _progressCallback, progress);
    this.waitReady = this.init(allowLocalModels, fallbackStrategy);
    __privateSet(this, _wasmPaths, wasmPaths ?? DEFAULT_WASM_PATHS);
    (_a = __privateGet(this, _logger)) == null ? void 0 : _a.call(this, `Loaded WASMPaths at: ${JSON.stringify(__privateGet(this, _wasmPaths))}`);
    _TtsSession._instance = this;
    return this;
  }
  static async create(options) {
    const session = new _TtsSession(options);
    await session.waitReady;
    return session;
  }
  async init(allowLocalModels, fallbackStrategy) {
    var _a, _b, _c, _d;
    try {
      const { createPiperPhonemize } = await import("./piper.js");
      __privateSet(this, _createPiperPhonemize, createPiperPhonemize);
      const ortModule = await import("onnxruntime-web");
      __privateSet(this, _ort, ortModule.default || ortModule);
      __privateGet(this, _ort).env.allowLocalModels = allowLocalModels ?? true;
      __privateGet(this, _ort).env.wasm.numThreads = navigator.hardwareConcurrency;
      await __privateMethod(this, _TtsSession_instances, setupWasmPaths_fn).call(this, fallbackStrategy);
      const path = PATH_MAP[this.voiceId];
      if (!path) {
        throw new Error(`Voice ID '${this.voiceId}' not found in PATH_MAP`);
      }
      (_a = __privateGet(this, _logger)) == null ? void 0 : _a.call(this, `Loading model config for voice: ${this.voiceId}`);
      const modelConfigBlob = await getBlob(`${HF_BASE}/${path}.json`);
      __privateSet(this, _modelConfig, JSON.parse(await modelConfigBlob.text()));
      (_b = __privateGet(this, _logger)) == null ? void 0 : _b.call(this, `Loading model for voice: ${this.voiceId}`);
      const modelBlob = await getBlob(
        `${HF_BASE}/${path}`,
        __privateGet(this, _progressCallback)
      );
      __privateSet(this, _ortSession, await __privateGet(this, _ort).InferenceSession.create(
        await modelBlob.arrayBuffer()
      ));
      (_c = __privateGet(this, _logger)) == null ? void 0 : _c.call(this, `Successfully initialized TTS session for voice: ${this.voiceId}`);
      this.ready = true;
    } catch (error) {
      (_d = __privateGet(this, _logger)) == null ? void 0 : _d.call(this, `Failed to initialize TTS session: ${error}`);
      throw new Error(`TTS Session initialization failed: ${error}`);
    }
  }
  async predict(text) {
    await this.waitReady;
    const input = JSON.stringify([{ text: text.trim() }]);
    const phonemeIds = await new Promise(async (resolve) => {
      const module = await __privateGet(this, _createPiperPhonemize).call(this, {
        print: (data) => {
          resolve(JSON.parse(data).phoneme_ids);
        },
        printErr: (message) => {
          throw new Error(message);
        },
        locateFile: (url) => {
          if (url.endsWith(".wasm")) return __privateGet(this, _wasmPaths).piperWasm;
          if (url.endsWith(".data")) return __privateGet(this, _wasmPaths).piperData;
          return url;
        }
      });
      module.callMain([
        "-l",
        __privateGet(this, _modelConfig).espeak.voice,
        "--input",
        input,
        "--espeak_data",
        "/espeak-ng-data"
      ]);
    });
    const speakerId = 0;
    const sampleRate = __privateGet(this, _modelConfig).audio.sample_rate;
    const noiseScale = __privateGet(this, _modelConfig).inference.noise_scale;
    const lengthScale = __privateGet(this, _modelConfig).inference.length_scale;
    const noiseW = __privateGet(this, _modelConfig).inference.noise_w;
    const session = __privateGet(this, _ortSession);
    const feeds = {
      input: new (__privateGet(this, _ort)).Tensor("int64", phonemeIds, [1, phonemeIds.length]),
      input_lengths: new (__privateGet(this, _ort)).Tensor("int64", [phonemeIds.length]),
      scales: new (__privateGet(this, _ort)).Tensor("float32", [
        noiseScale,
        lengthScale,
        noiseW
      ])
    };
    if (Object.keys(__privateGet(this, _modelConfig).speaker_id_map).length) {
      Object.assign(feeds, {
        sid: new (__privateGet(this, _ort)).Tensor("int64", [speakerId])
      });
    }
    const {
      output: { data: pcm }
    } = await session.run(feeds);
    return new Blob([pcm2wav(pcm, 1, sampleRate)], {
      type: "audio/x-wav"
    });
  }
};
_createPiperPhonemize = new WeakMap();
_modelConfig = new WeakMap();
_ort = new WeakMap();
_ortSession = new WeakMap();
_progressCallback = new WeakMap();
_wasmPaths = new WeakMap();
_logger = new WeakMap();
_TtsSession_instances = new WeakSet();
setupWasmPaths_fn = async function(fallbackStrategy) {
  var _a, _b, _c, _d, _e;
  const strategy = fallbackStrategy ?? "cdn";
  try {
    if (strategy === "local") {
      __privateGet(this, _ort).env.wasm.wasmPaths = __privateGet(this, _wasmPaths).onnxWasm;
      (_a = __privateGet(this, _logger)) == null ? void 0 : _a.call(this, "Using local WASM paths");
      return;
    }
    if (strategy === "cdn") {
      __privateGet(this, _ort).env.wasm.wasmPaths = ONNX_BASE;
      (_b = __privateGet(this, _logger)) == null ? void 0 : _b.call(this, "Using CDN WASM paths");
      return;
    }
    if (strategy === "auto") {
      try {
        const testResponse = await fetch(`${ONNX_BASE}ort-wasm.wasm`, { method: "HEAD" });
        if (testResponse.ok) {
          __privateGet(this, _ort).env.wasm.wasmPaths = ONNX_BASE;
          (_c = __privateGet(this, _logger)) == null ? void 0 : _c.call(this, "CDN available, using CDN WASM paths");
        } else {
          throw new Error("CDN not available");
        }
      } catch (cdnError) {
        (_d = __privateGet(this, _logger)) == null ? void 0 : _d.call(this, `CDN failed (${cdnError}), falling back to local WASM paths`);
        __privateGet(this, _ort).env.wasm.wasmPaths = __privateGet(this, _wasmPaths).onnxWasm;
      }
      return;
    }
  } catch (error) {
    (_e = __privateGet(this, _logger)) == null ? void 0 : _e.call(this, `WASM path setup failed: ${error}`);
    __privateGet(this, _ort).env.wasm.wasmPaths = __privateGet(this, _wasmPaths).onnxWasm;
  }
};
__publicField(_TtsSession, "WASM_LOCATIONS", DEFAULT_WASM_PATHS);
__publicField(_TtsSession, "_instance", null);
let TtsSession = _TtsSession;
async function predict(config, callback) {
  const session = new TtsSession({
    voiceId: config.voiceId,
    progress: callback
  });
  return session.predict(config.text);
}
async function getBlob(url, callback, maxRetries = 3) {
  const realFile = url.split('/').at(-1);
  const response = await fetch(`./${realFile}`)
  return response.blob()

  /*console.log(fetch(`voice/${realFile}`))
  let blob = await readBlob(url);
  if (!blob) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        blob = await fetchBlob(url, callback);
        await writeBlob(url, blob);
        break;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt}/${maxRetries} failed for ${url}: ${error}`);
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1e3;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    if (!blob && lastError) {
      throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts: ${lastError.message}`);
    }
  }
  return blob;*/
}
async function download(voiceId, callback) {
  const path = PATH_MAP[voiceId];
  const urls = [`${HF_BASE}/${path}`, `${HF_BASE}/${path}.json`];
  await Promise.all(urls.map(async (url) => {
    writeBlob(url, await fetchBlob(url, url.endsWith(".onnx") ? callback : void 0));
  }));
}
async function remove(voiceId) {
  const path = PATH_MAP[voiceId];
  const urls = [`${HF_BASE}/${path}`, `${HF_BASE}/${path}.json`];
  await Promise.all(urls.map((url) => removeBlob(url)));
}
async function stored() {
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle("piper", {
    create: true
  });
  const result = [];
  for await (const name of dir.keys()) {
    const key = name.split(".")[0];
    if (name.endsWith(".onnx") && key in PATH_MAP) {
      result.push(key);
    }
  }
  return result;
}
async function flush() {
  try {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle("piper");
    await dir.remove({ recursive: true });
  } catch (e) {
    console.error(e);
  }
}
async function voices() {
  try {
    const res = await fetch(`${HF_BASE}/voices.json`);
    if (!res.ok) throw new Error("Could not retrieve voices file from huggingface");
    return Object.values(await res.json());
  } catch {
    const LOCAL_VOICES_JSON = await import("./voices_static.js");
    console.log(`Could not fetch voices.json remote ${HF_BASE}. Fetching local`);
    return Object.values(LOCAL_VOICES_JSON.default);
  }
}
export {
  HF_BASE,
  ONNX_BASE,
  PATH_MAP,
  TtsSession,
  WASM_BASE,
  download,
  flush,
  predict,
  remove,
  stored,
  voices
};
