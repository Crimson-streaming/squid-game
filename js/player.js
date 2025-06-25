document.addEventListener('DOMContentLoaded', () => {
  const videoEl = document.getElementById('player');
  const hlsUrl = videoEl.querySelector('source').src;
  const previewVttUrl = videoEl.getAttribute('data-preview'); // <<< récupère depuis HTML

  const isMobile = 'ontouchstart' in window || /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
  const screenIsLargeEnough = window.innerWidth >= 600 && !isMobile;
  const playerControls = screenIsLargeEnough ?
      ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'] :
      ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'settings', 'pip', 'airplay', 'fullscreen'];

  const player = new Plyr('#player', {
    controls: playerControls,
    settings: ["captions", "quality", "speed"],
    playsinline: true,
    keyboard: { focused: true, global: true },
    fullscreen: { enabled: true, fallback: true, iosNative: true },
    storage: { enabled: true, key: "player" },
    invertTime: false,
    disableContextMenu: true,
    ratio: "16:9",
    previewThumbnails: {
      enabled: true,
      src: previewVttUrl
    },
    volume: 1,
    muted: false,
    i18n: {
      restart: 'Recommencer',
      rewind: 'Revenir de {seektime}s',
      play: 'Lecture',
      pause: 'Pause',
      fastForward: 'Avancer de {seektime}s',
      seek: 'Rechercher',
      seekLabel: '{currentTime} de {duration}',
      played: 'Lancé',
      buffered: 'Mis en mémoire',
      currentTime: 'Temps actuel',
      duration: 'Durée',
      volume: 'Volume',
      mute: 'Silence',
      unmute: 'Son activé',
      enableCaptions: 'Activer les sous-titres',
      disableCaptions: 'Désactiver les sous-titres',
      download: 'Télécharger',
      enterFullscreen: 'Plein écran',
      exitFullscreen: 'Sortir du plein écran',
      frameTitle: 'Lecteur pour {title}',
      captions: 'Sous-titres',
      settings: 'Réglages',
      pip: 'Picture-In-Picture',
      menuBack: 'Retour au menu précédent',
      speed: 'Vitesse',
      normal: 'Normal',
      quality: 'Qualité',
      loop: 'Boucle',
      start: 'Début',
      end: 'Fin',
      all: 'Tous',
      reset: 'Réinitialiser',
      disabled: 'Désactivé',
      enabled: 'Activé',
      advertisement: 'Publicité',
    }
  });

  const videoElement = document.getElementById('player');
  const loaderElement = document.getElementById('video-loader');
  const hlsSource = videoElement.querySelector('source').src;

  const url = new URL(hlsSource);
  const parts = url.pathname.split('/');
  const keyParts = parts.slice(3);
  let keyPart = keyParts.join('/').replace(/\.m3u8$/, "");
  const storageKey = `videoCurrentTime_${keyPart}`;

  const loadVideoTime = () => {
    const savedTime = localStorage.getItem(storageKey);
    if (savedTime) {
      videoElement.currentTime = parseFloat(savedTime);
    }
  };

  const toggleLoader = (show) => {
    loaderElement.style.display = show ? 'block' : 'none';
  };

  toggleLoader(false);
  videoElement.addEventListener('pause', () => toggleLoader(false));
  videoElement.addEventListener('play', () => toggleLoader(true));

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(hlsSource);
    hls.attachMedia(videoElement);
    hls.on(Hls.Events.MANIFEST_PARSED, () => toggleLoader(false));
    hls.on(Hls.Events.BUFFER_STALLED, () => toggleLoader(true));
    videoElement.addEventListener('timeupdate', () => {
      localStorage.setItem(storageKey, videoElement.currentTime);
    });
    videoElement.addEventListener('waiting', () => toggleLoader(true));
    videoElement.addEventListener('playing', () => toggleLoader(false));
    loadVideoTime();
  } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    videoElement.src = hlsSource;
    videoElement.addEventListener('loadeddata', () => toggleLoader(false));
    videoElement.addEventListener('waiting', () => toggleLoader(true));
    videoElement.addEventListener('timeupdate', () => {
      localStorage.setItem(storageKey, videoElement.currentTime);
    });
    loadVideoTime();
  } else {
    console.error('HLS non supporté, ou aucun fallback compatible disponible.');
    toggleLoader(false);
  }

  initChromecast();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (!isIOS) {
    player.on('ready', () => {
      const controlsContainer = document.querySelector('.plyr__controls');
      if (!controlsContainer) return;

      const pipButton = controlsContainer.querySelector('[data-plyr="pip"]');
      const castButton = document.createElement('button');
      castButton.classList.add('plyr__control');
      castButton.setAttribute('type', 'button');
      castButton.setAttribute('aria-label', 'Cast');
      castButton.id = 'castButton';
      castButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path d="M447.8 64H64c-23.6 0-42.7 19.1-42.7 42.7v63.9H64v-63.9h383.8v298.6H298.6V448H448c23.6 0 42.7-19.1 42.7-42.7V106.7C490.7 83.1 471.4 64 447.8 64zM21.3 383.6L21.3 383.6l0 63.9h63.9C85.2 412.2 56.6 383.6 21.3 383.6L21.3 383.6zM21.3 298.6V341c58.9 0 106.6 48.1 106.6 107h42.7C170.7 365.6 103.7 298.7 21.3 298.6zM213.4 448h42.7c-.5-129.5-105.3-234.3-234.8-234.6l0 42.4C127.3 255.6 213.3 342 213.4 448z" fill="white"/>
        </svg>
      `;
      if (pipButton) {
        pipButton.insertAdjacentElement('afterend', castButton);
      } else {
        controlsContainer.appendChild(castButton);
      }
      castButton.addEventListener('click', launchCast);
    });
  }

  player.on('ready', () => {
    const controlsContainer = document.querySelector('.plyr__controls');
    if (!controlsContainer) return;

    if (typeof window.introStart !== 'number' || typeof window.introEnd !== 'number') {
      console.warn('Intro non définie, le bouton "Passez l\'intro" ne sera pas affiché.');
      return;
    }

    const introStart = window.introStart;
    const introEnd = window.introEnd;

    const btn = document.createElement('button');
    btn.classList.add('plyr__control');
    btn.type = 'button';
    btn.id = 'skipIntroButton';
    btn.setAttribute('aria-label', 'Passez l\'intro');
    btn.innerText = 'Passez l\'intro';

    Object.assign(btn.style, {
      backgroundColor: '#b3151d',
      border: 'none',
      borderRadius: '5px',
      padding: '4px 8px',
      color: 'white',
      fontSize: '12px',
      fontFamily: "'Nunito', sans-serif",
      fontWeight: '700',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      width: '90px',
      textAlign: 'center',
      lineHeight: '1',
    });

    const currentTimeEl = controlsContainer.querySelector('.plyr__time');
    if (currentTimeEl) {
      currentTimeEl.insertAdjacentElement('beforebegin', btn);
    } else {
      controlsContainer.appendChild(btn);
    }

    player.on('timeupdate', () => {
      const t = player.currentTime;
      btn.style.display = (t >= introStart && t <= introEnd) ? 'flex' : 'none';
    });

    btn.addEventListener('click', () => {
      console.log('Clique sur Passez l’intro détecté !');
      player.currentTime = introEnd;
      player.play();
    });
  });
});

// --- Chromecast ---
function initChromecast() {
  if (typeof chrome === "undefined") return;
  const loadCastInterval = setInterval(() => {
    if (chrome.cast && chrome.cast.isAvailable) {
      clearInterval(loadCastInterval);
      initCastApi();
    }
  }, 1000);
}

function initCastApi() {
  cast.framework.CastContext.getInstance().setOptions({
    receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
  });
}

function connectToSession() {
  return Promise.resolve()
    .then(() => {
      const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
      if (!castSession) {
        return cast.framework.CastContext.getInstance().requestSession()
          .then(() => cast.framework.CastContext.getInstance().getCurrentSession());
      }
      return castSession;
    });
}

function launchCast() {
  connectToSession()
    .then((session) => {
      const videoSrc = document.getElementById('player').querySelector('source').src;
      const mediaInfo = new chrome.cast.media.MediaInfo(videoSrc);
      mediaInfo.contentType = 'application/x-mpegURL';
      mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = "CAST | Crimson";
      const request = new chrome.cast.media.LoadRequest(mediaInfo);
      request.autoplay = true;
      return session.loadMedia(request);
    })
    .then(() => {
      console.log("Lecture diffusée sur Chromecast en m3u8");
      listenToRemote();
    })
    .catch((error) => {
      console.error("Erreur lors du lancement de Chromecast :", error);
    });
}

function listenToRemote() {
  const remotePlayer = new cast.framework.RemotePlayer();
  const remoteController = new cast.framework.RemotePlayerController(remotePlayer);
  remoteController.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, () => {
    console.log("État du lecteur distant, isPaused =", remotePlayer.isPaused);
  });
  remoteController.addEventListener(cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED, () => {
    if (!remotePlayer.isConnected) {
      console.log("Session Chromecast terminée");
    }
  });
}
