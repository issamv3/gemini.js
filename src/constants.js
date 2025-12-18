export const EP = {
  GOOGLE: 'https://www.google.com',
  INIT: 'https://gemini.google.com/app',
  STREAM: 'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate',
  ROTATE: 'https://accounts.google.com/RotateCookies',
  UPLOAD: 'https://content-push.googleapis.com/upload',
  BATCH: 'https://gemini.google.com/_/BardChatUi/data/batchexecute'
};

export const RPC = {
  LIST_CONV: 'MaZiqc',
  READ_CONV: 'hNvQHb',
  LIST_GEMS: 'CNgdBe',
  CREATE_GEM: 'oMH3Zd',
  UPDATE_GEM: 'kHv0Vd',
  DELETE_GEM: 'UXcSJb'
};

export const HD = {
  GEMINI: {
    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    'Host': 'gemini.google.com',
    'Origin': 'https://gemini.google.com',
    'Referer': 'https://gemini.google.com/',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 16; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
    'X-Same-Domain': '1'
  },
  ROTATE: { 'Content-Type': 'application/json' },
  UPLOAD: { 'Push-ID': 'feeds/mcudyrk2a4khkz' }
};

export const Model = {
  DEFAULT: { name: 'unspecified', headers: {}, adv: false },
  FLASH_3: {
  name: 'gemini-3.0-flash',
  headers: { 'x-goog-ext-525001261-jspb': '[1,null,null,null,"56fdd199312815e2",null,null,0,[4],null,null,2]' },
  adv: false
  },
  PRO_3: {
    name: 'gemini-3.0-pro',
    headers: { 'x-goog-ext-525001261-jspb': '[1,null,null,null,"9d8ca3786ebdfbea",null,null,0,[4],null,null,2]' },
    adv: false
  },
  PRO_25: {
    name: 'gemini-2.5-pro',
    headers: { 'x-goog-ext-525001261-jspb': '[1,null,null,null,"4af6c7f5da75d65d",null,null,0,[4],null,null,2]' },
    adv: false
  },
  FLASH_25: {
    name: 'gemini-2.5-flash',
    headers: { 'x-goog-ext-525001261-jspb': '[1,null,null,null,"9ec249fc9ad08861",null,null,0,[4],null,null,2]' },
    adv: false
  }
};

export const ERR = {
  TIMEOUT: 1013,
  LIMIT: 1037,
  MODEL: 1050,
  HEADER: 1052,
  BLOCKED: 1060
};

export const getModel = (name) => {
  for (const k in Model) {
    if (Model[k].name === name) return Model[k];
  }
  throw new Error(`Unknown model: ${name}`);
};

export const customModel = (cfg) => {
  if (!cfg.name || !cfg.headers) throw new Error('name and headers required');
  return { name: cfg.name, headers: cfg.headers, adv: false };
};
