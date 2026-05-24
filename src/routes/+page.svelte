<script lang="ts">
  interface Dito {
    id: number;
    x: number;
    y: number;
    colore: string;
  }

  // State reattivi (Svelte 5 Runes)
  let tocchi = $state<Dito[]>([]);
  let idVincitore = $state<number | null>(null);
  let countdown = $state<number | null>(null);
  let faseGioco = $state<'attesa' | 'conteggio' | 'finito'>('attesa');

  const colori = ['#FF3E00', '#40B3FF', '#00FF88', '#FFD700', '#FF69B4', '#9932CC', '#40E0D0'];
  const mappaColori = new Map<number, string>();

  let timerSelezionatore: ReturnType<typeof setTimeout> | null = null;
  let intervalCountdown: ReturnType<typeof setInterval> | null = null;
  let timerResetTolleranza: ReturnType<typeof setTimeout> | null = null;

  function gestisciTocchi(e: TouchEvent) {
    // 1. Impedisce al browser di fare lo "swipe-to-refresh" o pinch-to-zoom hardware
    e.preventDefault();

    // Se abbiamo già un vincitore fisso, ignora nuovi tocchi finché lo schermo non viene svuotato del tutto
    if (faseGioco === 'finito' && e.touches.length > 0) return;

    // Se tutti hanno tolto le dita, attiviamo una tolleranza di 300ms prima di resettare davvero
    if (e.touches.length === 0) {
      if (!timerResetTolleranza) {
        timerResetTolleranza = setTimeout(() => {
          resetGioco();
        }, 300); // Finestra di tolleranza per i micro-distacchi
      }
      return;
    }

    // Se c'è di nuovo un dito, annulla l'eventuale reset imminente
    if (timerResetTolleranza) {
      clearTimeout(timerResetTolleranza);
      timerResetTolleranza = null;
    }

    // Salva il numero di partecipanti prima dell'aggiornamento
    const quantiPrima = tocchi.length;

    // Aggiorna la mappa dei tocchi attuali
    tocchi = Array.from(e.touches).map((t) => {
      if (!mappaColori.has(t.identifier)) {
        const coloreCasuale = colori[Math.floor(Math.random() * colori.length)];
        mappaColori.set(t.identifier, coloreCasuale);
      }
      return {
        id: t.identifier,
        x: t.clientX,
        y: t.clientY,
        colore: mappaColori.get(t.identifier) || '#fff'
      };
    });

    // 2. Gestione dei Timer: resettiamo il countdown SOLO se cambia il NUMERO di dita (aggiunta/rimozione)
    // Se l'evento è solo un `touchmove` (movimento), NON resettiamo il timer del vincitore.
    if (e.type !== 'touchmove' || quantiPrima !== tocchi.length) {
      stoppaTimer();
      
      if (tocchi.length >= 1) { // Puoi cambiare a 2 se vuoi che parta solo se si è in compagnia
        faseGioco = 'conteggio';
        countdown = 2; // Secondi di attesa stabili

        intervalCountdown = setInterval(() => {
          if (countdown !== null && countdown > 0) {
            countdown -= 1;
          }
        }, 1000);

        timerSelezionatore = setTimeout(() => {
          scegliVincitore();
        }, 2000);
      } else {
        faseGioco = 'attesa';
      }
    }
  }

  function scegliVincitore() {
    stoppaTimer();
    if (tocchi.length > 0) {
      faseGioco = 'finito';
      const indiceCasuale = Math.floor(Math.random() * tocchi.length);
      idVincitore = tocchi[indiceCasuale].id;
    }
  }

  function stoppaTimer() {
    if (timerSelezionatore) clearTimeout(timerSelezionatore);
    if (intervalCountdown) clearInterval(intervalCountdown);
    countdown = null;
  }

  function resetGioco() {
    stoppaTimer();
    tocchi = [];
    idVincitore = null;
    faseGioco = 'attesa';
    mappaColori.clear();
    if (timerResetTolleranza) clearTimeout(timerResetTolleranza);
    timerResetTolleranza = null;
  }
</script>

<div 
  class="arena-gioco" 
  role="application"
  aria-label="Gioco di selezione casuale dei giocatori"
  ontouchstart={gestisciTocchi}
  ontouchmove={gestisciTocchi}
  ontouchend={gestisciTocchi}
  ontouchcancel={gestisciTocchi}
>
  {#if faseGioco === 'conteggio' && countdown !== null}
    <div class="stato-gioco animate-pulse">Non muovetevi! {countdown}...</div>
  {:else if faseGioco === 'finito'}
    <div class="stato-gioco vincitore-testo">ECCO IL VINCITORE! 👑<br><span style="font-size: 1.2rem; color: white; font-weight: normal;">Alza le dita per rigiocare</span></div>
  {:else}
    <div class="stato-gioco istruzioni">Appoggiate i diti qui per scegliere</div>
  {/if}

  {#each tocchi as dito (dito.id)}
    <div 
      class="cerchio-giocatore"
      class:perdente={faseGioco === 'finito' && idVincitore !== dito.id}
      class:vincitore={faseGioco === 'finito' && idVincitore === dito.id}
      style="left: {dito.x}px; top: {dito.y}px; --colore-dito: {dito.colore};"
    ></div>
  {/each}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #08080c;
    user-select: none;
    overflow: hidden;
  }

  .arena-gioco {
    width: 100vw;
    height: 100vh;
    position: relative;
    touch-action: none; /* Blocca i gesti nativi del browser mobile */
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .stato-gioco {
    font-family: system-ui, -apple-system, sans-serif;
    color: white;
    font-size: 1.4rem;
    text-align: center;
    max-width: 80%;
    pointer-events: none;
    z-index: 10;
    line-height: 1.4;
  }

  .vincitore-testo {
    font-weight: bold;
    font-size: 2rem;
    color: #00ff88;
    text-shadow: 0 0 25px rgba(0, 255, 136, 0.5);
  }

  .istruzioni {
    opacity: 0.4;
  }

  .cerchio-giocatore {
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--colore-dito) 0%, transparent 75%);
    border: 5px solid var(--colore-dito);
    box-shadow: 0 0 25px var(--colore-dito);
    transform: translate(-50%, -50%) scale(1);
    /* Transizione fluida che segue il dito senza scatti */
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.2s ease;
    pointer-events: none;
  }

  .cerchio-giocatore.perdente {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }

  .cerchio-giocatore.vincitore {
    transform: translate(-50%, -50%) scale(1.8);
    animation: pulsazione 0.6s infinite alternate;
    border-color: #ffffff;
  }

  @keyframes pulsazione {
    0% { box-shadow: 0 0 25px var(--colore-dito); }
    100% { box-shadow: 0 0 50px var(--colore-dito), 0 0 80px #fff; }
  }

  .animate-pulse {
    animation: pulse 0.8s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.98); }
  }
</style>