import axios from 'axios';

const api = axios.create({
  // In production VITE_API_URL is set to the Railway backend URL.
  // In dev the Vite proxy rewrites /api → localhost:3001 so we keep '/api'.
  baseURL: (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : '') + '/api',
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
  email:      (email, pw, register) => api.post('/auth/email', { email, password: pw, register }),
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

/** Call after login to attach JWT to all future requests (for cross-domain Railway). */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export default api;
