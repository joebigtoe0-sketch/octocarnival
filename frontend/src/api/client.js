import axios from 'axios';

const api = axios.create({
  // In dev: Vite proxy forwards /api → localhost:3001/api
  // In prod: frontend Express server proxies /api → BACKEND_URL/api
  // Either way the browser just hits its own origin at /api — no VITE_API_URL needed.
  baseURL: '/api',
  withCredentials: true,
  timeout: 10000,
});

// Attach JWT from cookie automatically (cookie is httpOnly so this is just a note —
// credentials: 'include' on fetch / withCredentials on axios handles it)
api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

export const authApi = {
  google:     token       => api.post('/auth/google', { token }),
  email:      (email, pw, register, username) => api.post('/auth/email', { email, password: pw, register, username }),
  walletChallenge: walletAddress => api.post('/auth/wallet/challenge', { walletAddress }),
  walletLogin: data => api.post('/auth/wallet/login', data),
  logout:     ()          => api.post('/auth/logout'),
  guestMerge: saveData    => api.post('/auth/guest-merge', { saveData }),
  me:         ()          => api.get('/auth/me'),
};

export const gameApi = {
  loadState:  ()          => api.get('/game/state'),
  loadBlob:   ()          => api.get('/game/blob'),
  saveState:  data        => api.post('/game/save', data),
  npcStream:  ()          => api.get('/game/npc-stream'),
  upgradeStat:(stat)      => api.post('/game/upgrade-stat', { stat }),
  prestige:   ()          => api.post('/game/prestige'),
};

export const crewApi = {
  buy:     crewId         => api.post('/crew/buy', { crewId }),
  levelUp: crewId         => api.post('/crew/level', { crewId }),
};

export const ratsApi = {
  rob:        npcId       => api.post('/rats/rob', { npcId }),
  sell:       ()          => api.post('/rats/sell'),
  sendToBase: ()          => api.post('/rats/send-to-base'),
  equipBase:  ratId       => api.post('/rats/equip', { ratId }),
  sellBase:   ratId       => api.post('/rats/sell-base', { ratId }),
};

export const shopApi = {
  daily:  ()              => api.get('/shop/daily'),
  buy:    (itemKey, qty)  => api.post('/shop/buy', { itemKey, quantity: qty }),
};

export const mintApi = {
  check:   traits          => api.post('/mint/check', { traits }, { timeout: 30000 }),
  reserve: data            => api.post('/mint/reserve', data, { timeout: 120000 }),
  build:   data            => api.post('/mint/build', data, { timeout: 60000 }),
  confirm: data            => api.post('/mint/confirm', data, { timeout: 60000 }),
};

/** Call after login to attach JWT to all future requests (for cross-domain Railway). */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export default api;
