import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { RARITY_COLORS } from '../constants/traits.js';
import { playSound } from '../audio.js';

function fmtN(n) { return window.fmtNum ? window.fmtNum(n) : String(Math.floor(n)); }

function CoinSvg() {
  return <img src="/assets/icons/coins.png" alt="coins" style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: 3 }} />;
}

function DiamondIcon({ size = 14 }) {
  return <img src="/assets/icons/diamond.png" alt="diamonds" style={{ width: size, height: size, verticalAlign: 'middle', marginRight: 3 }} />;
}

function ShopItemIcon({ src, size = 28 }) {
  if (src && src.startsWith('/')) return <img src={src} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />;
  return <span style={{ fontSize: size * 0.7 }}>{src}</span>;
}

const SHOP_TABS = ['Consumables', 'Diamond Shop'];

// ── Consumables ────────────────────────────────────────────────────────────────
const CONSUMABLES = [
  { key: 'energy_drink',  name: 'Energy Drink',    desc: 'Instantly recharge 1 sell cooldown',   price: 250,  icon: '/assets/icons/energydrink.png',    type: 'consumable' },
  { key: 'boost_dps',    name: 'DPS Surge',        desc: '+10% Crew DPS for 10 min',            price: 500,  icon: '/assets/icons/dpssurgeboost.png',   type: 'consumable' },
  { key: 'boost_coins',  name: 'Coin Storm',       desc: '2× sell cooldown speed for 5 min',    price: 400,  icon: '/assets/icons/coinstormboost.png',  type: 'consumable' },
  { key: 'boost_click',  name: 'Iron Fist',        desc: '2× click damage for 10 min',          price: 350,  icon: '/assets/icons/ironfistboost.png',   type: 'consumable' },
  { key: 'boost_luck',   name: 'Rat Luck',         desc: '+30% Luck for 10 min',                price: 1000, icon: '/assets/icons/ratluckboost.png',    type: 'consumable' },
  { key: 'boost_speed',  name: 'Rat Speed',        desc: '+30% NPC Speed for 10 min',           price: 1000, icon: '/assets/icons/speedboost.png',      type: 'consumable' },
  { key: 'bell_uncommon', name: 'Uncommon Bell',   desc: 'Alert on Uncommon+ NPC for 5 min',    price: 300,  icon: '/assets/icons/bell.png',        type: 'consumable' },
  { key: 'bell_rare',     name: 'Rare Bell',       desc: 'Alert on Rare+ NPC for 5 min',        price: 900,  icon: '/assets/icons/bell.png',        type: 'consumable' },
  { key: 'bell_epic',     name: 'Epic Bell',       desc: 'Alert on Epic+ NPC for 5 min',        price: 2400, icon: '/assets/icons/bell.png',        type: 'consumable' },
  { key: 'swap_token',    name: 'Swap Token',      desc: 'Swap one trait slot between two rats', price: 500,  icon: '/assets/icons/swaptoken.png',   type: 'swap' },
  { key: 'card_reroll',   name: 'Card Reroll',     desc: '+1 reroll on next level-up card pick', price: 800,  icon: '/assets/icons/cardreroll.png',  type: 'reroll' },
];

// ── Diamond Shop ──────────────────────────────────────────────────────────────
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

const DIAMOND_KEY_PRICES = {
  common:    1,
  uncommon:  3,
  rare:      7,
  epic:      15,
  legendary: 30,
  mythic:    100,
};

const DIAMOND_BOX_PRICES = {
  common:    1,
  uncommon:  3,
  rare:      7,
  epic:      15,
  legendary: 30,
  mythic:    100,
};

// Extra sell slot: starts at 2 diamonds, doubles each purchase. Max 7 purchases.
const SLOT_BASE = 2;
const SLOT_MAX  = 7; // 3 start + 7 = 10 max

function slotPrice(bought) {
  return SLOT_BASE * Math.pow(2, bought);
}

