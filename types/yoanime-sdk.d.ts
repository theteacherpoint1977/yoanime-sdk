/* yoAnime Studio Runtime SDK v0.3.0
 * Public extension surface. Browser extensions send intents only; WPF/VSTO remain authoritative.
 */

declare global {
  interface Window {
    yoanime: YoAnimeSdk;
  }
}

export type RuntimePropertyKind =
  | "PositionX"
  | "PositionY"
  | "Width"
  | "Height"
  | "Rotation"
  | "AnchorX"
  | "AnchorY"
  | "ScaleX"
  | "ScaleY"
  | "Trajectory"
  | "Opacity"
  | "FillColor"
  | "StrokeColor"
  | "StrokeWeight"
  | "FontSize"
  | "TextColor"
  | "PositionZ"
  | "RotationX"
  | "RotationY"
  | "CameraDistance"
  | "CameraFov"
  | "DepthBlur"
  | "DepthOpacity"
  | "Blur"
  | "Glow";

export interface YoAnimeCapabilities {
  sdkVersion: string;
  hostVersion: string;
  surface: string;
  extensionId?: string;
  isExtensionSession: boolean;
  permissions: string[];
  capabilities: string[];
  apiStability: {
    stable: string[];
    preview?: string[];
    experimental: string[];
    deprecated: string[];
    internal: string[];
  };
  platformLaws: string[];
}

export interface SelectedShape {
  id: string;
  runtimeNodeId?: string;
  powerPointShapeId?: string;
  name?: string;
  type?: string;
  /**
   * Back-compat field. New timeline authoring code should use slideBounds for
   * PowerPoint mutation values and screenBounds for overlay rendering.
   */
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };
  slideBounds?: {
    x?: number;
    y?: number;
    left: number;
    top: number;
    width: number;
    height: number;
  };
  screenBounds?: {
    x?: number;
    y?: number;
    left: number;
    top: number;
    width: number;
    height: number;
  };
  hasStableRuntimeIdentity: boolean;
}

export interface RuntimePropertyValue {
  number?: number;
  color?: string;
}

export interface RuntimePropertyKeyframe {
  normalizedTime: number;
  value: RuntimePropertyValue;
  easingOverride?: string;
}

export interface RuntimePropertyTrack {
  propertyTrackId?: string;
  runtimeNodeId: string;
  /**
   * Transform properties use PowerPoint points for PositionX, PositionY, Width, and Height.
   * Rotation is degrees. ScaleX and ScaleY are multipliers where 1.0 means 100%.
   */
  propertyKind: RuntimePropertyKind;
  startTimeSeconds?: number;
  durationSeconds?: number;
  delaySeconds?: number;
  easingFunction?: string;
  sourceClipId?: string;
  sourceEffectType?: string;
  evaluationStatus?: "Active" | "DeferredCompositing" | "Unsupported";
  keyframes: RuntimePropertyKeyframe[];
  interpolation?: {
    easingFunction?: string;
    isAdditive?: boolean;
    blendMode?: string;
  };
}

export interface TimelinePropertyChannel {
  channelId?: string;
  displayName?: string;
  propertyKind: RuntimePropertyKind;
  valueType?: "number" | "color" | string;
  unit?: "pt" | "deg" | "ratio" | string;
  isAnimatable?: boolean;
  isSupported?: boolean;
  isAuthored?: boolean;
  propertyTrackId?: string;
  keyframeCount?: number;
}

export interface TimelinePropertyGroup {
  groupId?: string;
  displayName?: string;
  isExpanded?: boolean;
  channels: TimelinePropertyChannel[];
}

export interface TimelineClip {
  clipId?: string;
  runtimeNodeId?: string;
  effectType?: string;
  startTimeSeconds?: number;
  durationSeconds?: number;
  delaySeconds?: number;
  easingFunction?: string;
  propertyTracks?: RuntimePropertyTrack[];
  motionTrajectory?: unknown;
}

export interface TimelineLayerTrack {
  runtimeNodeId?: string;
  powerPointShapeId?: string;
  shapeName?: string;
  baseX?: number;
  baseY?: number;
  baseWidth?: number;
  baseHeight?: number;
  baseRotation?: number;
  isSelected?: boolean;
  isVisible?: boolean;
  isLocked?: boolean;
  clips?: TimelineClip[];
  propertyTracks?: RuntimePropertyTrack[];
  propertyGroups?: TimelinePropertyGroup[];
}

export interface TimelineSnapshot {
  slideInstanceId?: string;
  activeRuntimeNodeId?: string;
  activePowerPointShapeId?: string;
  timelineVersion?: string | number;
  totalDurationSeconds?: number;
  durationSeconds?: number;
  playheadPositionSeconds?: number;
  runtimePropertyModelVersion?: number;
  tracks?: TimelineLayerTrack[];
}

export interface TimelineLayerStateRequest {
  runtimeNodeId?: string;
  powerPointShapeId?: string;
  shapeId?: string;
  isVisible?: boolean;
  visible?: boolean;
  isLocked?: boolean;
  locked?: boolean;
}

export interface TimelineLayerStateResult {
  success: boolean;
  error?: string;
  runtimeNodeId?: string;
  powerPointShapeId?: string;
  isVisible?: boolean;
  isLocked?: boolean;
  timeline?: TimelineSnapshot;
  timelineVersion?: string | number;
}

export interface TimelineLayerApi {
  list(): Promise<TimelineLayerTrack[]>;
  active(): Promise<TimelineLayerTrack | null>;
  get(request: TimelineLayerStateRequest): Promise<TimelineLayerTrack | null>;
  groups(request: TimelineLayerStateRequest): Promise<TimelinePropertyGroup[]>;
  channels(request: TimelineLayerStateRequest): Promise<TimelinePropertyChannel[]>;
  setState(request: TimelineLayerStateRequest): Promise<TimelineLayerStateResult>;
  setVisible(request: TimelineLayerStateRequest, isVisible?: boolean): Promise<TimelineLayerStateResult>;
  setLocked(request: TimelineLayerStateRequest, isLocked?: boolean): Promise<TimelineLayerStateResult>;
}

export interface TimelinePresetTrack {
  propertyKind: RuntimePropertyKind;
  additive?: boolean;
  isAdditive?: boolean;
  startTimeSeconds?: number;
  durationSeconds?: number;
  delaySeconds?: number;
  easingFunction?: string;
  interpolation?: {
    easingFunction?: string;
    isAdditive?: boolean;
    blendMode?: string;
  };
  keyframes: RuntimePropertyKeyframe[] | Array<[number, number | string, string?]>;
}

