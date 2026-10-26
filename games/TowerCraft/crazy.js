'use strict';
const CG = { ready: false, busy: false, muted: false };
(async () => {
  try {
    const S = window.CrazyGames && window.CrazyGames.SDK;
    if (!S) return;
    await S.init();
    CG.ready = true;
    try {
      const st = S.game.settings;
      CG.muted = !!st.muteAudio;
      S.game.addSettingsChangeListener(s => { CG.muted = !!(s && s.muteAudio); });
    } catch (e) {}
  } catch (e) {}
})();
function cgStart() { try { if (CG.ready) window.CrazyGames.SDK.game.gameplayStart(); } catch (e) {} }
function cgStop() { try { if (CG.ready) window.CrazyGames.SDK.game.gameplayStop(); } catch (e) {} }
function cgRewarded(ok, fail) {
  if (!CG.ready || CG.busy) { fail && fail(); return; }
  CG.busy = true;
  const vol = SET.vol;
  const done = good => {
    if (!CG.busy) return;
    CG.busy = false; SET.vol = vol;
    if (good) ok(); else fail && fail();
  };
  try {
    window.CrazyGames.SDK.ad.requestAd('rewarded', {
      adStarted: () => { SET.vol = 0; },
      adFinished: () => done(true),
      adError: () => done(false),
    });
  } catch (e) { done(false); }
}
