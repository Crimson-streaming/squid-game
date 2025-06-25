$(document).ready(function() {
    // =========================================================================================
    // SECTION 1: Logique existante pour la gestion des cartes de saison (NE PAS MODIFIER CELA)
    // =========================================================================================
    // ... (votre code existant ici) ...
    // =========================================================================================


    // =========================================================================================
    // SECTION 2: LOGIQUE POUR LA MODALE DE BANDE-ANNONCE (SIMPLE ET INSTANTANÉE)
    // =========================================================================================

    const trailerButton = $('.hero-section .btn-secondary');
    const trailerModal = $('#trailerModal');
    // trailerDialog n'est plus nécessaire car les animations CSS sont supprimées
    const trailerIframe = $('#trailerIframe');
    const modalBody = trailerModal.find('.modal-body');
    
    // REMPLACEZ 'YOUR_ACTUAL_VIDEO_ID' PAR L'ID RÉEL DE VOTRE VIDÉO YOUTUBE
    const videoId = "YOUR_ACTUAL_VIDEO_ID"; 
    
    // URL de base pour le préchargement (format d'intégration YouTube)
    // AUCUN PARAMÈTRE ici - se fie au comportement par défaut de YouTube
    const youtubeTrailerBaseUrl = `https://www.youtube.com/embed/GYoD8oOH31M`;
    
    // L'URL pour l'affichage/lecture est identique à la base, SANS aucun paramètre additionnel.
    // La vidéo ne démarrera PAS automatiquement, et les suggestions/infos seront gérées par défaut par YouTube.
    const youtubeTrailerAutoplayUrl = youtubeTrailerBaseUrl;


    // Les paramètres de synchronisation des animations et les délais sont supprimés car l'affichage est instantané.


    // =========================================================================================
    // INITIALISATION : CHARGE L'EMBED EN ARRIÈRE-PLAN DÈS LE DÉPART
    // =========================================================================================
    // La vidéo est préchargée dès que la page est prête, sans paramètres spécifiques.
    trailerIframe.attr('src', youtubeTrailerBaseUrl); 

    // Gère l'événement de clic sur le bouton "Bande-annonce"
    trailerButton.on('click', function() {
        // Ouvre la modale. Les classes 'hiding' ne sont plus gérées par JS ici car les animations sont en CSS.
        trailerModal.modal({
            backdrop: true, // Permet la fermeture en cliquant sur l'overlay
            keyboard: true  // Permet la fermeture avec la touche Échap
        }).modal('show');
    });

    // Gère l'événement Bootstrap : quand la modale a FINI de s'ouvrir.
    trailerModal.on('shown.bs.modal', function() {
        // Empêche le défilement de la page principale.
        $('body').addClass('no-scroll'); 

        // Affiche la vidéo instantanément en chargeant l'URL complète et en rendant le corps visible.
        trailerIframe.attr('src', youtubeTrailerAutoplayUrl); 
        modalBody.addClass('show-video'); 
    });

    // Gère l'événement Bootstrap : quand la modale est SUR LE POINT D'ÊTRE CACHÉE.
    trailerModal.on('hide.bs.modal', function() {
        // Masque la vidéo instantanément.
        modalBody.removeClass('show-video');
        // Vider l'iframe instantanément pour arrêter la lecture et libérer les ressources.
        trailerIframe.attr('src', ''); 
    });

    // Gère l'événement Bootstrap : quand la modale est ENTIÈREMENT FERMÉE.
    trailerModal.on('hidden.bs.modal', function() {
        // Rétablit le défilement de la page principale.
        $('body').removeClass('no-scroll'); 

        // Recharge l'iframe avec l'URL de base pour le prochain préchargement.
        trailerIframe.attr('src', youtubeTrailerBaseUrl); 
    });

    // =========================================================================================
    // FIN SECTION 2: LOGIQUE POUR LA MODALE DE BANDE-ANNONCE (SIMPLE ET INSTANTANÉE)
    // =========================================================================================

});