export interface TimelinePreset {
  id?: string;
  runtimeNodeId?: string;
  name?: string;
  category?: string;
  description?: string;
  icon?: string;
  recommendedDurationSeconds?: number;
  startTimeSeconds?: number;
  durationSeconds?: number;
  easingFunction?: string;
  tracks: TimelinePresetTrack[];
}

export interface TimelinePresetPack {
  id: string;
  name?: string;
  description?: string;
  presets: TimelinePreset[];
}

export interface TimelinePresetResult {
  success: boolean;
  error?: string | null;
  errors?: TimelinePresetValidationError[];
  runtimeNodeId?: string;
  presetId?: string;
  name?: string;
  results?: PropertyTrackMutationResult[];
  timeline?: TimelineSnapshot;
  timelineVersion?: number | string;
}

export interface TimelinePresetValidationError {
  path: string;
  message: string;
}

export interface TimelinePresetValidationResult {
  success: boolean;
  error?: string | null;
  errors: TimelinePresetValidationError[];
}

export interface PropertyTrackMutationResult {
  success: boolean;
  error?: string;
  runtimeNodeId?: string;
  propertyTrackId?: string;
  timelineVersion?: string | number;
}

export interface ExtensionToggleResult {
  success: boolean;
  extensionId: string;
  enabled: boolean;
  taskPaneId?: string;
  overlayId?: string;
  supportsTaskPane?: boolean;
  supportsOverlay?: boolean;
}

export interface OverlayState {
  success: boolean;
  overlayId: string;
  taskPaneId: string;
  mounted: boolean;
  extensionId?: string;
  visible: boolean;
  interactive: boolean;
}

export interface SurfaceMessage<TMessage = unknown> {
  from: string;
  overlayId: string;
  taskPaneId: string;
  message: TMessage;
}

export interface SurfacePostMessageResult {
  success: boolean;
  destinationId: string;
}

export type YoAnimeSdkEventName =
  | "selection.changed"
  | "selection.cleared"
  | "scene.updated"
  | "timeline.updated"
  | "timeline.tick"
  | "channels.message"
  | "data.changed"
  | "webSurface.event"
  | "playback.started"
  | "playback.stopped"
  | "slideshow.started"
  | "slideshow.slidechanged"
  | "slideshow.ended"
  | "runtime.warning"
  | "runtime.sessionEnded";

export interface YoAnimeSdkEvent<TPayload = unknown> {
  type: YoAnimeSdkEventName | string;
  payload: TPayload;
  timestamp: number;
  surface: string;
}

export interface YoAnimeResult<TData = unknown> {
  success: boolean;
  requestId?: string;
  data?: TData;
  error?: string;
  errorCode?: string;
  command?: string;
}

export interface ShapeMutationProperties {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWeight?: number;
}

