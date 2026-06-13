/**
 * Shared overlay interaction / ghost-mode orchestration (CRPM-proven policy).
 *
 * - Uses yoAnimeBridge click pass-through (NOT global SDK setInteractive(false)).
 * - Win32 ghost mode enters only after explicit pass-through to PowerPoint.
 * - GhostModePoller wakes overlay only when cursor is over registered interactive bounds.
 * - Reports interactive bounds after geometry / trajectory scene updates.
 */
(function () {
    'use strict';

    let _config = null;
    let _scheduledReport = 0;

    function reportBounds() {
        _scheduledReport = 0;
        if (window.yoAnimeBridge?.sendBoundsToHost) {
            window.yoAnimeBridge.sendBoundsToHost();
        }
    }

    function scheduleReportBounds(delay = 0) {
        if (_scheduledReport) {
            window.clearTimeout(_scheduledReport);
            _scheduledReport = 0;
        }

        if (delay <= 0) {
            reportBounds();
            return;
        }

        _scheduledReport = window.setTimeout(reportBounds, delay);
    }

    function scheduleSettlingReports() {
        [0, 50, 150, 350, 800].forEach(delay => {
            window.setTimeout(reportBounds, delay);
        });
    }

    function bindBoundsRefresh() {
        const events = _config?.boundsRefreshEvents || [
            'yoanime-overlay-geometry-updated',
            'yoanime-workspace-geometry-updated',
            'yoanime-trajectory-scene-updated',
            'yoanime-selection-changed',
            'yoanime-sdk-selection-changed'
        ];
        events.forEach((name) => document.addEventListener(name, () => scheduleReportBounds(16)));

        ['pointermove', 'pointerover', 'mouseenter', 'pointerdown', 'mousedown', 'click', 'focusin'].forEach(name => {
            document.addEventListener(name, () => scheduleReportBounds(16), { passive: true });
        });

        window.addEventListener('resize', scheduleSettlingReports);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) scheduleSettlingReports();
        });
    }

    function init(config) {
        _config = config || {};
        const containerId = _config.containerId || 'cw-main-container';
        const interactiveSelectors = _config.interactiveSelectors || [];

        if (window.yoAnimeBridge) {
            window.yoAnimeBridge.init({
                containerId,
                interactiveSelectors
            });
        }

        bindBoundsRefresh();
        scheduleSettlingReports();

        console.log('[yoAnimeOverlayInteraction] CRPM-aligned ghost policy active (bridge pass-through only).');
    }

    window.yoAnimeOverlayInteraction = {
        init,
        reportBounds
    };
})();
