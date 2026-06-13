/**
 * yoAnimeBridge.js
 * Overlay bridge: ghost-mode bounds reporting and click pass-through to PowerPoint.
 */
(function (window) {
    'use strict';

    const isFramed = !!(window.parent && window.parent !== window);
    const isWebView = !!window.chrome?.webview;
    const compositorOrigin = 'https://yoanime-animationpanel.assets';
    const SDK_VERSION = '0.3.0';
    const SDK_REQUEST_TIMEOUT_MS = 15000;
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

            if (type === 'yoanime.sdk.session.ended') {
                emitSet(listeners.sessionEnded, payload || {}, 'session.ended');
                emit('session.ended', payload || {});
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
        const normalizeBakeLayers = (layers, fallbackDuration) => asArray(layers).map(layer => {
            const rawProperties = layer?.properties || layer?.Properties || {};
            const entries = Array.isArray(rawProperties)
                ? rawProperties
                : Object.entries(rawProperties).map(([propertyKind, property]) => ({ ...(property || {}), propertyKind }));
            return {
                runtimeNodeId: layer?.runtimeNodeId || layer?.RuntimeNodeId || layer?.nodeId || layer?.NodeId,
                powerPointShapeId: layer?.powerPointShapeId || layer?.PowerPointShapeId || layer?.shapeId || layer?.ShapeId,
                properties: entries.map(property => ({
                    propertyKind: property?.propertyKind || property?.PropertyKind,
                    startTimeSeconds: readNumber(property?.startTimeSeconds ?? property?.StartTimeSeconds, 0),
                    durationSeconds: readNumber(property?.durationSeconds ?? property?.DurationSeconds, fallbackDuration || 2),
                    delaySeconds: readNumber(property?.delaySeconds ?? property?.DelaySeconds, 0),
                    easingFunction: property?.easingFunction || property?.EasingFunction,
                    interpolation: property?.interpolation || property?.Interpolation,
                    keyframes: asArray(property?.keyframes || property?.Keyframes).map(keyframe => ({
                        normalizedTime: Math.max(0, Math.min(1, readNumber(keyframe?.normalizedTime ?? keyframe?.NormalizedTime, 0))),
                        value: makeKeyframeValue(keyframe?.value ?? keyframe?.Value),
                        easingOverride: keyframe?.easingOverride ?? keyframe?.EasingOverride
                    }))
                })).filter(property => property.propertyKind)
            };
        }).filter(layer => layer.runtimeNodeId || layer.powerPointShapeId);

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
                get: async () => sendSdkRequest('yoanime.sdk.selection.get', {}),
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
            timeline: {
                get: async () => sendSdkRequest('yoanime.sdk.timeline.get', {}),
                bake: async (request = {}) => sendSdkRequest('yoanime.sdk.timeline.bake', {
                    label: request.label || request.Label || 'Timeline bake',
                    clear: request.clear || request.Clear || [],
                    durationSeconds: request.durationSeconds || request.DurationSeconds,
                    layers: normalizeBakeLayers(request.layers || request.Layers, request.durationSeconds || request.DurationSeconds)
                }),
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
            taskpane: {
                postMessage: async (message) => sendSdkRequest('yoanime.sdk.taskpane.postmessage', { message }),
                onMessage: (callback) => {
                    listeners.taskpaneMessage.add(callback);
                    return () => listeners.taskpaneMessage.delete(callback);
                }
            },
            playback: {
                onStarted: (callback) => {
                    if (typeof callback !== 'function') throw new Error('yoanime.playback.onStarted requires a callback.');
                    listeners.playbackStarted.add(callback);
                    return () => listeners.playbackStarted.delete(callback);
                },
                onStopped: (callback) => {
                    if (typeof callback !== 'function') throw new Error('yoanime.playback.onStopped requires a callback.');
                    listeners.playbackStopped.add(callback);
                    return () => listeners.playbackStopped.delete(callback);
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
            physics: createPhysicsApi()
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