export default function ShopPanel({ onClose }) {
  const [tab, setTab]       = useState('Consumables');
  const store               = useGameStore();
  const { coins, diamonds } = store;
  const sellSlotsBought     = store.sellSlotsBought || 0;
  const maxSellCharges      = store.maxSellCharges;
  const sellSlotCapped      = sellSlotsBought >= SLOT_MAX;
  const nextSellSlotPrice   = sellSlotCapped ? null : slotPrice(sellSlotsBought);

  const baseSlotsBought     = store.baseSlotsBought || 0;
  const maxBaseSlots        = store.maxBaseSlots || 3;
  const baseSlotCapped      = baseSlotsBought >= SLOT_MAX;
  const nextBaseSlotPrice   = baseSlotCapped ? null : slotPrice(baseSlotsBought);

  // ── coin purchase ──────────────────────────────────────────────────────────
  const handleBuy = (item) => {
    if (coins < item.price) return;
    playSound('coins');
    store.spendCoins(item.price);
    if (item.type === 'reroll') {
      store.addStoredReroll();
    } else {
      store.addToInventory({
        key:    item.key,
        name:   item.name,
        icon:   item.icon,
        effect: item.desc,
        type:   'consumable',
      });
    }
  };

  // ── diamond purchases ──────────────────────────────────────────────────────
  const handleBuyDiamondKey = (rarity) => {
    const price = DIAMOND_KEY_PRICES[rarity];
    if (diamonds < price) return;
    store.spendDiamonds(price);
    store.addKey(rarity);
  };

  const handleBuyDiamondBox = (rarity) => {
    const price = DIAMOND_BOX_PRICES[rarity];
    if (diamonds < price) return;
    store.spendDiamonds(price);
    store.addLootbox(rarity);
  };

  const handleBuySellSlot = () => {
    if (sellSlotCapped || diamonds < nextSellSlotPrice) return;
    store.spendDiamonds(nextSellSlotPrice);
    store.incMaxSellCharges();
  };

  const handleBuyBaseSlot = () => {
    if (baseSlotCapped || diamonds < nextBaseSlotPrice) return;
    store.spendDiamonds(nextBaseSlotPrice);
    store.incMaxBaseSlots();
  };

  return (
    <div className="popup__scrim" onClick={onClose}>
      <div className="popup" onClick={e => e.stopPropagation()}>
        <div className="popup__hd">
          <div className="popup__title">SHOP</div>
          <button className="popup__close" onClick={() => { playSound('uiClick'); onClose(); }}>✕</button>
        </div>

        {/* Balances */}
        <div className="shop-balances">
          <span className="shop-balance shop-balance--coins">
            <CoinSvg />{fmtN(coins)}
          </span>
          <span className="shop-balance shop-balance--diamonds"><DiamondIcon />{fmtN(diamonds)}</span>
        </div>

        <div className="shop-tabs">
          {SHOP_TABS.map(t => (
            <button
              key={t}
              className={`shop-tab${tab === t ? ' shop-tab--active' : ''}${t === 'Diamond Shop' ? ' shop-tab--diamond' : ''}`}
              onClick={() => { playSound('uiClick'); setTab(t); }}
            >{t}</button>
          ))}
        </div>

        <div className="popup__body" style={{ display: 'block', overflowY: 'auto' }}>

          {/* ── CONSUMABLES ───────────────────────────────────────────────── */}
          {tab === 'Consumables' && (
            <div className="shop-items-grid">
              {CONSUMABLES.map(item => {
                const canAfford = coins >= item.price;
                return (
                  <div key={item.key} className="shop-item plate">
                    <div className="shop-item__icon"><ShopItemIcon src={item.icon} /></div>
                    <div className="shop-item__info">
                      <div className="shop-item__name">{item.name}</div>
                      <div className="shop-item__desc">{item.desc}</div>
                    </div>
                    <button className="hirebtn" disabled={!canAfford} onClick={() => handleBuy(item)}>
                      <CoinSvg />{fmtN(item.price)}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── DIAMOND SHOP ──────────────────────────────────────────────── */}
          {tab === 'Diamond Shop' && (
            <>
              <p className="shop-note shop-note--diamond">
                <DiamondIcon size={13} />Diamonds are premium currency — earn them in-game or purchase them.
              </p>

              {/* Extra Sell Slot */}
              <div className="shop-diamond-section">
                <div className="shop-diamond-section__title">UPGRADES</div>
                <div className="shop-items-grid">
                  <div className="shop-item plate">
                    <div className="shop-item__icon"><ShopItemIcon src="/assets/icons/extrasellslot.png" /></div>
                    <div className="shop-item__info">
                      <div className="shop-item__name">Extra Sell Slot</div>
                      <div className="shop-item__desc">
                        +1 max sell charge (permanent)<br />
                        <span style={{ color: '#88eeff' }}>{maxSellCharges}/10 slots</span>
                        {sellSlotCapped && <span style={{ color: '#f6a020' }}> — MAX</span>}
                      </div>
                    </div>
                    <button
                      className="hirebtn hirebtn--diamond"
                      disabled={sellSlotCapped || diamonds < nextSellSlotPrice}
                      onClick={handleBuySellSlot}
                    >
                      {sellSlotCapped ? 'MAX' : <><DiamondIcon />{nextSellSlotPrice}</>}
                    </button>
                  </div>

                  <div className="shop-item plate">
                    <div className="shop-item__icon"><ShopItemIcon src="/assets/icons/extrabaselot.png" /></div>
                    <div className="shop-item__info">
                      <div className="shop-item__name">Extra Base Slot</div>
                      <div className="shop-item__desc">
                        +1 rat slot in your base (permanent)<br />
                        <span style={{ color: '#88eeff' }}>{maxBaseSlots}/10 slots</span>
                        {baseSlotCapped && <span style={{ color: '#f6a020' }}> — MAX</span>}
                      </div>
                    </div>
                    <button
                      className="hirebtn hirebtn--diamond"
                      disabled={baseSlotCapped || diamonds < nextBaseSlotPrice}
                      onClick={handleBuyBaseSlot}
                    >
                      {baseSlotCapped ? 'MAX' : <><DiamondIcon />{nextBaseSlotPrice}</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Keys */}
              <div className="shop-diamond-section">
                <div className="shop-diamond-section__title">KEYS</div>
                <div className="shop-items-grid">
                  {RARITIES.map(rarity => {
                    const price = DIAMOND_KEY_PRICES[rarity];
                    const canAfford = diamonds >= price;
                    const color = RARITY_COLORS[rarity] || '#aaa';
                    return (
                      <div key={rarity} className={`shop-item plate shop-item--${rarity}`}>
                        <div className="shop-item__icon"><ShopItemIcon src={`/assets/icons/key_${rarity}.png`} /></div>
                        <div className="shop-item__info">
                          <div className="shop-item__name" style={{ color }}>{rarity.toUpperCase()} KEY</div>
                          <div className="shop-item__desc">Opens a {rarity} lootbox</div>
                        </div>
                        <button
                          className="hirebtn hirebtn--diamond"
                          disabled={!canAfford}
                          onClick={() => handleBuyDiamondKey(rarity)}
                        ><DiamondIcon />{price}</button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lootboxes */}
              <div className="shop-diamond-section">
                <div className="shop-diamond-section__title">LOOTBOXES</div>
                <div className="shop-items-grid">
                  {RARITIES.map(rarity => {
                    const price = DIAMOND_BOX_PRICES[rarity];
                    const canAfford = diamonds >= price;
                    const color = RARITY_COLORS[rarity] || '#aaa';
                    return (
                      <div key={rarity} className={`shop-item plate shop-item--${rarity}`}>
                        <div className="shop-item__icon"><ShopItemIcon src={`/assets/icons/chest_${rarity}.png`} /></div>
                        <div className="shop-item__info">
                          <div className="shop-item__name" style={{ color }}>{rarity.toUpperCase()} BOX</div>
                          <div className="shop-item__desc">Contains a {rarity} trait</div>
                        </div>
                        <button
                          className="hirebtn hirebtn--diamond"
                          disabled={!canAfford}
                          onClick={() => handleBuyDiamondBox(rarity)}
                        ><DiamondIcon />{price}</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
