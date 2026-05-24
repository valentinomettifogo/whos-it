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

  // Sci-fi inspired vibrant accent colors
  const colori = [
    '#00f0ff', // Cyber Blue
    '#00ffaa', // Cyber Emerald
    '#ffea00', // Cyber Gold
    '#ff007f', // Cyber Magenta
    '#bd00ff', // Cyber Purple
    '#ff5e00', // Cyber Orange
    '#ffffff'  // Pure White
  ];
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
        colore: mappaColori.get(t.identifier) || '#00f0ff'
      };
    });

    // 2. Gestione dei Timer: resettiamo il countdown SOLO se cambia il NUMERO di dita (aggiunta/rimozione)
    // Se l'evento è solo un `touchmove` (movimento), NON resettiamo il timer del vincitore.
    if (e.type !== 'touchmove' || quantiPrima !== tocchi.length) {
      stoppaTimer();
      
      if (tocchi.length >= 1) { // Parte se c'è almeno un dito
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
  class="relative w-screen h-screen overflow-hidden bg-[#030307] select-none touch-none flex items-center justify-center cyber-grid cyber-dots" 
  role="application"
  aria-label="Futuristic random player selector HUD"
  ontouchstart={gestisciTocchi}
  ontouchmove={gestisciTocchi}
  ontouchend={gestisciTocchi}
  ontouchcancel={gestisciTocchi}
>
  <!-- Moving laser scanline overlay -->
  <div class="absolute inset-x-0 w-full cyber-scanline pointer-events-none top-0 animate-scanline z-10 opacity-70"></div>
  
  <!-- Cyber vignette overlay -->
  <div class="absolute inset-0 cyber-vignette pointer-events-none z-10"></div>

  <!-- Ambient technical indicators in the viewport corners -->
  <div class="absolute top-4 left-6 font-mono text-[9px] text-cyber-blue/40 tracking-[0.2em] pointer-events-none uppercase hidden sm:block">
    SYSTEM // STATUS: ACTIVE // BUILD_v0.92
  </div>
  <div class="absolute top-4 right-6 font-mono text-[9px] text-cyber-blue/40 tracking-[0.2em] pointer-events-none uppercase hidden sm:block">
    SENSORS: ONLINE // MT_GRID_DETECT
  </div>
  <div class="absolute bottom-4 left-6 font-mono text-[9px] text-cyber-blue/40 tracking-[0.2em] pointer-events-none uppercase hidden sm:block">
    LATENCY: 0.14ms // REFRESH: 120Hz
  </div>
  <div class="absolute bottom-4 right-6 font-mono text-[9px] text-cyber-blue/40 tracking-[0.2em] pointer-events-none uppercase hidden sm:block">
    SECURE LINK // STABLE
  </div>

  <!-- Central Status HUD Window -->
  <div class="z-20 pointer-events-none max-w-sm md:max-w-md w-11/12 text-center flex flex-col items-center justify-center p-6 md:p-8 bg-black/55 backdrop-blur-md border border-cyber-blue/10 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.03)] animate-float-hud">
    <!-- Cyber Decorative Top Bar -->
    <div class="w-16 md:w-24 h-0.5 bg-linear-to-r from-transparent via-cyber-blue/50 to-transparent mb-5 md:mb-6"></div>

    {#if faseGioco === 'conteggio' && countdown !== null}
      <div class="font-display text-[10px] text-cyber-blue tracking-[0.3em] uppercase mb-2 animate-pulse">Initializing Scan</div>
      <div class="font-display text-2xl md:text-3xl font-black text-white tracking-widest uppercase mb-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
        LOCKING IN...
      </div>
      <div class="font-mono text-xs text-cyber-gold tracking-widest mt-4 flex items-center justify-center gap-2">
        <span class="w-2 h-2 rounded-full bg-cyber-gold animate-ping"></span>
        HOLD POSITION // T-MINUS {countdown}S
      </div>
    {:else if faseGioco === 'finito'}
      <div class="font-display text-[10px] text-cyber-emerald tracking-[0.3em] uppercase mb-2">Scan Complete</div>
      <div class="font-display text-2xl md:text-3xl font-black text-cyber-emerald tracking-widest uppercase mb-1 drop-shadow-[0_0_20px_rgba(0,255,170,0.3)] animate-pulse">
        TARGET ACQUIRED
      </div>
      <div class="font-mono text-[9px] text-slate-400 tracking-wider mt-5 border border-slate-800 bg-slate-950/80 px-4 py-2 rounded-full uppercase">
        Release fingers to reboot system
      </div>
    {:else}
      <div class="font-display text-[10px] text-cyber-blue/50 tracking-[0.3em] uppercase mb-3">System Standby</div>
      <div class="font-display text-xl md:text-2xl font-bold text-slate-200 tracking-wider uppercase leading-snug">
        PLACE FINGERS HERE
      </div>
      <div class="font-mono text-[9px] text-slate-500 tracking-widest mt-4 flex items-center justify-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-cyber-blue/20"></span>
        READY TO TRACE BIOMETRICS
      </div>
    {/if}

    <!-- Cyber Decorative Bottom Bar -->
    <div class="w-16 md:w-24 h-0.5 bg-linear-to-r from-transparent via-cyber-blue/50 to-transparent mt-5 md:mt-6"></div>
  </div>

  <!-- Finger Reticles Layer -->
  {#each tocchi as dito (dito.id)}
    {@const isVincitore = faseGioco === 'finito' && idVincitore === dito.id}
    {@const isPerdente = faseGioco === 'finito' && idVincitore !== dito.id}
    
    <div 
      class="absolute w-32 h-32 pointer-events-none transition-all duration-500 ease-out origin-center -translate-x-1/2 -translate-y-1/2"
      class:scale-0={isPerdente}
      class:opacity-0={isPerdente}
      class:scale-125={isVincitore}
      style="left: {dito.x}px; top: {dito.y}px; --colore-dito: {dito.colore}; color: {dito.colore};"
    >
      <!-- Radar Pulse Rings -->
      <div 
        class="absolute top-1/2 left-1/2 w-full h-full rounded-full border border-current opacity-0 animate-radar-pulse"
      ></div>

      <!-- Outer Rotating Dashed Ring -->
      <div 
        class="absolute top-1/2 left-1/2 w-28 h-28 rounded-full border-2 border-dashed border-current/50 animate-spin-clockwise"
      ></div>

      <!-- Inner Rotating Dotted Ring -->
      <div 
        class="absolute top-1/2 left-1/2 w-20 h-20 rounded-full border border-dotted border-current/80 animate-spin-counter"
      ></div>

      <!-- Tech Core Dot -->
      <div 
        class="absolute top-1/2 left-1/2 w-6 h-6 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 flex items-center justify-center"
        class:animate-ping={isVincitore}
        style="background-color: var(--colore-dito); box-shadow: 0 0 20px var(--colore-dito);"
      ></div>
      <!-- Center white precision point -->
      <div class="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 bg-white shadow-md"></div>

      <!-- Corner Brackets (HUD target frame) -->
      <div 
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 transition-all duration-500"
        class:w-30={isVincitore}
        class:h-30={isVincitore}
        class:animate-lock-blink={isVincitore}
      >
        <!-- Top Left Corner -->
        <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current"></div>
        <!-- Top Right Corner -->
        <div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current"></div>
        <!-- Bottom Left Corner -->
        <div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current"></div>
        <!-- Bottom Right Corner -->
        <div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current"></div>
      </div>

      <!-- Biometric telemetry sidebar box -->
      <div 
        class="absolute top-12 left-12 font-mono text-[9px] uppercase tracking-widest whitespace-nowrap bg-black/75 px-2 py-1.5 border border-current/20 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] pointer-events-none transition-all flex flex-col gap-0.5 {isVincitore ? 'text-white border-white bg-cyber-emerald/15 shadow-[0_0_20px_var(--colore-dito)]' : ''}"
      >
        <div class="flex items-center gap-1.5 font-bold">
          <span class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
          NODE_0{Math.abs(dito.id) % 100}
        </div>
        <div class="opacity-70 text-[8px]">POS // X:{Math.round(dito.x)} Y:{Math.round(dito.y)}</div>
        
        {#if isVincitore}
          <div class="text-[9px] text-white font-black mt-1 tracking-wider animate-pulse flex items-center gap-1">
            <span>&gt;&gt;</span> LOCKED <span>&lt;&lt;</span>
          </div>
        {:else if faseGioco === 'conteggio'}
          <div class="text-[7px] text-current/80 mt-0.5 animate-pulse">TRACING...</div>
        {/if}
      </div>
    </div>
  {/each}
</div>