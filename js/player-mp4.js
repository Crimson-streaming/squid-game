document.addEventListener('DOMContentLoaded', () => {
    // Déclaration correcte de videoElement et sourceElement
    const videoElement = document.getElementById('player');
    const sourceElement = videoElement.querySelector('source');
    const previewVttUrl = videoElement.getAttribute('data-preview');

    const isMobile = 'ontouchstart' in window || /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
    const screenIsLargeEnough = window.innerWidth >= 600 && !isMobile;
    const playerControls = screenIsLargeEnough ?
    ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'] :
    ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'settings', 'pip', 'airplay', 'fullscreen'];

    console.log("Contrôles du lecteur :", playerControls);

    const player = new Plyr('#player', {
        controls: playerControls,
        settings: ["captions", "quality", "speed"],
        playsinline: true,
        keyboard: {
            focused: true,
            global: true
        },
        fullscreen: {
            enabled: true,
            fallback: true,
            iosNative: true
        },
        storage: {
            enabled: true,
            key: "player"
        },
        captions: {
        active: false, // Active les sous-titres par défaut
        language: 'fr', // Définit le français comme langue par défaut si disponible
        update: true // Écoute les changements de pistes et met à jour le menu
        },
        previewThumbnails: {
        enabled: true,
        src: previewVttUrl
        },
        invertTime: false,
        disableContextMenu: true,
        ratio: "16:9",
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
        },
        volume: 1,
        muted: false
    });


    
    // const hlsUrl = videoElement.querySelector('source').src; // Cette ligne semble inutilisée
    // const previewVttUrl = videoElement.getAttribute('data-preview'); // Cette ligne semble inutilisée

    let videoPath = 'default';
    if (sourceElement && sourceElement.src) {
        const url = new URL(sourceElement.src);
        const pathSegments = url.pathname.split('/');
        if (pathSegments.length >= 4) {
            const relevantSegments = pathSegments.slice(2);
            // On enlève l'extension .mp4 du dernier élément
            relevantSegments[relevantSegments.length - 1] = relevantSegments[relevantSegments.length - 1].replace('.mp4', '');
            videoPath = relevantSegments.join('/');
        }
    }
    
    const storageKey = `videoCurrentTime_${videoPath}`;
    
    // Fonction pour charger le temps enregistré
    const loadVideoTime = () => {
        const savedTime = localStorage.getItem(storageKey);
        if (savedTime) {
            videoElement.currentTime = parseFloat(savedTime);
            console.log(`Temps de lecture chargé : ${savedTime} secondes`);
        }
    };
    
    // Sauvegarde du temps de lecture toutes les 5 secondes (ou à une fréquence plus adaptée)
    let saveInterval = null;
    videoElement.addEventListener('play', () => {
        if (!saveInterval) {
            saveInterval = setInterval(() => {
                localStorage.setItem(storageKey, videoElement.currentTime);
                console.log(`Temps de lecture sauvegardé : ${videoElement.currentTime} secondes`);
            }, 5000); // Sauvegarde toutes les 5 secondes
        }
    });

    videoElement.addEventListener('pause', () => {
        clearInterval(saveInterval);
        saveInterval = null;
        localStorage.setItem(storageKey, videoElement.currentTime); // Sauvegarde immédiate à la pause
        console.log(`Temps de lecture sauvegardé (à la pause) : ${videoElement.currentTime} secondes`);
    });

    videoElement.addEventListener('ended', () => {
        clearInterval(saveInterval);
        saveInterval = null;
        localStorage.removeItem(storageKey); // Supprimer le temps sauvegardé si la vidéo est terminée
        console.log("Vidéo terminée, temps de lecture supprimé.");
    });
    
    // Chargement du temps de lecture
    player.on('ready', () => { // Utiliser l'événement 'ready' de Plyr pour s'assurer que le lecteur est prêt
        loadVideoTime();
        // toggleLoader(false); // La fonction toggleLoader n'est pas définie dans le code fourni, je l'ai commentée.
    });
    
    // --- Intégration Chromecast ---
    // (Le code Chromecast reste inchangé car il semble indépendant du problème de sauvegarde de temps)
    initChromecast();
    
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



    // --- Bouton Chromecast (si pas iOS) ---
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
    
    // --- Fonctions Chromecast ---
    function initChromecast() {
        if (typeof chrome === "undefined") {
            return;
        }
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
                // S'assurer que sourceElement est défini avant de l'utiliser
                const videoSrc = sourceElement ? sourceElement.src : ''; 
                const mediaInfo = new chrome.cast.media.MediaInfo(videoSrc, 'video/mp4');
    
                mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
                mediaInfo.metadata.title = "CAST | Crimson";
    
                const request = new chrome.cast.media.LoadRequest(mediaInfo);
                request.autoplay = true;
                return session.loadMedia(request);
            })
            .then(() => {
                console.log("Lecture diffusée sur Chromecast (MP4)");
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
});