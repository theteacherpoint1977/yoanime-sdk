(async function yoAnimeLumenJellyShowcase() {
  "use strict";

  console.clear();
  console.log(
    "%c🪼 yoAnime Studio — Project LUMEN-JELLY: Deep-Sea Hydrostatic Jellyfish Rig",
    "color: #06b6d4; font-size: 16px; font-weight: bold; text-shadow: 0 0 12px rgba(6,182,212,0.7);"
  );

  const sdk = window.yoanime;
  if (!sdk?.scene?.build || !sdk?.timeline?.bake || !sdk?.timeline?.play) {
    console.error("❌ Required yoAnime SDK APIs not found.");
    return;
  }

  await sdk.runtime.ready();

  // ==========================================================================
  // 1. HYDRODYNAMICS & ANATOMICAL CONFIGURATION
  // ==========================================================================
  const CONFIG = {
    duration: 12.0, // 12-second seamless swimming loop
    fps: 30,
    slide: { width: 960, height: 540 },

    // Swim Propulsion Cycle (4 complete contraction strokes in 12s)
    swim: {
      centerX: 480,
      baseY: 340,
      ascentDistance: 160,
      pulseCyclesTotal: 4, // 4 power strokes across 12s
      horizontalSwayAmp: 24
    },

    // Jellyfish Bell Dome Dimensions
    bell: {
      w: 110,
      h: 75
    },

    // 4 Articulated Tentacles (4 segments each = 16 links)
    tentacles: [
      { id: "tent_L2", rootX: -32, segLen: 24, segWidth: 4, color: "#38bdf8" }, // Outer Left
      { id: "tent_L1", rootX: -12, segLen: 28, segWidth: 5, color: "#06b6d4" }, // Inner Left
      { id: "tent_R1", rootX:  12, segLen: 28, segWidth: 5, color: "#06b6d4" }, // Inner Right
      { id: "tent_R2", rootX:  32, segLen: 24, segWidth: 4, color: "#38bdf8" }  // Outer Right
    ],

    // Marine Snow Ambient Particles
    particleCount: 8
  };

  const totalFrames = Math.round(CONFIG.duration * CONFIG.fps);
  const round2 = (v) => Math.round(v * 100) / 100;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const toRad = (deg) => (deg * Math.PI) / 180;

  // Exact center-rotation translation compensation
  function getRotatedBoneBounds(jointX, jointY, length, height, angleDeg) {
    const rad = toRad(angleDeg);
    const halfL = length / 2;
    const halfH = height / 2;
    const centerX = jointX + halfL * Math.cos(rad);
    const centerY = jointY + halfL * Math.sin(rad);

    return {
      left: round2(centerX - halfL),
      top: round2(centerY - halfH),
      rotation: round2(angleDeg)
    };
  }

  // ==========================================================================
  // 2. SCENE GRAPH BUILDER (40 Native PowerPoint Shapes)
  // ==========================================================================
  function buildJellyScene() {
    const shapes = [];

    // 1. Deep Abyssal Midnight Ocean Backdrop
    shapes.push({
      id: "bg_abyss",
      name: "Abyssal_Ocean_Backdrop",
      type: "rectangle",
      bounds: { left: 0, top: 0, width: CONFIG.slide.width, height: CONFIG.slide.height },
      fill: { color: "#020617" },
      outline: { color: "#0f172a", weight: 2 }
    });

    // 2. Ambient Bioluminescent Caustic Glow Orb
    shapes.push({
      id: "abyss_ambient_glow",
      name: "Deep_Sea_Caustic_Glow",
      type: "circle",
      bounds: { left: 300, top: 100, width: 360, height: 360 },
      fill: { color: "#082f49" },
      outline: { color: "transparent", weight: 0 }
    });

    // ------------------------------------------------------------------------
    // AMBIENT MARINE SNOW / PLANKTON PARTICLES (1 to 8)
    // ------------------------------------------------------------------------
    for (let i = 1; i <= CONFIG.particleCount; i++) {
      shapes.push({
        id: `marine_snow_${i}`,
        name: `Plankton_Particle_${i}`,
        type: "circle",
        bounds: { left: 0, top: 0, width: 6, height: 6 },
        fill: { color: i % 2 === 0 ? "#38bdf8" : "#a855f7" },
        outline: { color: "#ffffff", weight: 1 }
      });
    }

    // ------------------------------------------------------------------------
    // 4 ARTICULATED TENTACLES (4 SEGMENTS EACH = 16 SEGMENTS)
    // ------------------------------------------------------------------------
    CONFIG.tentacles.forEach((tDef) => {
      for (let s = 1; s <= 4; s++) {
        shapes.push({
          id: `${tDef.id}_seg_${s}`,
          name: `${tDef.id}_Segment_${s}`,
          type: "roundedRectangle",
          bounds: { left: 0, top: 0, width: tDef.segLen, height: tDef.segWidth - (s - 1) * 0.7 },
          fill: { color: tDef.color },
          outline: { color: "#ffffff", weight: 1 }
        });
      }
    });

    // ------------------------------------------------------------------------
    // JELLYFISH CENTRAL DOME & BIOLUMINESCENT ORGANELLES
    // ------------------------------------------------------------------------
    // Outer Hydrostatic Bell Dome (Translucent Outer Umbrella)
    shapes.push({
      id: "jelly_bell_outer",
      name: "Bell_Outer_Umbrella",
      type: "circle",
      bounds: { left: 0, top: 0, width: CONFIG.bell.w, height: CONFIG.bell.h },
      fill: { color: "#082f49" },
      outline: { color: "#38bdf8", weight: 2.5 }
    });

    // Inner Radiant Organelle (Gastric Cavity Core)
    shapes.push({
      id: "jelly_organelle_core",
      name: "Bioluminescent_Gastric_Core",
      type: "circle",
      bounds: { left: 0, top: 0, width: 32, height: 26 },
      fill: { color: "#38bdf8" },
      outline: { color: "#ffffff", weight: 1.5 }
    });

    // Sub-Umbrella Lappet / Oral Margin Frill
    shapes.push({
      id: "jelly_oral_frill",
      name: "Oral_Margin_Lappet",
      type: "roundedRectangle",
      bounds: { left: 0, top: 0, width: 68, height: 16 },
      fill: { color: "#1e1b4b" },
      outline: { color: "#c084fc", weight: 1.5 }
    });

    // Central Floating Strobe Bead (Rhopalia Sensor)
    shapes.push({
      id: "jelly_rhopalia_sensor",
      name: "Rhopalia_Light_Sensor",
      type: "circle",
      bounds: { left: 0, top: 0, width: 10, height: 10 },
      fill: { color: "#ffffff" },
      outline: { color: "#38bdf8", weight: 1 }
    });

    // ------------------------------------------------------------------------
    // HUD TELEMETRY & POETIC HEADER
    // ------------------------------------------------------------------------
    shapes.push({
      id: "hud_jelly_title",
      name: "HUD_LumenJelly_Header",
      type: "text",
      bounds: { left: 45, top: 25, width: 620, height: 32 },
      fill: { color: "transparent" },
      outline: { color: "transparent", weight: 0 },
      text: {
        content: "PROJECT LUMEN-JELLY // HYDROSTATIC VOLUME PULSE & FLUID TENTACLES",
        fontSize: 13,
        color: "#06b6d4"
      }
    });

    shapes.push({
      id: "hud_jelly_telemetry",
      name: "HUD_LumenJelly_Telemetry",
      type: "text",
      bounds: { left: 45, top: 52, width: 620, height: 28 },
      fill: { color: "transparent" },
      outline: { color: "transparent", weight: 0 },
      text: {
        content: "HYDROSTATIC BELL CONTRACTION (ScaleX ↔ ScaleY) // 16-SEGMENT WAVE-LAG KINEMATICS // ABYSSAL DRIFT",
        fontSize: 9.5,
        color: "#94a3b8"
      }
    });

    return shapes;
  }

  // ==========================================================================
  // 3. HYDROSTATIC CONTRACTION & WAVE-LAG KINEMATICS EVALUATOR
  // ==========================================================================
  function generateJellyTimeline(ids) {
    const layers = [];
    const makeTrack = (propertyKind, keyframes) => ({ propertyKind, durationSeconds: CONFIG.duration, keyframes });

    // Bell & Organelle Buffers
    const bellX = [], bellY = [], bellScaleX = [], bellScaleY = [], bellRot = [];
    const coreX = [], coreY = [], coreScale = [], coreColor = [];
    const frillX = [], frillY = [], frillScaleX = [];
    const rhopX = [], rhopY = [], rhopScale = [];

    // Tentacle Segment Buffers (4 Tentacles × 4 Segments = 16 Links)
    const tentacleTracks = {};
    CONFIG.tentacles.forEach((tDef) => {
      for (let s = 1; s <= 4; s++) {
        tentacleTracks[`${tDef.id}_${s}`] = { x: [], y: [], rot: [] };
      }
    });

    // Marine Snow Particle Buffers
    const particleTracks = Array.from({ length: CONFIG.particleCount }, () => ({
      x: [], y: [], opacity: []
    }));

    const hudColors = [];

    for (let f = 0; f <= totalFrames; f++) {
      const t = f / totalFrames; // normalized time 0.0 -> 1.0

      // ----------------------------------------------------------------------
      // STEP 1: SWIM PROPULSION CYCLE & VERTICAL THRUST SURGE
      // ----------------------------------------------------------------------
      const cycleProgress = (t * CONFIG.swim.pulseCyclesTotal) % 1.0; // 0.0 -> 1.0 per pulse
      
      // Asymmetric power pulse: Quick snap contraction (0.0 -> 0.35) followed by relaxed glide (0.35 -> 1.0)
      let pulseCompression, thrustVel;
      if (cycleProgress < 0.35) {
        const u = cycleProgress / 0.35;
        // Power Stroke: compresses horizontally (ScaleX 0.70), elongates vertically (ScaleY 1.35)
        pulseCompression = Math.sin(u * Math.PI);
        thrustVel = Math.sin(u * Math.PI * 0.5); // Rapid upward acceleration
      } else {
        const u = (cycleProgress - 0.35) / 0.65;
        // Recovery Glide: relaxes smoothly back to wide open dome
        pulseCompression = Math.cos(u * Math.PI * 0.5) * 0.15;
        thrustVel = 1.0 - u * 0.85; // Coasting deceleration
      }

      // Continuous vertical ascent across 12s with rhythmic power bursts
      const baseAscent = Math.sin(t * Math.PI * 2) * (CONFIG.swim.ascentDistance * 0.5);
      const rhythmicBurst = -thrustVel * 18;
      const currentY = CONFIG.swim.baseY + baseAscent + rhythmicBurst;

      // Gentle lateral aquatic sway
      const swayX = Math.sin(t * Math.PI * 4) * CONFIG.swim.horizontalSwayAmp;
      const currentX = CONFIG.swim.centerX + swayX;
      const swayTiltDeg = Math.cos(t * Math.PI * 4) * 3.5;

      // Hydrostatic Volume Conservation Scales
      const scaleX = round2(1.20 - pulseCompression * 0.50); // 1.20 -> 0.70
      const scaleY = round2(0.80 + pulseCompression * 0.55); // 0.80 -> 1.35

      // ----------------------------------------------------------------------
      // STEP 2: TRANSFORM BELL DOME & GLOWING ORGANELLES
      // ----------------------------------------------------------------------
      bellX.push({ normalizedTime: t, value: { number: round2(currentX - CONFIG.bell.w / 2) } });
      bellY.push({ normalizedTime: t, value: { number: round2(currentY - CONFIG.bell.h / 2) } });
      bellScaleX.push({ normalizedTime: t, value: { number: scaleX } });
      bellScaleY.push({ normalizedTime: t, value: { number: scaleY } });
      bellRot.push({ normalizedTime: t, value: { number: round2(swayTiltDeg) } });

      // Inner Core Organelle (Pulses white-hot on power stroke)
      coreX.push({ normalizedTime: t, value: { number: round2(currentX - 16) } });
      coreY.push({ normalizedTime: t, value: { number: round2(currentY - 13) } });
      coreScale.push({ normalizedTime: t, value: { number: round2(1.0 + pulseCompression * 0.4) } });
      coreColor.push({ normalizedTime: t, value: { color: pulseCompression > 0.4 ? "#ffffff" : "#38bdf8" } });

      // Oral Frill
      frillX.push({ normalizedTime: t, value: { number: round2(currentX - 34) } });
      frillY.push({ normalizedTime: t, value: { number: round2(currentY + 12 * scaleY) } });
      frillScaleX.push({ normalizedTime: t, value: { number: scaleX } });

      // Rhopalia Strobe Sensor
      rhopX.push({ normalizedTime: t, value: { number: round2(currentX - 5) } });
      rhopY.push({ normalizedTime: t, value: { number: round2(currentY - 18) } });
      rhopScale.push({ normalizedTime: t, value: { number: round2(1.0 + pulseCompression * 0.6) } });

      // ----------------------------------------------------------------------
      // STEP 3: SOLVE 4x ARTICULATED WAVE-LAG TENTACLES (16 SEGMENTS)
      // ----------------------------------------------------------------------
      const oralMarginY = currentY + 16 * scaleY;

      CONFIG.tentacles.forEach((tDef) => {
        // Base anchor under oral frill
        let jointX = currentX + tDef.rootX * scaleX;
        let jointY = oralMarginY;

        for (let s = 1; s <= 4; s++) {
          const str = tentacleTracks[`${tDef.id}_${s}`];

          // Progressive wave lag: each segment lags behind the previous one
          const wavePhase = t * CONFIG.swim.pulseCyclesTotal * Math.PI * 2 - (s * 0.45);
          // 90° points straight down; wave oscillates left to right (±18°)
          const waveAngleDeg = 90.0 + Math.sin(wavePhase) * (12.0 + s * 4.0) + swayTiltDeg;
          const waveAngleRad = toRad(waveAngleDeg);

          const b = getRotatedBoneBounds(jointX, jointY, tDef.segLen, tDef.segWidth - (s - 1) * 0.7, waveAngleDeg);
          str.x.push({ normalizedTime: t, value: { number: b.left } });
          str.y.push({ normalizedTime: t, value: { number: b.top } });
          str.rot.push({ normalizedTime: t, value: { number: b.rotation } });

          // Next segment connects to distal tip of current bone
          jointX += Math.cos(waveAngleRad) * tDef.segLen;
          jointY += Math.sin(waveAngleRad) * tDef.segLen;
        }
      });

      // ----------------------------------------------------------------------
      // STEP 4: MARINE SNOW / PLANKTON DRIFT
      // ----------------------------------------------------------------------
      for (let i = 0; i < CONFIG.particleCount; i++) {
        const ptr = particleTracks[i];
        const pSpeed = 0.6 + (i % 3) * 0.3;
        const pCycle = (t * pSpeed + i * 0.125) % 1.0;

        const pX = 220 + (i * 75) + Math.sin(t * Math.PI * 4 + i) * 16;
        const pY = CONFIG.slide.height - pCycle * (CONFIG.slide.height + 40);
        const pOpacity = round2(Math.sin(pCycle * Math.PI) * 0.85);

        ptr.x.push({ normalizedTime: t, value: { number: round2(pX) } });
        ptr.y.push({ normalizedTime: t, value: { number: round2(pY) } });
        ptr.opacity.push({ normalizedTime: t, value: { number: pOpacity } });
      }

      hudColors.push({ normalizedTime: t, value: { color: pulseCompression > 0.3 ? "#06b6d4" : "#a855f7" } });
    }

    // ========================================================================
    // BIND ALL EVALUATED HYDROSTATIC TRACKS
    // ========================================================================
    // 1. Marine Snow Particles
    for (let i = 1; i <= CONFIG.particleCount; i++) {
      const ptr = particleTracks[i - 1];
      layers.push({
        runtimeNodeId: ids.get(`marine_snow_${i}`),
        properties: [
          makeTrack("PositionX", ptr.x),
          makeTrack("PositionY", ptr.y),
          makeTrack("Opacity", ptr.opacity)
        ]
      });
    }

    // 2. 16 Tentacle Segments
    CONFIG.tentacles.forEach((tDef) => {
      for (let s = 1; s <= 4; s++) {
        const str = tentacleTracks[`${tDef.id}_${s}`];
        layers.push({
          runtimeNodeId: ids.get(`${tDef.id}_seg_${s}`),
          properties: [
            makeTrack("PositionX", str.x),
            makeTrack("PositionY", str.y),
            makeTrack("Rotation", str.rot)
          ]
        });
      }
    });

    // 3. Bell Dome & Organelles
    layers.push({
      runtimeNodeId: ids.get("jelly_bell_outer"),
      properties: [
        makeTrack("PositionX", bellX),
        makeTrack("PositionY", bellY),
        makeTrack("ScaleX", bellScaleX),
        makeTrack("ScaleY", bellScaleY),
        makeTrack("Rotation", bellRot)
      ]
    });
    layers.push({
      runtimeNodeId: ids.get("jelly_organelle_core"),
      properties: [
        makeTrack("PositionX", coreX),
        makeTrack("PositionY", coreY),
        makeTrack("ScaleX", coreScale),
        makeTrack("ScaleY", coreScale),
        makeTrack("FillColor", coreColor)
      ]
    });
    layers.push({
      runtimeNodeId: ids.get("jelly_oral_frill"),
      properties: [
        makeTrack("PositionX", frillX),
        makeTrack("PositionY", frillY),
        makeTrack("ScaleX", frillScaleX)
      ]
    });
    layers.push({
      runtimeNodeId: ids.get("jelly_rhopalia_sensor"),
      properties: [
        makeTrack("PositionX", rhopX),
        makeTrack("PositionY", rhopY),
        makeTrack("ScaleX", rhopScale),
        makeTrack("ScaleY", rhopScale)
      ]
    });

    // 4. Header HUD Strobe
    layers.push({
      runtimeNodeId: ids.get("hud_jelly_title"),
      properties: [makeTrack("TextColor", hudColors)]
    });

    return layers;
  }

  // ==========================================================================
  // 4. MAIN ORCHESTRATOR & SLIDESHOW BAKER
  // ==========================================================================
  window.runShowcase_ProjectLumenJelly = async function runShowcase_ProjectLumenJelly() {
    console.log("%c🪼 Assembling 40-Shape Hydrodynamic Lumen-Jelly Rig...", "color: #06b6d4; font-weight: bold;");

    try {
      const shapes = buildJellyScene();
      const buildResult = await sdk.scene.build({ clear: true, shapes });

      if (!buildResult?.success) {
        console.error("❌ Scene build failed:", buildResult);
        return;
      }

      const idMap = new Map(buildResult.shapes.map((s) => [s.id, s.runtimeNodeId]));
      console.log(`✨ %c${shapes.length} PowerPoint shapes spawned into native deep-sea rig!`, "color: #4ade80; font-weight: bold;");

      console.log("📐 Evaluating Hydrostatic Volume Scaling (ScaleX ↔ ScaleY), 16-Link Wave-Lag Tentacles, and Bioluminescence...");
      const layers = generateJellyTimeline(idMap);

      console.log("⚡ Baking Project LUMEN-JELLY Timeline into PowerPoint CustomXML Runtime...");
      await sdk.timeline.bake({
        label: "Project_Lumen_Jelly_Hydrodynamics_Rig",
        clear: ["PositionX", "PositionY", "Rotation", "ScaleX", "ScaleY", "Opacity", "FillColor", "StrokeColor", "StrokeWeight", "TextColor"],
        merge: false,
        durationSeconds: CONFIG.duration,
        layers
      });

      console.log(
        "%c▶ PLAYING HYDROSTATIC LUMEN-JELLY IN POWERPOINT",
        "color: #22c55e; font-size: 16px; font-weight: bold;"
      );
      console.log("  • Hydrostatic volume-conserving bell contraction: ScaleX compresses while ScaleY elongates.");
      console.log("  • 4 Articulated tentacles (16 segments) solving progressive sinusoidal wave-lag ribbon physics.");
      console.log("  • Bioluminescent organelle core pulsing white-hot on power strokes.");
      console.log("  • Ambient upward-drifting marine snow plankton particles!\n");

      await sdk.timeline.play({ startTimeSeconds: 0 });
    } catch (err) {
      console.error("❌ Lumen-Jelly showcase failed:", err);
    }
  };

  console.log("\n%c👇 RUN LUMEN-JELLY RIG BY TYPING:", "color: #06b6d4; font-size: 13px; font-weight: bold;");
  console.log("%crunShowcase_ProjectLumenJelly()", "color: #22c55e; font-size: 15px; font-weight: bold;");
})();