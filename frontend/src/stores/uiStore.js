import { create } from 'zustand';

export const useUiStore = create(set => ({
  // popup modals: null | 'SHOP' | 'BASE' | 'GALLERY' | 'STATS' | 'CREW' | 'PRESTIGE' | 'BOUNTIES'
  popup: null,
  settingsOpen: false,
  itemsOpen: false,
  leveling: false,

  // auth modal
  authOpen: false,
  authTab: 'login',   // 'login' | 'register'

  // guest save-progress prompts (null | '3min' | '30min')
  guestPrompt: null,

  // lootbox opening flow
  // null | { phase: 'confirm'|'rolling'|'reveal', rarity, reward }
  lootbox: null,
  openLootboxFlow:  (rarity)  => set({ lootbox: { phase: 'confirm', rarity, reward: null } }),
  closeLootboxFlow: ()        => set({ lootbox: null }),
  startLootboxRoll: (reward)  => set(s => ({ lootbox: { ...s.lootbox, phase: 'rolling', reward } })),
  revealLootbox:    ()        => set(s => ({ lootbox: { ...s.lootbox, phase: 'reveal' } })),

  // drop announcements (toast queue)
  toasts: [],

  setPopup:      popup      => set({ popup }),
  closePopup:    ()         => set({ popup: null }),
  setSettings:   open       => set({ settingsOpen: open }),
  setItems:      open       => set({ itemsOpen: open }),
  setLeveling:   leveling   => set({ leveling }),

  openAuth:  (tab = 'login') => set({ authOpen: true, authTab: tab }),
  closeAuth: ()               => set({ authOpen: false }),
  setAuthTab:(tab)            => set({ authTab: tab }),

  showGuestPrompt: (which) => set({ guestPrompt: which }),
  hideGuestPrompt: ()      => set({ guestPrompt: null }),

  addToast(toast) {
    const id = Date.now() + Math.random();
    set(s => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000);
  },
  removeToast(id) {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
  },
}));
