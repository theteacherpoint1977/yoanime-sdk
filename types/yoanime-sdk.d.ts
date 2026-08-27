/* yoAnime Studio Runtime SDK v0.4.0
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

/** Two-dimensional point in slide-point (PPT coordinate) or screen-DIP space. */
export interface PointDto {
  x: number;
  y: number;
}

/**
 * Normalized selection result returned by `selection.get()` and delivered to
 * `selection.onChanged()`. Wraps the primary shape with selection metadata.
 */
export interface SelectionResult {
  primary: SelectedShape | null;
  shape: SelectedShape | null;
  shapes: SelectedShape[];
  count: number;
  groupBounds?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
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
  | "scene.changed"
  | "timeline.updated"
  | "timeline.tick"
  | "channels.message"
  | "channels.opened"
  | "channels.closed"
  | "constraints.changed"
  | "behavior.changed"
  | "data.changed"
  | "webSurface.event"
  | "playback.started"
  | "playback.stopped"
  | "slideshow.started"
  | "slideshow.slideChanged"
  | "slideshow.ended"
  | "presets.changed"
  | "motionproviders.changed"
  | "transforms.changed"
  | "commands.changed"
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
  version?: string;
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

export interface TimelineBakeResult {
  success: boolean;
  error?: string;
  label: string;
  layerCount: number;
  propertyTrackCount: number;
  timeline?: TimelineSnapshot;
  timelineOmitted?: boolean;
  timelineOmitReason?: string;
  timelineVersion: number;
}

export interface TimelineHistoryTransactionResult {
  success: boolean;
  error?: string;
  operation?: string;
  label?: string;
  depth: number;
  undoDepth: number;
  redoDepth: number;
  timeline?: TimelineSnapshot;
  timelineVersion: number;
}

export interface TimelineHistoryResult {
  success: boolean;
  error?: string;
  operation?: string;
  timeline?: TimelineSnapshot;
  timelineVersion: number;
  undoDepth: number;
  redoDepth: number;
}

export interface ShapeDescriptor {
  id?: string;
  logicalId?: string;
  type?: string;
  bounds?: {
    left?: number;
    x?: number;
    top?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  rotation?: number;
  visible?: boolean;
  zIndex?: number;
  name?: string;
  fill?: { color: string };
  outline?: { color: string; weight?: number };
  text?: { content: string; fontSize?: number; color?: string };
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface SceneBuildDescriptor {
  clear?: boolean;
  shapes: ShapeDescriptor[];
}

export interface ShapeCreateResult {
  id: string;
  runtimeNodeId: string;
  name: string;
  powerPointShapeId: string;
}

export interface SdkSceneBuildResult {
  success: boolean;
  shapes: ShapeCreateResult[];
  error?: string;
}

export interface RolesSetOptions {
  roles?: string[];
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface RolesSetResult {
  success: boolean;
  runtimeNodeId: string;
  roles: string[];
  tags: string[];
  metadata: Record<string, string>;
  transactionId: string;
  error?: string;
}

/**
 * Closed V1 constraint taxonomy (F3.1; contract §4). The union is closed at the four V1
 * types; Spring and deferred types are absent from the V1 surface.
 */
export type ConstraintType =
  | "Follow"
  | "MaintainDistance"
  | "LookAt"
  | "MaintainOffset";

/** Per-type parameter set carried by create/update/read (F2.5; contract §4). Fields irrelevant to a type are simply not used. */
export interface ConstraintParameters {
  /** Offset applied to the source along X (Follow, MaintainOffset). */
  offsetX?: number;
  /** Offset applied to the source along Y (Follow, MaintainOffset). */
  offsetY?: number;
  /** Rotation offset in degrees (Follow, MaintainOffset). */
  offsetRotation?: number;
  /** If true, the target keeps its own rotation instead of adopting the source's (Follow). */
  maintainRotation?: boolean;
  /** Fixed distance from the source (MaintainDistance); must be >= 0. */
  distance?: number;
}

/** Full serialized view of one definition (F2.1–F2.6; contract §4). Never carries order index as truth or derived/evaluation state. */
export interface ConstraintDto {
  constraintId: string;
  type: ConstraintType;
  sourceId: string;
  targetId: string;
  parameters: ConstraintParameters;
  enabled: boolean;
}

/** List-view row of one definition (contract §4). Order is conveyed by list position (I6), not an embedded truth field. */
export interface ConstraintSummary {
  constraintId: string;
  type: ConstraintType;
  sourceId: string;
  targetId: string;
  enabled: boolean;
}

/** The list() read projection: the ordered set of definitions for the current scene. Never null; empty array when no graph (lazy, RI-10). */
export interface ConstraintListResponse {
  constraints: ConstraintSummary[];
}

/** The get(id) read projection: the full definition view, or an explicit not-found verdict (null) when the identity is absent or retired. */
export interface ConstraintGetResponse {
  constraint: ConstraintDto | null;
}

/** The create proposal (intent). No identity field — identity is host-minted (Truth Model §10). */
export interface ConstraintCreateInput {
  type: ConstraintType;
  sourceId: string;
  targetId: string;
  parameters?: ConstraintParameters;
  space?: "local" | "world";
  enabled?: boolean;
}

/** The host verdict for a create: the accepted definition (host-minted canonical identity). */
export interface ConstraintCreateResponse {
  constraint: ConstraintDto;
}

/** The change patch (intent). Carries the target identity plus changeable facts; identity is never altered by a patch (M3). */
export interface ConstraintUpdateInput {
  constraintId: string;
  parameters?: ConstraintParameters;
  enabled?: boolean;
  sourceId?: string;
  targetId?: string;
  space?: "local" | "world";
}

/** The host verdict for an update: the resulting definition. */
export interface ConstraintUpdateResponse {
  constraint: ConstraintDto;
}

/** The host verdict for a remove: removal acknowledged with the retired identity (CS-T3). */
export interface ConstraintRemoveResponse {
  constraintId: string;
}

/** Graph-changed notification payload: what changed and which identity (contract §4, §9). Notification only; never carries solved output (I8). */
export interface ConstraintChangedEvent {
  sceneId: string;
  operation: "create" | "update" | "remove" | "reorder" | "enable" | "disable";
  constraintId: string;
}

/** Transform change notification (ARC-006). Fires after a successful transforms preview/commit. Fire-and-forget host mutation; payload is the original command params plus timestamp. */
export interface TransformChangedEvent {
  operation: "previewRotation" | "commitRotation";
  angle?: number;
  finalAngle?: number;
  relativePivotX?: number;
  relativePivotY?: number;
  timestamp: number;
}

/** Command change notification (ARC-006). Fires after a successful commands rotate/translate/scale/setPivot. Payload mirrors the original command params plus timestamp. */
export interface CommandChangedEvent {
  operation: "rotate" | "translate" | "scale" | "setPivot";
  angle?: number;
  offsetX?: number;
  offsetY?: number;
  scaleX?: number;
  scaleY?: number;
  relativeX?: number;
  relativeY?: number;
  timestamp: number;
}

/**
 * Closed V1 Behavior taxonomy (frozen M3-A contract §3; F3.1). The union is closed at the six
 * V1 behaviors; deferred types are absent from the V1 surface.
 */
export type BehaviorType =
  | "Patrol"
  | "FollowTarget"
  | "Wander"
  | "Guard"
  | "Evade"
  | "Idle";

/** Per-type parameter set carried by read (BehaviorParameters F2.4; M5-A contract §5/§6). Fields irrelevant to a type are simply not used. Carries only declarative intent data. */
export interface BehaviorParameters {
  /** Target/threat/anchor entity (borrowed canonical scene identity) — FollowTarget, Guard, Evade. */
  targetEntityId?: string;
  /** Declarative radius/range/bounds value — Wander (bounds), Guard (alert radius), Evade (threat range). */
  radius?: number;
  /** Ordered patrol waypoint identities (borrowed canonical scene identities) — Patrol. */
  patrolPoints?: string[];
}

/** List-view row of one definition (M5-A contract §6). Contains only authoritative graph information necessary for enumeration. Order is conveyed by list position, not an embedded truth field. */
export interface BehaviorSummary {
  behaviorId: string;
  behaviorType: BehaviorType;
  enabled: boolean;
  attachedEntityId: string;
}

/** Full serialized view of one definition (M5-A contract §5/§6). Never carries derived facts (intent/state/transitions/evaluation order/activation plan) — authoritative graph truth only. */
export interface BehaviorDefinitionDto {
  behaviorId: string;
  behaviorType: BehaviorType;
  attachedEntityId: string;
  parameters: BehaviorParameters;
  enabled: boolean;
}

/** The list() read projection: the ordered Behavior membership for a scene. Never null; empty array when the scene has no graph (lazy, M5-A contract §11). Never fabricates a graph on read. */
export interface BehaviorListResponse {
  behaviors: BehaviorSummary[];
}

/** The get(id) read projection: the full definition view including authoritative parameters. Missing/invalid identity is a not-found SDK error (M5-A contract §11/§12). */
export interface BehaviorGetResponse {
  behavior: BehaviorDefinitionDto;
}

/** The create proposal (intent; M5-A contract §7/§8). No identity field — the BehaviorId is host-minted by the authority (Truth Model §10). `attachedEntityId` is a borrowed canonical scene identity. */
export interface BehaviorCreateInput {
  behaviorType: BehaviorType;
  attachedEntityId: string;
  parameters?: BehaviorParameters;
  enabled?: boolean;
}

/** The host verdict for a create: the accepted definition carrying the host-minted canonical identity. */
export interface BehaviorCreateResponse {
  behavior: BehaviorDefinitionDto;
}

/** The change patch (intent; M5-A contract §7/§10). Carries the target identity plus changeable facts only — BehaviorType and AttachedEntityId are immutable in the authority's update path. */
export interface BehaviorUpdateInput {
  behaviorId: string;
  parameters?: BehaviorParameters;
  enabled?: boolean;
}

/** The host verdict for an update: the resulting definition after the authority applied the patch. */
export interface BehaviorUpdateResponse {
  behavior: BehaviorDefinitionDto;
}

/** The host verdict for a remove: removal acknowledged with the retired identity (Truth Model §10). */
export interface BehaviorRemoveResponse {
  behaviorId: string;
}

/** The reorder proposal (M5-A contract §7/§8). Scene Behavior Graph membership order only — never evaluation order, transition priority, runtime scheduling, or constraint/procedural ordering. */
export interface BehaviorReorderInput {
  behaviorId: string;
  newIndex: number;
}

/** The host verdict for a reorder: the resulting definition at its new membership position. */
export interface BehaviorReorderResponse {
  behavior: BehaviorDefinitionDto;
}

/** The setEnabled proposal (M5-A contract §7/§13). Enabled is authoritative graph definition state; runtime consequences are the Behavior evaluation/runtime layers' responsibility. */
export interface BehaviorSetEnabledInput {
  behaviorId: string;
  enabled: boolean;
}

/** The host verdict for setEnabled: the resulting definition with the authoritative enabled state. */
export interface BehaviorSetEnabledResponse {
  behavior: BehaviorDefinitionDto;
}

/** Behavior graph-changed notification payload (M5-A contract §9; RD-2). Notification only — scene identity + targeted behavior identity; never the graph snapshot, definitions, derived intent/state, or activation plans (BI-8). */
export interface BehaviorChangedEvent {
  sceneId: string;
  behaviorId?: string;
}

// ── Relationship surface (Mission 5B additive): typed projection of the existing gateway routes ──
// Gateway reference: SdkCommandGateway.cs relationship routes L669-688, handlers L2944-3188,
// permission relationship.write L1207-1208. All 7 routes require relationship.write; no separate
// read permission exists. Additive-only; no existing declaration modified.

/** The Relationship type taxonomy. Closed at the single V1 Follow type (yoAnime.Engine.Relationships.DataModel.RelationshipType). */
export type RelationshipType = "Follow";

/** Declarative Follow relationship parameters. Offsets are world-space and applied as pure translation (Mission #5 pinned semantics — no pivot/rotation transform of offsets; no cos/sin). */
export interface RelationshipParameters {
  /** World-space X offset applied to the leader's X (follower.X = leader.X + OffsetX). */
  offsetX: number;
  /** World-space Y offset applied to the leader's Y (follower.Y = leader.Y + OffsetY). */
  offsetY: number;
  /** Rotation offset in degrees; when set, adds onto the leader's rotation (rotation inheritance per maintainRotation). */
  offsetRotation?: number;
  /** If true, the follower keeps its own rotation instead of adopting the leader's. */
  maintainRotation: boolean;
}

/** Full serialized view of one definition (list DTO). Never carries derived/evaluation state. */
export interface RelationshipDefinitionDto {
  relationshipId: string;
  leaderId: string;
  followerId: string;
  type: RelationshipType;
  offsetX: number;
  offsetY: number;
  offsetRotation?: number;
  maintainRotation: boolean;
}

/** The create proposal (intent). No identity field — relationshipId is host-minted. */
export interface RelationshipCreateInput {
  leaderId: string;
  followerId: string;
  offsetX?: number;
  offsetY?: number;
  offsetRotation?: number;
  maintainRotation?: boolean;
}

/** The host verdict for a create: the accepted definition (host-minted canonical identity). */
export interface RelationshipCreateResponse {
  relationshipId: string;
  success: boolean;
}

/** The change patch (intent). Carries the target identity plus changeable parameters only; identity/leader/follower/type are immutable in the host update path. */
export interface RelationshipUpdateInput {
  relationshipId: string;
  offsetX?: number;
  offsetY?: number;
  offsetRotation?: number;
  maintainRotation?: boolean;
}

/** The host verdict for an update. */
export interface RelationshipUpdateResponse {
  relationshipId: string;
  success: boolean;
}

/** The removal proposal. */
export interface RelationshipDeleteInput {
  relationshipId: string;
}

/** The host verdict for a remove: removal acknowledged with the removed identity. */
export interface RelationshipDeleteResponse {
  relationshipId: string;
  removed: boolean;
  success: boolean;
}

/** The list() read projection: the set of definitions for the current scene. Never null; empty array when empty. */
export interface RelationshipListResponse {
  relationships: RelationshipDefinitionDto[];
  success: boolean;
}

/** One element of a setAll replacement list. Identities are host-minted. */
export interface RelationshipSetAllItem {
  leaderId: string;
  followerId: string;
  offsetX?: number;
  offsetY?: number;
  offsetRotation?: number;
  maintainRotation?: boolean;
}

/** The setAll proposal: replaces the full relationship set for the current scene. */
export interface RelationshipSetAllInput {
  relationships: RelationshipSetAllItem[];
}

/** The host verdict for a setAll: the number of applied definitions. */
export interface RelationshipSetAllResponse {
  count: number;
  success: boolean;
}

/** The select proposal (inspector selection state for the current surface). Null/empty relationshipId clears the selection. */
export interface RelationshipSelectInput {
  relationshipId?: string;
}

/** The host verdict for select: echoes the recorded selection (null when cleared). */
export interface RelationshipSelectResponse {
  relationshipId?: string;
  success: boolean;
}

/** One cached scene-node position entry returned by getPositions (keyed by runtime node id). */
export interface RelationshipNodePosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The getPositions() read projection: the relationship set plus cached scene-node positions. */
export interface RelationshipGetPositionsResponse {
  relationships: Array<{
    relationshipId: string;
    leaderId: string;
    followerId: string;
    type: RelationshipType;
    offsetX: number;
    offsetY: number;
  }>;
  positions: Record<string, RelationshipNodePosition>;
  success: boolean;
}

// ── Motion contract surface (Mission #3 additive): ik / expressions / transforms / commands ──
// Facade reference: YoAnimeSdkProvider.cs (ik L3189-3346, expressions L3348-3538,
// transforms L2805-2821, commands L5586-5619). Additive-only; no existing declaration modified.

/** Options for ik.solveTwoBone. All angles are degrees; the solver is pure deterministic math (no host request). */
export interface IkSolveTwoBoneOptions {
  upperArmLength?: number;
  forearmLength?: number;
  targetX?: number;
  targetY?: number;
  shoulderX?: number;
  shoulderY?: number;
  elbowBendDirection?: number;
  shoulderAngleOffset?: number;
}

/** Result of ik.solveTwoBone. Angles are reported in degrees. */
export interface IkSolveTwoBoneResult {
  shoulderAngle: number;
  elbowAngle: number;
  shoulderX: number;
  shoulderY: number;
  elbowX: number;
  elbowY: number;
  effectorX: number;
  effectorY: number;
}

/** Options for ik.solveChain (FABRIK). */
export interface IkSolveChainOptions {
  boneLengths?: number[];
  targetX?: number;
  targetY?: number;
  originX?: number;
  originY?: number;
  maxIterations?: number;
  tolerance?: number;
}

/** One bone in an ik.solveChain result. angle is in degrees. */
export interface IkSolveChainBone {
  length: number;
  angle: number;
}

/** Result of ik.solveChain (FABRIK). */
export interface IkSolveChainResult {
  bones: IkSolveChainBone[];
  effectorX: number;
  effectorY: number;
}

/** Options for ik.generateTwoBone. source (shoulder) and joint (elbow) shapes are required. */
export interface IkGenerateTwoBoneOptions {
  source: { runtimeNodeId?: string; nodeId?: string };
  joint: { runtimeNodeId?: string; nodeId?: string };
  durationSeconds?: number;
  target?: { x: number; y: number };
  targetX?: number;
  targetY?: number;
  forearmLength?: number;
  elbowBendDirection?: number;
  samples?: number;
  sampleCount?: number;
  startRotation?: number;
  label?: string;
}

/** Result of ik.generateTwoBone — a two-rotation-layer generated-motion IR (clear: ['Rotation']). */
export interface IkGenerateTwoBoneResult extends Omit<GeneratedMotionIr, "diagnostics"> {
  diagnostics: {
    upperArmLength: number;
    sampleCount: number;
    targetX: number;
    targetY: number;
  };
}

/** Expression evaluation context passed to expressions.evaluate and _eval: time/value/index/vars. */
export interface ExpressionContext {
  time?: number;
  value?: number;
  index?: number;
  vars?: Record<string, number>;
}

/** Options for expressions.evaluate. */
export interface ExpressionEvaluateOptions {
  time?: number;
  value?: number;
  index?: number;
  vars?: Record<string, number>;
}

/** Options for expressions.generateFromExpression. */
export interface ExpressionGenerateOptions {
  expression?: string;
  propertyKind?: string;
  durationSeconds?: number;
  samples?: number;
  sampleCount?: number;
  runtimeNodeId?: string;
  source?: { runtimeNodeId?: string; nodeId?: string };
  additive?: boolean;
  baseValue?: number;
  value?: number;
  easingFunction?: string;
  label?: string;
  vars?: Record<string, number>;
}

/** Result of expressions.generateFromExpression — a single-track generated-motion IR. */
export interface ExpressionGenerateResult extends Omit<GeneratedMotionIr, "diagnostics"> {
  diagnostics: {
    expression: string;
    propertyKind: string;
    sampleCount: number;
    additive: boolean;
  };
}

/** Options shared by transforms.previewRotation / transforms.commitRotation (fire-and-forget, void). */
export interface TransformRotationOptions {
  angle: number;
  finalAngle: number;
  relativePivotX?: number;
  relativePivotY?: number;
}

/** Options for commands.rotate (fire-and-forget, void). */
export interface CommandRotateOptions {
  angle: number;
}

/** Options for commands.translate (fire-and-forget, void). Requires shapes.write at the host. */
export interface CommandTranslateOptions {
  offsetX: number;
  offsetY: number;
}

/** Options for commands.scale (fire-and-forget, void). Requires shapes.write at the host. */
export interface CommandScaleOptions {
  scaleX: number;
  scaleY: number;
}

/** Options for commands.setPivot (fire-and-forget, void). */
export interface CommandSetPivotOptions {
  relativeX: number;
  relativeY: number;
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
    get(): Promise<SelectionResult | null>;
    onChanged(callback: (result: SelectionResult) => void): () => void;
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
    /** @preview Requires scene.write. */
    build(descriptor: SceneBuildDescriptor): Promise<SdkSceneBuildResult>;
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
    /** @preview Requires scene.write. */
    roles: {
      set(runtimeNodeId: string, rolesOrOptions: string[] | RolesSetOptions): Promise<RolesSetResult>;
    };
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
    /** @stable Requires timeline.playback. Alias: scrub(). */
    scrubTo(timeSeconds: number): Promise<void>;
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
    /** @stable Requires timeline.write. */
    bake(request?: TimelineBakeRequest): Promise<TimelineBakeResult>;
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
    undo(): Promise<TimelineHistoryResult>;
    /** @preview Direct timeline editor API. */
    redo(): Promise<TimelineHistoryResult>;
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
    /** @preview Preset registration API. */
    unregisterPresetPacksByOwner(ownerExtensionId: string): Promise<{ success: boolean; ownerExtensionId: string; removedPackIds: string[] }>;
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
    /** @preview History transaction management. */
    history: {
      begin(options?: { label?: string }): Promise<TimelineHistoryTransactionResult>;
      commit(): Promise<TimelineHistoryTransactionResult>;
      rollback(): Promise<TimelineHistoryTransactionResult>;
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
    /** @stable Read projection of the current scene's Constraint Graph. Requires constraint.read. */
    list(): Promise<ConstraintListResponse>;
    /** @stable Read projection of a single definition by its canonical identity. Requires constraint.read. */
    get(constraintId: string): Promise<ConstraintGetResponse>;
    /** @stable Proposes a new definition; the host validates and applies atomically. Requires constraint.write. */
    create(input: ConstraintCreateInput): Promise<ConstraintCreateResponse>;
    /** @stable Proposes a change to an existing definition; the host validates and applies atomically. Requires constraint.write. */
    update(constraintId: string, patch: ConstraintUpdateInput): Promise<ConstraintUpdateResponse>;
    /** @stable Proposes removal of a definition from the graph. Requires constraint.write. */
    remove(constraintId: string): Promise<ConstraintRemoveResponse>;
    /** @stable Subscribes to graph-change notifications; returns an unsubscribe function. Requires constraint.read. */
    onChanged(callback: (event: ConstraintChangedEvent) => void): () => void;
  };
  /** @stable Read projection + write projection of the current scene's Behavior Graph. Reads require behavior.read; writes require behavior.write. */
  behavior: {
    /** @stable Ordered Behavior membership for the current scene. Requires behavior.read. */
    list(): Promise<BehaviorListResponse>;
    /** @stable Full definition of one behavior by its canonical identity. Missing identity → not-found error. Requires behavior.read. */
    get(behaviorId: string): Promise<BehaviorGetResponse>;
    /** @stable Proposes a new definition; the host mints the canonical identity and applies atomically. Requires behavior.write. */
    create(input: BehaviorCreateInput): Promise<BehaviorCreateResponse>;
    /** @stable Proposes a change to an existing definition (parameters/enabled only); the host validates and applies atomically. Requires behavior.write. */
    update(behaviorId: string, patch: BehaviorUpdateInput): Promise<BehaviorUpdateResponse>;
    /** @stable Proposes removal of a definition from the graph; the host retires the identity. Requires behavior.write. */
    remove(behaviorId: string): Promise<BehaviorRemoveResponse>;
    /** @stable Proposes a membership-order change; the host applies atomically. Requires behavior.write. */
    reorder(behaviorId: string, newIndex: number): Promise<BehaviorReorderResponse>;
    /** @stable Proposes an authoritative enabled toggle; the host validates and applies atomically. Requires behavior.write. */
    setEnabled(behaviorId: string, enabled: boolean): Promise<BehaviorSetEnabledResponse>;
    /** @stable Subscribes to behavior graph-change notifications (raw { sceneId, behaviorId } payload); returns an unsubscribe function. Requires behavior.read. */
    onChanged(callback: (event: BehaviorChangedEvent) => void): () => void;
  };
  /** @stable Read/write projection of the current scene's Relationship Graph. All 7 routes require relationship.write at the host (SdkCommandGateway.cs:1207-1208); no separate read permission exists. Additive Mission 5B contract exposure; underlying Follow semantics and runtime execution are unchanged. */
  relationship: {
    /** @stable Proposes a new Follow definition; the host mints the canonical identity. Requires relationship.write. */
    create(input: RelationshipCreateInput): Promise<RelationshipCreateResponse>;
    /** @stable Proposes a parameter change to an existing definition; identity/leader/follower/type are immutable in the host update path. Requires relationship.write. */
    update(input: RelationshipUpdateInput): Promise<RelationshipUpdateResponse>;
    /** @stable Proposes removal of a definition from the graph. Requires relationship.write. */
    delete(input: RelationshipDeleteInput): Promise<RelationshipDeleteResponse>;
    /** @stable Lists the Follow definitions of the current scene. Requires relationship.write. */
    list(): Promise<RelationshipListResponse>;
    /** @stable Replaces the full relationship set for the current scene; the host mints identities. Requires relationship.write. */
    setAll(input: RelationshipSetAllInput): Promise<RelationshipSetAllResponse>;
    /** @stable Records the inspector selection for the current surface; null/empty relationshipId clears it. Requires relationship.write. */
    select(input: RelationshipSelectInput): Promise<RelationshipSelectResponse>;
    /** @stable Read projection of the relationship set plus cached scene-node positions. Requires relationship.write. */
    getPositions(): Promise<RelationshipGetPositionsResponse>;
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
  /** @stable AI namespace. Local request/explanation helpers are @stable; provider generation remains @preview. */
  ai: {
    /** @stable Pure, deterministic, no host cost. Normalizes an AI motion request to contract v1. */
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
    /** @stable Pure, deterministic, no host cost. Explains a prompt into intents. */
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
    /** @preview AI motion provider contract — generation fidelity may evolve. */
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
    screenToSlide(screenX: number, screenY: number): Promise<PointDto>;
    screenToSlide(point: { x: number; y: number } | { X: number; Y: number }): Promise<PointDto>;
    slideToScreen(slideX: number, slideY: number): Promise<PointDto>;
    slideToScreen(point: { x: number; y: number } | { X: number; Y: number }): Promise<PointDto>;
  };
  /** @stable Overlay visibility, interactivity, and surface messaging. */
  overlay: {
    show(): Promise<{ success: boolean; overlayId: string; visible: true }>;
    hide(): Promise<{ success: boolean; overlayId: string; visible: false }>;
    toggle(visible: boolean): Promise<{ success: boolean; overlayId: string; visible: boolean }>;
    getState(): Promise<OverlayState>;
    setInteractive(isInteractive: boolean): Promise<{ success: boolean }>;
    postMessage<TMessage = unknown>(message: TMessage): Promise<SurfacePostMessageResult>;
    onMessage<TMessage = unknown>(callback: (message: TMessage) => void): () => void;
  };
  /** @stable Taskpane surface messaging. */
  taskpane: {
    postMessage<TMessage = unknown>(message: TMessage): Promise<SurfacePostMessageResult>;
    onMessage<TMessage = unknown>(callback: (message: TMessage) => void): () => void;
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
  /** @stable Pure inverse-kinematics helpers. @preview FABRIK chain solver. */
  ik: {
    /** @stable Two-bone IK solver; angles returned in degrees. Pure deterministic math (no host request). Transitively certified through the built-in yoanime.ik.two-bone-chain provider (Mission #2 Stage A). */
    solveTwoBone(options?: IkSolveTwoBoneOptions): IkSolveTwoBoneResult;
    /** @preview FABRIK multi-bone chain solver; angles in degrees. Presence-only — no built-in consumer yet. */
    solveChain(options?: IkSolveChainOptions): IkSolveChainResult;
    /** @stable Generates a two-rotation-layer timeline IR from source (shoulder) and joint (elbow) shapes. Requires source/joint with runtimeNodeId. */
    generateTwoBone(options?: IkGenerateTwoBoneOptions): Promise<IkGenerateTwoBoneResult>;
  };
  /** @stable Expression parser/evaluator/generator surface. @internal _parse/_eval are the implementation of evaluate/generateFromExpression; extensions should call evaluate or generateFromExpression. */
  expressions: {
    /** @internal Recursive-descent expression parser (implementation detail). Backing for evaluate/generateFromExpression. */
    _parse(expression: string): any;
    /** @internal Expression AST evaluator (implementation detail). Backing for evaluate/generateFromExpression. Unknown calls evaluate to 0. */
    _eval(ast: any, ctx: ExpressionContext): number;
    /** @preview Synchronously evaluates an expression against a context. Presence-only — no built-in consumer yet. */
    evaluate(expression: string, options?: ExpressionEvaluateOptions): number;
    /** @stable Generates a single-track timeline IR from an expression (additive by default). Requires a source shape with runtimeNodeId. Direct dependency of the five certified yoanime.expression.* providers (Mission #2 Stage A). */
    generateFromExpression(options?: ExpressionGenerateOptions): Promise<ExpressionGenerateResult>;
  };
  /** @preview Rotation preview/commit host commands. Fire-and-forget (void, no response). Requires shapes.write at the host (gateway route + permission map L1172-1174). */
  transforms: {
    /** @preview Previews a rotation on the WPF ghost overlay (fire-and-forget; no response). */
    previewRotation(angle: number, relativePivotX?: number, relativePivotY?: number): void;
    /** @preview Commits a rotation to the live PowerPoint shape over the pipe (fire-and-forget; no response). */
    commitRotation(finalAngle: number, relativePivotX?: number, relativePivotY?: number): void;
    /** @preview Subscribe to transform change notifications (fires after successful preview/commit). */
    onChanged(callback: (event: TransformChangedEvent) => void): () => void;
  };
  /** @preview Imperative shape commands. Fire-and-forget (void, no response). Requires shapes.write at the host (permission map L1172-1174). */
  commands: {
    /** @preview Rotates the selected shape (fire-and-forget). */
    rotate(angle: number): void;
    /** @preview Translates the selected shape (fire-and-forget). Requires shapes.write at the host. */
    translate(offsetX: number, offsetY: number): void;
    /** @preview Scales the selected shape (fire-and-forget). Requires shapes.write at the host. */
    scale(scaleX: number, scaleY: number): void;
    /** @preview Sets the custom rotation pivot on the selected shape (fire-and-forget). */
    setPivot(relativeX: number, relativeY: number): void;
    /** @preview Subscribe to command change notifications (fires after successful rotate/translate/scale/setPivot). */
    onChanged(callback: (event: CommandChangedEvent) => void): () => void;
  };
}

export {};