export interface WebSurfaceBounds {
  left?: number;
  top?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface WebSurfaceInfo {
  presentationUniqueId?: number;
  slideIndex?: number;
  slideId?: number;
  slideWidthPoints?: number;
  slideHeightPoints?: number;
  powerPointShapeId?: number;
  shapeName?: string;
  contentId?: string;
  sourceType?: "url" | "localHtml" | "effectPreset" | string;
  sourceUrl?: string;
  htmlPath?: string;
  fitMode?: "cover" | "contain" | "stretch" | string;
  interactiveInEdit?: boolean;
  interactiveInSlideshow?: boolean;
  autoplay?: boolean;
  backgroundMode?: "transparent" | "solid" | string;
  fallbackSnapshotPath?: string;
  trustLevel?: "first-party" | "untrusted" | string;
  bridgePolicy?: "visual-only" | string;
  sandboxPolicy?: "scripts-no-same-origin" | string;
  sourceProvider?: "generic" | "youtube" | "vimeo" | string;
  permissionProfile?: "generic-strict" | "youtube-embed" | "vimeo-embed" | string;
  boundsPoints?: WebSurfaceBounds;
  unrotatedBoundsScreenDIPs?: WebSurfaceBounds;
  shapeBoundsScreenDIPs?: WebSurfaceBounds;
}

export interface WebSurfaceListResult {
  success: boolean;
  targetInstanceId?: string;
  taskPaneId?: string;
  overlayId?: string;
  hasState?: boolean;
  state?: unknown;
  surfaces: WebSurfaceInfo[];
  surfaceCount: number;
  mode?: string;
}

export interface WebSurfaceRefreshResult extends WebSurfaceListResult {
  hadState?: boolean;
  previousSurfaceCount?: number;
}

export interface WebSurfaceEvent {
  contractVersion: "websurface-event.v1" | string;
  event: string;
  payload?: any;
  contentId?: string | null;
  shapeId?: number | string | null;
  shapeName?: string | null;
  presentationUniqueId?: number | string | null;
  slideIndex?: number | null;
  slideId?: number | string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  sourceHost?: string | null;
  sourceOrigin?: string | null;
  permissionProfile?: string | null;
  trust?: {
    level?: "first-party-preset" | "packaged-local-html" | "external-https" | "unknown" | string;
    firstParty?: boolean;
    external?: boolean;
  };
  source?: {
    renderer?: string;
    iframeOrigin?: string;
    [key: string]: any;
  } | null;
  sourceOverlayId?: string | null;
  taskPaneId?: string | null;
  timestamp?: number;
  receivedAtUtc?: string | null;
}

export interface WebSurfaceCreateRequest {
  sourceType?: "url" | "localHtml" | "effectPreset" | string;
  sourceUrl?: string;
  htmlPath?: string;
  bounds?: WebSurfaceBounds;
  fitMode?: "cover" | "contain" | "stretch" | string;
  interactiveInEdit?: boolean;
  interactiveInSlideshow?: boolean;
  autoplay?: boolean;
  backgroundMode?: "transparent" | "solid" | string;
}

export type MotionProviderKind =
  | "physics"
  | "noise"
  | "expression"
  | "constraint"
  | "path"
  | "svg"
  | "particle"
  | "layout"
  | "ik"
  | "lottie"
  | "ai"
  | "data"
  | "custom";

export interface MotionProviderContext {
  contractVersion: "motion-provider-context.v1" | string;
  providerId?: string | null;
  providerKind?: MotionProviderKind | string | null;
  options?: Record<string, any>;
  durationSeconds?: number;
  startTimeSeconds?: number;
  slideContext?: any;
  scene?: any;
  selection?: any;
  timeline?: any;
  query?: (query?: SceneQuery | string, options?: SceneQueryOptions) => Promise<SceneQueryResult>;
  sdk: YoAnimeSdk;
}

export interface MotionProvider {
  id: string;
  name?: string;
  label?: string;
  kind?: MotionProviderKind | string;
  category?: string;
  description?: string;
  tags?: string[];
  inputs?: Record<string, any>;
  outputContract?: string;
  ownerKind?: "builtin" | "extension" | "runtime" | string;
  ownerExtensionId?: string | null;
  packId?: string | null;
  packLabel?: string | null;
  generate(context: MotionProviderContext): Promise<TimelineBakeRequest | GeneratedMotionIr | any> | TimelineBakeRequest | GeneratedMotionIr | any;
}

export type MotionProviderInputType =
  | "number"
  | "range"
  | "boolean"
  | "select"
  | "text"
  | "string"
  | "duration"
  | "axis"
  | "color"
  | "shape"
  | "shapeRole"
  | "path"
  | "seed";

export interface MotionProviderInputSchema {
  type: MotionProviderInputType | string;
  label?: string;
  description?: string;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<string | { label: string; value: any }>;
  required?: boolean;
  placeholder?: string;
}

export interface MotionProviderPack {
  id: string;
  name?: string;
  label?: string;
  version?: string;
  description?: string;
  category?: string;
  icon?: string | null;
  docsUrl?: string | null;
  examples?: any[];
  permissions?: string[];
  inputs?: Record<string, MotionProviderInputSchema>;
  sharedInputs?: Record<string, MotionProviderInputSchema>;
  providers: MotionProvider[];
  ownerKind?: "extension" | "runtime" | "builtin" | string;
  ownerExtensionId?: string | null;
  providerIds?: string[];
}

export interface MotionProviderValidationResult {
  success: boolean;
  error?: string | null;
  errors?: Array<{ path: string; message: string }>;
  ir?: GeneratedMotionIr;
}

export interface GeneratedMotionDiagnostic {
  level?: "info" | "warning" | "error" | string;
  code?: string;
  message: string;
  path?: string | null;
  data?: any;
}

export interface GeneratedMotionIr {
  success?: boolean;
  contractVersion: "generated-motion.v1" | string;
  label?: string;
  description?: string;
  durationSeconds?: number;
  startTimeSeconds?: number;
  fps?: number | null;
  seed?: string | number | null;
  deterministic?: boolean;
  clear?: RuntimePropertyKind[] | string[];
  layers: TimelineBakeRequest["layers"];
  bake?: TimelineBakeRequest;
  preview?: {
    mode?: "timeline" | "ghost" | "none" | string;
    hints?: any[];
    ghostLayers?: any[];
    showDiagnostics?: boolean;
  };
  requirements?: {
    selectionRequired?: boolean;
    minSelectedShapes?: number;
    targetRoles?: string[];
    targetRuntimeNodeIds?: string[];
    permissions?: string[];
  };
  source?: {
    providerId?: string | null;
    providerKind?: MotionProviderKind | string | null;
    packId?: string | null;
    ownerExtensionId?: string | null;
    generator?: string | null;
  };
  metadata?: Record<string, any>;
  diagnostics?: GeneratedMotionDiagnostic[];
}

export interface MotionProviderGenerateResult {
  contractVersion: "motion-provider-result.v1" | string;
  provider: MotionProvider;
  request: any;
  output: TimelineBakeRequest;
  ir: GeneratedMotionIr;
  diagnostics?: GeneratedMotionDiagnostic[];
}

export interface MotionProviderBakeResult {
  contractVersion: "motion-provider-bake.v1" | string;
  provider: MotionProvider;
  generated: TimelineBakeRequest;
  ir?: GeneratedMotionIr;
  diagnostics?: GeneratedMotionDiagnostic[];
  bake: any;
}

export type SceneQuery = string | {
  runtimeNodeId?: string;
  nodeId?: string;
  powerPointShapeId?: string | number;
  shapeId?: string | number;
  role?: string | string[];
  roles?: string | string[];
  shapeRole?: string | string[];
  tag?: string | string[];
  tags?: string | string[];
  name?: string;
  shapeName?: string;
  type?: string;
  shapeType?: string;
  visible?: boolean | string;
  hidden?: boolean | string;
  selected?: boolean;
  hasMetadata?: boolean | string;
  metadata?: boolean | string;
  within?: { left?: number; top?: number; right?: number; bottom?: number; width?: number; height?: number; x?: number; y?: number };
  bounds?: { left?: number; top?: number; right?: number; bottom?: number; width?: number; height?: number; x?: number; y?: number };
  nearestTo?: string | { runtimeNodeId?: string; name?: string; role?: string; x?: number; y?: number };
  nearest?: string | { runtimeNodeId?: string; name?: string; role?: string; x?: number; y?: number };
  zOrder?: { runtimeNodeId?: string; name?: string; relation?: "above" | "below" | string };
  z?: { runtimeNodeId?: string; name?: string; relation?: "above" | "below" | string };
  limit?: number;
  includeGeometry?: boolean;
  includeShapeType?: boolean;
  includeTags?: boolean;
};

export interface SceneQueryOptions {
  includeGeometry?: boolean;
  includeShapeType?: boolean;
  includeTags?: boolean;
  limit?: number;
  scene?: any;
}

export interface SceneQueryDiagnostic {
  level?: "info" | "warning" | "error" | string;
  code?: string;
  message: string;
}

export interface SceneQueryResult extends Array<any> {
  contractVersion?: "scene-query-result.v1" | string;
  query?: SceneQuery | Record<string, any>;
  count?: number;
  diagnostics?: SceneQueryDiagnostic[];
}

export interface SceneQueryExplainResult {
  contractVersion: "scene-query-explain.v1" | string;
  query: SceneQuery | Record<string, any>;
  count: number;
  diagnostics: SceneQueryDiagnostic[];
  nodes: SceneQueryResult;
}

export interface RuntimeChannelEvent {
  contractVersion: "runtime-channel-event.v1" | string;
  channelId: string;
  event: string;
  payload: any;
  ownerExtensionId?: string | null;
  sourceSurface?: string | null;
  target?: string | null;
  messageId?: string | null;
  timestamp?: number;
}

export interface RuntimeChannelPublishResult {
  success: boolean;
  contractVersion: "runtime-channel-publish.v1" | string;
  channelId: string;
  event: string;
  messageId: string;
  deliveries: any[];
}

export interface RuntimeChannelState {
  contractVersion: "runtime-channel-state.v1" | string;
  channelId: string;
  label?: string;
  ownerExtensionId?: string | null;
  surface?: string;
  subscriberEvents?: string[];
  openedAt?: number;
}

export interface RuntimeChannel {
  id: string;
  label?: string;
  ownerExtensionId?: string | null;
  publish(eventName: string, payload?: any, options?: { target?: "peer" | "overlay" | "taskpane" | "local" | "all" | string; local?: boolean; ownerExtensionId?: string }): Promise<RuntimeChannelPublishResult>;
  subscribe(eventName: string, callback: (event: RuntimeChannelEvent) => void): () => void;
  close(): { success: boolean; channelId: string };
  getState(): RuntimeChannelState;
}

export interface DeveloperDiagnosticEvent {
  contractVersion: "sdk-diagnostic-event.v1" | string;
  type: string;
  level?: string;
  payload?: any;
  surface?: string;
  timestamp: number;
}

export interface DeveloperDiagnosticError {
  contractVersion: "sdk-diagnostic-error.v1" | string;
  code: string;
  message: string;
  data?: any;
  surface?: string;
  timestamp: number;
}

export interface DeveloperRecentEventsResult {
  contractVersion: "developer-recent-events.v1" | string;
  count: number;
  events: DeveloperDiagnosticEvent[];
}

export interface DeveloperRecentErrorsResult {
  contractVersion: "developer-recent-errors.v1" | string;
  count: number;
  errors: DeveloperDiagnosticError[];
}

export interface DeveloperRuntimeDiagnostics {
  contractVersion: "developer-runtime-diagnostics.v1" | string;
  sdkVersion: string;
  surface: string;
  ready: boolean;
  capabilities?: YoAnimeCapabilities | null;
  slideContext?: any;
  selection?: any;
  overlayState?: OverlayState | null;
  slideshowStatus?: any;
  listenerCounts?: Record<string, number>;
  providerCount?: number;
  providerPackCount?: number;
  channelCount?: number;
  recentEventCount?: number;
  recentErrorCount?: number;
}

export interface DeveloperProviderDiagnostics {
  contractVersion: "developer-provider-diagnostics.v1" | string;
  providerCount: number;
  packCount: number;
  byKind: Record<string, number>;
  invalidProviderCount: number;
  invalidPackCount: number;
  providers: any[];
  packs: any[];
}

export interface DeveloperSceneDiagnostics {
  contractVersion: "developer-scene-diagnostics.v1" | string;
  count: number;
  selectedCount: number;
  duplicateRuntimeNodeIds: Array<{ runtimeNodeId: string; count: number }>;
  hasDuplicateRuntimeNodeIds: boolean;
  diagnostics: any[];
  scene: any;
}

export interface DeveloperWebSurfaceDiagnostics {
  contractVersion: "developer-websurface-diagnostics.v1" | string;
  success: boolean;
  overlayId?: string | null;
  taskPaneId?: string | null;
  surfaceCount: number;
  surfaces: WebSurfaceInfo[];
  recentEvents: DeveloperDiagnosticEvent[];
  rendererState?: any;
}

export interface DeveloperChannelDiagnostics {
  contractVersion: "developer-channel-diagnostics.v1" | string;
  channelCount: number;
  channels: RuntimeChannelState[];
  recentMessages: DeveloperDiagnosticEvent[];
}

export interface DataSourceInfo {
  id: string;
  label?: string;
  name?: string;
  ownerKind?: string;
  ownerExtensionId?: string | null;
  refreshIntervalSeconds?: number;
  cacheTtlSeconds?: number;
  lastReadAt?: number | null;
  lastRefreshAt?: number | null;
  hasCachedData?: boolean;
  lastError?: any;
  [key: string]: any;
}

export interface DataSourceContext {
  contractVersion: "data-source-context.v1" | string;
  source?: DataSourceInfo | null;
  options?: any;
  scene?: any;
  selection?: any;
  sdk?: YoAnimeSdk;
  timestamp: number;
}

export interface DataSourceResult {
  contractVersion: "data-source-result.v1" | string;
  sourceId: string;
  label?: string;
  rows: any[];
  data: any;
  metadata?: any;
  cached: boolean;
  refreshed: boolean;
  readAt: number;
  ownerKind?: string;
  ownerExtensionId?: string | null;
}

export interface DataSourceRegisterResult {
  success: boolean;
  contractVersion: "data-source-register.v1" | string;
  source?: DataSourceInfo | null;
  sourceId?: string;
  sourceCount: number;
  error?: string | null;
  errors?: any[];
}

export interface DataSourceChangeEvent {
  contractVersion: "data-source-change.v1" | string;
  reason: string;
  sourceCount: number;
  sourceId?: string | null;
  ownerExtensionId?: string | null;
  [key: string]: any;
}

export interface DeveloperDataSourceDiagnostics {
  contractVersion: "developer-data-source-diagnostics.v1" | string;
  sourceCount: number;
  sources: DataSourceInfo[];
  recentEvents: DeveloperDiagnosticEvent[];
}

export interface DeveloperMotionValidation {
  contractVersion: "developer-motion-validation.v1" | string;
  inputContractVersion?: string | null;
  normalizedContractVersion: string;
  success: boolean;
  error?: string | null;
  errors: any[];
  diagnostics: any[];
  layerCount: number;
  durationSeconds?: number;
  ir: GeneratedMotionIr;
}

export interface DeveloperBakeExplanation {
  contractVersion: "developer-bake-explain.v1" | string;
  success?: boolean | null;
  label?: string | null;
  providerId?: string | null;
  timelineVersion?: string | null;
  timelineOmitted: boolean;
  timelineOmitReason?: string | null;
  layerCount: number;
  propertyTrackCount: number;
  clear: string[];
  diagnostics: any[];
  validation?: DeveloperMotionValidation | null;
}

export interface TimelineBakeRequest {
  label?: string;
  clear?: RuntimePropertyKind[] | string[];
  durationSeconds?: number;
  layers: Array<{
    runtimeNodeId?: string;
    properties: Record<string, {
      propertyKind?: RuntimePropertyKind | string;
      startTimeSeconds?: number;
      durationSeconds?: number;
      delaySeconds?: number;
      easingFunction?: string;
      keyframes: RuntimePropertyKeyframe[];
    }> | Array<{
      propertyKind: RuntimePropertyKind | string;
      startTimeSeconds?: number;
      durationSeconds?: number;
      delaySeconds?: number;
      easingFunction?: string;
      keyframes: RuntimePropertyKeyframe[];
    }>;
  }>;
}

export interface PhysicsGeneratedMotion extends TimelineBakeRequest {
  success: boolean;
  contractVersion: "physics-generated-motion.v1" | "physics-bake.v1" | string;
  fps?: number;
  steps?: number;
  layerCount?: number;
  contacts?: any[];
  world?: any;
  bakeResult?: any;
}

export interface YoAnimeSdk {
  version: string;
  /** @internal Debug convenience for local development. */
  debug: {
    enableLogging(enabled: boolean): void;
  };
  /** @stable Generic SDK event bus. Event-specific permissions still apply. */
  events: {
    on<TPayload = unknown>(
      eventName: YoAnimeSdkEventName | string,
      callback: (event: YoAnimeSdkEvent<TPayload>) => void
    ): () => void;
  };
  /** @stable Runtime readiness, capabilities, permissions, and current surface identity. */
  runtime: {
    surface: string;
    ready(): Promise<void>;
    getCapabilities(): Promise<YoAnimeCapabilities>;
    onWarning(callback: (warning: any) => void): () => void;
    onSessionEnded(callback: () => void): () => void;
  };
  /** @stable Current PowerPoint selection and selection lifecycle. Requires selection.read. */
  selection: {
    get(): Promise<SelectedShape | null>;
    onChanged(callback: (shape: SelectedShape) => void): () => void;
    onCleared(callback: () => void): () => void;
  };
  /** @preview Direct shape mutation helpers. Prefer scene roles and timeline.bake for public examples. */
  shapes: {
    get(runtimeNodeId: string): Promise<any | null>;
    setPosition(runtimeNodeId: string, position: { x?: number; y?: number }): Promise<any>;
    setRotation(runtimeNodeId: string, angle: number): Promise<any>;
    setSize(runtimeNodeId: string, size: { width?: number; height?: number }): Promise<any>;
    setScale(runtimeNodeId: string, scale: { x?: number; y?: number }): Promise<any>;
    batchMutate(mutations: any[]): Promise<any>;
  };
  /** @stable read/event APIs. @preview create/update/remove authoring APIs. */
  webSurface: {
    /** @stable Lists the Web Surfaces currently known to the active renderer surface. Requires websurface.read. */
    list(): Promise<WebSurfaceListResult>;
    /** @stable Replays the latest cached renderer state. This does not force a VSTO slide rescan yet. Requires websurface.read. */
    refresh(): Promise<WebSurfaceRefreshResult>;
    /** @preview Creates a Web Surface through the VSTO-authoritative authoring path. Requires websurface.write. */
    create(request: WebSurfaceCreateRequest): Promise<any>;
    /** @preview Updates a Web Surface through the VSTO-authoritative authoring path. Requires websurface.write. */
    update(contentId: string, patch: Partial<WebSurfaceCreateRequest>): Promise<any>;
    /** @preview Removes a Web Surface through the VSTO-authoritative authoring path. Requires websurface.write. */
    remove(contentId: string): Promise<any>;
    /** @stable Subscribe to sanitized data-only events emitted by Web Surface iframe content. Requires websurface.read. */
    onEvent(callback: (event: WebSurfaceEvent) => void): () => void;
  };
  /** @stable scene reads, role writes, and query DSL. @preview direct mutation/grouping APIs. */
  scene: {
    /** @stable Requires scene.read. */
    get(knownVersion?: number): Promise<any>;
    /** @stable Requires scene.read. */
    get(options: { knownVersion?: number; includeGeometry?: boolean; includeShapeType?: boolean; includeTags?: boolean }): Promise<any>;
    /** @stable Requires scene.read. */
    query(query?: SceneQuery | string, options?: SceneQueryOptions): Promise<SceneQueryResult>;
    /** @stable Requires scene.read. */
    findOne(query?: SceneQuery | string, options?: SceneQueryOptions): Promise<any | null>;
    /** @stable Requires scene.read. */
    explainQuery(query?: SceneQuery | string, options?: SceneQueryOptions): Promise<SceneQueryExplainResult>;
    /** @preview Requires scene.write/shapes.write. Prefer timeline.bake for animation authoring. */
    mutateShape(runtimeNodeId: string, properties: ShapeMutationProperties): Promise<any>;
    /** @preview Requires scene.write/shapes.write. */
    batchMutate(mutations: any[]): Promise<any>;
    /** @preview Requires scene.write. */
    group(nodeIds: string[]): Promise<any>;
    /** @preview Requires scene.write. */
    ungroup(groupId: string): Promise<any>;
    /** @stable Requires scene.read. */
    onUpdated(callback: (scene: any) => void): () => void;
  };
  /** @stable timeline get/bake/playback. @preview direct editor/persistence APIs. */
  timeline: {
    /** @stable Requires timeline.read. */
    get(): Promise<TimelineSnapshot>;
    /** @stable Requires timeline.playback. */
    play(options?: { startTimeSeconds?: number; time?: number }): void;
    /** @stable Requires timeline.playback. */
    stop(): void;
    /** @stable Requires timeline.playback. */
    scrub(timeSeconds: number): Promise<void>;
    /** @stable Requires timeline.playback. */
    scrubBegin(timeSeconds?: number): Promise<void>;
    /** @stable Requires timeline.playback. */
    scrubUpdate(timeSeconds: number): Promise<void>;
    /** @stable Requires timeline.playback. */
    scrubEnd(timeSeconds: number): Promise<void>;
    /** @preview Direct timeline editor API. */
    updateClip(clipId: string, options: { duration?: number; delay?: number; easing?: string }): Promise<void>;
    /** @preview Direct property-track editing API. */
    createTrack(request: RuntimePropertyTrack): Promise<PropertyTrackMutationResult>;
    /** @preview Direct keyframe editing API. */
    addKeyframe(request: {
      runtimeNodeId: string;
      propertyTrackId?: string;
      propertyKind?: RuntimePropertyKind;
      normalizedTime: number;
      value: RuntimePropertyValue;
      easingOverride?: string;
    }): Promise<PropertyTrackMutationResult>;
    /** @preview Direct keyframe editing API. */
    setKeyframe(request: {
      runtimeNodeId: string;
      propertyTrackId?: string;
      propertyKind?: RuntimePropertyKind;
      normalizedTime: number;
      originalNormalizedTime?: number;
      value: RuntimePropertyValue;
      easingOverride?: string;
    }): Promise<PropertyTrackMutationResult>;
    /** @preview Direct keyframe editing API. */
    deleteKeyframe(request: {
      runtimeNodeId: string;
      propertyTrackId?: string;
      propertyKind?: RuntimePropertyKind;
      normalizedTime: number;
    }): Promise<PropertyTrackMutationResult>;
    /** @preview Direct property-track editing API. */
    deleteTrack(request: { runtimeNodeId: string; propertyTrackId?: string; propertyKind?: RuntimePropertyKind }): Promise<PropertyTrackMutationResult>;
    /** @preview Direct keyframe easing editing API. */
    setEasing(request: {
      runtimeNodeId: string;
      propertyTrackId?: string;
      propertyKind?: RuntimePropertyKind;
      normalizedTime?: number;
      easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'hold' | string;
    }): Promise<PropertyTrackMutationResult>;
    /** @preview Timeline persistence API. */
    save(options?: { slot?: string }): Promise<{ success: boolean; slot?: string; path?: string; storage?: string; presentationName?: string; timelineVersion?: string | number; error?: string; timeline?: TimelineSnapshot }>;
    /** @preview Timeline persistence API. */
    load(options?: { slot?: string }): Promise<{ success: boolean; slot?: string; path?: string; storage?: string; presentationName?: string; timelineVersion?: string | number; error?: string; timeline?: TimelineSnapshot }>;
    /** @preview Embedded timeline persistence API. */
    saveToPresentation(options?: { slot?: string }): Promise<{ success: boolean; slot?: string; storage?: string; presentationName?: string; timelineVersion?: string | number; error?: string; timeline?: TimelineSnapshot }>;
    /** @preview Embedded timeline persistence API. */
    loadFromPresentation(options?: { slot?: string }): Promise<{ success: boolean; slot?: string; storage?: string; presentationName?: string; timelineVersion?: string | number; error?: string; timeline?: TimelineSnapshot }>;
    /** @internal Raw timeline export is not a public live scripting path. */
    export(): Promise<{ success: boolean; timeline?: TimelineSnapshot; timelineVersion?: string | number; error?: string }>;
    /** @internal Raw timeline import is not a public live scripting path. */
    import(timeline: TimelineSnapshot, options?: { slot?: string; save?: boolean }): Promise<{ success: boolean; slot?: string; path?: string; timelineVersion?: string | number; error?: string; timeline?: TimelineSnapshot }>;
    /** @preview Direct timeline editor API. */
    rebaseTrack(request: { runtimeNodeId: string }): Promise<PropertyTrackMutationResult>;
    /** @preview Timeline layer editor API. */
    setLayerState(request: TimelineLayerStateRequest): Promise<TimelineLayerStateResult>;
    /** @preview Timeline layer editor API. */
    getLayers(): Promise<TimelineLayerTrack[]>;
    /** @preview Timeline layer editor API. */
    getActiveLayer(): Promise<TimelineLayerTrack | null>;
    /** @preview Timeline layer editor API. */
    layers: TimelineLayerApi;
    /** @preview Preset catalog API. */
    getBuiltInPresets(): Promise<TimelinePreset[]>;
    /** @preview Preset catalog API. */
    getPresetPacks(): Promise<TimelinePresetPack[]>;
    /** @preview Preset catalog API. */
    getPresets(): Promise<TimelinePreset[]>;
    /** @preview Preset validation API. */
    validatePresetPack(pack: TimelinePresetPack): Promise<TimelinePresetValidationResult>;
    /** @preview Preset registration API. */
    registerPresetPack(pack: TimelinePresetPack): Promise<{ success: boolean; packId?: string; presetCount?: number; error?: string; errors?: TimelinePresetValidationError[] }>;
    /** @preview Preset registration API. */
    unregisterPresetPack(packId: string): Promise<{ success: boolean; packId: string }>;
    /** @preview Preset application API. */
    applyPreset(preset: TimelinePreset | string): Promise<TimelinePresetResult>;
    /** @stable Requires timeline.playback. */
    playFrom(timeSeconds?: number): void;
    /** @stable Requires timeline.playback. */
    scrubTo(timeSeconds?: number): Promise<void>;
    /** @preview Direct property-track editing API. */
    propertytrack: {
      upsert(request: RuntimePropertyTrack): Promise<PropertyTrackMutationResult>;
      delete(request: { runtimeNodeId: string; propertyTrackId?: string; propertyKind?: RuntimePropertyKind }): Promise<PropertyTrackMutationResult>;
      updateKeyframe(request: {
        runtimeNodeId: string;
        propertyTrackId: string;
        normalizedTime: number;
        originalNormalizedTime?: number;
        newValue: RuntimePropertyValue;
        easingOverride?: string;
      }): Promise<PropertyTrackMutationResult>;
      deleteKeyframe(request: { runtimeNodeId: string; propertyTrackId: string; normalizedTime: number }): Promise<PropertyTrackMutationResult>;
      beginEdit(request?: { runtimeNodeId?: string; propertyTrackId?: string; reason?: string }): Promise<any>;
      endEdit(request?: { runtimeNodeId?: string; propertyTrackId?: string; reason?: string }): Promise<any>;
    };
    /** @stable Requires timeline.read. */
    onUpdated(callback: (timeline: any) => void): () => void;
    /** @stable Requires timeline.playback. */
    onTick(callback: (tick: any) => void): () => void;
  };
  /** @stable list/get/generate/bake consumption. @preview registration, packs, validation, IR, and change events. */
  motionProviders: {
    /** @preview Generated Motion IR helper contract. */
    ir: {
      normalize(output: TimelineBakeRequest | GeneratedMotionIr | any, fallback?: Record<string, any>): GeneratedMotionIr;
      validate(ir: TimelineBakeRequest | GeneratedMotionIr | any): MotionProviderValidationResult;
      toBakeRequest(ir: TimelineBakeRequest | GeneratedMotionIr | any, overrides?: Partial<TimelineBakeRequest>): TimelineBakeRequest;
    };
    validate(provider: MotionProvider): MotionProviderValidationResult;
    validateInputs(inputs: Record<string, MotionProviderInputSchema>): MotionProviderValidationResult;
    validatePack(pack: MotionProviderPack): MotionProviderValidationResult;
    /** @preview Registers an in-memory provider owned by the current extension/runtime. */
    register(provider: MotionProvider, options?: { ownerExtensionId?: string; extensionId?: string }): Promise<{ success: boolean; provider?: MotionProvider; providerCount?: number; error?: string; errors?: any[] }>;
    /** @preview Unregisters an in-memory provider. */
    unregister(providerId: string): Promise<{ success: boolean; providerId: string; providerCount: number }>;
    /** @preview Registers an in-memory provider pack. */
    registerPack(pack: MotionProviderPack, options?: { ownerExtensionId?: string; extensionId?: string; replace?: boolean }): Promise<{ success: boolean; pack?: MotionProviderPack; providers?: MotionProvider[]; providerCount?: number; packCount?: number; error?: string; errors?: any[] }>;
    /** @preview Unregisters an in-memory provider pack. */
    unregisterPack(packId: string): Promise<{ success: boolean; packId: string; providerIds?: string[]; providerCount: number; packCount: number }>;
    /** @preview Provider pack inspection. */
    listPacks(): MotionProviderPack[];
    /** @preview Provider pack inspection. */
    getPack(packId: string): MotionProviderPack | null;
    /** @stable Lists callable built-in and registered providers. */
    list(): MotionProvider[];
    /** @stable Gets a callable provider descriptor by id. */
    get(providerId: string): MotionProvider | null;
    /** @preview Builds the provider execution context without generating motion. */
    createContext(request?: Record<string, any>): Promise<MotionProviderContext>;
    /** @stable Generates motion from a built-in or registered provider. */
    generate(providerId: string, request?: Record<string, any>): Promise<MotionProviderGenerateResult>;
    /** @stable Generates and bakes motion through the timeline. */
    bake(providerId: string, request?: Record<string, any>): Promise<MotionProviderBakeResult>;
    /** @preview Provider registry change events. */
    onChanged(callback: (event: any) => void): () => void;
  };
  /** @stable Pure deterministic noise helpers. */
  noise: {
    hashSeed(seed?: string): number;
    random(seed?: string): () => number;
    smoothstep(t: number): number;
    value1D(x: number, seed?: string): number;
    generateKeyframes(options?: {
      amplitude?: number;
      frequency?: number;
      durationSeconds?: number;
      sampleCount?: number;
      fps?: number;
      seed?: string;
      baseline?: number;
      mode?: "smooth" | "sine" | string;
    }): RuntimePropertyKeyframe[];
    generateWiggle(options?: {
      runtimeNodeId?: string;
      target?: SelectedShape | any;
      axis?: "x" | "y" | "xy" | "position" | "rotation" | "r" | "float" | string;
      amplitude?: number;
      rotationAmplitude?: number;
      frequency?: number;
      durationSeconds?: number;
      fps?: number;
      sampleCount?: number;
      seed?: string;
      additive?: boolean;
      mode?: "smooth" | "sine" | string;
      propertyKind?: RuntimePropertyKind | string;
      label?: string;
    }): TimelineBakeRequest;
  };
  /** @stable Pure constraint helpers and motion generation helpers. */
  constraints: {
    boundsOf(shape: any): {
      left: number;
      top: number;
      width: number;
      height: number;
      right: number;
      bottom: number;
      centerX: number;
      centerY: number;
      rotation: number;
    };
    findShape(sceneOrShapes: any, selector?: Record<string, any>): any | null;
    resolvePair(options?: Record<string, any>): Promise<{
      scene: any;
      source: any;
      target: any;
      sourceBounds: any;
      targetBounds: any;
    }>;
    generateFollow(options?: Record<string, any>): Promise<TimelineBakeRequest>;
    generateLookAt(options?: Record<string, any>): Promise<TimelineBakeRequest>;
    generateMaintainDistance(options?: Record<string, any>): Promise<TimelineBakeRequest>;
  };
  /** @stable Pure SVG/path sampling helpers and path motion generation helpers. */
  paths: {
    parsePolyline(points: string | Array<[number, number]> | Array<{ x: number; y: number }>): Array<{ x: number; y: number }>;
    samplePolyline(points: string | Array<[number, number]> | Array<{ x: number; y: number }>, sampleCount?: number): Array<{ normalizedTime: number; x: number; y: number }>;
    sampleSvgPath(pathData: string, options?: { sampleCount?: number; samples?: number }): Array<{ normalizedTime: number; x: number; y: number }>;
    ellipsePoints(options?: {
      centerX?: number;
      centerY?: number;
      x?: number;
      y?: number;
      radius?: number;
      radiusX?: number;
      radiusY?: number;
      startAngleDegrees?: number;
      turns?: number;
      sampleCount?: number;
    }): Array<{ normalizedTime: number; x: number; y: number }>;
    generateFollowPath(options?: Record<string, any>): Promise<TimelineBakeRequest>;
    generateOrbitTarget(options?: Record<string, any>): Promise<TimelineBakeRequest>;
  };
  /** @stable local parsing/helpers. @preview provider contract and full Lottie import semantics. */
  lottie: {
    parse(input: string | Record<string, any>): any;
    getDurationSeconds(lottie: any, options?: Record<string, any>): number;
    listLayers(input: string | Record<string, any>): Array<{
      index: number;
      ind: number | null;
      name: string;
      type: number | null;
      hasTransform: boolean;
      supported: boolean;
    }>;
    selectLayer(lottie: any, options?: { layerIndex?: number; layerName?: string }): any;
    normalizeAnimatedValues(property: any, options?: { frameRate?: number; inPoint?: number; outPoint?: number }): Array<{ normalizedTime: number; value: any }>;
    generateTransform(options?: Record<string, any>): Promise<GeneratedMotionIr>;
  };
  /** @stable local request/explanation helpers. @preview AI motion provider contract. */
  ai: {
    normalizeRequest(request?: Record<string, any>): {
      contractVersion: "ai-motion-request.v1" | string;
      prompt: string;
      style: string;
      seed: string;
      durationSeconds: number;
      model: any;
      targetRuntimeNodeIds: string[];
      options: any;
    };
    explainPrompt(request?: Record<string, any>): {
      contractVersion: "ai-motion-explanation.v1" | string;
      prompt: string;
      style: string;
      seed: string;
      model: any;
      intents: string[];
      reproducible: boolean;
      authority: string;
      note?: string;
    };
    generatePromptMotion(request?: Record<string, any>): Promise<GeneratedMotionIr>;
  };
  /** @stable Physics world, diagnostics, simulation, bake, primitives, and presets. */
  physics: {
    createWorldFromScene(options?: Record<string, any>): Promise<any>;
    generateSimulation(request?: Record<string, any>): Promise<PhysicsGeneratedMotion>;
    bakeSimulation(request?: Record<string, any>): Promise<PhysicsGeneratedMotion>;
    inspectWorld(world: any, options?: Record<string, any>): any[];
    compareSceneToSlide(sceneOrWorld: any, slideContext?: any, options?: Record<string, any>): any;
    diagnostics: {
      analyzeWorld(world: any, options?: Record<string, any>): any;
      summarizeBake(result: any, options?: Record<string, any>): any;
    };
    primitives: {
      materialProfiles: Record<string, { restitution: number; friction: number; density: number }>;
      listMaterialProfiles(): Array<{ id: string; restitution: number; friction: number; density: number }>;
      getMaterialProfile(id: string): { id: string; restitution: number; friction: number; density: number } | null;
      gravity(x?: number, y?: number, scale?: number): { x: number; y: number; scale: number };
      impulse(options?: Record<string, any>): (args: any) => Promise<void>;
      composeBeforeSimulate(...steps: Array<((args: any) => any) | Array<(args: any) => any> | null | undefined>): (args: any) => Promise<void>;
      worldOptions(options?: Record<string, any>): Record<string, any>;
      prepareBakeRequest(options?: Record<string, any>): Promise<any>;
    };
    presets: {
      rampRoll(options?: Record<string, any>): Promise<any>;
      projectileImpact(options?: Record<string, any>): Promise<any>;
      fallingStack(options?: Record<string, any>): Promise<any>;
      multiBallCascade(options?: Record<string, any>): Promise<any>;
    };
  };
  /** @stable Runtime playback lifecycle. */
  playback: {
    onStarted(callback: (event: any) => void): () => void;
    onStopped(callback: (event: any) => void): () => void;
  };
  /** @stable Read-only slideshow lifecycle/status. Requires slideshow.read. */
  slideshow: {
    getStatus(): Promise<any>;
    onStarted(callback: (event: any) => void): () => void;
    onSlideChanged(callback: (event: any) => void): () => void;
    onEnded(callback: (event: any) => void): () => void;
  };
  /** @internal First-party trajectory visualization/editing only. */
  trajectory: {
    onOverlayUpdated(callback: (overlay: any) => void): () => void;
    onSelectionUpdated(callback: (selection: any) => void): () => void;
    select(request: any): void;
    setEasing(request: { clipId: string; easing: string }): void;
    clearSelection(): void;
    projectOverlayLocalToSlide(overlayLocalX: number, overlayLocalY: number): Promise<any>;
    mutateEndpoint(request: any): Promise<any>;
  };
  /** @stable Active slide context. Requires geometry.read. */
  slide: {
    getContext(): Promise<any>;
  };
  /** @stable Projection helpers. Requires geometry.read. */
  geometry: {
    screenToSlide(screenX: number, screenY: number): Promise<any>;
    screenToSlide(point: { x: number; y: number } | { X: number; Y: number }): Promise<any>;
    slideToScreen(slideX: number, slideY: number): Promise<any>;
    slideToScreen(point: { x: number; y: number } | { X: number; Y: number }): Promise<any>;
  };
  /** @stable Overlay visibility, interactivity, and surface messaging. */
  overlay: {
    show(): Promise<{ success: boolean; overlayId: string; visible: true }>;
    hide(): Promise<{ success: boolean; overlayId: string; visible: false }>;
    toggle(visible: boolean): Promise<{ success: boolean; overlayId: string; visible: boolean }>;
    getState(): Promise<OverlayState>;
    setInteractive(isInteractive: boolean): Promise<{ success: boolean }>;
    postMessage<TMessage = unknown>(message: TMessage): Promise<SurfacePostMessageResult>;
    onMessage<TMessage = unknown>(callback: (event: SurfaceMessage<TMessage>) => void): () => void;
  };
  /** @stable Taskpane surface messaging. */
  taskpane: {
    postMessage<TMessage = unknown>(message: TMessage): Promise<SurfacePostMessageResult>;
    onMessage<TMessage = unknown>(callback: (event: SurfaceMessage<TMessage>) => void): () => void;
  };
  /** @stable JSON-safe runtime channels for taskpane/overlay coordination. */
  channels: {
    open(channelId: string, options?: { label?: string; ownerExtensionId?: string; extensionId?: string }): Promise<RuntimeChannel>;
    get(channelId: string): RuntimeChannel | null;
    list(): RuntimeChannelState[];
    close(channelId: string): { success: boolean; channelId: string; dropReason?: string };
    publish(channelId: string, eventName: string, payload?: any, options?: { target?: "peer" | "overlay" | "taskpane" | "local" | "all" | string; local?: boolean; ownerExtensionId?: string }): Promise<RuntimeChannelPublishResult>;
    subscribe(channelId: string, eventName: string, callback: (event: RuntimeChannelEvent) => void, options?: { label?: string; ownerExtensionId?: string; extensionId?: string }): Promise<() => void>;
    onMessage(callback: (event: YoAnimeSdkEvent<RuntimeChannelEvent>) => void): () => void;
  };
  /** @preview Data source provider APIs from Phase 100. */
  data: {
    validateSource(source: any): { success: boolean; error?: string | null; errors: any[] };
    registerSource(source: any, options?: { replace?: boolean; ownerExtensionId?: string; extensionId?: string }): Promise<DataSourceRegisterResult>;
    unregisterSource(id: string): { success: boolean; contractVersion: string; sourceId: string; sourceCount: number };
    listSources(): DataSourceInfo[];
    getSource(id: string): DataSourceInfo | null;
    read(id: string, options?: { force?: boolean; cacheTtlSeconds?: number; includeScene?: boolean; includeSelection?: boolean; [key: string]: any }): Promise<DataSourceResult>;
    refresh(id: string, options?: { cacheTtlSeconds?: number; includeScene?: boolean; includeSelection?: boolean; [key: string]: any }): Promise<DataSourceResult>;
    refreshAll(options?: any): Promise<{ success: boolean; contractVersion: string; sourceCount: number; results: DataSourceResult[] }>;
    clearCache(id?: string | null): { success: boolean; contractVersion: string; sourceId?: string | null; cleared: number };
    onChanged(callback: (event: DataSourceChangeEvent) => void): () => void;
  };
  /** @preview Developer diagnostics toolkit. Requires diagnostics.read for host-backed diagnostics. */
  dev: {
    inspectRuntime(): Promise<DeveloperRuntimeDiagnostics>;
    inspectProviders(): DeveloperProviderDiagnostics;
    inspectScene(options?: any): Promise<DeveloperSceneDiagnostics>;
    inspectWebSurfaces(): Promise<DeveloperWebSurfaceDiagnostics>;
    inspectChannels(): DeveloperChannelDiagnostics;
    inspectDataSources(): DeveloperDataSourceDiagnostics;
    validateMotion(motion: any): DeveloperMotionValidation;
    explainBake(result: any): DeveloperBakeExplanation;
    getRecentEvents(options?: { type?: string; limit?: number; count?: number; since?: number; sinceTimestamp?: number }): DeveloperRecentEventsResult;
    getRecentErrors(options?: { code?: string; type?: string; limit?: number; count?: number; since?: number; sinceTimestamp?: number }): DeveloperRecentErrorsResult;
  };
  /** @stable Pointer ownership helpers for overlay interactions. Requires interaction.write. */
  interaction: {
    capturePointer(): void;
    releasePointer(): void;
    /**
     * Marks the overlay as pointer-owned for high-frequency web interactions.
     * Use during handle drags, then release so empty overlay regions can pass through to PowerPoint.
     */
    beginDrag(): void;
    endDrag(): void;
  };
  /** @stable getInstalled. @internal mount/unmount/toggle are host launcher plumbing. */
  extensions: {
    /** @stable Requires extensions.read. */
    getInstalled(): Promise<any[]>;
    /** @internal Requires extensions.write; ordinary extensions should not mount other extensions. */
    mount(extensionId: string): Promise<ExtensionToggleResult>;
    /** @internal Requires extensions.write; ordinary extensions should not unmount other extensions. */
    unmount(extensionId: string): Promise<ExtensionToggleResult>;
    /** @internal Requires extensions.write; ordinary extensions should not toggle other extensions. */
    toggle(extensionId: string, enable: boolean): Promise<ExtensionToggleResult>;
  };
}

export {};
