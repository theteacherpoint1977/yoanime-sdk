// Global type definitions for yoAnime SDK v0.4.0 (current runtime)
// Based on authoritative contract: CustomRotationPointApp/html/sdk/yoanime-sdk.d.ts (B7C96E43)

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
  propertyKind: string;
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
  clips?: unknown[];
  propertyTracks?: RuntimePropertyTrack[];
}

export interface TimelineBakeRequest {
  label?: string;
  clear?: string[];
  durationSeconds?: number;
  layers: Array<{
    runtimeNodeId?: string;
    properties: Record<string, {
      propertyKind?: string;
      startTimeSeconds?: number;
      durationSeconds?: number;
      delaySeconds?: number;
      easingFunction?: string;
      keyframes: RuntimePropertyKeyframe[];
    }>;
  }>;
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

// Behavior Platform Types
export type BehaviorType =
  | "Patrol"
  | "FollowTarget"
  | "Wander"
  | "Guard"
  | "Evade"
  | "Idle";

export interface BehaviorParameters {
  targetEntityId?: string;
  radius?: number;
  patrolPoints?: string[];
}

export interface BehaviorSummary {
  behaviorId: string;
  behaviorType: BehaviorType;
  enabled: boolean;
  attachedEntityId: string;
}

export interface BehaviorDefinitionDto {
  behaviorId: string;
  behaviorType: BehaviorType;
  attachedEntityId: string;
  parameters: BehaviorParameters;
  enabled: boolean;
}

export interface BehaviorListResponse {
  behaviors: BehaviorSummary[];
}

export interface BehaviorGetResponse {
  behavior: BehaviorDefinitionDto;
}

export interface BehaviorCreateInput {
  behaviorType: BehaviorType;
  attachedEntityId: string;
  parameters?: BehaviorParameters;
  enabled?: boolean;
}

export interface BehaviorCreateResponse {
  behavior: BehaviorDefinitionDto;
}

export interface BehaviorUpdateInput {
  behaviorId?: string;
  parameters?: BehaviorParameters;
  enabled?: boolean;
}

export interface BehaviorUpdateResponse {
  behavior: BehaviorDefinitionDto;
}

export interface BehaviorRemoveResponse {
  behaviorId: string;
}

export interface BehaviorReorderInput {
  behaviorId: string;
  newIndex: number;
}

export interface BehaviorReorderResponse {
  behavior: BehaviorDefinitionDto;
}

export interface BehaviorSetEnabledInput {
  behaviorId: string;
  enabled: boolean;
}

export interface BehaviorSetEnabledResponse {
  behavior: BehaviorDefinitionDto;
}

export interface BehaviorChangedEvent {
  sceneId: string;
  behaviorId?: string;
}

export interface BehaviorApi {
  list(): Promise<BehaviorListResponse>;
  get(behaviorId: string): Promise<BehaviorGetResponse>;
  create(input: BehaviorCreateInput): Promise<BehaviorCreateResponse>;
  update(behaviorId: string, patch: BehaviorUpdateInput): Promise<BehaviorUpdateResponse>;
  remove(behaviorId: string): Promise<BehaviorRemoveResponse>;
  reorder(behaviorId: string, newIndex: number): Promise<BehaviorReorderResponse>;
  setEnabled(behaviorId: string, enabled: boolean): Promise<BehaviorSetEnabledResponse>;
  onChanged(callback: (event: BehaviorChangedEvent) => void): () => void;
}

// Relationship Types
export type RelationshipType = "Follow";

export interface RelationshipParameters {
  offsetX: number;
  offsetY: number;
  offsetRotation?: number;
  maintainRotation: boolean;
}

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

export interface RelationshipCreateInput {
  leaderId: string;
  followerId: string;
  offsetX?: number;
  offsetY?: number;
  offsetRotation?: number;
  maintainRotation?: boolean;
}

export interface RelationshipCreateResponse {
  relationshipId: string;
  success: boolean;
}

export interface RelationshipUpdateInput {
  relationshipId: string;
  offsetX?: number;
  offsetY?: number;
  offsetRotation?: number;
  maintainRotation?: boolean;
}

export interface RelationshipUpdateResponse {
  relationshipId: string;
  success: boolean;
}

export interface RelationshipDeleteInput {
  relationshipId: string;
}

export interface RelationshipDeleteResponse {
  relationshipId: string;
  removed: boolean;
  success: boolean;
}

export interface RelationshipListResponse {
  relationships: RelationshipDefinitionDto[];
  success: boolean;
}

export interface RelationshipSetAllItem {
  leaderId: string;
  followerId: string;
  offsetX?: number;
  offsetY?: number;
  offsetRotation?: number;
  maintainRotation?: boolean;
}

export interface RelationshipSetAllInput {
  relationships: RelationshipSetAllItem[];
}

export interface RelationshipSetAllResponse {
  count: number;
  success: boolean;
}

export interface RelationshipSelectInput {
  relationshipId?: string;
}

export interface RelationshipSelectResponse {
  relationshipId?: string;
  success: boolean;
}

export interface RelationshipNodePosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

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

export interface RelationshipApi {
  create(input: RelationshipCreateInput): Promise<RelationshipCreateResponse>;
  update(input: RelationshipUpdateInput): Promise<RelationshipUpdateResponse>;
  delete(input: RelationshipDeleteInput): Promise<RelationshipDeleteResponse>;
  list(): Promise<RelationshipListResponse>;
  setAll(input: RelationshipSetAllInput): Promise<RelationshipSetAllResponse>;
  select(input: RelationshipSelectInput): Promise<RelationshipSelectResponse>;
  getPositions(): Promise<RelationshipGetPositionsResponse>;
}

// Constraint Types
export type ConstraintType =
  | "Follow"
  | "MaintainDistance"
  | "LookAt"
  | "MaintainOffset";

export interface ConstraintParameters {
  offsetX?: number;
  offsetY?: number;
  offsetRotation?: number;
  maintainRotation?: boolean;
  distance?: number;
}

export interface ConstraintDto {
  constraintId: string;
  type: ConstraintType;
  sourceId: string;
  targetId: string;
  parameters: ConstraintParameters;
  enabled: boolean;
}

export interface ConstraintSummary {
  constraintId: string;
  type: ConstraintType;
  sourceId: string;
  targetId: string;
  enabled: boolean;
}

export interface ConstraintListResponse {
  constraints: ConstraintSummary[];
}

export interface ConstraintGetResponse {
  constraint: ConstraintDto | null;
}

export interface ConstraintCreateInput {
  type: ConstraintType;
  sourceId: string;
  targetId: string;
  parameters?: ConstraintParameters;
  space?: "local" | "world";
  enabled?: boolean;
}

export interface ConstraintCreateResponse {
  constraint: ConstraintDto;
}

export interface ConstraintUpdateInput {
  constraintId: string;
  parameters?: ConstraintParameters;
  enabled?: boolean;
  sourceId?: string;
  targetId?: string;
  space?: "local" | "world";
}

export interface ConstraintUpdateResponse {
  constraint: ConstraintDto;
}

export interface ConstraintRemoveResponse {
  constraintId: string;
}

export interface ConstraintChangedEvent {
  sceneId: string;
  operation: "create" | "update" | "remove" | "reorder" | "enable" | "disable";
  constraintId: string;
}

export interface ConstraintsApi {
  list(): Promise<ConstraintListResponse>;
  get(constraintId: string): Promise<ConstraintGetResponse>;
  create(input: ConstraintCreateInput): Promise<ConstraintCreateResponse>;
  update(constraintId: string, patch: ConstraintUpdateInput): Promise<ConstraintUpdateResponse>;
  remove(constraintId: string): Promise<ConstraintRemoveResponse>;
  onChanged(callback: (event: ConstraintChangedEvent) => void): () => void;
}

// Animation Types
export type AnimationType = "Keyframe";

export interface AnimationLayerSpec {
  runtimeNodeId: string;
  properties: Record<string, {
    propertyKind: string;
    startTimeSeconds?: number;
    durationSeconds?: number;
    delaySeconds?: number;
    easingFunction?: string;
    keyframes: Array<{
      normalizedTime: number;
      value: any;
      easingOverride?: string;
    }>;
    interpolation?: {
      easingFunction?: string;
      isAdditive?: boolean;
      blendMode?: string;
    };
  }>;
  motionProvider?: {
    providerId: string;
    options?: Record<string, any>;
  };
}

export interface AnimationParameters {
  durationSeconds?: number;
  layers?: AnimationLayerSpec[];
  metadata?: Record<string, any>;
}

export interface AnimationSummary {
  animationId: string;
  label?: string;
  durationSeconds?: number;
  enabled: boolean;
  layerCount: number;
}

export interface AnimationDto {
  animationId: string;
  label?: string;
  durationSeconds: number;
  enabled: boolean;
  layers: AnimationLayerSpec[];
  metadata?: Record<string, any>;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface AnimationListResponse {
  animations: AnimationSummary[];
}

export interface AnimationGetResponse {
  animation: AnimationDto | null;
}

export interface AnimationCreateInput {
  label?: string;
  durationSeconds?: number;
  layers?: AnimationLayerSpec[];
  metadata?: Record<string, any>;
  enabled?: boolean;
}

export interface AnimationCreateResponse {
  animation: AnimationDto;
}

export interface AnimationUpdateInput {
  animationId: string;
  label?: string;
  durationSeconds?: number;
  layers?: AnimationLayerSpec[];
  metadata?: Record<string, any>;
  enabled?: boolean;
}

export interface AnimationUpdateResponse {
  animation: AnimationDto;
}

export interface AnimationRemoveResponse {
  animationId: string;
}

export interface AnimationReorderInput {
  animationId: string;
  newIndex: number;
}

export interface AnimationReorderResponse {
  animation: AnimationDto;
}

export interface AnimationPreviewInput {
  animationId: string;
  durationSeconds?: number;
}

export interface AnimationPreviewResponse {
  ir: any;
}

export interface AnimationCommitInput {
  animationId: string;
  label?: string;
}

export interface AnimationCommitResponse {
  success: boolean;
  animationId: string;
  timeline?: any;
  timelineVersion?: number;
}

export interface AnimationSaveInput {
  animationId: string;
  slot?: string;
}

export interface AnimationSaveResponse {
  success: boolean;
  animationId: string;
  slot?: string;
}

export interface AnimationLoadInput {
  animationId?: string;
  slot: string;
}

export interface AnimationLoadResponse {
  animation: AnimationDto;
  success: boolean;
}

export interface AnimationUndoResponse {
  success: boolean;
  animationId?: string;
}

export interface AnimationRedoResponse {
  success: boolean;
  animationId?: string;
}

export interface AnimationChangedEvent {
  sceneId: string;
  animationId?: string;
  operation?: "create" | "update" | "remove" | "reorder" | "enable" | "disable" | "preview" | "commit";
}

export interface AnimationApi {
  create(input: AnimationCreateInput): Promise<AnimationCreateResponse>;
  list(): Promise<AnimationListResponse>;
  get(animationId: string): Promise<AnimationGetResponse>;
  update(animationId: string, patch: AnimationUpdateInput): Promise<AnimationUpdateResponse>;
  remove(animationId: string): Promise<AnimationRemoveResponse>;
  reorder(animationId: string, newIndex: number): Promise<AnimationReorderResponse>;
  onChanged(callback: (event: AnimationChangedEvent) => void): () => void;
  preview(input: AnimationPreviewInput): Promise<AnimationPreviewResponse>;
  commit(input: AnimationCommitInput): Promise<AnimationCommitResponse>;
  save(input: AnimationSaveInput): Promise<AnimationSaveResponse>;
  load(input: AnimationLoadInput): Promise<AnimationLoadResponse>;
  undo(): Promise<AnimationUndoResponse>;
  redo(): Promise<AnimationRedoResponse>;
}

export interface SceneApi {
  get(options?: { includeGeometry?: boolean; includeShapeType?: boolean; includeTags?: boolean }): Promise<{ fullSnapshot?: { rootNodes: unknown[] }; shapes?: unknown[] }>;
  build(input: { clear: boolean; shapes: Array<{ id: string; type: string; name: string; bounds: { left: number; top: number; width: number; height: number }; fill: { color: string } }> }): Promise<{ success: boolean; shapes: Array<{ runtimeNodeId: string }> }>;
  roles: {
    setParent(childRuntimeNodeId: string, parentRuntimeNodeId: string | null): Promise<RolesSetResult>;
    getParent(childRuntimeNodeId: string): Promise<{ parentRuntimeNodeId: string | null }>;
    getChildren(parentRuntimeNodeId: string): Promise<{ children: Array<{ runtimeNodeId: string }> }>;
  };
  onUpdated(callback: (scene: unknown) => void): () => void;
}

// Motion Providers
export interface MotionProvider {
  id: string;
  version?: string;
  name?: string;
  label?: string;
  kind?: string;
  category?: string;
  description?: string;
  tags?: string[];
  inputs?: Record<string, unknown>;
  outputContract?: string;
  ownerKind?: string;
  ownerExtensionId?: string | null;
  packId?: string | null;
  packLabel?: string | null;
  generate(context: MotionProviderContext): Promise<unknown>;
}

export interface MotionProviderContext {
  contractVersion: string;
  providerId?: string | null;
  providerKind?: string | null;
  options?: Record<string, unknown>;
  durationSeconds?: number;
  startTimeSeconds?: number;
  slideContext?: unknown;
  scene?: unknown;
  selection?: unknown;
  timeline?: unknown;
  query?: (query?: string | Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
  sdk: YoAnimeSdk;
}

export interface MotionProviderGenerateResult {
  contractVersion: string;
  provider: MotionProvider;
  request: unknown;
  output: TimelineBakeRequest;
  ir: unknown;
  diagnostics?: unknown[];
}

export interface MotionProviderApi {
  list(): Promise<MotionProvider[]>;
  get(providerId: string): Promise<MotionProvider | null>;
  generate(providerId: string, request?: Record<string, unknown>): Promise<MotionProviderGenerateResult>;
  bake(providerId: string, request?: Record<string, unknown>): Promise<unknown>;
}

export interface YoAnimeSdk {
  version: string;
  runtime: {
    surface: string;
    ready(): Promise<void>;
    getCapabilities(): Promise<YoAnimeCapabilities>;
    onSessionEnded(callback: () => void): () => void;
  };
  behavior: BehaviorApi;
  relationship: RelationshipApi;
  constraints: ConstraintsApi;
  animation: AnimationApi;
  scene: SceneApi;
  timeline: TimelineApi;
  playback: PlaybackApi;
  motionProviders: MotionProviderApi;
  selection: {
    get(): Promise<SelectionResult | null>;
    onChanged(callback: (result: SelectionResult) => void): () => void;
    onCleared(callback: () => void): () => void;
  };
}

export interface RelationshipApi {
  create(input: RelationshipCreateInput): Promise<RelationshipCreateResponse>;
  update(input: RelationshipUpdateInput): Promise<RelationshipUpdateResponse>;
  delete(input: RelationshipDeleteInput): Promise<RelationshipDeleteResponse>;
  list(): Promise<RelationshipListResponse>;
  setAll(input: RelationshipSetAllInput): Promise<RelationshipSetAllResponse>;
  select(input: RelationshipSelectInput): Promise<RelationshipSelectResponse>;
  getPositions(): Promise<RelationshipGetPositionsResponse>;
}

export interface ConstraintsApi {
  list(): Promise<ConstraintListResponse>;
  get(constraintId: string): Promise<ConstraintGetResponse>;
  create(input: ConstraintCreateInput): Promise<ConstraintCreateResponse>;
  update(constraintId: string, patch: ConstraintUpdateInput): Promise<ConstraintUpdateResponse>;
  remove(constraintId: string): Promise<ConstraintRemoveResponse>;
  onChanged(callback: (event: ConstraintChangedEvent) => void): () => void;
}

export interface SceneApi {
  get(options?: { includeGeometry?: boolean; includeShapeType?: boolean; includeTags?: boolean }): Promise<{ fullSnapshot?: { rootNodes: unknown[] }; shapes?: unknown[] }>;
  build(input: { clear: boolean; shapes: Array<{ id: string; type: string; name: string; bounds: { left: number; top: number; width: number; height: number }; fill: { color: string } }> }): Promise<{ success: boolean; shapes: Array<{ runtimeNodeId: string }> }>;
  roles: {
    setParent(childRuntimeNodeId: string, parentRuntimeNodeId: string | null): Promise<{ success: boolean }>;
    getParent(childRuntimeNodeId: string): Promise<{ parentRuntimeNodeId: string | null }>;
    getChildren(parentRuntimeNodeId: string): Promise<{ children: Array<{ runtimeNodeId: string }> }>;
  };
  onUpdated(callback: (scene: unknown) => void): () => void;
}

export interface TimelineApi {
  get(): Promise<TimelineSnapshot | null>;
  bake(request: TimelineBakeRequest): Promise<TimelineBakeResult>;
  play(options?: { startTimeSeconds?: number }): Promise<void> | void;
  stop(): Promise<void> | void;
  scrubTo(timeSeconds: number): Promise<void>;
  onUpdated(callback: (timeline: TimelineSnapshot) => void): () => void;
  onTick(callback: (tick: unknown) => void): () => void;
}

export interface PlaybackApi {
  onStarted(callback: (event: unknown) => void): () => void;
  onStopped(callback: (event: unknown) => void): () => void;
}

// Supporting types
interface SelectionResult {
  primary: SelectedShape | null;
  shape: SelectedShape | null;
  shapes: SelectedShape[];
  count: number;
}

interface SelectedShape {
  id: string;
  runtimeNodeId?: string;
  powerPointShapeId?: string;
  name?: string;
  type?: string;
  bounds?: { x: number; y: number; width: number; height: number; rotation: number };
  slideBounds?: { left: number; top: number; width: number; height: number };
  screenBounds?: { left: number; top: number; width: number; height: number };
  hasStableRuntimeIdentity: boolean;
}

// Forward declarations for interdependent types
interface YoAnimeCapabilities {
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

// Behavior API interfaces (from d.ts)
interface BehaviorApi {
  list(): Promise<BehaviorListResponse>;
  get(behaviorId: string): Promise<BehaviorGetResponse>;
  create(input: BehaviorCreateInput): Promise<BehaviorCreateResponse>;
  update(behaviorId: string, patch: BehaviorUpdateInput): Promise<BehaviorUpdateResponse>;
  remove(behaviorId: string): Promise<BehaviorRemoveResponse>;
  reorder(behaviorId: string, newIndex: number): Promise<BehaviorReorderResponse>;
  setEnabled(behaviorId: string, enabled: boolean): Promise<BehaviorSetEnabledResponse>;
  onChanged(callback: (event: BehaviorChangedEvent) => void): () => void;
}

interface BehaviorListResponse {
  behaviors: BehaviorSummary[];
}

interface BehaviorGetResponse {
  behavior: BehaviorDefinitionDto;
}

interface BehaviorCreateInput {
  behaviorType: BehaviorType;
  attachedEntityId: string;
  parameters?: BehaviorParameters;
  enabled?: boolean;
}

interface BehaviorCreateResponse {
  behavior: BehaviorDefinitionDto;
}

interface BehaviorUpdateInput {
  behaviorId?: string;
  parameters?: BehaviorParameters;
  enabled?: boolean;
}

interface BehaviorUpdateResponse {
  behavior: BehaviorDefinitionDto;
}

interface BehaviorRemoveResponse {
  behaviorId: string;
}

interface BehaviorReorderInput {
  behaviorId: string;
  newIndex: number;
}

interface BehaviorReorderResponse {
  behavior: BehaviorDefinitionDto;
}

interface BehaviorSetEnabledInput {
  behaviorId: string;
  enabled: boolean;
}

interface BehaviorSetEnabledResponse {
  behavior: BehaviorDefinitionDto;
}

interface BehaviorChangedEvent {
  sceneId: string;
  behaviorId?: string;
}

type BehaviorType = "Patrol" | "FollowTarget" | "Wander" | "Guard" | "Evade" | "Idle";

interface BehaviorParameters {
  targetEntityId?: string;
  radius?: number;
  patrolPoints?: string[];
}

interface BehaviorSummary {
  behaviorId: string;
  behaviorType: BehaviorType;
  enabled: boolean;
  attachedEntityId: string;
}

interface BehaviorDefinitionDto {
  behaviorId: string;
  behaviorType: BehaviorType;
  attachedEntityId: string;
  parameters: BehaviorParameters;
  enabled: boolean;
}

interface BehaviorListResponse {
  behaviors: BehaviorSummary[];
}

interface BehaviorGetResponse {
  behavior: BehaviorDefinitionDto;
}

interface BehaviorCreateInput {
  behaviorType: BehaviorType;
  attachedEntityId: string;
  parameters?: BehaviorParameters;
  enabled?: boolean;
}

interface BehaviorCreateResponse {
  behavior: BehaviorDefinitionDto;
}

interface BehaviorUpdateInput {
  behaviorId?: string;
  parameters?: BehaviorParameters;
  enabled?: boolean;
}

interface BehaviorUpdateResponse {
  behavior: BehaviorDefinitionDto;
}

interface BehaviorRemoveResponse {
  behaviorId: string;
}

interface BehaviorReorderInput {
  behaviorId: string;
  newIndex: number;
}

interface BehaviorReorderResponse {
  behavior: BehaviorDefinitionDto;
}

interface BehaviorSetEnabledInput {
  behaviorId: string;
  enabled: boolean;
}

interface BehaviorSetEnabledResponse {
  behavior: BehaviorDefinitionDto;
}

interface BehaviorChangedEvent {
  sceneId: string;
  behaviorId?: string;
}

// Relationship API interfaces
interface RelationshipApi {
  create(input: RelationshipCreateInput): Promise<RelationshipCreateResponse>;
  update(input: RelationshipUpdateInput): Promise<RelationshipUpdateResponse>;
  delete(input: RelationshipDeleteInput): Promise<RelationshipDeleteResponse>;
  list(): Promise<RelationshipListResponse>;
  setAll(input: RelationshipSetAllInput): Promise<RelationshipSetAllResponse>;
  select(input: RelationshipSelectInput): Promise<RelationshipSelectResponse>;
  getPositions(): Promise<RelationshipGetPositionsResponse>;
}

type RelationshipType = "Follow";

interface RelationshipParameters {
  offsetX: number;
  offsetY: number;
  offsetRotation?: number;
  maintainRotation: boolean;
}

interface RelationshipDefinitionDto {
  relationshipId: string;
  leaderId: string;
  followerId: string;
  type: RelationshipType;
  offsetX: number;
  offsetY: number;
  offsetRotation?: number;
  maintainRotation: boolean;
}

interface RelationshipCreateInput {
  leaderId: string;
  followerId: string;
  offsetX?: number;
  offsetY?: number;
  offsetRotation?: number;
  maintainRotation?: boolean;
}

interface RelationshipCreateResponse {
  relationshipId: string;
  success: boolean;
}

interface RelationshipUpdateInput {
  relationshipId: string;
  offsetX?: number;
  offsetY?: number;
  offsetRotation?: number;
  maintainRotation?: boolean;
}

interface RelationshipUpdateResponse {
  relationshipId: string;
  success: boolean;
}

interface RelationshipDeleteInput {
  relationshipId: string;
}

interface RelationshipDeleteResponse {
  relationshipId: string;
  removed: boolean;
  success: boolean;
}

interface RelationshipListResponse {
  relationships: RelationshipDefinitionDto[];
  success: boolean;
}

interface RelationshipSetAllItem {
  leaderId: string;
  followerId: string;
  offsetX?: number;
  offsetY?: number;
  offsetRotation?: number;
  maintainRotation?: boolean;
}

interface RelationshipSetAllInput {
  relationships: RelationshipSetAllItem[];
}

interface RelationshipSetAllResponse {
  count: number;
  success: boolean;
}

interface RelationshipSelectInput {
  relationshipId?: string;
}

interface RelationshipSelectResponse {
  relationshipId?: string;
  success: boolean;
}

interface RelationshipNodePosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface RelationshipGetPositionsResponse {
  relationships: Array<{
    relationshipId: string;
    leaderId: string;
    followerId: string;
    type: RelationshipType;
    offsetX: number;
    offsetY: number;
  }>;
  positions: Record<string, { left: number; top: number; width: number; height: number }>;
  success: boolean;
}

// Constraints API
interface ConstraintsApi {
  list(): Promise<ConstraintListResponse>;
  get(constraintId: string): Promise<ConstraintGetResponse>;
  create(input: ConstraintCreateInput): Promise<ConstraintCreateResponse>;
  update(constraintId: string, patch: ConstraintUpdateInput): Promise<ConstraintUpdateResponse>;
  remove(constraintId: string): Promise<ConstraintRemoveResponse>;
  onChanged(callback: (event: ConstraintChangedEvent) => void): () => void;
}

type ConstraintType = "Follow" | "MaintainDistance" | "LookAt" | "MaintainOffset";

interface ConstraintParameters {
  offsetX?: number;
  offsetY?: number;
  offsetRotation?: number;
  maintainRotation?: boolean;
  distance?: number;
}

interface ConstraintDto {
  constraintId: string;
  type: ConstraintType;
  sourceId: string;
  targetId: string;
  parameters: ConstraintParameters;
  enabled: boolean;
}

interface ConstraintSummary {
  constraintId: string;
  type: ConstraintType;
  sourceId: string;
  targetId: string;
  enabled: boolean;
}

interface ConstraintListResponse {
  constraints: ConstraintSummary[];
}

interface ConstraintGetResponse {
  constraint: ConstraintDto | null;
}

interface ConstraintCreateInput {
  type: ConstraintType;
  sourceId: string;
  targetId: string;
  parameters?: ConstraintParameters;
  space?: "local" | "world";
  enabled?: boolean;
}

interface ConstraintCreateResponse {
  constraint: ConstraintDto;
}

interface ConstraintUpdateInput {
  constraintId: string;
  parameters?: ConstraintParameters;
  enabled?: boolean;
  sourceId?: string;
  targetId?: string;
  space?: "local" | "world";
}

interface ConstraintUpdateResponse {
  constraint: ConstraintDto;
}

interface ConstraintRemoveResponse {
  constraintId: string;
}

interface ConstraintChangedEvent {
  sceneId: string;
  operation: "create" | "update" | "remove" | "reorder" | "enable" | "disable";
  constraintId: string;
}

export type {
  YoAnimeSdk,
  YoAnimeCapabilities,
  SelectionResult,
  SelectedShape,
  TimelineSnapshot,
  TimelineLayerTrack,
  RuntimePropertyTrack,
  RuntimePropertyKeyframe,
  RuntimePropertyValue,
  TimelineBakeRequest,
  TimelineBakeResult,
  YoAnimeSdk as YoAnimeSdkCompat,
};