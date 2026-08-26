/**
 * yoAnimeBridge.js
 * Overlay bridge: ghost-mode bounds reporting and click pass-through to PowerPoint.
 */
(function (window) {
    'use strict';

    const isFramed = !!(window.parent && window.parent !== window);
    const isWebView = !!window.chrome?.webview;
    const compositorOrigin = 'https://yoanime-animationpanel.assets';
    const SDK_VERSION = '0.4.0';
    const SDK_REQUEST_TIMEOUT_MS = 60000;
    let runtimeSurface = 'unknown';

    const normalizeSurfaceName = value => {
        const raw = String(value || '').toLowerCase();
        if (raw.includes('interactiveoverlay') || raw.includes('overlay')) return 'overlay';
        if (raw.includes('taskpane') || raw.includes('task-pane')) return 'taskpane';
        return raw || 'unknown';
    };

    const rememberRuntimeSurface = capabilities => {
        const surface = capabilities?.surface || capabilities?.Surface || capabilities?.surfaceType || capabilities?.SurfaceType;
        const normalized = normalizeSurfaceName(surface);
        if (normalized && normalized !== 'unknown') runtimeSurface = normalized;
        return capabilities;
    };

    function installFramedChromeWebViewShim() {
        if (!isFramed) return;

        const listeners = new Set();
        const nativeChrome = window.chrome || {};
        const nativeWebView = nativeChrome.webview;

        window.chrome = nativeChrome;
        window.chrome.webview = {
            __yoAnimeFramedProxy: true,
            __nativeWebView: nativeWebView || null,
            postMessage(message) {
                window.parent.postMessage({
                    type: 'yoanime.compositor.childmessage',
                    data: message
                }, compositorOrigin);
            },
            addEventListener(eventName, callback) {
                if (String(eventName || '').toLowerCase() !== 'message' || typeof callback !== 'function')
                    return;

                const wrapped = event => {
                    callback({ data: event.data });
                };
                listeners.add({ callback, wrapped });
                window.addEventListener('message', wrapped);
            },
            removeEventListener(eventName, callback) {
                if (String(eventName || '').toLowerCase() !== 'message')
                    return;

                for (const entry of [...listeners]) {
                    if (entry.callback !== callback) continue;
                    window.removeEventListener('message', entry.wrapped);
                    listeners.delete(entry);
                }
            }
        };
    }

    function installCompositorPointerProxy() {
        if (!isFramed || window.__yoAnimeCompositorPointerProxyInstalled) return;
        window.__yoAnimeCompositorPointerProxyInstalled = true;
        const capturedPointerTargets = new Map();
        const pointerDownTargets = new Map();
        let lastSyntheticClick = null;

        const pointerToMouseEvent = {
            pointerdown: 'mousedown',
            pointerover: 'mouseover',
            pointerenter: 'mouseenter',
            pointermove: 'mousemove',
            pointerout: 'mouseout',
            pointerleave: 'mouseleave',
            pointerup: 'mouseup',
            pointercancel: 'mouseup'
        };

        const dispatchMouseFallback = (target, eventType, init) => {
            const mouseType = pointerToMouseEvent[eventType];
            if (!mouseType) return;
            try {
                target.dispatchEvent(new MouseEvent(mouseType, init));
            } catch (_) { /* best effort */ }
        };

        const findActivatableTarget = (target) => {
            if (!target?.closest) return target;
            return target.closest('button, a[href], input, select, textarea, summary, [role="button"], [role="menuitem"], [tabindex]') || target;
        };

        const isNativeFormControl = (target) => {
            const element = target?.closest?.('select, input, textarea, option');
            if (!element) return false;
            const tag = String(element.tagName || '').toLowerCase();
            const type = String(element.getAttribute?.('type') || '').toLowerCase();
            return tag === 'select' || tag === 'textarea' || tag === 'option' ||
                (tag === 'input' && type !== 'button' && type !== 'submit' && type !== 'reset');
        };

        const focusTarget = (target) => {
            const focusable = findActivatableTarget(target);
            if (!focusable || typeof focusable.focus !== 'function') return;
            try { focusable.focus({ preventScroll: true }); } catch (_) { try { focusable.focus(); } catch { /* best effort */ } }
        };

        const findScrollableTarget = (target, deltaX, deltaY) => {
            const wantsVertical = Math.abs(Number(deltaY) || 0) >= Math.abs(Number(deltaX) || 0);
            for (let el = target; el && el !== document; el = el.parentElement) {
                const style = window.getComputedStyle?.(el);
                if (!style) continue;
                const canScrollY = /(auto|scroll|overlay)/i.test(style.overflowY || '') && el.scrollHeight > el.clientHeight;
                const canScrollX = /(auto|scroll|overlay)/i.test(style.overflowX || '') && el.scrollWidth > el.clientWidth;
                if ((wantsVertical && canScrollY) || (!wantsVertical && canScrollX) || canScrollY || canScrollX) {
                    return el;
                }
            }

            const root = document.scrollingElement || document.documentElement || document.body;
            if (root && (root.scrollHeight > root.clientHeight || root.scrollWidth > root.clientWidth)) return root;
            return null;
        };

        const isClickActivatable = (target) => {
            const activatable = findActivatableTarget(target);
            if (!activatable || activatable.disabled || activatable.getAttribute?.('aria-disabled') === 'true') return false;
            const tag = String(activatable.tagName || '').toLowerCase();
            return tag === 'button' ||
                tag === 'a' ||
                tag === 'summary' ||
                tag === 'input' ||
                tag === 'select' ||
                tag === 'textarea' ||
                activatable.getAttribute?.('role') === 'button' ||
                activatable.getAttribute?.('role') === 'menuitem' ||
                activatable.hasAttribute?.('tabindex');
        };

        const recentlyClicked = (target, init) => {
            if (!lastSyntheticClick || lastSyntheticClick.target !== target) return false;
            const age = Date.now() - lastSyntheticClick.at;
            if (age > 250) return false;
            return Math.abs((init.clientX || 0) - lastSyntheticClick.clientX) < 3 &&
                Math.abs((init.clientY || 0) - lastSyntheticClick.clientY) < 3;
        };

        const synthesizeClick = (target, init) => {
            const activatable = findActivatableTarget(target);
            if (!isClickActivatable(activatable)) return;
            try {
                activatable.dispatchEvent(new MouseEvent('click', init));
                lastSyntheticClick = {
                    target: activatable,
                    clientX: init.clientX || 0,
                    clientY: init.clientY || 0,
                    at: Date.now()
                };
            } catch (_) { /* best effort */ }
        };

        window.addEventListener('message', event => {
            let message = event.data;
            if (typeof message === 'string') {
                try { message = JSON.parse(message); } catch (_) { return; }
            }

            const type = String(message?.type || message?.Type || '').toLowerCase();
            if (type !== 'yoanime.compositor.pointer') return;

            const data = message.data || message.Data || {};
            const eventType = String(data.eventType || '').toLowerCase();
            if (!eventType) return;

            const clientX = Number(data.clientX) || 0;
            const clientY = Number(data.clientY) || 0;
            const pointerId = Number(data.pointerId) || 1;
            const capturedTarget = capturedPointerTargets.get(pointerId);
            const target = capturedTarget || document.elementFromPoint(clientX, clientY) || document.body || document.documentElement;
            if (!target) return;

            const init = {
                bubbles: true,
                cancelable: true,
                composed: true,
                clientX,
                clientY,
                screenX: Number(data.screenX) || 0,
                screenY: Number(data.screenY) || 0,
                button: Number(data.button) || 0,
                buttons: Number(data.buttons) || 0,
                altKey: !!data.altKey,
                ctrlKey: !!data.ctrlKey,
                metaKey: !!data.metaKey,
                shiftKey: !!data.shiftKey
            };

            try {
                if (eventType === 'wheel') {
                    const deltaX = Number(data.deltaX) || 0;
                    const deltaY = Number(data.deltaY) || 0;
                    const wheelEvent = new WheelEvent('wheel', {
                        ...init,
                        deltaX,
                        deltaY,
                        deltaMode: Number(data.deltaMode) || 0
                    });
                    const notCanceled = target.dispatchEvent(wheelEvent);
                    if (notCanceled && !wheelEvent.defaultPrevented) {
                        const scroller = findScrollableTarget(target, deltaX, deltaY);
                        if (scroller) {
                            scroller.scrollLeft += deltaX;
                            scroller.scrollTop += deltaY;
                            try {
                                scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
                            } catch (_) { /* best effort */ }
                        }
                    }
                    return;
                }

                if (eventType.startsWith('pointer') && typeof PointerEvent !== 'undefined') {
                    target.dispatchEvent(new PointerEvent(eventType, {
                        ...init,
                        pointerId,
                        pointerType: data.pointerType || 'mouse',
                        isPrimary: true
                    }));
                    dispatchMouseFallback(target, eventType, init);
                    if (eventType === 'pointerdown') {
                        focusTarget(target);
                        if (!isNativeFormControl(target)) {
                            capturedPointerTargets.set(pointerId, target);
                            pointerDownTargets.set(pointerId, findActivatableTarget(target));
                        }
                    } else if (eventType === 'pointerup' || eventType === 'pointercancel') {
                        const downTarget = pointerDownTargets.get(pointerId);
                        const upTarget = findActivatableTarget(target);
                        if (eventType === 'pointerup' && downTarget && downTarget === upTarget) {
                            synthesizeClick(upTarget, init);
                        }
                        capturedPointerTargets.delete(pointerId);
                        pointerDownTargets.delete(pointerId);
                    }
                    return;
                }

                if (eventType === 'click' && recentlyClicked(findActivatableTarget(target), init)) {
                    return;
                }

                target.dispatchEvent(new MouseEvent(eventType, init));
                if (eventType === 'mousedown') {
                    focusTarget(target);
                    if (!isNativeFormControl(target)) {
                        capturedPointerTargets.set(pointerId, target);
                        pointerDownTargets.set(pointerId, findActivatableTarget(target));
                    }
                } else if (eventType === 'mouseup') {
                    const downTarget = pointerDownTargets.get(pointerId);
                    const upTarget = findActivatableTarget(target);
                    if (downTarget && downTarget === upTarget) {
                        synthesizeClick(upTarget, init);
                    }
                    capturedPointerTargets.delete(pointerId);
                    pointerDownTargets.delete(pointerId);
                }
            } catch (error) {
                console.warn('[yoAnimeBridge] Failed to dispatch compositor pointer event.', error);
            }
        });
    }

    function postToHost(message) {
        if (isFramed) {
            window.parent.postMessage({
                type: 'yoanime.compositor.childmessage',
                data: message
            }, compositorOrigin);
            return;
        }

        if (isWebView) {
            window.chrome.webview.postMessage(message);
        }
    }

    function installIframeSdkProxy() {
        if (!isFramed || window.yoanime) return;

        let requestCounter = 0;
        const pending = new Map();
        const runtimeChannels = new Map();
        const listeners = {
            selectionChanged: new Set(),
            noSelection: new Set(),
            timelineUpdated: new Set(),
            timelineTick: new Set(),
            playbackStarted: new Set(),
            playbackStopped: new Set(),
            sessionEnded: new Set(),
            overlayMessage: new Set(),
            taskpaneMessage: new Set(),
            webSurfaceEvent: new Set(),
            sceneUpdated: new Set(),
            slideshowStarted: new Set(),
            slideshowSlideChanged: new Set(),
            slideshowEnded: new Set(),
            trajectoryOverlayUpdated: new Set(),
            trajectorySelectionUpdated: new Set(),
            runtimeWarning: new Set(),
            constraintChanged: new Set(),
            behaviorChanged: new Set(),
            events: new Map()
        };

        const normalizeChannelId = (id) => String(id || '').trim().toLowerCase();
        const normalizeChannelEventName = (eventName) => String(eventName || '*').trim() || '*';
        const cloneJsonSafe = (value, fallback = null) => {
            if (value == null) return fallback;
            try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
        };
        const getPayload = (message) => message?.data || message?.Data || message?.message || message?.Message || message || {};
        const isRuntimeChannelEnvelope = (value) => {
            if (!value || typeof value !== 'object') return false;
            const contract = String(value.contractVersion || value.ContractVersion || '').toLowerCase();
            return contract === 'runtime-channel-message.v1' ||
                !!((value.channelId || value.ChannelId) && (value.event || value.Event));
        };
        const unwrapBridgeMessage = (payload) => {
            if (!payload || typeof payload !== 'object') return payload;
            return payload.message || payload.Message ||
                payload.data?.message || payload.data?.Message ||
                payload.Data?.message || payload.Data?.Message ||
                payload;
        };
        const unwrapRuntimeChannelEnvelope = (message) => {
            if (isRuntimeChannelEnvelope(message)) return message;
            const payload = message?.data || message?.Data || message?.payload || message?.Payload;
            if (isRuntimeChannelEnvelope(payload)) return payload;
            const nested = payload?.message || payload?.Message;
            if (isRuntimeChannelEnvelope(nested)) return nested;
            return payload || message;
        };
        const emit = (eventName, payload) => {
            const set = listeners.events.get(eventName);
            if (!set) return { delivered: 0 };
            let delivered = 0;
            [...set].forEach(callback => {
                try { callback(payload); } catch (error) { console.error('[yoAnime iframe SDK] Event callback failed:', eventName, error); }
                delivered++;
            });
            return { delivered };
        };
        const emitSet = (set, payload, label) => {
            let delivered = 0;
            [...set].forEach(callback => {
                try { callback(payload); } catch (error) { console.error(`[yoAnime iframe SDK] ${label} callback failed:`, error); }
                delivered++;
            });
            return delivered;
        };

        const sendSdkRequest = (type, data = {}) => {
            const reqId = `req_${++requestCounter}`;
            postToHost({ type, sdkVersion: SDK_VERSION, reqId, data });
            return new Promise((resolve, reject) => {
                const timeout = window.setTimeout(() => {
                    pending.delete(reqId);
                    reject(new Error(`SDK Request timed out: ${type}`));
                }, SDK_REQUEST_TIMEOUT_MS);
                pending.set(reqId, { resolve, reject, timeout, type });
            });
        };

        const dispatchRuntimeChannelEnvelope = (envelope) => {
            const channelId = normalizeChannelId(envelope?.channelId || envelope?.ChannelId);
            if (!channelId) return { delivered: 0, dropReason: 'missing-channel-id' };
            const channel = runtimeChannels.get(channelId);
            if (!channel) return { delivered: 0, dropReason: 'channel-not-open' };

            const eventName = normalizeChannelEventName(envelope.event || envelope.Event);
            const event = {
                contractVersion: 'runtime-channel-event.v1',
                channelId,
                event: eventName,
                payload: envelope.payload ?? envelope.Payload ?? null,
                ownerExtensionId: envelope.ownerExtensionId || envelope.OwnerExtensionId || channel.ownerExtensionId || null,
                sourceSurface: envelope.sourceSurface || envelope.SourceSurface || null,
                target: envelope.target || envelope.Target || null,
                messageId: envelope.messageId || envelope.MessageId || null,
                timestamp: envelope.timestamp || envelope.Timestamp || Date.now()
            };

            let delivered = 0;
            const deliver = (set) => {
                if (!set) return;
                [...set].forEach(callback => {
                    try {
                        callback(event);
                        delivered++;
                    } catch (error) {
                        console.error('[yoAnime iframe SDK] Runtime channel callback failed:', channelId, eventName, error);
                    }
                });
            };
            deliver(channel.subscribers.get(eventName));
            if (eventName !== '*') deliver(channel.subscribers.get('*'));
            emit('channels.message', event);
            return { delivered, dropReason: delivered ? null : 'no-subscribers' };
        };

        const makeRuntimeChannelEnvelope = (channelId, eventName, payload, options = {}) => ({
            contractVersion: 'runtime-channel-message.v1',
            channelId,
            event: normalizeChannelEventName(eventName),
            payload: cloneJsonSafe(payload, null),
            ownerExtensionId: options.ownerExtensionId || null,
            sourceSurface: runtimeSurface,
            target: options.target || 'peer',
            messageId: options.messageId || `ch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
            timestamp: Date.now()
        });

        const createRuntimeChannel = (channelId, options = {}) => {
            const id = normalizeChannelId(channelId);
            if (!id) throw new Error('Runtime channel id is required.');
            const existing = runtimeChannels.get(id);
            if (existing) return existing.api;

            const state = {
                id,
                label: options.label || id,
                ownerExtensionId: options.ownerExtensionId || options.extensionId || null,
                openedAt: Date.now(),
                subscribers: new Map()
            };

            const api = {
                id,
                label: state.label,
                ownerExtensionId: state.ownerExtensionId,
                publish: async (eventName, payload = null, publishOptions = {}) => {
                    const envelope = makeRuntimeChannelEnvelope(id, eventName, payload, {
                        ...publishOptions,
                        ownerExtensionId: publishOptions.ownerExtensionId || state.ownerExtensionId
                    });
                    const target = String(publishOptions.target || envelope.target || 'peer').toLowerCase();
                    const deliveries = [];
                    if (publishOptions.local || target === 'local' || target === 'all') {
                        deliveries.push({ target: 'local', ...dispatchRuntimeChannelEnvelope(envelope) });
                    }
                    const sendToOverlay = target === 'overlay' || target === 'all' || (target === 'peer' && runtimeSurface !== 'overlay');
                    const sendToTaskpane = target === 'taskpane' || target === 'all' || (target === 'peer' && runtimeSurface !== 'taskpane');
                    if (sendToOverlay) {
                        deliveries.push({
                            target: 'overlay',
                            result: await window.yoanime.overlay.postMessage({ type: 'yoanime.sdk.channel.message', data: envelope })
                        });
                    }
                    if (sendToTaskpane) {
                        deliveries.push({
                            target: 'taskpane',
                            result: await window.yoanime.taskpane.postMessage({ type: 'yoanime.sdk.channel.message', data: envelope })
                        });
                    }
                    return {
                        success: true,
                        contractVersion: 'runtime-channel-publish.v1',
                        channelId: id,
                        event: envelope.event,
                        messageId: envelope.messageId,
                        deliveries
                    };
                },
                subscribe: (eventName, callback) => {
                    const evt = normalizeChannelEventName(eventName);
                    if (typeof callback !== 'function') throw new Error('Runtime channel subscribe requires a callback.');
                    if (!state.subscribers.has(evt)) state.subscribers.set(evt, new Set());
                    state.subscribers.get(evt).add(callback);
                    return () => state.subscribers.get(evt)?.delete(callback);
                },
                close: () => {
                    runtimeChannels.delete(id);
                    state.subscribers.clear();
                    return { success: true, channelId: id };
                },
                getState: () => ({
                    contractVersion: 'runtime-channel-state.v1',
                    channelId: id,
                    label: state.label,
                    ownerExtensionId: state.ownerExtensionId,
                    surface: runtimeSurface,
                    subscriberEvents: Array.from(state.subscribers.keys()),
                    openedAt: state.openedAt
                })
            };

            state.api = api;
            runtimeChannels.set(id, state);
            return api;
        };

        window.addEventListener('message', event => {
            let message = event.data;
            if (typeof message === 'string') {
                try { message = JSON.parse(message); } catch (_) { return; }
            }
            if (!message) return;

            const type = String(message.type || message.Type || '').toLowerCase();
            const payload = getPayload(message);
            if (type === 'shapeinfo') {
                const selection = { primary: payload, shape: payload, shapes: payload ? [payload] : [] };
                emitSet(listeners.selectionChanged, selection, 'selection.changed');
                emit('selection.changed', selection);
                return;
            }

            if (type === 'multipleshapesselected') {
                const shapes = payload?.shapes || payload?.Shapes || [];
                const selection = {
                    primary: shapes[0] || null,
                    shape: shapes[0] || null,
                    shapes,
                    count: payload?.count || payload?.Count || shapes.length,
                    groupBounds: payload?.groupBounds || payload?.GroupBounds || null
                };
                const sdk = window.yoanime;
                if (sdk?.selection) sdk.selection._lastMulti = selection;
                emitSet(listeners.selectionChanged, selection, 'selection.changed');
                emit('selection.changed', selection);
                return;
            }

            if (type === 'noshapeselected' || type === 'noshapeselection') {
                emitSet(listeners.noSelection, payload || null, 'selection.cleared');
                emit('selection.cleared', payload || null);
                return;
            }

            if (type.startsWith('yoanime.sdk.response.')) {
                const reqId = message.reqId || message.ReqId;
                const request = reqId ? pending.get(reqId) : null;
                if (!request) return;
                window.clearTimeout(request.timeout);
                pending.delete(reqId);
                if (type === 'yoanime.sdk.response.error' || (payload && payload.success === false && payload.error)) {
                    const error = new Error(payload?.error || payload?.message || 'yoAnime SDK command failed.');
                    error.payload = payload;
                    request.reject(error);
                } else {
                    request.resolve(payload);
                }
                return;
            }

            if (type === 'yoanime.sdk.overlay.message' || type === 'yoanime.sdk.taskpane.message') {
                const bridgePayload = getPayload(message);
                const bridgeMessage = unwrapBridgeMessage(bridgePayload);
                const bridgeType = String(bridgeMessage?.type || bridgeMessage?.Type || '').toLowerCase();
                if (bridgeType === 'yoanime.sdk.channel.message' || isRuntimeChannelEnvelope(bridgeMessage)) {
                    dispatchRuntimeChannelEnvelope(unwrapRuntimeChannelEnvelope(bridgeMessage));
                }
                const set = type === 'yoanime.sdk.overlay.message' ? listeners.overlayMessage : listeners.taskpaneMessage;
                [...set].forEach(callback => {
                    try { callback(bridgeMessage); } catch (error) { console.error('[yoAnime iframe SDK] Surface message callback failed:', error); }
                });
                return;
            }

            if (type === 'yoanime.sdk.websurface.event') {
                [...listeners.webSurfaceEvent].forEach(callback => {
                    try { callback(payload); } catch (error) { console.error('[yoAnime iframe SDK] Web Surface callback failed:', error); }
                });
                emit('webSurface.event', payload);
                return;
            }

            if (type === 'yoanime.sdk.selectionchanged') {
                const selection = payload?.primary || payload?.Primary || payload?.shape || payload?.Shape
                    ? payload
                    : { primary: payload, shape: payload, shapes: payload ? [payload] : [] };
                emitSet(listeners.selectionChanged, selection, 'selection.changed');
                emit('selection.changed', selection);
                return;
            }

            if (type === 'yoanime.sdk.noselection') {
                emitSet(listeners.noSelection, payload || null, 'selection.cleared');
                emit('selection.cleared', payload || null);
                return;
            }

            if (type === 'yoanime.sdk.timeline.updated') {
                emitSet(listeners.timelineUpdated, payload, 'timeline.updated');
                emit('timeline.updated', payload);
                return;
            }

            if (type === 'yoanime.sdk.timeline.tick') {
                emitSet(listeners.timelineTick, payload, 'timeline.tick');
                emit('timeline.tick', payload);
                return;
            }

            if (type === 'yoanime.sdk.playback.started') {
                emitSet(listeners.playbackStarted, payload || {}, 'playback.started');
                emit('playback.started', payload || {});
                return;
            }

            if (type === 'yoanime.sdk.playback.stopped') {
                emitSet(listeners.playbackStopped, payload || {}, 'playback.stopped');
                emit('playback.stopped', payload || {});
                return;
            }

            if (type === 'yoanime.sdk.session.ended' || type === 'yoanime.sdk.lifecycle.sessionended') {
                // Reject all pending SDK requests immediately — the session context is gone,
                // so they will never receive a response. Prevents 15-second timeout wait during
                // presentation switches or extension unmounts.
                const terminated = new Error('SDK session ended');
                terminated.code = 'session_ended';
                for (const [reqId, request] of pending) {
                    window.clearTimeout(request.timeout);
                    pending.delete(reqId);
                    try { request.reject(terminated); } catch (_) { /* best effort */ }
                }
                emitSet(listeners.sessionEnded, payload || {}, 'session.ended');
                emit('session.ended', payload || {});
                return;
            }

            if (type === 'yoanime.sdk.scene.updated' || type === 'sceneupdated') {
                emitSet(listeners.sceneUpdated, payload, 'scene.updated');
                emit('scene.updated', payload);
                return;
            }

            if (type === 'yoanime.sdk.slideshow.started') {
                emitSet(listeners.slideshowStarted, payload || {}, 'slideshow.started');
                emit('slideshow.started', payload || {});
                return;
            }

            if (type === 'yoanime.sdk.slideshow.slidechanged') {
                emitSet(listeners.slideshowSlideChanged, payload || {}, 'slideshow.slidechanged');
                emit('slideshow.slidechanged', payload || {});
                return;
            }

            if (type === 'yoanime.sdk.slideshow.ended') {
                emitSet(listeners.slideshowEnded, payload || {}, 'slideshow.ended');
                emit('slideshow.ended', payload || {});
                return;
            }

            if (type === 'yoanime.sdk.trajectory.overlayupdated') {
                emitSet(listeners.trajectoryOverlayUpdated, payload || {}, 'trajectory.overlayupdated');
                emit('trajectory.overlayupdated', payload || {});
                return;
            }

            if (type === 'yoanime.sdk.trajectory.selectionupdated') {
                emitSet(listeners.trajectorySelectionUpdated, payload || {}, 'trajectory.selectionupdated');
                emit('trajectory.selectionupdated', payload || {});
                return;
            }

            if (type === 'yoanime.sdk.runtime.warning') {
                emitSet(listeners.runtimeWarning, payload || {}, 'runtime.warning');
                emit('runtime.warning', payload || {});
                return;
            }

            if (type === 'yoanime.sdk.constraints.changed') {
                emitSet(listeners.constraintChanged, payload || {}, 'constraints.changed');
                emit('constraints.changed', payload || {});
                return;
            }

            if (type === 'yoanime.sdk.behavior.changed') {
                emitSet(listeners.behaviorChanged, payload || {}, 'behavior.changed');
                emit('behavior.changed', payload || {});
                return;
            }
        });

        const unwrapData = value => value?.data ?? value?.Data ?? value?.result ?? value?.Result ?? value;
        const asArray = value => Array.isArray(value) ? value : [];
        const readNumber = (value, fallback = 0) => {
            const n = Number(value);
            return Number.isFinite(n) ? n : fallback;
        };
        const round = value => {
            const n = Number(value);
            return Number.isFinite(n) ? Number(n.toFixed(3)) : null;
        };
        const readList = value => Array.isArray(value)
            ? value.map(item => String(item || '').trim().toLowerCase()).filter(Boolean)
            : String(value || '').split(/[,;|]/g).map(item => item.trim().toLowerCase()).filter(Boolean);
        const readShapeBounds = shape => {
            const bounds = shape?.bounds || shape?.Bounds || shape?.boundsPoints || shape?.BoundsPoints || shape?.geometry || shape?.Geometry || {};
            const left = readNumber(bounds.left ?? bounds.Left ?? bounds.x ?? bounds.X ?? shape?.x ?? shape?.X ?? shape?.left ?? shape?.Left, 0);
            const top = readNumber(bounds.top ?? bounds.Top ?? bounds.y ?? bounds.Y ?? shape?.y ?? shape?.Y ?? shape?.top ?? shape?.Top, 0);
            const width = readNumber(bounds.width ?? bounds.Width ?? shape?.width ?? shape?.Width, 0);
            const height = readNumber(bounds.height ?? bounds.Height ?? shape?.height ?? shape?.Height, 0);
            const rotation = readNumber(bounds.rotation ?? bounds.Rotation ?? shape?.rotation ?? shape?.Rotation, 0);
            return {
                left,
                top,
                width,
                height,
                right: readNumber(bounds.right ?? bounds.Right, left + width),
                bottom: readNumber(bounds.bottom ?? bounds.Bottom, top + height),
                centerX: readNumber(bounds.centerX ?? bounds.CenterX, left + width * 0.5),
                centerY: readNumber(bounds.centerY ?? bounds.CenterY, top + height * 0.5),
                rotation
            };
        };
        const flattenSceneGraphNodes = (nodes, output = []) => {
            for (const node of asArray(nodes)) {
                if (!node || typeof node !== 'object') continue;
                output.push({
                    ...node,
                    runtimeNodeId: node.runtimeNodeId || node.RuntimeNodeId || node.nodeId || node.NodeId,
                    nodeId: node.nodeId || node.NodeId || node.runtimeNodeId || node.RuntimeNodeId,
                    name: node.name || node.Name || node.shapeName || node.ShapeName,
                    shapeName: node.shapeName || node.ShapeName || node.name || node.Name,
                    powerPointShapeId: node.powerPointShapeId || node.PowerPointShapeId,
                    type: node.type || node.Type,
                    roles: node.roles || node.Roles || [],
                    tags: node.tags || node.Tags || [],
                    metadata: node.metadata || node.Metadata || {},
                    bounds: node.bounds || node.Bounds || {
                        left: node.left ?? node.Left ?? node.x ?? node.X,
                        top: node.top ?? node.Top ?? node.y ?? node.Y,
                        width: node.width ?? node.Width,
                        height: node.height ?? node.Height,
                        rotation: node.rotation ?? node.Rotation
                    }
                });
                flattenSceneGraphNodes(node.children || node.Children, output);
            }
            return output;
        };
        const unwrapSceneShapes = sceneResult => {
            const source = unwrapData(sceneResult);
            const snapshot = source?.fullSnapshot || source?.FullSnapshot || source?.snapshot || source?.Snapshot || source;
            const directShapes = asArray(snapshot?.shapes || snapshot?.Shapes || snapshot?.nodes || snapshot?.Nodes || snapshot?.scene?.shapes || snapshot?.Scene?.Shapes);
            if (directShapes.length) return directShapes;
            return flattenSceneGraphNodes(snapshot?.rootNodes || snapshot?.RootNodes);
        };
        const unwrapSlideContext = contextResult => unwrapData(contextResult);
        const makeKeyframeValue = value => {
            if (value && typeof value === 'object' && ('number' in value || 'Number' in value || 'color' in value || 'Color' in value)) {
                return value;
            }
            const n = Number(value);
            return Number.isFinite(n) ? { number: n } : { string: String(value ?? '') };
        };
        const YOANIME_NS = 'yoanime';

        const normalizeMotion = motion => {
            if (motion === undefined || motion === null) return undefined;
            if (typeof motion === 'string') return { provider: motion };
            if (typeof motion !== 'object') return undefined;
            const { provider, options, providers } = motion;
            if (providers) {
                return { providers: providers.map(p => typeof p === 'string' ? { provider: p } : p) };
            }
            const result = {};
            if (provider) result.provider = provider;
            if (options) result.options = options;
            return result;
        };

        const normalizeBakeLayers = (layers, fallbackDuration) => asArray(layers).map(layer => {
            const rawProperties = layer?.properties || layer?.Properties || {};
            const entries = Array.isArray(rawProperties)
                ? rawProperties
                : Object.entries(rawProperties).map(([propertyKind, property]) => ({ ...(property || {}), propertyKind }));

            // Normalize declarative `motion` into namespaced metadata
            const metadata = { ...(layer?.metadata || layer?.Metadata || {}) };
            const motion = layer?.motion || layer?.Motion;
            if (motion !== undefined && motion !== null) {
                const normalized = normalizeMotion(motion);
                if (normalized) {
                    const yoanime = metadata[YOANIME_NS] = { ...(metadata[YOANIME_NS]) };
                    if (yoanime.motion) {
                        console.warn('yoAnimeBridge: layer.motion overrides metadata.yoanime.motion');
                    }
                    yoanime.motion = normalized;
                }
            }

            return {
                RuntimeNodeId: layer?.runtimeNodeId || layer?.RuntimeNodeId || layer?.nodeId || layer?.NodeId,
                PowerPointShapeId: layer?.powerPointShapeId || layer?.PowerPointShapeId || layer?.shapeId || layer?.ShapeId,
                Metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
                Properties: entries.map(property => ({
                    PropertyKind: property?.propertyKind || property?.PropertyKind,
                    StartTimeSeconds: readNumber(property?.startTimeSeconds ?? property?.StartTimeSeconds, 0),
                    DurationSeconds: readNumber(property?.durationSeconds ?? property?.DurationSeconds, fallbackDuration || 2),
                    DelaySeconds: readNumber(property?.delaySeconds ?? property?.DelaySeconds, 0),
                    EasingFunction: property?.easingFunction || property?.EasingFunction,
                    Interpolation: property?.interpolation || property?.Interpolation,
                    Keyframes: asArray(property?.keyframes || property?.Keyframes).map(keyframe => ({
                        NormalizedTime: Math.max(0, Math.min(1, readNumber(keyframe?.normalizedTime ?? keyframe?.NormalizedTime, 0))),
                        Value: makeKeyframeValue(keyframe?.value ?? keyframe?.Value),
                        EasingOverride: keyframe?.easingOverride ?? keyframe?.EasingOverride
                    }))
                })).filter(property => property.PropertyKind)
            };
        }).filter(layer => layer.RuntimeNodeId || layer.PowerPointShapeId);

        const createPhysicsApi = () => {
            const inferRoles = (shape, tags, options) => {
                const roles = new Set(readList(shape?.roles || shape?.Roles));
                const name = String(shape?.name || shape?.Name || shape?.shapeName || shape?.ShapeName || '').toLowerCase();
                if (options?.inferFromNames !== false) {
                    if (name.includes('ball') || name.includes('sphere')) roles.add('ball');
                    if (name.includes('ramp') || name.includes('slope')) roles.add('ramp');
                    if (name.includes('projectile') || name.includes('bullet')) roles.add('projectile');
                    if (name.includes('floor') || name.includes('ground')) roles.add('floor');
                    if (name.includes('wall')) roles.add('wall');
                    const mapped = options?.roleMap?.[name];
                    readList(mapped).forEach(role => roles.add(role));
                }
                if (tags.has('static')) roles.add('static');
                if (tags.has('dynamic')) roles.add('dynamic');
                return Array.from(roles);
            };

            const createWorldFromScene = async (options = {}) => {
                const slideContext = unwrapSlideContext(await window.yoanime.slide.getContext());
                const scene = await window.yoanime.scene.get({
                    includeGeometry: true,
                    includeShapeType: true,
                    includeTags: true,
                    knownVersion: options.knownVersion ?? 0
                });
                const shapes = unwrapSceneShapes(scene);
                const bodies = shapes.map(shape => {
                    const bounds = readShapeBounds(shape);
                    const metadata = shape?.metadata || shape?.Metadata || {};
                    const tags = new Set(readList(shape?.tags || shape?.Tags));
                    const roles = inferRoles(shape, tags, options);
                    const isStatic = roles.some(role => ['ramp', 'floor', 'ground', 'wall', 'static'].includes(role));
                    const isProjectile = roles.includes('projectile') || roles.includes('bullet');
                    const circularity = bounds.width > 0 && bounds.height > 0 ? Math.min(bounds.width, bounds.height) / Math.max(bounds.width, bounds.height) : 0;
                    const requestedColliderType = String(metadata.colliderType || metadata.physicsColliderType || '').toLowerCase();
                    const isRound = requestedColliderType === 'circle'
                        ? true
                        : requestedColliderType === 'rectangle'
                            ? false
                            : (roles.includes('ball') || isProjectile || circularity >= 0.82);
                    const radiusScale = readNumber(metadata.radiusScale ?? (isProjectile ? options.projectileRadiusScale : options.ballRadiusScale), isProjectile ? 0.92 : 0.96);
                    const padding = readNumber(metadata.collisionPadding ?? metadata.padding ?? options.surfacePadding, 0);
                    const thicknessMultiplier = Math.max(0.1, readNumber(metadata.thicknessMultiplier ?? options.thicknessMultiplier, 1));
                    const radius = Math.max(0.5, Math.min(bounds.width || bounds.height, bounds.height || bounds.width) * 0.5 * radiusScale);
                    const bodyType = isRound ? 'circle' : 'rectangle';
                    const physicsRotation = (options.ignoreInitialBallRotation !== false && isRound && !isStatic) ? 0 : bounds.rotation;
                    const runtimeNodeId = shape?.runtimeNodeId || shape?.RuntimeNodeId || shape?.nodeId || shape?.NodeId || shape?.id || shape?.Id;
                    return {
                        runtimeNodeId,
                        powerPointShapeId: shape?.powerPointShapeId || shape?.PowerPointShapeId || shape?.shapeId || shape?.ShapeId,
                        name: shape?.name || shape?.Name || shape?.shapeName || shape?.ShapeName || runtimeNodeId,
                        type: shape?.type || shape?.Type || shape?.shapeType || shape?.ShapeType,
                        roles,
                        tags: Array.from(tags),
                        metadata,
                        shape,
                        bodyType,
                        isStatic,
                        isDynamic: !isStatic,
                        isProjectile,
                        bounds,
                        center: { x: bounds.centerX, y: bounds.centerY },
                        radius,
                        angleRadians: physicsRotation * Math.PI / 180,
                        collider: {
                            width: bodyType === 'circle' ? radius * 2 : Math.max(1, bounds.width + padding * 2),
                            height: bodyType === 'circle' ? radius * 2 : Math.max(1, bounds.height * thicknessMultiplier + padding * 2),
                            radius,
                            padding,
                            thicknessMultiplier,
                            rotation: bounds.rotation,
                            physicsRotation,
                            angleRadians: physicsRotation * Math.PI / 180
                        },
                        matter: {
                            label: shape?.name || shape?.Name || runtimeNodeId,
                            isStatic,
                            angle: physicsRotation * Math.PI / 180,
                            restitution: readNumber(metadata.restitution ?? metadata.bounce, isProjectile ? 0.35 : 0.72),
                            friction: readNumber(metadata.friction, isStatic ? 0.45 : 0.08),
                            density: readNumber(metadata.density, 0.001),
                            mass: metadata.mass != null && metadata.mass !== '' ? readNumber(metadata.mass, undefined) : undefined
                        }
                    };
                }).filter(body => body.runtimeNodeId && body.bounds.width > 0 && body.bounds.height > 0);
                const byRole = role => bodies.filter(body => body.roles.includes(role));
                const world = {
                    contractVersion: 'physics-world.v1',
                    units: 'powerpoint-slide-points',
                    slideContext,
                    scene: unwrapData(scene),
                    bounds: {
                        slide: slideContext?.slide?.boundsPoints || slideContext?.Slide?.BoundsPoints,
                        physics: slideContext?.physics || slideContext?.Physics,
                        pasteboard: slideContext?.pasteboard?.recommendedBoundsPoints || slideContext?.Pasteboard?.RecommendedBoundsPoints
                    },
                    bodies,
                    staticBodies: bodies.filter(body => body.isStatic),
                    dynamicBodies: bodies.filter(body => !body.isStatic),
                    balls: byRole('ball'),
                    ramps: byRole('ramp'),
                    projectiles: bodies.filter(body => body.isProjectile),
                    byRole,
                    toMatterBodies: Matter => {
                        if (!Matter?.Bodies) throw new Error('Matter.js Bodies API is required.');
                        return bodies.map(body => {
                            const opts = {
                                ...body.matter,
                                yoanime: {
                                    runtimeNodeId: body.runtimeNodeId,
                                    powerPointShapeId: body.powerPointShapeId,
                                    roles: body.roles,
                                    tags: body.tags
                                }
                            };
                            const matterBody = body.bodyType === 'circle'
                                ? Matter.Bodies.circle(body.center.x, body.center.y, body.radius, opts)
                                : Matter.Bodies.rectangle(body.center.x, body.center.y, body.collider.width, body.collider.height, opts);
                            if (!body.isStatic && Number.isFinite(body.matter.mass) && Matter.Body?.setMass) Matter.Body.setMass(matterBody, body.matter.mass);
                            return matterBody;
                        });
                    }
                };
                return world;
            };

            const inspectWorld = world => asArray(world?.bodies).map(body => ({
                name: body.name,
                runtimeNodeId: body.runtimeNodeId,
                type: body.bodyType,
                isStatic: !!body.isStatic,
                roles: body.roles || [],
                x: round(body.center?.x),
                y: round(body.center?.y),
                w: round(body.bounds?.width),
                h: round(body.bounds?.height),
                rotation: round(body.bounds?.rotation),
                colliderWidth: round(body.collider?.width),
                colliderHeight: round(body.collider?.height),
                radius: round(body.collider?.radius),
                friction: round(body.matter?.friction),
                restitution: round(body.matter?.restitution),
                density: round(body.matter?.density)
            }));

            const compareSceneToSlide = (sceneOrWorld, slideContext) => {
                const shapes = Array.isArray(sceneOrWorld?.bodies)
                    ? sceneOrWorld.bodies.map(body => body.shape || body)
                    : unwrapSceneShapes(sceneOrWorld);
                const ctx = slideContext || sceneOrWorld?.slideContext || {};
                const slide = ctx.slide || ctx.Slide || {};
                const physics = ctx.physics || ctx.Physics || {};
                const slideW = readNumber(slide.widthPoints ?? slide.WidthPoints ?? slide.boundsPoints?.width ?? slide.BoundsPoints?.Width ?? physics.rightWallX, 0);
                const slideH = readNumber(slide.heightPoints ?? slide.HeightPoints ?? slide.boundsPoints?.height ?? slide.BoundsPoints?.Height ?? physics.floorY, 0);
                const rows = shapes.map(shape => {
                    const bounds = readShapeBounds(shape);
                    const issues = [];
                    if (bounds.width <= 0 || bounds.height <= 0) issues.push('invalid-size');
                    if (slideW > 0 && bounds.width > slideW * 3) issues.push('width-exceeds-pasteboard-heuristic');
                    if (slideH > 0 && bounds.height > slideH * 3) issues.push('height-exceeds-pasteboard-heuristic');
                    return {
                        name: shape?.name || shape?.Name || shape?.shapeName || shape?.ShapeName,
                        runtimeNodeId: shape?.runtimeNodeId || shape?.RuntimeNodeId || shape?.nodeId || shape?.NodeId,
                        x: round(bounds.left),
                        y: round(bounds.top),
                        w: round(bounds.width),
                        h: round(bounds.height),
                        rotation: round(bounds.rotation),
                        slideW: round(slideW),
                        slideH: round(slideH),
                        issues: issues.join(','),
                        domain: issues.length ? 'suspect' : 'slide-points'
                    };
                });
                return {
                    contractVersion: 'physics-geometry-diagnostics.v1',
                    shapeCount: rows.length,
                    suspectCount: rows.filter(row => row.issues).length,
                    rows
                };
            };

            const generateSimulation = async (request = {}) => {
                const Matter = request.Matter || window.Matter;
                if (!Matter?.Engine || !Matter?.Composite || !Matter?.Body) throw new Error('Matter.js Engine, Composite, and Body APIs are required for physics.generateSimulation.');
                const world = request.world || await createWorldFromScene(request.worldOptions || {});
                if (!world.dynamicBodies.length) {
                    const bodyNames = world.bodies.map(body => `${body.name || body.runtimeNodeId || 'shape'}[${(body.roles || []).join('|') || 'no-role'}]`).join(', ');
                    throw new Error(`Physics bake has no dynamic bodies, so no timeline layers can be generated. Mark at least one shape as ball/projectile/dynamic. Detected bodies: ${bodyNames || 'none'}.`);
                }
                const durationSeconds = Math.max(0.1, readNumber(request.durationSeconds, 4));
                const fps = Math.max(1, Math.min(120, readNumber(request.fps, 30)));
                const baseFrameCount = Math.max(2, Math.round(durationSeconds * fps));
                const settleSeconds = Math.max(0, readNumber(request.settleSeconds ?? request.tailSettleSeconds, 0));
                const settleFrameCount = Math.max(0, Math.round(settleSeconds * fps));
                const frameCount = baseFrameCount + settleFrameCount;
                const engine = Matter.Engine.create();
                const gravity = request.gravity || { x: 0, y: 1, scale: 0.001 };
                engine.gravity.x = readNumber(gravity.x, 0);
                engine.gravity.y = readNumber(gravity.y, 1);
                engine.gravity.scale = readNumber(gravity.scale, 0.001);
                const matterBodies = world.toMatterBodies(Matter);
                const bodyByRuntimeId = new Map();
                matterBodies.forEach(body => {
                    const runtimeNodeId = body?.yoanime?.runtimeNodeId;
                    if (runtimeNodeId) bodyByRuntimeId.set(runtimeNodeId, body);
                });
                Matter.Composite.add(engine.world, matterBodies);
                if (typeof request.beforeSimulate === 'function') await request.beforeSimulate({ Matter, engine, world, bodyByRuntimeId, matterBodies });
                const samples = new Map();
                world.dynamicBodies.forEach(body => samples.set(body.runtimeNodeId, {
                    x: [],
                    y: [],
                    r: [],
                    offsetX: readNumber(body.center?.x, 0) - readNumber(body.bounds?.left, 0),
                    offsetY: readNumber(body.center?.y, 0) - readNumber(body.bounds?.top, 0)
                }));
                for (let frame = 0; frame <= frameCount; frame++) {
                    const normalizedTime = frame / frameCount;
                    for (const source of world.dynamicBodies) {
                        const body = bodyByRuntimeId.get(source.runtimeNodeId);
                        if (!body) continue;
                        const bucket = samples.get(source.runtimeNodeId);
                        bucket.x.push({ normalizedTime, value: { number: Number(body.position.x) - bucket.offsetX } });
                        bucket.y.push({ normalizedTime, value: { number: Number(body.position.y) - bucket.offsetY } });
                        bucket.r.push({ normalizedTime, value: { number: Number(body.angle || 0) * 180 / Math.PI } });
                    }
                    if (frame < frameCount) Matter.Engine.update(engine, 1000 / fps);
                }
                const layers = world.dynamicBodies.map(body => {
                    const bucket = samples.get(body.runtimeNodeId);
                    return {
                        runtimeNodeId: body.runtimeNodeId,
                        properties: {
                            PositionX: { durationSeconds, keyframes: bucket?.x || [] },
                            PositionY: { durationSeconds, keyframes: bucket?.y || [] },
                            Rotation: { durationSeconds, keyframes: bucket?.r || [] }
                        }
                    };
                });
                return {
                    contractVersion: 'generated-motion.v1',
                    label: request.label || 'Physics Simulation',
                    durationSeconds,
                    clear: request.clear || ['PositionX', 'PositionY', 'Rotation'],
                    layers,
                    contacts: [],
                    world
                };
            };

            const bakeSimulation = async (request = {}) => {
                const generated = await generateSimulation(request);
                if (!generated.layers.length) {
                    throw new Error('Physics bake generated no layers. Refresh the world and ensure at least one non-static physics body exists.');
                }
                const bake = await window.yoanime.timeline.bake({
                    label: request.label || generated.label,
                    clear: generated.clear,
                    durationSeconds: generated.durationSeconds,
                    layers: generated.layers
                });
                if (request.play) {
                    await window.yoanime.timeline.stop();
                    await window.yoanime.timeline.play(request.startTimeSeconds || 0);
                }
                return {
                    ...generated,
                    bake,
                    success: bake?.success ?? bake?.Success ?? true,
                    layerCount: generated.layers.length,
                    timelineVersion: bake?.timelineVersion || bake?.TimelineVersion,
                    contacts: generated.contacts || []
                };
            };

            const defaultWorldOptions = options => ({
                inferFromNames: options.inferFromNames ?? true,
                roleMap: options.roleMap,
                rampPadding: options.rampPadding ?? 0,
                floorPadding: options.floorPadding ?? 0,
                wallPadding: options.wallPadding ?? 0,
                surfacePadding: options.surfacePadding ?? 0,
                ballRadiusScale: options.ballRadiusScale ?? 1,
                projectileRadiusScale: options.projectileRadiusScale ?? 1,
                ignoreInitialBallRotation: options.ignoreInitialBallRotation ?? true,
                ...(options.worldOptions || {})
            });
            const runPreset = async (presetId, options = {}, configure) => {
                const Matter = options.Matter || window.Matter;
                const world = options.world || await createWorldFromScene(defaultWorldOptions(options));
                const request = {
                    Matter,
                    world,
                    label: options.label || `Physics Preset: ${presetId}`,
                    durationSeconds: options.durationSeconds,
                    fps: options.fps,
                    settleSeconds: options.settleSeconds,
                    gravity: options.gravity || { x: 0, y: 1, scale: 0.001 },
                    play: options.play ?? true,
                    clear: options.clear,
                    beforeSimulate: options.beforeSimulate
                };
                if (configure) await configure({ Matter, world, request, options });
                const result = await bakeSimulation(request);
                return { ...result, presetId, inspection: inspectWorld(world), diagnostics: compareSceneToSlide(world) };
            };

            return {
                createWorldFromScene,
                inspectWorld,
                compareSceneToSlide,
                generateSimulation,
                bakeSimulation,
                primitives: {
                    materialProfiles: {
                        rubber: { restitution: 0.92, friction: 0.08, density: 0.001 },
                        glass: { restitution: 0.65, friction: 0.02, density: 0.0008 },
                        metal: { restitution: 0.38, friction: 0.18, density: 0.0032 },
                        wood: { restitution: 0.34, friction: 0.42, density: 0.0018 },
                        paper: { restitution: 0.18, friction: 0.6, density: 0.0006 },
                        ice: { restitution: 0.2, friction: 0.005, density: 0.0009 },
                        concrete: { restitution: 0.12, friction: 0.8, density: 0.0024 }
                    },
                    listMaterialProfiles() { return Object.entries(this.materialProfiles).map(([id, profile]) => ({ id, ...profile })); },
                    getMaterialProfile(id) { const key = String(id || '').toLowerCase(); return this.materialProfiles[key] ? { id: key, ...this.materialProfiles[key] } : null; },
                    gravity: (x = 0, y = 1, scale = 0.001) => ({ x: Number(x), y: Number(y), scale: Number(scale) }),
                    impulse: (options = {}) => async ({ Matter, world, bodyByRuntimeId }) => {
                        const roles = readList(options.roles || options.role);
                        for (const source of world?.dynamicBodies || []) {
                            const matchesRole = roles.length && roles.some(role => source.roles?.includes(role));
                            const matchesId = options.runtimeNodeId && source.runtimeNodeId === options.runtimeNodeId;
                            if ((roles.length || options.runtimeNodeId) && !matchesRole && !matchesId) continue;
                            const body = bodyByRuntimeId.get(source.runtimeNodeId);
                            if (!body) continue;
                            Matter.Body.setVelocity(body, { x: readNumber(options.velocityX ?? options.x, 0), y: readNumber(options.velocityY ?? options.y, 0) });
                            if (options.angularVelocity != null) Matter.Body.setAngularVelocity(body, readNumber(options.angularVelocity, 0));
                        }
                    },
                    composeBeforeSimulate: (...steps) => async args => {
                        for (const step of steps.flat().filter(Boolean)) if (typeof step === 'function') await step(args);
                    },
                    worldOptions: defaultWorldOptions,
                    prepareBakeRequest: async (options = {}) => {
                        const world = options.world || await createWorldFromScene(defaultWorldOptions(options));
                        return { contractVersion: 'physics-primitive-request.v1', world, inspection: inspectWorld(world), geometry: compareSceneToSlide(world), request: { ...options, world } };
                    }
                },
                diagnostics: {
                    analyzeWorld: world => {
                        const bodies = asArray(world?.bodies);
                        const sceneShapes = unwrapSceneShapes(world?.scene);
                        const bodyIds = new Set(bodies.map(body => body.runtimeNodeId).filter(Boolean));
                        const skippedBodies = sceneShapes.filter(shape => !bodyIds.has(shape.runtimeNodeId || shape.RuntimeNodeId || shape.nodeId || shape.NodeId)).map(shape => ({
                            name: shape.name || shape.Name || shape.shapeName || shape.ShapeName,
                            runtimeNodeId: shape.runtimeNodeId || shape.RuntimeNodeId || shape.nodeId || shape.NodeId,
                            reasons: ['not-classified-as-physics-body'],
                            bounds: readShapeBounds(shape)
                        }));
                        return { contractVersion: 'physics-diagnostics.v1', bodyCount: bodies.length, skippedCount: skippedBodies.length, warningCount: skippedBodies.length ? 1 : 0, warnings: skippedBodies.length ? [`${skippedBodies.length}-scene-shape(s)-not-used-by-physics-world`] : [], colliderRows: inspectWorld(world), skippedBodies };
                    },
                    summarizeBake: result => {
                        const layers = asArray(result?.layers || result?.Layers);
                        const contacts = asArray(result?.contacts || result?.Contacts);
                        const readKeyframes = property => asArray(property?.keyframes || property?.Keyframes);
                        const readValueNumber = keyframe => readNumber(keyframe?.value?.number ?? keyframe?.Value?.Number ?? keyframe?.value ?? keyframe?.Value, NaN);
                        const buildPathPoints = layer => {
                            const properties = layer?.properties || layer?.Properties || {};
                            const positionX = properties.PositionX || properties.positionX || properties.X || properties.x;
                            const positionY = properties.PositionY || properties.positionY || properties.Y || properties.y;
                            const xKeys = readKeyframes(positionX);
                            const yKeys = readKeyframes(positionY);
                            const count = Math.min(xKeys.length, yKeys.length);
                            const points = [];
                            for (let i = 0; i < count; i++) {
                                const x = readValueNumber(xKeys[i]);
                                const y = readValueNumber(yKeys[i]);
                                const normalizedTime = readNumber(xKeys[i]?.normalizedTime ?? xKeys[i]?.NormalizedTime ?? yKeys[i]?.normalizedTime ?? yKeys[i]?.NormalizedTime, count <= 1 ? 0 : i / (count - 1));
                                if (Number.isFinite(x) && Number.isFinite(y)) points.push({ normalizedTime, x, y });
                            }
                            return points;
                        };
                        return {
                            contractVersion: 'physics-bake-diagnostics.v1',
                            layerCount: layers.length,
                            contactCount: contacts.length,
                            pathRows: layers.map(layer => {
                                const points = buildPathPoints(layer);
                                return {
                                    runtimeNodeId: layer.runtimeNodeId || layer.RuntimeNodeId,
                                    pointCount: points.length,
                                    points
                                };
                            }),
                            contactRows: contacts
                        };
                    }
                },
                presets: {
                    _defaultWorldOptions: defaultWorldOptions,
                    rampRoll: options => runPreset('ramp-roll', { label: 'Physics Preset: Ramp Roll', durationSeconds: 4.5, ...options }, async ({ Matter, world, request, options }) => {
                        request.beforeSimulate = async args => {
                            if (typeof options.beforeSimulate === 'function') await options.beforeSimulate(args);
                            const ramp = world.ramps?.[0] || world.staticBodies?.find(body => body.roles.includes('ramp'));
                            const direction = readNumber(ramp?.collider?.physicsRotation || ramp?.bounds?.rotation, 0) >= 0 ? 1 : -1;
                            for (const source of world.balls?.length ? world.balls : world.dynamicBodies) {
                                const body = args.bodyByRuntimeId.get(source.runtimeNodeId);
                                if (!body) continue;
                                Matter.Body.setVelocity(body, { x: readNumber(options.initialVelocityX, 2.6 * direction), y: readNumber(options.initialVelocityY, 0) });
                                Matter.Body.setAngularVelocity(body, readNumber(options.initialAngularVelocity, 0.08) * direction);
                            }
                        };
                    }),
                    projectileImpact: options => runPreset('projectile-impact', { label: 'Physics Preset: Projectile Impact', durationSeconds: 3.5, ...options }, async ({ Matter, world, request, options }) => {
                        request.beforeSimulate = async args => {
                            if (typeof options.beforeSimulate === 'function') await options.beforeSimulate(args);
                            for (const source of world.projectiles?.length ? world.projectiles : world.dynamicBodies.slice(0, 1)) {
                                const body = args.bodyByRuntimeId.get(source.runtimeNodeId);
                                if (!body) continue;
                                Matter.Body.setVelocity(body, { x: readNumber(options.initialVelocityX, 8), y: readNumber(options.initialVelocityY, -5) });
                            }
                        };
                    }),
                    fallingStack: options => runPreset('falling-stack', { label: 'Physics Preset: Falling Stack', durationSeconds: 4.5, ...options }),
                    multiBallCascade: options => runPreset('multi-ball-cascade', { label: 'Physics Preset: Multi-Ball Cascade', durationSeconds: 5, ...options }, async ({ Matter, world, request, options }) => {
                        request.beforeSimulate = async args => {
                            if (typeof options.beforeSimulate === 'function') await options.beforeSimulate(args);
                            world.dynamicBodies.forEach((source, index) => {
                                const body = args.bodyByRuntimeId.get(source.runtimeNodeId);
                                if (!body) return;
                                Matter.Body.setVelocity(body, { x: readNumber(options.initialVelocityX, 1.4 + index * 0.45), y: readNumber(options.initialVelocityY, -0.4) });
                            });
                        };
                    })
                }
            };
        };

        window.sendSdkRequest = sendSdkRequest; // shorthand alias
        window.yoanime = {
            version: SDK_VERSION,
            debug: { enableLogging: () => {} },
            sdk: { request: sendSdkRequest },
            events: {
                on: (eventName, callback) => {
                    if (!listeners.events.has(eventName)) listeners.events.set(eventName, new Set());
                    listeners.events.get(eventName).add(callback);
                    return () => listeners.events.get(eventName)?.delete(callback);
                }
            },
            runtime: {
                get surface() { return runtimeSurface; },
                ready: async () => {
                    postToHost({ type: 'yoanime.sdk.ready', sdkVersion: SDK_VERSION, data: { message: 'SDK Ready', surface: runtimeSurface } });
                    await window.yoanime.runtime.getCapabilities().catch(() => null);
                    return true;
                },
                onSessionEnded: (callback) => {
                    listeners.sessionEnded.add(callback);
                    return () => listeners.sessionEnded.delete(callback);
                },
                getCapabilities: async () => rememberRuntimeSurface(await sendSdkRequest('yoanime.sdk.runtime.getcapabilities', {}))
            },
            selection: {
                _lastMulti: null,
                get: async () => {
                    const result = await sendSdkRequest('yoanime.sdk.selection.get', {});
                    if (result) return result;
                    return window.yoanime.selection._lastMulti;
                },
                onChanged: (callback) => {
                    listeners.selectionChanged.add(callback);
                    return () => listeners.selectionChanged.delete(callback);
                },
                onCleared: (callback) => {
                    listeners.noSelection.add(callback);
                    return () => listeners.noSelection.delete(callback);
                }
            },
            scene: {
                get: async (request = {}) => sendSdkRequest('yoanime.sdk.scene.get', request || {}),
                roles: {
                    set: async (runtimeNodeId, request = {}) => sendSdkRequest('yoanime.sdk.scene.roles.set', {
                        runtimeNodeId,
                        roles: request.roles || request.Roles || [],
                        tags: request.tags || request.Tags || [],
                        metadata: request.metadata || request.Metadata || {}
                    })
                }
            },
            slide: { getContext: async () => sendSdkRequest('yoanime.sdk.slide.getcontext', {}) },
            geometry: {
                screenToSlide: async (x, y) => sendSdkRequest('yoanime.sdk.geometry.screentoslide', { x: Number(x ?? 0), y: Number(y ?? 0) }),
                slideToScreen: async (x, y) => sendSdkRequest('yoanime.sdk.geometry.slidetoscreen', { x: Number(x ?? 0), y: Number(y ?? 0) })
            },
            timeline: {
                get: async () => sendSdkRequest('yoanime.sdk.timeline.get', {}),
                bake: async (request = {}) => {
                    const fallbackDuration = request.durationSeconds || request.DurationSeconds;
                    const merge = request.merge === true;
                    return sendSdkRequest('yoanime.sdk.timeline.bake', {
                        Label: request.label || request.Label || 'Timeline bake',
                        Clear: request.clear || request.Clear || [],
                        Merge: merge,
                        Layers: normalizeBakeLayers(request.layers || request.Layers, fallbackDuration)
                    });
                },
                play: async (startTimeSeconds = 0) => {
                    if (startTimeSeconds && typeof startTimeSeconds === 'object') startTimeSeconds = startTimeSeconds.startTimeSeconds ?? startTimeSeconds.StartTimeSeconds ?? 0;
                    postToHost({ type: 'yoanime.sdk.timeline.play', sdkVersion: SDK_VERSION, data: { startTimeSeconds } });
                },
                playFrom: async (startTimeSeconds = 0) => {
                    if (startTimeSeconds && typeof startTimeSeconds === 'object') startTimeSeconds = startTimeSeconds.startTimeSeconds ?? startTimeSeconds.StartTimeSeconds ?? 0;
                    postToHost({ type: 'yoanime.sdk.timeline.play', sdkVersion: SDK_VERSION, data: { startTimeSeconds } });
                },
                stop: async () => {
                    postToHost({ type: 'yoanime.sdk.timeline.stop', sdkVersion: SDK_VERSION, data: {} });
                },
                scrubTo: async (time = 0) => {
                    postToHost({ type: 'yoanime.sdk.timeline.scrub', sdkVersion: SDK_VERSION, data: { time } });
                },
                scrubBegin: async (time = 0) => {
                    postToHost({ type: 'yoanime.sdk.timeline.scrub.begin', sdkVersion: SDK_VERSION, data: { time } });
                },
                scrubUpdate: async (time = 0) => {
                    postToHost({ type: 'yoanime.sdk.timeline.scrub.update', sdkVersion: SDK_VERSION, data: { time } });
                },
                scrubEnd: async (time = 0) => {
                    postToHost({ type: 'yoanime.sdk.timeline.scrub.end', sdkVersion: SDK_VERSION, data: { time } });
                },
                onUpdated: (callback) => {
                    listeners.timelineUpdated.add(callback);
                    return () => listeners.timelineUpdated.delete(callback);
                },
                onTick: (callback) => {
                    listeners.timelineTick.add(callback);
                    return () => listeners.timelineTick.delete(callback);
                },
                saveToPresentation: async (options = {}) => sendSdkRequest('yoanime.sdk.timeline.saveembedded', { slot: options.slot || options.Slot || 'default' }),
                loadFromPresentation: async (options = {}) => sendSdkRequest('yoanime.sdk.timeline.loadembedded', { slot: options.slot || options.Slot || 'default' })
            },
            webSurface: {
                list: async () => sendSdkRequest('yoanime.sdk.websurface.list', {}),
                refresh: async () => sendSdkRequest('yoanime.sdk.websurface.refresh', {}),
                onEvent: (callback) => {
                    if (typeof callback !== 'function') throw new Error('yoanime.webSurface.onEvent requires a callback.');
                    listeners.webSurfaceEvent.add(callback);
                    return () => listeners.webSurfaceEvent.delete(callback);
                }
            },
            overlay: {
                show: async () => sendSdkRequest('yoanime.sdk.overlay.show', {}),
                hide: async () => sendSdkRequest('yoanime.sdk.overlay.hide', {}),
                getState: async () => sendSdkRequest('yoanime.sdk.overlay.getstate', {}),
                setInteractive: async (isInteractive) => sendSdkRequest('yoanime.sdk.overlay.setinteractive', { isInteractive: !!isInteractive }),
                postMessage: async (message) => sendSdkRequest('yoanime.sdk.overlay.postmessage', { message }),
                onMessage: (callback) => {
                    listeners.overlayMessage.add(callback);
                    return () => listeners.overlayMessage.delete(callback);
                }
            },
            inspector: {
                getProperty: async (params) => sendSdkRequest('yoanime.sdk.inspector.getProperty', params || {}),
                setProperty: async (params) => sendSdkRequest('yoanime.sdk.inspector.setProperty', params || {}),
                action: async (params) => sendSdkRequest('yoanime.sdk.inspector.action', params || {}),
                getShapeList: async (params) => sendSdkRequest('yoanime.sdk.inspector.getShapeList', params || {})
            },
            taskpane: {
                postMessage: async (message) => sendSdkRequest('yoanime.sdk.taskpane.postmessage', { message }),
                onMessage: (callback) => {
                    listeners.taskpaneMessage.add(callback);
                    return () => listeners.taskpaneMessage.delete(callback);
                }
            },
            channels: {
                open: async (channelId, options = {}) => createRuntimeChannel(channelId, options || {}),
                get: (channelId) => runtimeChannels.get(normalizeChannelId(channelId))?.api || null,
                list: () => Array.from(runtimeChannels.values()).map(channel => channel.api.getState()),
                close: (channelId) => {
                    const channel = runtimeChannels.get(normalizeChannelId(channelId));
                    return channel ? channel.api.close() : { success: false, channelId, dropReason: 'channel-not-open' };
                },
                publish: async (channelId, eventName, payload = null, options = {}) => {
                    const channel = runtimeChannels.get(normalizeChannelId(channelId))?.api || createRuntimeChannel(channelId, options || {});
                    return channel.publish(eventName, payload, options || {});
                },
                subscribe: async (channelId, eventName, callback, options = {}) => {
                    const channel = runtimeChannels.get(normalizeChannelId(channelId))?.api || createRuntimeChannel(channelId, options || {});
                    return channel.subscribe(eventName, callback);
                },
                onMessage: (callback) => window.yoanime.events.on('channels.message', callback)
            },
            physics: createPhysicsApi(),

            // ---- Pure JS namespaces (no host calls needed) ----

            shapes: {
                get: async (runtimeNodeId) => {
                    const timeline = await window.yoanime.timeline.get();
                    const tracks = timeline?.tracks || timeline?.Tracks || [];
                    return tracks.find(t => (t.runtimeNodeId || t.RuntimeNodeId) === runtimeNodeId) || null;
                },
                setPosition: async (runtimeNodeId, position) => {
                    return await window.yoanime.scene.mutateShape(runtimeNodeId, { x: position?.x, y: position?.y });
                },
                setRotation: async (runtimeNodeId, angle) => {
                    return await window.yoanime.scene.mutateShape(runtimeNodeId, { rotation: angle });
                },
                setSize: async (runtimeNodeId, size) => {
                    return await window.yoanime.scene.mutateShape(runtimeNodeId, { width: size?.width, height: size?.height });
                },
                setScale: async (runtimeNodeId, scale) => {
                    const track = await window.yoanime.shapes.get(runtimeNodeId);
                    const baseWidth = Number(track?.baseWidth ?? track?.BaseWidth ?? 0);
                    const baseHeight = Number(track?.baseHeight ?? track?.BaseHeight ?? 0);
                    return await window.yoanime.scene.mutateShape(runtimeNodeId, {
                        width: baseWidth * Number(scale?.x ?? 1),
                        height: baseHeight * Number(scale?.y ?? 1)
                    });
                },
                batchMutate: async (mutations) => {
                    return await window.yoanime.scene.batchMutate(mutations || []);
                }
            },

            noise: {
                hashSeed: (seed = 'yoanime') => {
                    const text = String(seed ?? 'yoanime');
                    let h = 2166136261;
                    for (let i = 0; i < text.length; i++) {
                        h ^= text.charCodeAt(i);
                        h = Math.imul(h, 16777619);
                    }
                    return h >>> 0;
                },
                random: (seed = 'yoanime') => {
                    let state = window.yoanime.noise.hashSeed(seed) || 1;
                    return () => {
                        state += 0x6D2B79F5;
                        let t = state;
                        t = Math.imul(t ^ (t >>> 15), t | 1);
                        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
                    };
                },
                smoothstep: (t) => {
                    const x = Math.max(0, Math.min(1, Number(t) || 0));
                    return x * x * (3 - 2 * x);
                },
                value1D: (x, seed = 'yoanime') => {
                    const xi = Math.floor(Number(x) || 0);
                    const xf = (Number(x) || 0) - xi;
                    const randA = window.yoanime.noise.random(`${seed}:${xi}`)() * 2 - 1;
                    const randB = window.yoanime.noise.random(`${seed}:${xi + 1}`)() * 2 - 1;
                    const u = window.yoanime.noise.smoothstep(xf);
                    return randA + (randB - randA) * u;
                },
                generateKeyframes: (options = {}) => {
                    const amplitude = Number(options.amplitude ?? 30);
                    const frequency = Math.max(0.01, Number(options.frequency ?? 4));
                    const durationSeconds = Math.max(0.01, Number(options.durationSeconds ?? 2));
                    const sampleCount = Math.max(2, Math.min(240, Math.round(Number(options.sampleCount ?? ((options.fps ?? 12) * durationSeconds)))));
                    const seed = options.seed ?? 'yoanime-wiggle';
                    const baseline = Number(options.baseline ?? 0);
                    const mode = String(options.mode || 'smooth').toLowerCase();
                    const keyframes = [];
                    for (let i = 0; i <= sampleCount; i++) {
                        const normalizedTime = i / sampleCount;
                        const t = normalizedTime * frequency;
                        const wave = mode === 'sine'
                            ? Math.sin(t * Math.PI * 2)
                            : window.yoanime.noise.value1D(t, seed);
                        keyframes.push({
                            normalizedTime,
                            value: { number: baseline + wave * amplitude }
                        });
                    }
                    return keyframes;
                },
                generateWiggle: (options = {}) => {
                    const runtimeNodeId = options.runtimeNodeId || options.target?.runtimeNodeId || options.target?.nodeId;
                    if (!runtimeNodeId) throw new Error('Noise wiggle requires a runtimeNodeId or target shape.');
                    const axis = String(options.axis || 'xy').toLowerCase();
                    const amplitude = Number(options.amplitude ?? 30);
                    const frequency = Number(options.frequency ?? 4);
                    const durationSeconds = Number(options.durationSeconds ?? 2);
                    const fps = Number(options.fps ?? 12);
                    const seed = options.seed ?? runtimeNodeId;
                    const additive = options.additive !== false;
                    const propertySpecs = [];
                    const addSpec = (propertyKind, amp, seedSuffix, mode) => propertySpecs.push({
                        propertyKind,
                        additive,
                        durationSeconds,
                        keyframes: window.yoanime.noise.generateKeyframes({
                            amplitude: amp,
                            frequency,
                            durationSeconds,
                            fps,
                            sampleCount: options.sampleCount,
                            seed: `${seed}:${seedSuffix}`,
                            mode: mode || options.mode
                        })
                    });
                    if (axis === 'x' || axis === 'xy' || axis === 'position') addSpec('PositionX', amplitude, 'x');
                    if (axis === 'y' || axis === 'xy' || axis === 'position' || axis === 'float') addSpec('PositionY', axis === 'float' ? -Math.abs(amplitude) : amplitude, 'y', axis === 'float' ? 'sine' : options.mode);
                    if (axis === 'rotation' || axis === 'r') addSpec('Rotation', Number(options.rotationAmplitude ?? amplitude), 'rotation');
                    if (options.propertyKind) addSpec(options.propertyKind, amplitude, String(options.propertyKind));
                    return {
                        label: options.label || 'Noise Wiggle',
                        durationSeconds,
                        clear: Array.from(new Set(propertySpecs.map(spec => spec.propertyKind))),
                        layers: [{
                            runtimeNodeId,
                            properties: propertySpecs
                        }]
                    };
                }
            },

            constraints: {
                boundsOf: (shape) => {
                    const b = shape?.bounds || shape?.boundsPoints || shape?.geometry || shape?.slideBounds || {};
                    const left = Number(b?.left ?? b?.Left ?? b?.x ?? b?.X ?? 0);
                    const top = Number(b?.top ?? b?.Top ?? b?.y ?? b?.Y ?? 0);
                    const width = Number(b?.width ?? b?.Width ?? 100);
                    const height = Number(b?.height ?? b?.Height ?? 100);
                    return {
                        left, top, width, height,
                        right: left + width,
                        bottom: top + height,
                        centerX: left + width / 2,
                        centerY: top + height / 2,
                        rotation: Number(shape?.rotation ?? shape?.Rotation ?? 0)
                    };
                },
                findShape: (sceneOrShapes, selector = {}) => {
                    const shapes = Array.isArray(sceneOrShapes) ? sceneOrShapes
                        : sceneOrShapes?.shapes || sceneOrShapes?.Shapes || sceneOrShapes?.nodes || sceneOrShapes?.Nodes || [];
                    if (!selector || Object.keys(selector).length === 0) return shapes[0] || null;
                    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
                    return shapes.find(s => Object.entries(selector).every(([k, v]) => String(s[k] ?? s[cap(k)] ?? '') === String(v))) || null;
                },
                resolvePair: async (options = {}) => {
                    const scene = options.scene || await window.yoanime.scene.get();
                    const source = options.source || options.sourceId || options.sourceRuntimeNodeId;
                    const target = options.target || options.targetId || options.targetRuntimeNodeId;
                    const sourceShape = typeof source === 'string' ? window.yoanime.constraints.findShape(scene, { runtimeNodeId: source }) : source;
                    const targetShape = typeof target === 'string' ? window.yoanime.constraints.findShape(scene, { runtimeNodeId: target }) : target;
                    return {
                        scene,
                        source: sourceShape,
                        target: targetShape,
                        sourceBounds: sourceShape ? window.yoanime.constraints.boundsOf(sourceShape) : null,
                        targetBounds: targetShape ? window.yoanime.constraints.boundsOf(targetShape) : null
                    };
                },
                generateFollow: async (options = {}) => {
                    const { source, target, sourceBounds, targetBounds } = await window.yoanime.constraints.resolvePair(options);
                    if (!source || !target) throw new Error('constraints.generateFollow requires both source and target shapes.');
                    const sb = sourceBounds;
                    const tb = targetBounds;
                    const frames = 20;
                    const xkf = [];
                    const ykf = [];
                    for (let i = 0; i <= frames; i++) {
                        const t = i / frames;
                        xkf.push({ normalizedTime: t, value: { number: sb.centerX + (tb.centerX - sb.centerX) * t } });
                        ykf.push({ normalizedTime: t, value: { number: sb.centerY + (tb.centerY - sb.centerY) * t } });
                    }
                    return {
                        label: options.label || 'Follow',
                        durationSeconds: options.durationSeconds ?? 1,
                        layers: [{
                            runtimeNodeId: source.runtimeNodeId || source.RuntimeNodeId,
                            properties: [
                                { propertyKind: 'PositionX', keyframes: xkf },
                                { propertyKind: 'PositionY', keyframes: ykf }
                            ]
                        }]
                    };
                },
                generateLookAt: async (options = {}) => {
                    const { source, target, sourceBounds, targetBounds } = await window.yoanime.constraints.resolvePair(options);
                    if (!source || !target) throw new Error('constraints.generateLookAt requires both source and target shapes.');
                    const dx = targetBounds.centerX - sourceBounds.centerX;
                    const dy = targetBounds.centerY - sourceBounds.centerY;
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    return {
                        label: options.label || 'Look At',
                        durationSeconds: options.durationSeconds ?? 1,
                        layers: [{
                            runtimeNodeId: source.runtimeNodeId || source.RuntimeNodeId,
                            properties: [{
                                propertyKind: 'Rotation',
                                keyframes: [{ normalizedTime: 0, value: { number: sourceBounds.rotation } }, { normalizedTime: 1, value: { number: angle } }]
                            }]
                        }]
                    };
                },
                generateMaintainDistance: async (options = {}) => {
                    const { source, target, sourceBounds, targetBounds } = await window.yoanime.constraints.resolvePair(options);
                    if (!source || !target) throw new Error('constraints.generateMaintainDistance requires both source and target shapes.');
                    const dx = targetBounds.centerX - sourceBounds.centerX;
                    const dy = targetBounds.centerY - sourceBounds.centerY;
                    const distance = options.distance ?? Math.sqrt(dx * dx + dy * dy);
                    return {
                        label: options.label || 'Maintain Distance',
                        durationSeconds: options.durationSeconds ?? 1,
                        layers: [{
                            runtimeNodeId: source.runtimeNodeId || source.RuntimeNodeId,
                            properties: [{
                                propertyKind: 'PositionX',
                                keyframes: [{ normalizedTime: 0, value: { number: sourceBounds.centerX } }]
                            }, {
                                propertyKind: 'PositionY',
                                keyframes: [{ normalizedTime: 0, value: { number: sourceBounds.centerY } }]
                            }]
                        }]
                    };
                },
                list: async () => sendSdkRequest('yoanime.sdk.constraints.list', {}),
                get: async (constraintId) => sendSdkRequest('yoanime.sdk.constraints.get', { constraintId }),
                create: async (input = {}) => sendSdkRequest('yoanime.sdk.constraints.create', {
                    type: input.type,
                    sourceId: input.sourceId,
                    targetId: input.targetId,
                    parameters: input.parameters ?? {},
                    enabled: input.enabled ?? true
                }),
                update: async (constraintId, patch = {}) => sendSdkRequest('yoanime.sdk.constraints.update', {
                    constraintId,
                    parameters: patch.parameters,
                    enabled: patch.enabled
                }),
                remove: async (constraintId) => sendSdkRequest('yoanime.sdk.constraints.remove', { constraintId }),
                onChanged: (callback) => {
                    listeners.constraintChanged.add(callback);
                    return () => listeners.constraintChanged.delete(callback);
                }
            },

            behavior: {
                list: async () => sendSdkRequest('yoanime.sdk.behavior.list', {}),
                get: async (behaviorId) => sendSdkRequest('yoanime.sdk.behavior.get', { behaviorId }),
                create: async (input = {}) => sendSdkRequest('yoanime.sdk.behavior.create', input),
                update: async (behaviorId, patch = {}) => sendSdkRequest('yoanime.sdk.behavior.update', {
                    behaviorId,
                    parameters: patch.parameters,
                    enabled: patch.enabled
                }),
                remove: async (behaviorId) => sendSdkRequest('yoanime.sdk.behavior.remove', { behaviorId }),
                reorder: async (behaviorId, newIndex) => sendSdkRequest('yoanime.sdk.behavior.reorder', { behaviorId, newIndex }),
                setEnabled: async (behaviorId, enabled) => sendSdkRequest('yoanime.sdk.behavior.setEnabled', { behaviorId, enabled }),
                onChanged: (callback) => {
                    listeners.behaviorChanged.add(callback);
                    return () => listeners.behaviorChanged.delete(callback);
                }
            },

            paths: {
                parsePolyline: (points) => {
                    if (typeof points === 'string') {
                        try { return JSON.parse(points); } catch (_) { return []; }
                    }
                    if (Array.isArray(points)) {
                        return points.map(p => {
                            if (Array.isArray(p)) return { x: Number(p[0] ?? 0), y: Number(p[1] ?? 0) };
                            return { x: Number(p.x ?? p.X ?? 0), y: Number(p.y ?? p.Y ?? 0) };
                        });
                    }
                    return [];
                },
                samplePolyline: (points, sampleCount = 20) => {
                    const pts = window.yoanime.paths.parsePolyline(points);
                    if (pts.length < 2) return [];
                    const totalLength = pts.reduce((sum, p, i) => i === 0 ? 0 : sum + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y), 0);
                    const samples = [];
                    let accumulated = 0;
                    let segIdx = 0;
                    for (let i = 0; i <= sampleCount; i++) {
                        const targetDist = (i / sampleCount) * totalLength;
                        while (segIdx < pts.length - 1) {
                            const segLen = Math.hypot(pts[segIdx + 1].x - pts[segIdx].x, pts[segIdx + 1].y - pts[segIdx].y);
                            if (accumulated + segLen >= targetDist || segLen === 0) break;
                            accumulated += segLen;
                            segIdx++;
                        }
                        const segLen = Math.hypot(pts[segIdx + 1].x - pts[segIdx].x, pts[segIdx + 1].y - pts[segIdx].y);
                        const t = segLen > 0 ? (targetDist - accumulated) / segLen : 0;
                        samples.push({
                            normalizedTime: i / sampleCount,
                            x: pts[segIdx].x + (pts[Math.min(segIdx + 1, pts.length - 1)].x - pts[segIdx].x) * t,
                            y: pts[segIdx].y + (pts[Math.min(segIdx + 1, pts.length - 1)].y - pts[segIdx].y) * t
                        });
                    }
                    return samples;
                },
                sampleSvgPath: (pathData, options = {}) => {
                    const sampleCount = options.sampleCount || options.samples || 20;
                    const svgPoints = [];
                    const tempParser = document.createElementNS && document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    if (!tempParser) return [];
                    try {
                        tempParser.setAttribute('d', pathData);
                        const length = tempParser.getTotalLength();
                        for (let i = 0; i <= sampleCount; i++) {
                            const pt = tempParser.getPointAtLength((i / sampleCount) * length);
                            svgPoints.push({ normalizedTime: i / sampleCount, x: pt.x, y: pt.y });
                        }
                    } catch (_) { }
                    return svgPoints;
                },
                ellipsePoints: (options = {}) => {
                    const cx = Number(options.centerX ?? options.x ?? 0);
                    const cy = Number(options.centerY ?? options.y ?? 0);
                    const rx = Number(options.radiusX ?? options.radius ?? 50);
                    const ry = Number(options.radiusY ?? options.radius ?? 50);
                    const startAngle = (Number(options.startAngleDegrees ?? 0) * Math.PI) / 180;
                    const turns = Number(options.turns ?? 1);
                    const sampleCount = Math.max(4, Math.round(Number(options.sampleCount ?? 32)));
                    const points = [];
                    for (let i = 0; i <= sampleCount; i++) {
                        const angle = startAngle + (i / sampleCount) * turns * Math.PI * 2;
                        points.push({
                            normalizedTime: i / sampleCount,
                            x: cx + rx * Math.cos(angle),
                            y: cy + ry * Math.sin(angle)
                        });
                    }
                    return points;
                },
                generateFollowPath: async (options = {}) => {
                    const optionsAny = options;
                    const source = optionsAny.source || optionsAny.runtimeNodeId || optionsAny.target?.runtimeNodeId;
                    if (!source) throw new Error('paths.generateFollowPath requires a source shape or runtimeNodeId.');
                    const points = optionsAny.points || optionsAny.path || optionsAny.pathData;
                    const polyline = typeof points === 'string' ? window.yoanime.paths.sampleSvgPath(points, options) : window.yoanime.paths.samplePolyline(points || [], options.sampleCount || options.samples);
                    if (polyline.length < 2) throw new Error('paths.generateFollowPath requires at least 2 path points.');
                    const runtimeNodeId = typeof source === 'string' ? source : (source.runtimeNodeId || source.RuntimeNodeId);
                    const xKeyframes = polyline.map(p => ({ normalizedTime: p.normalizedTime, value: { number: p.x } }));
                    const yKeyframes = polyline.map(p => ({ normalizedTime: p.normalizedTime, value: { number: p.y } }));
                    return {
                        label: optionsAny.label || 'Follow Path',
                        durationSeconds: optionsAny.durationSeconds ?? 2,
                        clear: optionsAny.clear !== false ? ['PositionX', 'PositionY'] : [],
                        layers: [{
                            runtimeNodeId,
                            properties: [{ propertyKind: 'PositionX', keyframes: xKeyframes }, { propertyKind: 'PositionY', keyframes: yKeyframes }]
                        }]
                    };
                },
                generateOrbitTarget: async (options = {}) => {
                    const optionsAny = options;
                    const source = optionsAny.source || optionsAny.runtimeNodeId || optionsAny.target?.runtimeNodeId;
                    if (!source) throw new Error('paths.generateOrbitTarget requires a source shape or runtimeNodeId.');
                    const runtimeNodeId = typeof source === 'string' ? source : (source.runtimeNodeId || source.RuntimeNodeId);
                    const cx = Number(optionsAny.centerX ?? optionsAny.cx ?? optionsAny.target?.x ?? 0);
                    const cy = Number(optionsAny.centerY ?? optionsAny.cy ?? optionsAny.target?.y ?? 0);
                    const radius = Number(optionsAny.radius ?? 100);
                    const turns = Number(optionsAny.turns ?? 1);
                    const durationSeconds = Number(optionsAny.durationSeconds ?? 3);
                    const sampleCount = Math.max(8, Math.round(Number(optionsAny.sampleCount ?? 60)));
                    const keyframes = [];
                    for (let i = 0; i <= sampleCount; i++) {
                        const angle = (i / sampleCount) * turns * Math.PI * 2;
                        keyframes.push({
                            normalizedTime: i / sampleCount,
                            value: { number: { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) } }
                        });
                    }
                    return {
                        label: optionsAny.label || 'Orbit Target',
                        durationSeconds,
                        clear: optionsAny.clear !== false ? ['PositionX', 'PositionY'] : [],
                        layers: [{
                            runtimeNodeId,
                            properties: [{ propertyKind: 'PositionX', keyframes }, { propertyKind: 'PositionY', keyframes }]
                        }]
                    };
                }
            },

            // ---- Host-backed namespaces (C# gateway has command handlers) ----

            interaction: {
                capturePointer: () => {
                    postToHost({ type: 'yoanime.sdk.interaction.capturepointer', sdkVersion: SDK_VERSION, data: {} });
                },
                releasePointer: () => {
                    postToHost({ type: 'yoanime.sdk.interaction.releasepointer', sdkVersion: SDK_VERSION, data: {} });
                },
                beginDrag: () => {
                    postToHost({ type: 'yoanime.sdk.interaction.capturepointer', sdkVersion: SDK_VERSION, data: {} });
                    postToHost({ type: 'yoanime.sdk.interaction.bringtofront', sdkVersion: SDK_VERSION, data: {} });
                },
                endDrag: () => {
                    postToHost({ type: 'yoanime.sdk.interaction.releasepointer', sdkVersion: SDK_VERSION, data: {} });
                    postToHost({ type: 'yoanime.sdk.interaction.restorezorder', sdkVersion: SDK_VERSION, data: {} });
                }
            },

            extensions: {
                getInstalled: async () => sendSdkRequest('yoanime.sdk.extensions.getinstalled', {}),
                mount: async (extensionId) => sendSdkRequest('yoanime.sdk.extensions.mount', { extensionId }),
                unmount: async (extensionId) => sendSdkRequest('yoanime.sdk.extensions.unmount', { extensionId }),
                toggle: async (extensionId, enable) => sendSdkRequest('yoanime.sdk.extensions.toggle', { extensionId, enable: !!enable })
            },

            slideshow: {
                getStatus: async () => sendSdkRequest('yoanime.sdk.slideshow.getstatus', {}),
                onStarted: (callback) => {
                    listeners.slideshowStarted.add(callback);
                    return () => listeners.slideshowStarted.delete(callback);
                },
                onSlideChanged: (callback) => {
                    listeners.slideshowSlideChanged.add(callback);
                    return () => listeners.slideshowSlideChanged.delete(callback);
                },
                onEnded: (callback) => {
                    listeners.slideshowEnded.add(callback);
                    return () => listeners.slideshowEnded.delete(callback);
                }
            },

            playback: {
                onStarted: (callback) => {
                    listeners.playbackStarted.add(callback);
                    return () => listeners.playbackStarted.delete(callback);
                },
                onStopped: (callback) => {
                    listeners.playbackStopped.add(callback);
                    return () => listeners.playbackStopped.delete(callback);
                }
            },

            trajectory: {
                select: (request) => {
                    postToHost({ type: 'yoanime.sdk.trajectory.select', sdkVersion: SDK_VERSION, data: request || {} });
                },
                clearSelection: () => {
                    postToHost({ type: 'yoanime.sdk.trajectory.clearselection', sdkVersion: SDK_VERSION, data: {} });
                },
                setEasing: (request) => {
                    postToHost({ type: 'yoanime.sdk.trajectory.clearselection', sdkVersion: SDK_VERSION, data: request || {} });
                },
                projectOverlayLocalToSlide: async (overlayLocalX, overlayLocalY) => {
                    return sendSdkRequest('yoanime.sdk.trajectory.projectoverlaylocal', { overlayLocalX, overlayLocalY });
                },
                mutateEndpoint: async (request) => {
                    return sendSdkRequest('yoanime.sdk.trajectory.mutateendpoint', request || {});
                },
                onOverlayUpdated: (callback) => {
                    listeners.trajectoryOverlayUpdated.add(callback);
                    return () => listeners.trajectoryOverlayUpdated.delete(callback);
                },
                onSelectionUpdated: (callback) => {
                    listeners.trajectorySelectionUpdated.add(callback);
                    return () => listeners.trajectorySelectionUpdated.delete(callback);
                }
            },

            // ---- Developer diagnostics namespace ----

            dev: {
                inspectRuntime: async () => sendSdkRequest('yoanime.sdk.diagnostics.stabilization6dd', {}),
                inspectProviders: () => {
                    const providers = window.yoanime.motionProviders ? window.yoanime.motionProviders.list() : [];
                    return { contractVersion: 'dev-provider-diagnostics.v1', providers };
                },
                inspectScene: async (options) => sendSdkRequest('yoanime.sdk.scene.get', { ...(options || {}), includeGeometry: true, includeShapeType: true }),
                inspectWebSurfaces: async () => sendSdkRequest('yoanime.sdk.websurface.list', {}),
                inspectChannels: () => {
                    const channels = window.yoanime.channels ? window.yoanime.channels.list() : [];
                    return { contractVersion: 'dev-channel-diagnostics.v1', channels, channelCount: channels.length };
                },
                inspectDataSources: () => {
                    return { contractVersion: 'dev-data-source-diagnostics.v1', sources: [], sourceCount: 0 };
                },
                validateMotion: (motion) => {
                    const errors = [];
                    if (!motion || typeof motion !== 'object') errors.push('motion must be an object');
                    if (motion.layers && !Array.isArray(motion.layers)) errors.push('motion.layers must be an array');
                    if (motion.layers) motion.layers.forEach((layer, i) => {
                        if (!layer.runtimeNodeId && !layer.RuntimeNodeId) errors.push(`layer[${i}] missing runtimeNodeId`);
                        if (!layer.properties && !layer.Properties) errors.push(`layer[${i}] missing properties`);
                    });
                    return { contractVersion: 'dev-motion-validation.v1', valid: errors.length === 0, errors };
                },
                explainBake: (result) => {
                    if (!result) return { contractVersion: 'dev-bake-explanation.v1', success: false, note: 'No bake result provided' };
                    return {
                        contractVersion: 'dev-bake-explanation.v1',
                        success: result.success !== false,
                        trackCount: result.tracks?.length || result.Tracks?.length || 0,
                        clipCount: result.clips?.length || result.Clips?.length || 0,
                        note: result.error || result.message || (result.success !== false ? 'Bake completed.' : 'Bake failed.')
                    };
                },
                getRecentEvents: (options) => {
                    return { contractVersion: 'dev-recent-events.v1', events: [], count: 0 };
                },
                getRecentErrors: (options) => {
                    return { contractVersion: 'dev-recent-errors.v1', errors: [], count: 0 };
                }
            },

            // ---- In-memory data sources ----

            data: {
                _sources: new Map(),
                _listeners: new Set(),
                validateSource: (source) => {
                    if (!source || typeof source !== 'object') return { success: false, error: 'Source must be an object.', errors: [{ path: 'root', message: 'Not an object.' }] };
                    if (!source.id && !source.sourceId) return { success: false, error: 'Source id is required.', errors: [{ path: 'id', message: 'Required.' }] };
                    if (!source.read && typeof source.read !== 'function') return { success: false, error: 'Source must have a read() function.', errors: [{ path: 'read', message: 'Required.' }] };
                    return { success: true, errors: [] };
                },
                registerSource: (source, options = {}) => {
                    const validation = window.yoanime.data.validateSource(source);
                    if (!validation.success) return validation;
                    const id = String(source.id || source.sourceId || '').trim();
                    if (window.yoanime.data._sources.has(id) && !options.replace) {
                        return { success: false, error: 'data_source_exists', errors: [{ path: 'id', message: `Data source '${id}' is already registered.` }], sourceId: id, sourceCount: window.yoanime.data._sources.size };
                    }
                    window.yoanime.data._sources.set(id, { source, cachedData: null, lastReadAt: null, lastRefreshAt: null, lastError: null, registeredAt: Date.now() });
                    window.yoanime.data._emitChanged(options.replace ? 'replaced' : 'registered', { sourceId: id });
                    return { success: true, sourceId: id, sourceCount: window.yoanime.data._sources.size };
                },
                unregisterSource: (id) => {
                    const sourceId = String(id || '').trim();
                    const removed = window.yoanime.data._sources.delete(sourceId);
                    if (removed) window.yoanime.data._emitChanged('unregistered', { sourceId });
                    return { success: removed, sourceId, sourceCount: window.yoanime.data._sources.size };
                },
                listSources: () => Array.from(window.yoanime.data._sources.values()).map(e => ({ ...e.source, cachedData: e.cachedData, lastReadAt: e.lastReadAt })),
                getSource: (id) => {
                    const entry = window.yoanime.data._sources.get(String(id || '').trim());
                    return entry ? { ...entry.source, cachedData: entry.cachedData, lastReadAt: entry.lastReadAt } : null;
                },
                read: async (id, options = {}) => {
                    const sourceId = String(id || '').trim();
                    const entry = window.yoanime.data._sources.get(sourceId);
                    if (!entry) return { success: false, error: 'Source not found.' };
                    try {
                        const result = await entry.source.read(options);
                        entry.cachedData = result;
                        entry.lastReadAt = Date.now();
                        entry.lastError = null;
                        return { success: true, data: result };
                    } catch (error) {
                        entry.lastError = error;
                        return { success: false, error: error.message || String(error) };
                    }
                },
                refresh: async (id, options = {}) => window.yoanime.data.read(id, { ...options, force: true }),
                refreshAll: async (options = {}) => {
                    const results = [];
                    for (const sourceId of window.yoanime.data._sources.keys()) {
                        try { results.push(await window.yoanime.data.read(sourceId, { ...(options || {}), force: true })); } catch (error) {
                            results.push({ success: false, error: error?.message || String(error), sourceId });
                        }
                    }
                    return { success: results.every(r => r?.success !== false), sourceCount: window.yoanime.data._sources.size, results };
                },
                clearCache: (id = null) => {
                    let cleared = 0;
                    for (const [key, entry] of window.yoanime.data._sources.entries()) {
                        if (id && key !== id) continue;
                        entry.cachedData = null;
                        entry.lastRefreshAt = null;
                        cleared++;
                    }
                    if (cleared) window.yoanime.data._emitChanged('cache-cleared', { sourceId: id, cleared });
                    return { success: true, sourceId: id, cleared };
                },
                _emitChanged: (action, info) => {
                    const event = { contractVersion: 'data-source-change.v1', action, ...info, timestamp: Date.now() };
                    [...window.yoanime.data._listeners].forEach(cb => { try { cb(event); } catch (_) { } });
                },
                onChanged: (callback) => {
                    if (typeof callback !== 'function') throw new Error('yoanime.data.onChanged requires a callback.');
                    window.yoanime.data._listeners.add(callback);
                    return () => window.yoanime.data._listeners.delete(callback);
                }
            },

            // ---- Motion providers ----

            motionProviders: {
                _providers: new Map(),
                _packs: new Map(),
                _changedListeners: new Set(),
                ir: {
                    normalize: (output, fallback) => {
                        if (!output || typeof output !== 'object') return fallback || { layers: [] };
                        return { ...fallback, ...output };
                    },
                    validate: (ir) => {
                        const errors = [];
                        if (!ir || typeof ir !== 'object') errors.push('IR must be an object');
                        if (ir.layers && !Array.isArray(ir.layers)) errors.push('IR layers must be an array');
                        return { valid: errors.length === 0, errors, contractVersion: 'motion-ir-validation.v1' };
                    },
                    toBakeRequest: (ir, overrides) => ({ ...ir, ...(overrides || {}) })
                },
                validate: (provider) => {
                    const errors = [];
                    if (!provider || typeof provider !== 'object') errors.push('Provider must be an object');
                    if (!provider.id) errors.push('Provider id is required');
                    if (typeof provider.generate !== 'function') errors.push('Provider must have a generate() function');
                    const error = errors.length ? errors.join('; ') : null;
                    return { valid: errors.length === 0, success: errors.length === 0, error, errors };
                },
                validateInputs: (inputs) => {
                    const errors = [];
                    if (!inputs || typeof inputs !== 'object') errors.push('Inputs must be an object');
                    for (const [key, schema] of Object.entries(inputs || {})) {
                        if (!schema.type) errors.push(`Input '${key}' missing type`);
                    }
                    return { valid: errors.length === 0, errors };
                },
                validatePack: (pack) => {
                    const errors = [];
                    if (!pack || typeof pack !== 'object') errors.push('Pack must be an object');
                    if (!pack.id) errors.push('Pack id is required');
                    if (pack.providers && !Array.isArray(pack.providers)) errors.push('Pack providers must be an array');
                    return { valid: errors.length === 0, errors };
                },
                register: async (provider, options = {}) => {
                    window.yoanime.motionProviders._providers.set(provider.id, { ...provider, ownerExtensionId: options.ownerExtensionId || options.extensionId || null });
                    window.yoanime.motionProviders._emitChanged();
                    return { success: true, provider, providerCount: window.yoanime.motionProviders._providers.size };
                },
                unregister: async (providerId) => {
                    window.yoanime.motionProviders._providers.delete(providerId);
                    window.yoanime.motionProviders._emitChanged();
                    return { success: true, providerId, providerCount: window.yoanime.motionProviders._providers.size };
                },
                registerPack: async (pack, options = {}) => {
                    window.yoanime.motionProviders._packs.set(pack.id, { ...pack, ownerExtensionId: options.ownerExtensionId || options.extensionId || null, registeredAt: Date.now() });
                    if (pack.providers) pack.providers.forEach(p => window.yoanime.motionProviders._providers.set(p.id, { ...p, ownerExtensionId: options.ownerExtensionId || null }));
                    window.yoanime.motionProviders._emitChanged();
                    return { success: true, pack, providers: pack.providers || [], providerCount: window.yoanime.motionProviders._providers.size, packCount: window.yoanime.motionProviders._packs.size };
                },
                unregisterPack: async (packId) => {
                    const pack = window.yoanime.motionProviders._packs.get(packId);
                    window.yoanime.motionProviders._packs.delete(packId);
                    if (pack?.providers) pack.providers.forEach(p => window.yoanime.motionProviders._providers.delete(p.id));
                    window.yoanime.motionProviders._emitChanged();
                    return { success: true, packId, providerIds: pack?.providers?.map(p => p.id) || [], providerCount: window.yoanime.motionProviders._providers.size, packCount: window.yoanime.motionProviders._packs.size };
                },
                listPacks: () => Array.from(window.yoanime.motionProviders._packs.values()),
                getPack: (packId) => window.yoanime.motionProviders._packs.get(packId) || null,
                list: () => Array.from(window.yoanime.motionProviders._providers.values()),
                get: (providerId) => window.yoanime.motionProviders._providers.get(providerId) || null,
                createContext: async (request) => ({
                    contractVersion: 'motion-provider-context.v1',
                    providerId: request?.providerId ?? null,
                    providerKind: request?.providerKind ?? null,
                    options: request?.options ?? request ?? {},
                    timestamp: Date.now(),
                    sdk: window.yoanime,
                    ...(request || {})
                }),
                generate: async (providerId, request) => {
                    const provider = window.yoanime.motionProviders._providers.get(providerId);
                    if (!provider) return { success: false, error: `Provider '${providerId}' not found.` };
                    if (typeof provider.generate !== 'function') return { success: false, error: `Provider '${providerId}' has no generate() function.` };
                    try {
                        const context = {
                            contractVersion: 'motion-provider-context.v1',
                            providerId,
                            providerKind: provider.kind || null,
                            options: request || {},
                            ...(request || {}),
                            sdk: window.yoanime
                        };
                        const raw = await provider.generate(context);
                        const output = (raw && typeof raw === 'object' && !raw.layers && !raw.tracks && raw.output)
                            ? raw.output
                            : raw;
                        return {
                            success: true,
                            contractVersion: 'motion-provider-result.v1',
                            provider,
                            request: request || {},
                            output,
                            ir: (output && typeof output === 'object' && output.contractVersion === 'generated-motion.v1')
                                ? output
                                : null
                        };
                    } catch (error) { return { success: false, error: error.message || String(error) }; }
                },
                bake: async (providerId, request) => {
                    const result = await window.yoanime.motionProviders.generate(providerId, request);
                    if (!result.success) return result;
                    const output = result.output ?? result;
                    if (output.layers || output.tracks) {
                        const baked = await window.yoanime.timeline.bake(output);
                        return { ...baked, contractVersion: 'motion-provider-bake.v1', provider: result.provider, generated: output };
                    }
                    return { success: true, message: 'Provider returned result (no timeline bake needed).', result, contractVersion: 'motion-provider-bake.v1', provider: result.provider, generated: output };
                },
                _emitChanged: () => {
                    const event = { contractVersion: 'motion-provider-change.v1', providerCount: window.yoanime.motionProviders._providers.size, packCount: window.yoanime.motionProviders._packs.size, timestamp: Date.now() };
                    [...window.yoanime.motionProviders._changedListeners].forEach(cb => { try { cb(event); } catch (_) { } });
                },
                onChanged: (callback) => {
                    window.yoanime.motionProviders._changedListeners.add(callback);
                    return () => window.yoanime.motionProviders._changedListeners.delete(callback);
                }
            },

            // ---- Lottie parser ----

            lottie: {
                parse: (input) => {
                    if (typeof input === 'string') { try { return JSON.parse(input); } catch (_) { return null; } }
                    return input || null;
                },
                getDurationSeconds: (lottie, options) => {
                    if (!lottie) return 0;
                    const fr = lottie.fr || lottie.Fr || 30;
                    const ip = lottie.ip || lottie.Ip || 0;
                    const op = lottie.op || lottie.Op || 0;
                    return (op - ip) / fr;
                },
                listLayers: (input) => {
                    const lottie = window.yoanime.lottie.parse(input);
                    if (!lottie?.layers) return [];
                    return lottie.layers.map((layer, i) => ({
                        index: i,
                        ind: layer.ind ?? null,
                        name: layer.nm || layer.name || `Layer ${i}`,
                        type: layer.ty ?? null,
                        hasTransform: !!layer.ks,
                        supported: !layer.ef && !layer.ao
                    }));
                },
                selectLayer: (lottie, options) => {
                    if (!lottie?.layers) return null;
                    if (options?.layerIndex != null) return lottie.layers[options.layerIndex] || null;
                    if (options?.layerName) return lottie.layers.find(l => (l.nm || l.name) === options.layerName) || null;
                    return lottie.layers[0] || null;
                },
                normalizeAnimatedValues: (property, options) => {
                    if (!property?.k) return [];
                    const keys = property.k;
                    if (!Array.isArray(keys) || keys.length === 0) return [];
                    const frameRate = options?.frameRate || 30;
                    const inPoint = options?.inPoint || 0;
                    const outPoint = options?.outPoint || (keys.length > 0 ? Math.max(...keys.map(k => k.t || 0)) : 0);
                    const duration = (outPoint - inPoint) / frameRate;
                    return keys.map(k => ({
                        normalizedTime: duration > 0 ? ((k.t - inPoint) / frameRate) / duration : 0,
                        value: k.s || k.v || k
                    }));
                },
                generateTransform: async (options) => {
                    return { contractVersion: 'generated-motion-ir.v1', layers: [], note: 'Lottie transform generation from overlay requires taskpane context.' };
                }
            },

            // ---- AI motion helpers ----

            ai: {
                normalizeRequest: (request) => ({
                    contractVersion: 'ai-motion-request.v1',
                    prompt: request?.prompt || '',
                    style: request?.style || 'natural',
                    seed: request?.seed || String(Math.random()),
                    durationSeconds: request?.durationSeconds ?? 2,
                    model: request?.model || null,
                    targetRuntimeNodeIds: Array.isArray(request?.targetRuntimeNodeIds) ? request.targetRuntimeNodeIds : [],
                    options: request?.options || {}
                }),
                explainPrompt: (request) => ({
                    contractVersion: 'ai-motion-explanation.v1',
                    prompt: request?.prompt || '',
                    style: request?.style || 'natural',
                    seed: request?.seed || String(Math.random()),
                    model: request?.model || null,
                    intents: ['animate'],
                    reproducible: true,
                    authority: 'overlay-sdk'
                }),
                generatePromptMotion: async (request) => {
                    return { contractVersion: 'generated-motion-ir.v1', layers: [], note: 'AI motion generation from overlay requires taskpane context.' };
                }
            },

            // ---- C# gateway host-backed namespaces ----

            transforms: {
                previewRotation: (angle, relativePivotX = 0.5, relativePivotY = 0.5) => {
                    postToHost({ type: 'yoanime.sdk.transforms.previewrotation', sdkVersion: SDK_VERSION, data: { angle, relativePivotX, relativePivotY } });
                },
                commitRotation: (finalAngle, relativePivotX = 0.5, relativePivotY = 0.5) => {
                    postToHost({ type: 'yoanime.sdk.transforms.commitrotation', sdkVersion: SDK_VERSION, data: { finalAngle, relativePivotX, relativePivotY } });
                }
            },

            commands: {
                rotate: (angle) => {
                    postToHost({ type: 'yoanime.sdk.commands.rotate', sdkVersion: SDK_VERSION, data: { angle } });
                },
                translate: (offsetX, offsetY) => {
                    postToHost({ type: 'yoanime.sdk.commands.translate', sdkVersion: SDK_VERSION, data: { offsetX, offsetY } });
                },
                scale: (scaleX, scaleY) => {
                    postToHost({ type: 'yoanime.sdk.commands.scale', sdkVersion: SDK_VERSION, data: { scaleX, scaleY } });
                },
                setPivot: (relativeX, relativeY) => {
                    postToHost({ type: 'yoanime.sdk.commands.setpivot', sdkVersion: SDK_VERSION, data: { relativeX, relativeY } });
                }
            },

            relationship: {
                create: async (request) => sendSdkRequest('yoanime.sdk.relationship.create', request || {}),
                update: async (request) => sendSdkRequest('yoanime.sdk.relationship.update', request || {}),
                delete: async (request) => sendSdkRequest('yoanime.sdk.relationship.delete', request || {}),
                list: async () => sendSdkRequest('yoanime.sdk.relationship.list', {}),
                setAll: async (request) => sendSdkRequest('yoanime.sdk.relationship.setall', request || {}),
                select: async (request) => sendSdkRequest('yoanime.sdk.relationship.select', request || {}),
                getPositions: async (request) => sendSdkRequest('yoanime.sdk.relationship.getpositions', request || {})
            },

            workspace: {
                list: async () => sendSdkRequest('yoanime.sdk.workspace.list', {}),
                switch: async (workspaceId) => sendSdkRequest('yoanime.sdk.workspace.switch', { workspaceId }),
                getActive: async () => sendSdkRequest('yoanime.sdk.workspace.getactive', {})
            },

            tool: {
                activate: async (toolId) => sendSdkRequest('yoanime.sdk.tool.activate', { toolId }),
                deactivate: async () => sendSdkRequest('yoanime.sdk.tool.deactivate', {}),
                cancel: async () => sendSdkRequest('yoanime.sdk.tool.cancel', {}),
                advance: async () => sendSdkRequest('yoanime.sdk.tool.advance', {}),
                getActive: async () => sendSdkRequest('yoanime.sdk.tool.getactive', {}),
                getTools: async () => sendSdkRequest('yoanime.sdk.tool.gettools', {}),
                registerTools: async (request) => sendSdkRequest('yoanime.sdk.tool.registertools', request || {})
            },

            hover: {
                set: async (request) => sendSdkRequest('yoanime.sdk.hover.set', request || {}),
                clear: async () => sendSdkRequest('yoanime.sdk.hover.clear', {})
            },

            modifier: {
                set: async (request) => sendSdkRequest('yoanime.sdk.modifier.set', request || {}),
                clear: async () => sendSdkRequest('yoanime.sdk.modifier.clear', {})
            }
        };
    }

    installFramedChromeWebViewShim();
    installCompositorPointerProxy();
    installIframeSdkProxy();

    const bridge = {
        _interactiveSelectors: [],
        _containerElement: null,
        _lastDirectInputActive: null,

        init(options) {
            if (!isWebView && !isFramed) {
                console.warn('yoAnimeBridge: Not in a WebView2 or compositor iframe context. Bridge will be inactive.');
                return;
            }

            this._containerElement = document.getElementById(options.containerId);
            this._interactiveSelectors = options.interactiveSelectors || [];

            if (!this._containerElement) {
                console.error(`yoAnimeBridge: Container element with ID '${options.containerId}' not found.`);
                return;
            }

            this._setupBackgroundListener();
            this.sendBoundsToHost();
            [50, 150, 350, 800].forEach(delay => {
                window.setTimeout(() => this.sendBoundsToHost(), delay);
            });
            console.log('yoAnimeBridge initialized successfully.');
        },

        _isInteractiveTarget(event) {
            const target = event.target;
            if (!target || !target.closest) return false;

            if (target.closest('[data-yoanime-passthrough="true"]')) {
                return false;
            }

            if (target.closest('[data-yoanime-interactive]:not([data-yoanime-interactive="false"])')) {
                return true;
            }

            for (const selector of this._interactiveSelectors) {
                try {
                    if (target.closest(selector)) return true;
                } catch (_) { /* invalid selector */ }
            }

            return false;
        },

        _setCompositorDirectInput(active) {
            if (!isFramed || this._lastDirectInputActive === !!active) return;
            this._lastDirectInputActive = !!active;
            postToHost({
                type: 'yoanime.compositor.directinput',
                data: { active: !!active }
            });
        },

        /**
         * Capture-phase listener: empty slide regions request Win32 pass-through (same intent as SDK passthrough).
         */
        _setupBackgroundListener() {
            const onPassThroughPointer = (event) => {
                if (this._isInteractiveTarget(event)) {
                    this._setCompositorDirectInput(true);
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                this._setCompositorDirectInput(false);
                console.log('yoAnimeBridge: Non-interactive region click — requesting pass-through.');
                this.requestClickPassThrough(event);
                this.sendBoundsToHost();
            };

            this._containerElement.addEventListener('mousedown', onPassThroughPointer, true);
            this._containerElement.addEventListener('pointerdown', onPassThroughPointer, true);
            this._containerElement.addEventListener('pointermove', event => {
                this._setCompositorDirectInput(this._isInteractiveTarget(event));
            }, true);
            this._containerElement.addEventListener('pointerleave', () => {
                this._setCompositorDirectInput(false);
            }, true);
            window.addEventListener('blur', () => this._setCompositorDirectInput(false));
        },

        requestClickPassThrough(event) {
            try {
                postToHost({
                    type: 'requestClickPassThrough',
                    data: {
                        screenX: event.screenX,
                        screenY: event.screenY
                    }
                });
            } catch (e) {
                console.error("yoAnimeBridge: Failed to post 'requestClickPassThrough' message.", e);
            }
        },

        sendBoundsToHost() {
            if (!isWebView && !isFramed) return;

            const elementBounds = [];
            const seen = new Set();
            const inferCursor = (el) => {
                const cursor = String(window.getComputedStyle?.(el)?.cursor || '').trim();
                const lower = cursor.toLowerCase();
                if (cursor && lower !== 'auto' && lower !== 'default') return cursor;
                if (el?.matches?.('button, a[href], input, select, textarea, summary, [role="button"], [role="menuitem"]')) return 'pointer';
                if (el?.querySelector?.('button, a[href], input, select, textarea, summary, [role="button"], [role="menuitem"]')) return 'pointer';
                return cursor;
            };

            const reportElement = (el, id) => {
                if (!el || seen.has(el)) return;
                seen.add(el);
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    elementBounds.push({
                        element: el,
                        elementId: id || el.id || 'interactive-el',
                        cursor: inferCursor(el),
                        bounds: {
                            left: rect.left,
                            top: rect.top,
                            width: rect.width,
                            height: rect.height
                        }
                    });
                }
            };

            this._interactiveSelectors.forEach(selector => {
                try {
                    document.querySelectorAll(selector).forEach(el => reportElement(el, selector));
                } catch (_) { /* ignore */ }
            });

            document.querySelectorAll('[data-yoanime-interactive]:not([data-yoanime-interactive="false"])')
                .forEach(el => reportElement(el, el.id || 'yoanime-interactive'));

            try {
                const filteredBounds = elementBounds
                    .filter(item => !elementBounds.some(other => other !== item && other.element?.contains?.(item.element)))
                    .map(({ element, ...item }) => item);

                postToHost({
                    type: 'sendInteractiveBounds',
                    data: { elementBounds: filteredBounds }
                });
            } catch (e) {
                console.error("yoAnimeBridge: Failed to post 'sendInteractiveBounds' message.", e);
            }
        }
    };

    window.yoAnimeBridge = bridge;

})(window);
