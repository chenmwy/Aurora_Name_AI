(function () {
  "use strict";

  /* ------------------------------------------------------------------------ */
  /* Boot mode — capture once before async SceneRuntime / any URL cleanup     */
  /* Task 035C: engineering modes must not depend on a later-cleared search.  */
  /* ------------------------------------------------------------------------ */

  function captureNamoraBootMode() {
    var debug = false;
    var layoutEdit = false;
    var responseProvider = null;
    try {
      var params = new URLSearchParams(window.location.search);
      debug = params.get("debug") === "1";
      layoutEdit = params.get("layout") === "edit";
      var providerParam = params.get("provider");
      if (providerParam === "local" || providerParam === "deepseek") {
        responseProvider = providerParam;
      }
    } catch (e) {
      debug = false;
      layoutEdit = false;
      responseProvider = null;
    }
    if (responseProvider == null) {
      responseProvider =
        window.location.protocol === "file:" ? "local" : "deepseek";
    }
    return Object.freeze({
      debug: debug,
      layoutEdit: layoutEdit,
      responseProvider: responseProvider
    });
  }

  var NAMORA_BOOT_MODE = captureNamoraBootMode();

  /* ------------------------------------------------------------------------ */
  /* Anchor Visualization — enable via ?debug=1 or NAMORA_DEBUG = true       */
  /* Canonical reference: docs/04_MECHANICS/NAMORA_ANCHOR_SYSTEM.md (v1.0.0)  */
  /* ------------------------------------------------------------------------ */

  var NAMORA_DEBUG = false;

  function isAnchorVisualizationEnabled() {
    if (NAMORA_DEBUG) return true;
    return !!NAMORA_BOOT_MODE.debug;
  }

  function isDebugEnabled() {
    return isAnchorVisualizationEnabled();
  }

  /* ------------------------------------------------------------------------ */
  /* Layout Editor activation — enable via ?layout=edit                       */
  /* Engineering tool only. Normal mode must never show editor chrome.        */
  /* ------------------------------------------------------------------------ */

  function isLayoutEditorQueryEnabled() {
    return !!NAMORA_BOOT_MODE.layoutEdit;
  }

  /* ------------------------------------------------------------------------ */
  /* Scene / World / Layout Profiles — runtime catalog (Task 031)             */
  /* Editor never owns these. Runtime constructs live state from profiles.    */
  /* ------------------------------------------------------------------------ */

  var NAMORA_ANCHOR_IDS = [
    "foot",
    "expression-center",
    "head-center",
    "dialogue-tail"
  ];

  var BACKGROUND_STANDING_POINT_ID = "background-standing-point";
  var PEARL_ROOT_ID = "pearl-root";
  var INPUT_ROOT_ID = "input-root";
  var USER_INPUT_GROUP_ROOT_ID = "user-input-group-root";
  var USER_INPUT_POINT_IDS = [
    PEARL_ROOT_ID,
    INPUT_ROOT_ID,
    USER_INPUT_GROUP_ROOT_ID
  ];

  /** Legacy NANA-local Pearl source — migrated to world pearl-root (Task 029). */
  var LEGACY_PEARL_NANA_LOCAL = { x: 624.3, y: 805.5 };

  /** Obsolete geometry (pre-Task 027) — retained only for proportional candidate math. */
  var LEGACY_SOURCE_WIDTH = 1717;
  var LEGACY_SOURCE_HEIGHT = 916;
  var LEGACY_STANDING_POINT = { x: 1474, y: 763 };

  var PLANNED_INPUT_ANCHOR_IDS = ["send"];

  var STANDING_POINT_CANDIDATE_X =
    LEGACY_STANDING_POINT.x * (1672 / LEGACY_SOURCE_WIDTH);
  var STANDING_POINT_CANDIDATE_Y =
    LEGACY_STANDING_POINT.y * (941 / LEGACY_SOURCE_HEIGHT);

  function defineNamoraAnchorRegistry(spriteWidth, spriteHeight, anchorDefinitions) {
    var anchors = Object.create(null);

    anchorDefinitions.forEach(function (definition) {
      anchors[definition.id] = Object.freeze({
        id: definition.id,
        label: definition.label,
        x: definition.x,
        y: definition.y,
        u: definition.x / spriteWidth,
        v: definition.y / spriteHeight,
        status: definition.status,
        purpose: definition.purpose
      });
    });

    return Object.freeze(anchors);
  }

  var DEFAULT_NANA_ANCHOR_DEFINITIONS = [
    {
      id: "foot",
      label: "Foot Anchor",
      x: 462.2,
      y: 893,
      status: "locked",
      purpose:
        "World registration anchor — register NANA to the background and maintain shell contact"
    },
    {
      id: "expression-center",
      label: "Expression Center",
      x: 510.607,
      y: 416.727,
      status: "locked",
      purpose:
        "Visual center of NANA's face for expressions, eye animation, smile animation, and emotional particles"
    },
    {
      id: "head-center",
      label: "Head Center",
      x: 507.644,
      y: 144.866,
      status: "locked",
      purpose:
        "Top semantic position of NANA for accessories, halo, crown, status icons, and floating indicators"
    },
    {
      id: "dialogue-tail",
      label: "Dialogue Tail Anchor",
      x: 182.687,
      y: 351.184,
      status: "locked",
      purpose:
        "Origin of the speech bubble tail — only the tail connects here; the bubble body extends by layout rules"
    }
  ];

  /** Approved Namora Default Layout baseline (Task 038 Rev B1/B2).
   *  Mirrors assets/config/namora-layout-default.json User Input Group.
   *  Used only by the built-in fallback when external JSON cannot load
   *  (e.g. file://). Must not diverge from the canonical profile. */
  var APPROVED_STANDING_POINT = { x: 1420.271, y: 706.569 };
  var APPROVED_DESIGN_WORLD_WIDTH = 1918.98;
  var APPROVED_USER_INPUT_GROUP = {
    bound: true,
    groupRoot: { x: 1342.392, y: 827.932 },
    pearlOffset: { x: 0, y: 0 },
    inputOffset: { x: -55.739, y: 0.08 },
    pearlWorld: { x: 1342.392, y: 827.932 },
    inputWorld: { x: 1286.653, y: 828.012 }
  };

  var WORLD_PROFILES = Object.freeze({
    "default-world": Object.freeze({
      id: "default-world",
      version: "1.0.0",
      asset: "assets/backgrounds/namora-bg-desktop.webp",
      formatDeclared: "webp",
      formatDetected: "png",
      sourceWidth: 1672,
      sourceHeight: 941,
      designWorldHeight: 1080,
      designWorldWidth: APPROVED_DESIGN_WORLD_WIDTH,
      scalePolicy: "fixed-design-world",
      origin: "bottom-right",
      standingPoint: Object.freeze({
        x: APPROVED_STANDING_POINT.x,
        y: APPROVED_STANDING_POINT.y,
        status: "locked",
        purpose:
          "Approved background standing point — canonical Namora Default Layout baseline (Task 032)."
      }),
      nana: Object.freeze({
        worldHeight: 150,
        spriteSourceWidth: 1024,
        spriteSourceHeight: 1024,
        visibleBounds: Object.freeze({
          minX: 137,
          minY: 105,
          maxX: 1023,
          maxY: 901
        }),
        anchors: DEFAULT_NANA_ANCHOR_DEFINITIONS
      })
    })
  });

  var LAYOUT_PROFILES = Object.freeze({
    "default-layout": Object.freeze({
      id: "default-layout",
      version: "0.1.0",
      profileId: "namora-default",
      profileName: "Namora Default Layout",
      schemaVersion: "1.1.0",
      standingPoint: null,
      nanaAnchors: null,
      userInputGroup: Object.freeze({
        bound: true,
        root: Object.freeze({
          x: APPROVED_USER_INPUT_GROUP.groupRoot.x,
          y: APPROVED_USER_INPUT_GROUP.groupRoot.y
        }),
        pearlOffset: Object.freeze({
          x: APPROVED_USER_INPUT_GROUP.pearlOffset.x,
          y: APPROVED_USER_INPUT_GROUP.pearlOffset.y
        }),
        inputOffset: Object.freeze({
          x: APPROVED_USER_INPUT_GROUP.inputOffset.x,
          y: APPROVED_USER_INPUT_GROUP.inputOffset.y
        }),
        pearl: Object.freeze({
          worldPosition: Object.freeze({
            x: APPROVED_USER_INPUT_GROUP.pearlWorld.x,
            y: APPROVED_USER_INPUT_GROUP.pearlWorld.y
          }),
          status: "locked"
        }),
        input: Object.freeze({
          worldPosition: Object.freeze({
            x: APPROVED_USER_INPUT_GROUP.inputWorld.x,
            y: APPROVED_USER_INPUT_GROUP.inputWorld.y
          }),
          status: "locked"
        }),
        members: Object.freeze(["pearl", "input-panel"])
      }),
      relationships: Object.freeze([
        Object.freeze({
          id: "nana-standing-registration",
          type: "registration",
          source: "nana.anchors.foot",
          target: "world.standingPoint",
          enabled: true
        }),
        Object.freeze({
          id: "user-input-group-binding",
          type: "group",
          parent: "user-input-group",
          members: Object.freeze(["pearl", "input-panel"]),
          enabled: true
        })
      ])
    })
  });

  var SCENE_PROFILES = Object.freeze({
    "namora-default": Object.freeze({
      id: "namora-default",
      version: "1.0.0",
      name: "Namora Default",
      description: "Default Namora scene (Background + NANA).",
      worldProfile: "default-world",
      layoutProfile: "default-layout",
      theme: "default",
      runtime: "default-runtime",
      enabled: true
    })
  });

  var DEFAULT_SCENE_ID = "namora-default";

  /** Live world constructed by SceneRuntime world loader. */
  var NAMORA_WORLD = null;
  var layoutEditorInstance = null;
  var USER_INPUT_DEFAULTS = null;
  var sceneRuntimeInstance = null;
  var runtimeLayoutState = null;
  var runtimeObjectGraph = null;
  var runtimeRelationshipGraph = null;
  var layoutLoadInfo = {
    source: "pending",
    filePath: "assets/config/namora-layout-default.json",
    loadSuccess: false,
    validationStatus: null,
    reconstructionStatus: null,
    fallbackReason: null,
    canonicalProfile: null,
    maxReconstructionDelta: null,
    boundCoordinateAuthority: "group-root-plus-local-offset",
    serializedWorldRole: "diagnostic"
  };

  var anchorRegistryValidationResult = null;

  function buildWorldFromProfile(worldProfile) {
    if (!worldProfile) {
      throw new Error("[SceneRuntime] world profile missing");
    }

    var spriteW = worldProfile.nana.spriteSourceWidth;
    var spriteH = worldProfile.nana.spriteSourceHeight;
    var standing = worldProfile.standingPoint;

    var world = {
      id: worldProfile.id,
      asset: worldProfile.asset,
      sourceWidth: worldProfile.sourceWidth,
      sourceHeight: worldProfile.sourceHeight,
      designWorldHeight: worldProfile.designWorldHeight,
      designWorldWidth: worldProfile.designWorldWidth,
      scalePolicy: worldProfile.scalePolicy || "fixed-design-world",
      origin: worldProfile.origin || "bottom-right",
      standingPoint: {
        x: standing.x,
        y: standing.y,
        status: standing.status,
        purpose: standing.purpose || ""
      },
      nana: {
        worldHeight: worldProfile.nana.worldHeight,
        spriteSourceWidth: spriteW,
        spriteSourceHeight: spriteH,
        visibleBounds: {
          minX: worldProfile.nana.visibleBounds.minX,
          minY: worldProfile.nana.visibleBounds.minY,
          maxX: worldProfile.nana.visibleBounds.maxX,
          maxY: worldProfile.nana.visibleBounds.maxY
        },
        anchors: defineNamoraAnchorRegistry(spriteW, spriteH, worldProfile.nana.anchors)
      }
    };

    return freezeRuntimeWorld(world);
  }

  function cloneAnchorRecord(anchor) {
    if (!anchor) return null;
    return {
      id: anchor.id,
      label: anchor.label,
      x: anchor.x,
      y: anchor.y,
      u: anchor.u,
      v: anchor.v,
      status: anchor.status,
      purpose: anchor.purpose
    };
  }

  function getAnchor(anchorId) {
    // Deprecated alias: former NANA-local pearl → authoritative world pearl-root
    if (anchorId === "pearl") {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "[NamoraWorld] getAnchor('pearl') is deprecated; use pearl-root (world). " +
            "There is one authoritative Pearl position."
        );
      }
      return {
        id: "pearl",
        label: "Pearl Anchor (deprecated → pearl-root)",
        x: null,
        y: null,
        u: null,
        v: null,
        status: "deprecated",
        purpose:
          "Retired NANA-local Pearl. Authoritative position is pearl-root (world / user-input-group).",
        deprecated: true,
        aliasOf: PEARL_ROOT_ID
      };
    }

    if (!anchorId || NAMORA_ANCHOR_IDS.indexOf(anchorId) === -1) return null;
    return cloneAnchorRecord(NAMORA_WORLD.nana.anchors[anchorId]);
  }

  function computeLegacyPearlWorldPosition(world, legacyLocal) {
    world = world || NAMORA_WORLD;
    legacyLocal = legacyLocal || LEGACY_PEARL_NANA_LOCAL;
    var transform = getNanaWorldTransform(world);
    return {
      x: transform.nanaWorldX + legacyLocal.x * transform.nanaWorldScale,
      y: transform.nanaWorldY + legacyLocal.y * transform.nanaWorldScale
    };
  }

  function initUserInputDefaults(layoutState) {
    var pearl;
    var input;
    var groupRoot;
    var pearlOffset;
    var inputOffset;
    var bound;
    var pearlStatus = "locked";
    var inputStatus = "locked";

    if (layoutState && layoutState.userInputGroup) {
      var group = layoutState.userInputGroup;
      bound = !!group.bound;
      pearl = {
        x: group.pearlWorld.x,
        y: group.pearlWorld.y
      };
      input = {
        x: group.inputWorld.x,
        y: group.inputWorld.y
      };
      pearlStatus = group.pearlStatus || pearlStatus;
      inputStatus = group.inputStatus || inputStatus;
      if (bound && group.groupRoot) {
        groupRoot = { x: group.groupRoot.x, y: group.groupRoot.y };
        pearlOffset = group.pearlOffset
          ? { x: group.pearlOffset.x, y: group.pearlOffset.y }
          : { x: 0, y: 0 };
        inputOffset = group.inputOffset
          ? { x: group.inputOffset.x, y: group.inputOffset.y }
          : { x: 0, y: 0 };
      } else {
        groupRoot = { x: pearl.x, y: pearl.y };
        pearlOffset = { x: 0, y: 0 };
        inputOffset = { x: input.x - pearl.x, y: input.y - pearl.y };
      }
    } else {
      bound = APPROVED_USER_INPUT_GROUP.bound;
      pearl = clonePoint(APPROVED_USER_INPUT_GROUP.pearlWorld);
      input = clonePoint(APPROVED_USER_INPUT_GROUP.inputWorld);
      groupRoot = clonePoint(APPROVED_USER_INPUT_GROUP.groupRoot);
      pearlOffset = clonePoint(APPROVED_USER_INPUT_GROUP.pearlOffset);
      inputOffset = clonePoint(APPROVED_USER_INPUT_GROUP.inputOffset);
    }

    USER_INPUT_DEFAULTS = Object.freeze({
      bound: bound,
      groupRoot: Object.freeze({ x: groupRoot.x, y: groupRoot.y }),
      pearlOffset: Object.freeze({ x: pearlOffset.x, y: pearlOffset.y }),
      inputOffset: Object.freeze({ x: inputOffset.x, y: inputOffset.y }),
      pearlWorld: Object.freeze({ x: pearl.x, y: pearl.y }),
      inputWorld: Object.freeze({ x: input.x, y: input.y }),
      pearlStatus: pearlStatus,
      inputStatus: inputStatus
    });
  }

  function clonePoint(point) {
    if (!point) return null;
    return { x: point.x, y: point.y };
  }

  function listAnchors() {
    return NAMORA_ANCHOR_IDS.map(function (anchorId) {
      return cloneAnchorRecord(NAMORA_WORLD.nana.anchors[anchorId]);
    });
  }

  function getAnchorSourcePosition(anchorId) {
    var anchor = getAnchor(anchorId);
    if (!anchor) return null;
    return {
      id: anchor.id,
      label: anchor.label,
      x: anchor.x,
      y: anchor.y,
      u: anchor.u,
      v: anchor.v,
      status: anchor.status,
      purpose: anchor.purpose
    };
  }

  function getEffectiveStandingPoint(world) {
    world = world || NAMORA_WORLD;

    if (
      layoutEditorInstance &&
      typeof layoutEditorInstance.getTemporaryStandingPoint === "function"
    ) {
      var temporary = layoutEditorInstance.getTemporaryStandingPoint();
      if (
        temporary &&
        typeof temporary.x === "number" &&
        typeof temporary.y === "number" &&
        isFinite(temporary.x) &&
        isFinite(temporary.y)
      ) {
        return {
          x: temporary.x,
          y: temporary.y,
          isTemporary: true,
          status: "temporary-override"
        };
      }
    }

    return {
      x: world.standingPoint.x,
      y: world.standingPoint.y,
      isTemporary: false,
      status: world.standingPoint.status || "canonical"
    };
  }

  function getNanaWorldTransform(world) {
    world = world || NAMORA_WORLD;
    var nana = world.nana;
    var nanaWorldScale = nana.worldHeight / nana.spriteSourceHeight;
    var foot = nana.anchors.foot;
    var standing = getEffectiveStandingPoint(world);
    var nanaWorldX = standing.x - foot.x * nanaWorldScale;
    var nanaWorldY = standing.y - foot.y * nanaWorldScale;

    return {
      nanaWorldScale: nanaWorldScale,
      nanaWorldWidth: nana.worldHeight,
      nanaWorldHeight: nana.worldHeight,
      nanaWorldX: nanaWorldX,
      nanaWorldY: nanaWorldY,
      standingPoint: {
        x: standing.x,
        y: standing.y,
        isTemporary: !!standing.isTemporary,
        status: standing.status
      }
    };
  }

  function getAnchorWorldPosition(anchorId, world) {
    // Deprecated pearl: resolve through effective pearl-root (no NANA-local authority)
    if (anchorId === "pearl") {
      var pearlWorld = null;
      if (
        layoutEditorInstance &&
        typeof layoutEditorInstance.getUserInputWorldPosition === "function"
      ) {
        pearlWorld = layoutEditorInstance.getUserInputWorldPosition(PEARL_ROOT_ID);
      }
      if (!pearlWorld && USER_INPUT_DEFAULTS) {
        pearlWorld = {
          x: USER_INPUT_DEFAULTS.pearlWorld.x,
          y: USER_INPUT_DEFAULTS.pearlWorld.y
        };
      }
      if (!pearlWorld) {
        pearlWorld = computeLegacyPearlWorldPosition();
      }
      return {
        id: "pearl",
        label: "Pearl Anchor (deprecated → pearl-root)",
        x: pearlWorld.x,
        y: pearlWorld.y,
        status: "deprecated",
        purpose: "Alias of pearl-root; not owned by NANA.",
        deprecated: true,
        aliasOf: PEARL_ROOT_ID,
        source: null
      };
    }

    var anchor = getAnchor(anchorId);
    if (!anchor) return null;

    var transform = getNanaWorldTransform(world);
    return {
      id: anchor.id,
      label: anchor.label,
      x: transform.nanaWorldX + anchor.x * transform.nanaWorldScale,
      y: transform.nanaWorldY + anchor.y * transform.nanaWorldScale,
      status: anchor.status,
      purpose: anchor.purpose,
      source: {
        x: anchor.x,
        y: anchor.y,
        u: anchor.u,
        v: anchor.v
      },
      nanaWorldOrigin: {
        x: transform.nanaWorldX,
        y: transform.nanaWorldY
      },
      nanaWorldScale: transform.nanaWorldScale
    };
  }

  function getAnchorViewportPosition(anchorId, world, layoutViewport) {
    world = world || NAMORA_WORLD;
    var worldPos = getAnchorWorldPosition(anchorId, world);
    if (!worldPos) return null;

    var layoutVp = layoutViewport || getLayoutViewportSize();
    var scale = computeWorldScale(world).scale;
    var worldOffsetX = layoutVp.width - world.designWorldWidth;
    var worldOffsetY = layoutVp.height - world.designWorldHeight;

    return {
      id: worldPos.id,
      label: worldPos.label,
      x: worldOffsetX + worldPos.x * scale,
      y: worldOffsetY + worldPos.y * scale,
      worldX: worldPos.x,
      worldY: worldPos.y,
      viewportWidth: layoutVp.width,
      viewportHeight: layoutVp.height,
      worldScale: scale,
      status: worldPos.status,
      purpose: worldPos.purpose,
      source: worldPos.source,
      nanaWorldOrigin: worldPos.nanaWorldOrigin,
      nanaWorldScale: worldPos.nanaWorldScale
    };
  }

  /**
   * Inverse mapping — Namora Scene layout CSS px → Namora World source px.
   * Input:  sceneX/sceneY relative to #namoraViewport top-left (NOT browser clientX/Y)
   * Output: Namora world source coordinates (same space as marker left/top in #namoraWorld)
   * Uses fixed world scale and bottom-right world placement within the scene.
   */
  function viewportToWorldPoint(viewportX, viewportY, world, layoutViewport) {
    if (typeof viewportX !== "number" || typeof viewportY !== "number" ||
        !isFinite(viewportX) || !isFinite(viewportY)) {
      throw new Error("[NamoraWorld] viewportToWorldPoint: invalid scene coordinates");
    }

    world = world || NAMORA_WORLD;
    var layoutVp = layoutViewport ||
      (lastLayout && lastLayout.layoutViewport) ||
      getLayoutViewportSize();
    var scale = computeWorldScale(world).scale;

    if (!scale) {
      throw new Error("[NamoraWorld] viewportToWorldPoint: invalid world scale");
    }

    var worldOffsetX = layoutVp.width - world.designWorldWidth;
    var worldOffsetY = layoutVp.height - world.designWorldHeight;

    return {
      x: (viewportX - worldOffsetX) / scale,
      y: (viewportY - worldOffsetY) / scale,
      worldScale: scale,
      worldOffsetX: worldOffsetX,
      worldOffsetY: worldOffsetY
    };
  }

  /**
   * Inverse mapping — Namora World source px → NANA sprite source local px.
   * Input:  world X/Y in Namora world source space
   * Output: NANA sprite-local source X/Y
   * Uses current effective NANA world transform (standing point / foot).
   */
  function worldToNanaLocalPoint(worldX, worldY, world) {
    if (typeof worldX !== "number" || typeof worldY !== "number" ||
        !isFinite(worldX) || !isFinite(worldY)) {
      throw new Error("[NamoraWorld] worldToNanaLocalPoint: invalid world coordinates");
    }

    var transform = getNanaWorldTransform(world);
    if (!transform.nanaWorldScale) {
      throw new Error("[NamoraWorld] worldToNanaLocalPoint: invalid NANA world scale");
    }

    return {
      x: (worldX - transform.nanaWorldX) / transform.nanaWorldScale,
      y: (worldY - transform.nanaWorldY) / transform.nanaWorldScale,
      nanaWorldOrigin: {
        x: transform.nanaWorldX,
        y: transform.nanaWorldY
      },
      nanaWorldScale: transform.nanaWorldScale
    };
  }

  /**
   * Inverse mapping — Namora Scene layout CSS px → NANA sprite source local px.
   * Input:  sceneX/sceneY relative to #namoraViewport top-left (NOT browser clientX/Y)
   * Output: NANA sprite-local source X/Y
   * Pipeline: Scene → World → NANA Local
   */
  function viewportToNanaLocalPoint(viewportX, viewportY, world, layoutViewport) {
    var worldPoint = viewportToWorldPoint(viewportX, viewportY, world, layoutViewport);
    var local = worldToNanaLocalPoint(worldPoint.x, worldPoint.y, world);
    return {
      x: local.x,
      y: local.y,
      worldX: worldPoint.x,
      worldY: worldPoint.y,
      nanaWorldOrigin: local.nanaWorldOrigin,
      nanaWorldScale: local.nanaWorldScale,
      worldScale: worldPoint.worldScale
    };
  }

  /**
   * Forward mapping — Namora World source px → Namora Scene layout CSS px.
   * Input:  world X/Y in Namora world source space
   * Output: scene X/Y relative to #namoraViewport top-left
   */
  function worldToViewportPoint(worldX, worldY, world, layoutViewport) {
    if (typeof worldX !== "number" || typeof worldY !== "number" ||
        !isFinite(worldX) || !isFinite(worldY)) {
      throw new Error("[NamoraWorld] worldToViewportPoint: invalid world coordinates");
    }

    world = world || NAMORA_WORLD;
    var layoutVp = layoutViewport ||
      (lastLayout && lastLayout.layoutViewport) ||
      getLayoutViewportSize();
    var scale = computeWorldScale(world).scale;
    var worldOffsetX = layoutVp.width - world.designWorldWidth;
    var worldOffsetY = layoutVp.height - world.designWorldHeight;

    return {
      x: worldOffsetX + worldX * scale,
      y: worldOffsetY + worldY * scale,
      worldScale: scale,
      worldOffsetX: worldOffsetX,
      worldOffsetY: worldOffsetY
    };
  }

  function nanaLocalToWorldPoint(localX, localY, world) {
    if (typeof localX !== "number" || typeof localY !== "number" ||
        !isFinite(localX) || !isFinite(localY)) {
      throw new Error("[NamoraWorld] nanaLocalToWorldPoint: invalid local coordinates");
    }

    var transform = getNanaWorldTransform(world);
    return {
      x: transform.nanaWorldX + localX * transform.nanaWorldScale,
      y: transform.nanaWorldY + localY * transform.nanaWorldScale,
      nanaWorldOrigin: {
        x: transform.nanaWorldX,
        y: transform.nanaWorldY
      },
      nanaWorldScale: transform.nanaWorldScale
    };
  }

  function validateAnchorRegistry() {
    var errors = [];
    var warnings = [];
    var seen = Object.create(null);

    NAMORA_ANCHOR_IDS.forEach(function (anchorId) {
      if (seen[anchorId]) {
        errors.push("Duplicate Namora anchor id: " + anchorId);
      }
      seen[anchorId] = true;

      var anchor = NAMORA_WORLD.nana.anchors[anchorId];
      if (!anchor) {
        errors.push("Missing Namora anchor: " + anchorId);
        return;
      }

      if (!anchor.label) {
        errors.push(anchorId + ": missing label");
      }

      if (!anchor.purpose) {
        errors.push(anchorId + ": missing semantic purpose");
      }

      if (typeof anchor.u !== "number" || typeof anchor.v !== "number") {
        errors.push(anchorId + ": missing normalized coordinates");
      }

      if (anchor.u !== anchor.x / NAMORA_WORLD.nana.spriteSourceWidth ||
          anchor.v !== anchor.y / NAMORA_WORLD.nana.spriteSourceHeight) {
        errors.push(anchorId + ": normalized coordinates do not match source pixels");
      }

      if (!Object.isFrozen(anchor)) {
        errors.push(anchorId + ": anchor record is mutable");
      }
    });

    if (!Object.isFrozen(NAMORA_WORLD.nana.anchors)) {
      errors.push("Namora anchor registry is mutable");
    }

    if (NAMORA_ANCHOR_IDS.length !== Object.keys(NAMORA_WORLD.nana.anchors).length) {
      errors.push("Namora anchor registry contains unexpected anchor ids");
    }

    var result = {
      status: errors.length === 0 ? "PASS" : "FAIL",
      errors: errors,
      warnings: warnings,
      anchorCount: NAMORA_ANCHOR_IDS.length
    };

    anchorRegistryValidationResult = result;

    if (result.status === "FAIL") {
      console.error("[NamoraWorld] anchor registry validation failed:", errors);
    }

    return Object.assign({}, result);
  }

  function resolveRegistryAnchorStatus(record) {
    if (!record.anchor) return "none";

    if (record.coordinateSpace === "nana-local") {
      return getAnchor(record.anchor) ? "resolved" : "missing";
    }

    if (record.coordinateSpace === "world") {
      if (USER_INPUT_POINT_IDS.indexOf(record.anchor) !== -1) return "resolved";
      if (record.anchor === "foot") return getAnchor("foot") ? "resolved" : "missing";
      return "unresolved";
    }

    if (record.coordinateSpace === "user-input-group-local") {
      if (record.anchor === PEARL_ROOT_ID || record.anchor === INPUT_ROOT_ID) {
        return "resolved";
      }
      return "unresolved";
    }

    if (record.coordinateSpace === "input-local" && record.anchor === "send") {
      return "planned";
    }

    return "unresolved";
  }

  /* ------------------------------------------------------------------------ */
  /* World Object Registry — spatial object catalog (Task 021 / 029)            */
  /* Object → Coordinate Owner → Anchor → Renderer                              */
  /* ------------------------------------------------------------------------ */

  var VALID_COORDINATE_SPACES = [
    "world",
    "nana-local",
    "input-local",
    "viewport",
    "user-input-group-local",
    "background-source",
    "speech-bubble-local"
  ];

  var NAMORA_OBJECTS = {
    worldBackground: {
      id: "world-background",
      type: "environment",
      coordinateSpace: "world",
      coordinateOwner: "namora-world",
      structuralParentId: null,
      transformParentId: null,
      anchor: null,
      enabled: true,
      visible: true,
      rendererBinding: "#namoraWorldBg",
      localOffset: null,
      metadata: {
        role: "scene-background"
      }
    },
    nana: {
      id: "nana",
      type: "character",
      coordinateSpace: "world",
      coordinateOwner: "standing-point",
      structuralParentId: "world-background",
      transformParentId: "world-background",
      anchor: "foot",
      enabled: true,
      visible: true,
      rendererBinding: "#namoraNana",
      localOffset: null,
      metadata: {
        role: "companion"
      }
    },
    speechBubble: {
      id: "speech-bubble",
      type: "interface-component",
      coordinateSpace: "speech-bubble-local",
      coordinateOwner: "nana",
      structuralParentId: "nana",
      transformParentId: "nana",
      anchor: "dialogue-tail",
      enabled: true,
      visible: true,
      rendererBinding: "#sceneSpeechBubble",
      localOffset: null,
      metadata: {
        role: "dialogue-surface",
        displayName: "NANA 对话气泡"
      }
    },
    userInputGroup: {
      id: "user-input-group",
      type: "interface",
      coordinateSpace: "world",
      coordinateOwner: "namora-world",
      structuralParentId: "world-background",
      transformParentId: "world-background",
      anchor: "user-input-group-root",
      enabled: false,
      visible: false,
      rendererBinding: null,
      localOffset: null,
      metadata: {
        role: "user-input-group",
        synthetic: true
      }
    },
    pearl: {
      id: "pearl",
      type: "interface",
      coordinateSpace: "user-input-group-local",
      coordinateOwner: "user-input-group",
      structuralParentId: "user-input-group",
      transformParentId: "user-input-group",
      anchor: "pearl-root",
      enabled: false,
      visible: false,
      rendererBinding: null,
      localOffset: null,
      metadata: {
        role: "pearl"
      }
    },
    inputPanel: {
      id: "input-panel",
      type: "interface",
      coordinateSpace: "user-input-group-local",
      coordinateOwner: "user-input-group",
      structuralParentId: "user-input-group",
      transformParentId: "user-input-group",
      anchor: "input-root",
      enabled: false,
      visible: false,
      rendererBinding: null,
      localOffset: null,
      metadata: {
        role: "message-input"
      }
    }
  };

  function getStructuralParentId(record) {
    if (!record) return null;
    if (record.structuralParentId !== undefined) return record.structuralParentId;
    return record.parentId != null ? record.parentId : null;
  }

  function getTransformParentId(record) {
    if (!record) return null;
    if (record.transformParentId !== undefined) return record.transformParentId;
    return record.parentId != null ? record.parentId : null;
  }

  function getObjectChainByParentField(objectId, parentField) {
    var chain = [];
    var seen = Object.create(null);
    var currentId = objectId;

    while (currentId) {
      if (seen[currentId]) return null;
      seen[currentId] = true;
      var record = getObject(currentId);
      if (!record) return null;
      chain.push(record);
      currentId =
        parentField === "transform"
          ? getTransformParentId(record)
          : getStructuralParentId(record);
    }

    return chain;
  }

  var BUBBLE_ROOT_ID = "bubble-root";
  var BUBBLE_TAIL_ID = "bubble-tail";
  var BUBBLE_BODY_CENTER_ID = "bubble-body-center";
  var BUBBLE_TEXT_ORIGIN_ID = "bubble-text-origin";
  var SPEECH_BUBBLE_POINT_IDS = [
    BUBBLE_ROOT_ID,
    BUBBLE_TAIL_ID,
    BUBBLE_BODY_CENTER_ID,
    BUBBLE_TEXT_ORIGIN_ID
  ];
  var SPEECH_BUBBLE_COMPONENT_ID = "speech-bubble";
  var SPEECH_BUBBLE_DEMO_TEXT =
    "你好，我是 NANA。我们先从你想寻找的名字开始吧。";

  /** Draft component geometry — centralized authority (Task 035). */
  var SPEECH_BUBBLE_COMPONENT = Object.freeze({
    id: SPEECH_BUBBLE_COMPONENT_ID,
    status: "draft",
    localSize: Object.freeze({ width: 268, height: 102 }),
    points: Object.freeze({
      root: Object.freeze({ x: 0, y: 0 }),
      tail: Object.freeze({ x: 252, y: 86 }),
      bodyCenter: Object.freeze({ x: 118, y: 40 }),
      textOrigin: Object.freeze({ x: 18, y: 14 })
    }),
    constraints: Object.freeze({
      minWidth: 120,
      maxWidth: 360,
      minHeight: 48
    }),
    attachment: Object.freeze({
      sourcePoint: "speech-bubble.points.tail",
      targetAnchor: "nana.anchors.dialogue-tail"
    })
  });

  /**
   * Adaptive render configuration — single authoritative owner for Speech
   * Bubble content-driven sizing and internal spacing (Task 036).
   *
   * These are renderer/runtime parameters (world units). They are NOT stored in
   * the Layout Profile and never overwrite canonical spatial data. They only
   * describe how the Bubble Content Area and Dialogue Text Block are derived
   * from measured content, anchored to the canonical Dialogue Tail attachment.
   *
   * Anchoring: the body's bottom-right reference corner is pinned relative to
   * the canonical tail point, so the bubble grows up and to the left while the
   * tail endpoint remains attached to NANA's Dialogue Tail.
   */
  var SPEECH_BUBBLE_RENDER = Object.freeze({
    fontSize: 15,
    lineHeight: 1.65,
    // Minimum content width keeps very short dialogue ("你好。") from
    // collapsing the bubble's visual identity.
    minContentWidth: 60,
    // Maximum content width ≈ 29 CJK glyphs — the approved one-line capacity
    // and the maximum approved bubble width (~87 chars over three lines).
    maxContentWidth: 435,
    // One visual line holds ~29 CJK glyphs; used to derive the target line
    // count from the unwrapped dialogue width (Task 037 line policy).
    oneLineMaxWidth: 435,
    paddingInline: 20,
    paddingBlock: 15,
    maxNormalLines: 3,
    // Extra width granted to multi-line bubbles so greedy wrapping settles into
    // the intended (balanced) number of lines rather than spilling one glyph
    // onto an extra line.
    lineBalanceSlack: 10,
    // Tail attachment tuning. The tail tip stays locked to the canonical
    // Dialogue Tail point; these only shape the body corner relative to it.
    tailInsetRight: 0,
    tailInsetBottom: 5,
    // Composition: lift the body up and to the left off the lower-right corner
    // so it reads as centered relative to NANA with comfortable breathing
    // space. The tail is lengthened to keep the visual connection.
    bodyLiftX: 10,
    bodyLiftY: 10,
    tailScaleX: 1.18,
    tailScaleY: 1.55
  });

  function getSpeechBubbleRenderConfig() {
    return SPEECH_BUBBLE_RENDER;
  }

  var SPEECH_BUBBLE_DEFAULTS = null;

  function cloneSpeechBubbleGeometry(geometry) {
    if (!geometry) return null;
    return {
      id: geometry.id || SPEECH_BUBBLE_COMPONENT_ID,
      status: geometry.status || "draft",
      localSize: {
        width: geometry.localSize.width,
        height: geometry.localSize.height
      },
      points: {
        root: { x: geometry.points.root.x, y: geometry.points.root.y },
        tail: { x: geometry.points.tail.x, y: geometry.points.tail.y },
        bodyCenter: {
          x: geometry.points.bodyCenter.x,
          y: geometry.points.bodyCenter.y
        },
        textOrigin: {
          x: geometry.points.textOrigin.x,
          y: geometry.points.textOrigin.y
        }
      },
      constraints: geometry.constraints
        ? {
            minWidth: geometry.constraints.minWidth,
            maxWidth: geometry.constraints.maxWidth,
            minHeight: geometry.constraints.minHeight
          }
        : null,
      attachment: geometry.attachment
        ? {
            sourcePoint: geometry.attachment.sourcePoint,
            targetAnchor: geometry.attachment.targetAnchor
          }
        : null
    };
  }

  function speechBubbleGeometryFromComponentDefaults() {
    return cloneSpeechBubbleGeometry(SPEECH_BUBBLE_COMPONENT);
  }

  function speechBubbleGeometryFromProfileObject(obj) {
    if (!obj) return speechBubbleGeometryFromComponentDefaults();
    var points = obj.points || {};
    var root = points.root || points["bubble-root"] || SPEECH_BUBBLE_COMPONENT.points.root;
    var tail = points.tail || points["bubble-tail"] || SPEECH_BUBBLE_COMPONENT.points.tail;
    var bodyCenter =
      points.bodyCenter ||
      points["body-center"] ||
      points["bubble-body-center"] ||
      SPEECH_BUBBLE_COMPONENT.points.bodyCenter;
    var textOrigin =
      points.textOrigin ||
      points["text-origin"] ||
      points["bubble-text-origin"] ||
      SPEECH_BUBBLE_COMPONENT.points.textOrigin;
    return {
      id: obj.id || SPEECH_BUBBLE_COMPONENT_ID,
      status: obj.status || "draft",
      localSize: {
        width: (obj.localSize && obj.localSize.width) || SPEECH_BUBBLE_COMPONENT.localSize.width,
        height: (obj.localSize && obj.localSize.height) || SPEECH_BUBBLE_COMPONENT.localSize.height
      },
      points: {
        root: { x: root.x, y: root.y },
        tail: { x: tail.x, y: tail.y },
        bodyCenter: { x: bodyCenter.x, y: bodyCenter.y },
        textOrigin: { x: textOrigin.x, y: textOrigin.y }
      },
      constraints: obj.constraints || {
        minWidth: SPEECH_BUBBLE_COMPONENT.constraints.minWidth,
        maxWidth: SPEECH_BUBBLE_COMPONENT.constraints.maxWidth,
        minHeight: SPEECH_BUBBLE_COMPONENT.constraints.minHeight
      },
      attachment: obj.attachment || {
        sourcePoint: SPEECH_BUBBLE_COMPONENT.attachment.sourcePoint,
        targetAnchor: SPEECH_BUBBLE_COMPONENT.attachment.targetAnchor
      }
    };
  }

  function buildSpeechBubbleProfileObject(geometry, options) {
    options = options || {};
    geometry = geometry || getCanonicalSpeechBubbleGeometry();
    var canonical = options.canonical || getCanonicalSpeechBubbleGeometry();
    var modified = !!options.modified;
    return {
      id: SPEECH_BUBBLE_COMPONENT_ID,
      type: "interface-component",
      coordinateSpace: "speech-bubble-local",
      structuralParentId: "nana",
      transformParentId: "nana",
      status: geometry.status || "draft",
      attachment: {
        sourcePoint: "speech-bubble.points.tail",
        targetAnchor: "nana.anchors.dialogue-tail"
      },
      localSize: {
        width: roundLayoutSource(geometry.localSize.width),
        height: roundLayoutSource(geometry.localSize.height)
      },
      points: {
        root: {
          x: roundLayoutSource(geometry.points.root.x),
          y: roundLayoutSource(geometry.points.root.y),
          canonical: {
            x: roundLayoutSource(canonical.points.root.x),
            y: roundLayoutSource(canonical.points.root.y)
          },
          modified: modified
        },
        tail: {
          x: roundLayoutSource(geometry.points.tail.x),
          y: roundLayoutSource(geometry.points.tail.y),
          canonical: {
            x: roundLayoutSource(canonical.points.tail.x),
            y: roundLayoutSource(canonical.points.tail.y)
          },
          modified: modified
        },
        "body-center": {
          x: roundLayoutSource(geometry.points.bodyCenter.x),
          y: roundLayoutSource(geometry.points.bodyCenter.y),
          canonical: {
            x: roundLayoutSource(canonical.points.bodyCenter.x),
            y: roundLayoutSource(canonical.points.bodyCenter.y)
          },
          modified: modified
        },
        "text-origin": {
          x: roundLayoutSource(geometry.points.textOrigin.x),
          y: roundLayoutSource(geometry.points.textOrigin.y),
          canonical: {
            x: roundLayoutSource(canonical.points.textOrigin.x),
            y: roundLayoutSource(canonical.points.textOrigin.y)
          },
          modified: modified
        }
      },
      constraints: {
        minWidth: geometry.constraints.minWidth,
        maxWidth: geometry.constraints.maxWidth,
        minHeight: geometry.constraints.minHeight
      }
    };
  }

  function ensureSpeechBubbleInProfile(profile) {
    if (!profile || !profile.objects) return profile;
    if (profile.objects["speech-bubble"]) return profile;
    var out = deepCloneLayoutProfile(profile);
    out.objects["speech-bubble"] = buildSpeechBubbleProfileObject(
      speechBubbleGeometryFromComponentDefaults(),
      { modified: false }
    );
    return out;
  }

  function initSpeechBubbleDefaults(layoutState) {
    var geometry;
    if (layoutState && layoutState.speechBubble) {
      geometry = cloneSpeechBubbleGeometry(layoutState.speechBubble);
    } else if (
      layoutLoadInfo &&
      layoutLoadInfo.canonicalProfile &&
      layoutLoadInfo.canonicalProfile.objects
    ) {
      geometry = speechBubbleGeometryFromProfileObject(
        layoutLoadInfo.canonicalProfile.objects["speech-bubble"]
      );
    } else {
      geometry = speechBubbleGeometryFromComponentDefaults();
    }
    SPEECH_BUBBLE_DEFAULTS = Object.freeze(cloneSpeechBubbleGeometry(geometry));
  }

  function getCanonicalSpeechBubbleGeometry() {
    if (!SPEECH_BUBBLE_DEFAULTS) initSpeechBubbleDefaults(runtimeLayoutState);
    return cloneSpeechBubbleGeometry(SPEECH_BUBBLE_DEFAULTS);
  }

  function getEffectiveSpeechBubbleGeometry() {
    var geometry = getCanonicalSpeechBubbleGeometry();
    if (
      layoutEditorInstance &&
      layoutEditorInstance.isEnabled() &&
      typeof layoutEditorInstance.getSpeechBubbleGeometryOverride === "function"
    ) {
      return layoutEditorInstance.getSpeechBubbleGeometryOverride(geometry);
    }
    return geometry;
  }

  function getDialogueTailWorldPosition(world) {
    world = world || NAMORA_WORLD;
    if (
      layoutEditorInstance &&
      layoutEditorInstance.isEnabled() &&
      typeof layoutEditorInstance.getEffectiveWorldPosition === "function"
    ) {
      var editorPos = layoutEditorInstance.getEffectiveWorldPosition("dialogue-tail");
      if (editorPos) return { x: editorPos.x, y: editorPos.y };
    }
    return getAnchorWorldPosition("dialogue-tail", world);
  }

  function computeSpeechBubbleWorldTransform(world, geometry, dialogueTailWorld) {
    geometry = geometry || getEffectiveSpeechBubbleGeometry();
    dialogueTailWorld =
      dialogueTailWorld || getDialogueTailWorldPosition(world);
    if (!geometry || !dialogueTailWorld) return null;

    var tailLocal = geometry.points.tail;
    var worldOrigin = {
      x: dialogueTailWorld.x - tailLocal.x,
      y: dialogueTailWorld.y - tailLocal.y
    };

    function localToWorld(localPoint) {
      return {
        x: worldOrigin.x + localPoint.x,
        y: worldOrigin.y + localPoint.y
      };
    }

    var tailWorld = localToWorld(geometry.points.tail);

    return {
      worldOrigin: worldOrigin,
      tailWorld: tailWorld,
      rootWorld: localToWorld(geometry.points.root),
      bodyCenterWorld: localToWorld(geometry.points.bodyCenter),
      textOriginWorld: localToWorld(geometry.points.textOrigin),
      registrationErrorPx: Math.hypot(
        tailWorld.x - dialogueTailWorld.x,
        tailWorld.y - dialogueTailWorld.y
      ),
      localSize: {
        width: geometry.localSize.width,
        height: geometry.localSize.height
      }
    };
  }

  function speechBubbleLocalToWorld(localPoint, worldOrigin) {
    return {
      x: worldOrigin.x + localPoint.x,
      y: worldOrigin.y + localPoint.y
    };
  }

  function speechBubbleWorldToLocal(worldPoint, worldOrigin) {
    return {
      x: worldPoint.x - worldOrigin.x,
      y: worldPoint.y - worldOrigin.y
    };
  }

  /**
   * Render the Speech Bubble with content-driven adaptive geometry (Task 036).
   *
   * Ownership: the Runtime owns the world attachment (worldOrigin derived from
   * the canonical Dialogue Tail + canonical tail point). The body size is
   * derived from renderer-local DOM measurement of the wrapped Dialogue Text,
   * clamped to the render configuration. Measurement is used only as an input
   * to component render geometry; it never overwrites the canonical Layout
   * Profile or the base geometry.
   *
   * Content Area = body minus symmetric padding. The Dialogue Text Block is
   * left-aligned but sized to the wrapped content width, so equal inline
   * padding centers the block horizontally; equal block padding centers it
   * vertically.
   */
  function applySpeechBubbleDomLayout(element, geometry, transform) {
    if (!element || !geometry || !transform) return;

    element.style.left = transform.worldOrigin.x + "px";
    element.style.top = transform.worldOrigin.y + "px";

    var body = element.querySelector(".scene-speech-bubble__body");
    var tail = element.querySelector(".scene-speech-bubble__tail");
    var text = element.querySelector(".scene-speech-bubble__text");
    if (!body || !tail || !text) return;

    var cfg = getSpeechBubbleRenderConfig();
    var lineHeightPx = cfg.fontSize * cfg.lineHeight;

    text.style.fontSize = cfg.fontSize + "px";
    text.style.lineHeight = String(cfg.lineHeight);

    // --- Step 1: measure the unwrapped (single-line) dialogue width ----------
    // Renderer-local only; never becomes canonical spatial data.
    text.style.whiteSpace = "nowrap";
    text.style.maxWidth = "none";
    text.style.width = "auto";
    var singleLineWidth = text.offsetWidth;

    // --- Step 2: derive a target line count and a balanced content width -----
    // Continuous growth: width scales with dialogue length. The target content
    // width distributes the text evenly across the target line count so lines
    // stay visually balanced (e.g. 40 chars → 20+20, not 29+11). Natural
    // wrapping is left to the renderer; no manual line breaks are inserted.
    var targetLines = Math.max(
      1,
      Math.ceil(singleLineWidth / cfg.oneLineMaxWidth)
    );
    var contentWidth;
    if (targetLines <= 1) {
      contentWidth = Math.min(cfg.oneLineMaxWidth, singleLineWidth);
    } else {
      contentWidth = singleLineWidth / targetLines + cfg.lineBalanceSlack;
    }
    contentWidth = Math.min(
      cfg.maxContentWidth,
      Math.max(cfg.minContentWidth, Math.round(contentWidth))
    );

    // --- Step 3: measure the wrapped height at the chosen width --------------
    text.style.whiteSpace = "normal";
    text.style.width = contentWidth + "px";
    var measuredHeight = text.offsetHeight;
    var lineCount = Math.max(1, Math.round(measuredHeight / lineHeightPx));
    var contentHeight = lineCount * lineHeightPx;

    var bodyW = contentWidth + cfg.paddingInline * 2;
    var bodyH = contentHeight + cfg.paddingBlock * 2;

    // --- Step 4: anchor body to the canonical tail; grow up and to the left --
    // The tail tip stays locked to the Dialogue Tail point. A small lift pushes
    // the body off the lower-right corner for a calmer composition; the tail is
    // scaled to keep the visual connection to NANA.
    var tailLocal = geometry.points.tail;
    var bodyRight = tailLocal.x - cfg.tailInsetRight - cfg.bodyLiftX;
    var bodyBottom = tailLocal.y + cfg.tailInsetBottom - cfg.bodyLiftY;
    var bodyLeft = bodyRight - bodyW;
    var bodyTop = bodyBottom - bodyH;

    element.style.width = bodyW + "px";
    element.style.height = bodyH + "px";

    body.style.left = bodyLeft + "px";
    body.style.top = bodyTop + "px";
    body.style.width = bodyW + "px";
    body.style.height = bodyH + "px";

    // Tail is a child of the component element (component-local origin). Its tip
    // remains at the canonical tail point; the scale lengthens it toward NANA.
    tail.style.left = tailLocal.x + "px";
    tail.style.top = tailLocal.y + "px";
    tail.style.setProperty("--tail-scale-x", String(cfg.tailScaleX));
    tail.style.setProperty("--tail-scale-y", String(cfg.tailScaleY));

    // Text block placed inside the content area with symmetric padding, so the
    // left-aligned block is centered both horizontally and vertically.
    text.style.maxWidth = "none";
    text.style.width = contentWidth + "px";
    text.style.left = cfg.paddingInline + "px";
    text.style.top = cfg.paddingBlock + "px";
  }

  function validateSpeechBubbleGeometry(geometry, errors, fail) {
    if (!geometry) {
      fail("缺少 Speech Bubble 组件几何数据");
      return;
    }
    if (
      !geometry.localSize ||
      !isFiniteNumber(geometry.localSize.width) ||
      geometry.localSize.width <= 0 ||
      !isFiniteNumber(geometry.localSize.height) ||
      geometry.localSize.height <= 0
    ) {
      fail("Speech Bubble 尺寸必须为正数");
    }
    if (!geometry.points) {
      fail("Speech Bubble 缺少局部控制点");
      return;
    }
    ["root", "tail", "bodyCenter", "textOrigin"].forEach(function (key) {
      var point = geometry.points[key];
      if (!point || !isFiniteNumber(point.x) || !isFiniteNumber(point.y)) {
        fail("Speech Bubble 控制点无效：" + key);
      }
    });
    if (geometry.points && geometry.localSize) {
      var tail = geometry.points.tail;
      var size = geometry.localSize;
      if (
        tail.x < -size.width * 0.25 ||
        tail.y < -size.height * 0.25 ||
        tail.x > size.width * 1.25 ||
        tail.y > size.height * 1.25
      ) {
        fail("Speech Bubble 尾点超出组件允许边界");
      }
      var bodyCenter = geometry.points.bodyCenter;
      var textOrigin = geometry.points.textOrigin;
      var bodyLeft = bodyCenter.x - size.width / 2;
      var bodyTop = bodyCenter.y - size.height / 2;
      if (
        textOrigin.x < bodyLeft ||
        textOrigin.y < bodyTop ||
        textOrigin.x > bodyLeft + size.width ||
        textOrigin.y > bodyTop + size.height
      ) {
        fail("Speech Bubble 文本原点超出内容区域");
      }
    }
  }

  var SCENE_COMPONENTS = Object.freeze({
    "speech-bubble": Object.freeze({
      id: "speech-bubble",
      objectId: "speech-bubble",
      anchorId: "dialogue-tail",
      attachmentPointId: BUBBLE_TAIL_ID,
      coordinateSpace: "speech-bubble-local",
      rendererBinding: "#sceneSpeechBubble",
      enabled: true,
      visible: true,
      editorVisible: true,
      runtimeVisible: true
    }),
    "input-panel": Object.freeze({
      id: "input-panel",
      objectId: "input-panel",
      anchorId: INPUT_ROOT_ID,
      coordinateSpace: "user-input-group-local",
      rendererBinding: "#sceneInputPanel",
      enabled: true,
      visible: true,
      editorVisible: true,
      runtimeVisible: true
    }),
    pearl: Object.freeze({
      id: "pearl",
      objectId: "pearl",
      anchorId: PEARL_ROOT_ID,
      coordinateSpace: "user-input-group-local",
      rendererBinding: "#scenePearl",
      enabled: true,
      visible: true,
      editorVisible: true,
      runtimeVisible: true
    })
  });

  var sceneComponentPreviewEnabled = false;
  var sceneComponentPositions = Object.create(null);

  function cloneSceneComponentRecord(record) {
    if (!record) return null;
    return {
      id: record.id,
      objectId: record.objectId,
      anchorId: record.anchorId,
      coordinateSpace: record.coordinateSpace,
      rendererBinding: record.rendererBinding,
      enabled: record.enabled,
      visible: record.visible,
      editorVisible: record.editorVisible,
      runtimeVisible: record.runtimeVisible
    };
  }

  function getSceneComponent(componentId) {
    var record = SCENE_COMPONENTS[componentId];
    if (!record) return null;
    var out = cloneSceneComponentRecord(record);
    if (componentId === "pearl" || componentId === "input-panel") {
      var bound =
        layoutEditorInstance && layoutEditorInstance.isEnabled()
          ? layoutEditorInstance.isUserInputGroupBound()
          : !!(USER_INPUT_DEFAULTS && USER_INPUT_DEFAULTS.bound);
      out.coordinateSpace = bound ? "user-input-group-local" : "world";
    }
    var position = sceneComponentPositions[componentId];
    out.worldPosition = position
      ? { x: position.x, y: position.y }
      : null;
    return out;
  }

  function listSceneComponents() {
    return Object.keys(SCENE_COMPONENTS).map(function (componentId) {
      return getSceneComponent(componentId);
    });
  }

  var registryValidationResult = null;
  var objectIndexById = null;

  function cloneObjectRecord(record) {
    var structuralParentId = getStructuralParentId(record);
    return {
      id: record.id,
      type: record.type,
      coordinateSpace: record.coordinateSpace,
      coordinateOwner: record.coordinateOwner,
      structuralParentId: structuralParentId,
      transformParentId: getTransformParentId(record),
      parentId: structuralParentId,
      anchor: record.anchor,
      enabled: record.enabled,
      visible: record.visible,
      rendererBinding: record.rendererBinding,
      localOffset: record.localOffset ? Object.assign({}, record.localOffset) : null,
      metadata: record.metadata ? Object.assign({}, record.metadata) : {}
    };
  }

  function buildObjectIndex() {
    var index = Object.create(null);
    Object.keys(NAMORA_OBJECTS).forEach(function (key) {
      var record = NAMORA_OBJECTS[key];
      index[record.id] = record;
    });
    return index;
  }

  function getObject(objectId) {
    if (!objectId || !objectIndexById) return null;
    var record = objectIndexById[objectId];
    return record ? cloneObjectRecord(record) : null;
  }

  function listObjects() {
    return Object.keys(NAMORA_OBJECTS).map(function (key) {
      return cloneObjectRecord(NAMORA_OBJECTS[key]);
    });
  }

  function getChildren(objectId) {
    if (!objectId) return [];
    return listObjects().filter(function (record) {
      return getStructuralParentId(record) === objectId;
    });
  }

  function getObjectChain(objectId) {
    return getObjectChainByParentField(objectId, "structural");
  }

  function getTransformObjectChain(objectId) {
    return getObjectChainByParentField(objectId, "transform");
  }

  function resolveRendererBinding(rendererBinding) {
    if (!rendererBinding) return null;
    return document.querySelector(rendererBinding);
  }

  function validateObjectRegistry() {
    var errors = [];
    var warnings = [];
    var records = listObjects();
    var ids = Object.create(null);
    var enabledCount = 0;
    var visibleCount = 0;

    records.forEach(function (record) {
      if (ids[record.id]) {
        errors.push("Duplicate object id: " + record.id);
      }
      ids[record.id] = true;

      if (!record.coordinateSpace) {
        errors.push(record.id + ": missing coordinateSpace");
      } else if (VALID_COORDINATE_SPACES.indexOf(record.coordinateSpace) === -1) {
        errors.push(record.id + ": unknown coordinateSpace '" + record.coordinateSpace + "'");
      }

      if (!record.coordinateOwner) {
        errors.push(record.id + ": missing coordinateOwner");
      }

      if (getStructuralParentId(record) === record.id) {
        errors.push(record.id + ": cannot be its own structural parent");
      }

      if (getTransformParentId(record) === record.id) {
        errors.push(record.id + ": cannot be its own transform parent");
      }

      var structuralParentId = getStructuralParentId(record);
      if (structuralParentId && !getObject(structuralParentId)) {
        errors.push(
          record.id + ": structural parent '" + structuralParentId + "' does not exist"
        );
      }

      var transformParentId = getTransformParentId(record);
      if (transformParentId && !getObject(transformParentId)) {
        errors.push(
          record.id + ": transform parent '" + transformParentId + "' does not exist"
        );
      }

      if (record.id === "pearl" && getStructuralParentId(record) === "nana") {
        errors.push(record.id + ": pearl must not be structurally owned by NANA");
      }
      if (record.id === "input-panel" && getStructuralParentId(record) === "nana") {
        errors.push(record.id + ": input-panel must not be structurally owned by NANA");
      }

      if (
        record.coordinateSpace === "user-input-group-local" &&
        getTransformParentId(record) !== "user-input-group"
      ) {
        errors.push(
          record.id + ": user-input-group-local object requires transform parent user-input-group"
        );
      }

      if (record.enabled) enabledCount += 1;
      if (record.visible) visibleCount += 1;

      if (record.enabled && record.visible && record.rendererBinding) {
        if (!resolveRendererBinding(record.rendererBinding)) {
          errors.push(
            record.id + ": renderer binding '" + record.rendererBinding + "' not found in DOM"
          );
        }
      } else if (record.enabled && record.visible && !record.rendererBinding) {
        errors.push(record.id + ": enabled visible object requires rendererBinding");
      }

      if (record.coordinateSpace === "world" && record.coordinateOwner) {
        var ownerRecord = objectIndexById[record.coordinateOwner];
        if (ownerRecord && ownerRecord.coordinateSpace === "viewport") {
          errors.push(
            record.id + ": world-space object cannot depend on viewport-space owner '" +
              record.coordinateOwner + "'"
          );
        }
      }
    });

    records.forEach(function (record) {
      var structuralChain = getObjectChain(record.id);
      if (structuralChain === null) {
        errors.push(record.id + ": structural parent chain contains a cycle or missing parent");
      }
      var transformChain = getTransformObjectChain(record.id);
      if (transformChain === null) {
        errors.push(record.id + ": transform parent chain contains a cycle or missing parent");
      }
    });

    records.forEach(function (record) {
      var anchorStatus = resolveRegistryAnchorStatus(record);
      if (anchorStatus === "missing") {
        errors.push(
          record.id + ": anchor '" + record.anchor + "' is not defined in NANA local space"
        );
      } else if (anchorStatus === "planned") {
        warnings.push(
          record.id + ": anchor '" + record.anchor + "' is planned for future Input Local Space"
        );
      } else if (anchorStatus === "unresolved" && record.anchor) {
        warnings.push(record.id + ": anchor '" + record.anchor + "' is unresolved");
      }
    });

    var result = {
      status: errors.length === 0 ? "PASS" : "FAIL",
      errors: errors,
      warnings: warnings,
      objectCount: records.length,
      enabledCount: enabledCount,
      visibleCount: visibleCount
    };

    registryValidationResult = result;

    if (result.status === "FAIL") {
      console.error("[NamoraWorld] object registry validation failed:", errors);
    }

    return Object.assign({}, result);
  }

  function formatRegistryDebugSummary() {
    var validation = registryValidationResult || validateObjectRegistry();
    var lines = [
      "registry status: " + validation.status,
      "registry objects: " + validation.objectCount,
      "enabled objects: " + validation.enabledCount,
      "visible objects: " + validation.visibleCount
    ];

    listObjects().forEach(function (record) {
      var bindingStatus = record.rendererBinding
        ? (resolveRendererBinding(record.rendererBinding) ? "bound" : "missing")
        : "none";
      lines.push(
        record.id +
          " | type=" + record.type +
          " | space=" + record.coordinateSpace +
          " | owner=" + record.coordinateOwner +
          " | structuralParent=" + (getStructuralParentId(record) || "null") +
          " | transformParent=" + (getTransformParentId(record) || "null") +
          " | anchor=" + (record.anchor || "null") +
          " | enabled=" + record.enabled +
          " | visible=" + record.visible +
          " | binding=" + bindingStatus
      );
    });

    if (validation.errors.length > 0) {
      lines.push("registry errors: " + validation.errors.join("; "));
    }

    if (validation.warnings.length > 0) {
      lines.push("registry warnings: " + validation.warnings.join("; "));
    }

    return lines.join("\n");
  }

  function formatAnchorVisualizationSummary(layout) {
    var anchorValidation = anchorRegistryValidationResult || validateAnchorRegistry();
    var lines = [
      "anchor visualization mode: on",
      "anchor registry status: " + anchorValidation.status,
      "namora anchors: " + anchorValidation.anchorCount,
      "nana world origin: " + layout.nana.nanaWorldX.toFixed(2) + ", " +
        layout.nana.nanaWorldY.toFixed(2),
      "nana world scale: " + layout.nana.nanaWorldScale.toFixed(6),
      "rendered nana size: " + layout.nana.nanaWorldWidth.toFixed(2) + " x " +
        layout.nana.nanaWorldHeight.toFixed(2)
    ];

    listAnchors().forEach(function (anchor) {
      var worldPos = getAnchorWorldPosition(anchor.id, layout.world);
      var viewportPos = getAnchorViewportPosition(
        anchor.id,
        layout.world,
        layout.layoutViewport
      );

      lines.push(
        anchor.label +
          " (" + anchor.id + ")" +
          " | status=" + anchor.status +
          " | source=" + anchor.x + ", " + anchor.y +
          " | u/v=" + anchor.u.toFixed(6) + ", " + anchor.v.toFixed(6) +
          " | world=" + worldPos.x.toFixed(2) + ", " + worldPos.y.toFixed(2) +
          " | viewport=" + viewportPos.x.toFixed(2) + ", " + viewportPos.y.toFixed(2) +
          " | " + anchor.purpose
      );
    });

    listObjects().forEach(function (record) {
      if (!record.anchor) return;
      lines.push(
        "registry anchor " + record.id + " -> " + record.anchor + ": " +
          resolveRegistryAnchorStatus(record)
      );
    });

    if (anchorValidation.errors.length > 0) {
      lines.push("anchor registry errors: " + anchorValidation.errors.join("; "));
    }

    return lines.join("\n");
  }

  function getActiveRendererElements() {
    var background = getObject("world-background");
    var nana = getObject("nana");
    return {
      worldBackground: background ? resolveRendererBinding(background.rendererBinding) : null,
      nana: nana ? resolveRendererBinding(nana.rendererBinding) : null
    };
  }

  /* ------------------------------------------------------------------------ */
  /* World layout DOM                                                          */
  /* ------------------------------------------------------------------------ */

  var viewportEl = document.getElementById("namoraViewport");
  var worldEl = document.getElementById("namoraWorld");
  var worldBgEl = document.getElementById("namoraWorldBg");
  var nanaEl = document.getElementById("namoraNana");
  var sceneComponentsEl = document.getElementById("namoraSceneComponents");
  var debugEl = document.getElementById("namoraDebug");
  var debugStandingEl = document.getElementById("namoraDebugStanding");
  var debugFootEl = document.getElementById("namoraDebugFoot");
  var debugCenterEl = document.getElementById("namoraDebugCenter");
  var debugHeadEl = document.getElementById("namoraDebugHead");
  var debugDialogueEl = document.getElementById("namoraDebugDialogue");
  var debugInteractionEl = document.getElementById("namoraDebugInteraction");
  var debugPanelEl = document.getElementById("namoraDebugPanel");

  var lastLayout = null;

  function getRuntimeComponentAnchorWorldPosition(anchorId) {
    if (anchorId === INPUT_ROOT_ID) {
      if (!USER_INPUT_DEFAULTS) initUserInputDefaults(runtimeLayoutState);
      if (USER_INPUT_DEFAULTS && USER_INPUT_DEFAULTS.bound) {
        return {
          x:
            USER_INPUT_DEFAULTS.groupRoot.x +
            USER_INPUT_DEFAULTS.inputOffset.x,
          y:
            USER_INPUT_DEFAULTS.groupRoot.y +
            USER_INPUT_DEFAULTS.inputOffset.y
        };
      }
      return USER_INPUT_DEFAULTS
        ? {
            x: USER_INPUT_DEFAULTS.inputWorld.x,
            y: USER_INPUT_DEFAULTS.inputWorld.y
          }
        : null;
    }
    if (anchorId === PEARL_ROOT_ID) {
      if (!USER_INPUT_DEFAULTS) initUserInputDefaults(runtimeLayoutState);
      if (USER_INPUT_DEFAULTS && USER_INPUT_DEFAULTS.bound) {
        return {
          x:
            USER_INPUT_DEFAULTS.groupRoot.x +
            USER_INPUT_DEFAULTS.pearlOffset.x,
          y:
            USER_INPUT_DEFAULTS.groupRoot.y +
            USER_INPUT_DEFAULTS.pearlOffset.y
        };
      }
      return USER_INPUT_DEFAULTS
        ? {
            x: USER_INPUT_DEFAULTS.pearlWorld.x,
            y: USER_INPUT_DEFAULTS.pearlWorld.y
          }
        : null;
    }
    return getAnchorWorldPosition(anchorId, NAMORA_WORLD);
  }

  function resolveSceneComponentAnchor(anchorId) {
    if (
      layoutEditorInstance &&
      layoutEditorInstance.isEnabled() &&
      typeof layoutEditorInstance.getComponentAnchorWorldPosition === "function"
    ) {
      var editorPosition =
        layoutEditorInstance.getComponentAnchorWorldPosition(anchorId);
      if (editorPosition) return editorPosition;
    }
    return getRuntimeComponentAnchorWorldPosition(anchorId);
  }

  function refreshSceneComponents() {
    if (!sceneComponentsEl || !NAMORA_WORLD) return [];
    var editorEnabled =
      !!(layoutEditorInstance && layoutEditorInstance.isEnabled());
    var positions = [];

    Object.keys(SCENE_COMPONENTS).forEach(function (componentId) {
      var record = SCENE_COMPONENTS[componentId];
      var element = document.querySelector(record.rendererBinding);
      if (!element) return;

      var shouldShow =
        !!record.enabled &&
        !!record.visible &&
        (editorEnabled
          ? !!record.editorVisible && sceneComponentPreviewEnabled
          : !!record.runtimeVisible);
      element.hidden = !shouldShow;
      element.classList.toggle("is-editor-preview", editorEnabled && shouldShow);
      if (!shouldShow) return;

      if (componentId === "speech-bubble") {
        var bubbleGeometry = getEffectiveSpeechBubbleGeometry();
        var bubbleTransform = computeSpeechBubbleWorldTransform(
          NAMORA_WORLD,
          bubbleGeometry
        );
        if (!bubbleTransform) {
          element.hidden = true;
          return;
        }
        applySpeechBubbleDomLayout(element, bubbleGeometry, bubbleTransform);
        sceneComponentPositions[componentId] = {
          x: bubbleTransform.worldOrigin.x,
          y: bubbleTransform.worldOrigin.y,
          tailWorld: bubbleTransform.tailWorld,
          registrationErrorPx: bubbleTransform.registrationErrorPx
        };
        positions.push({
          id: componentId,
          anchorId: record.anchorId,
          x: bubbleTransform.worldOrigin.x,
          y: bubbleTransform.worldOrigin.y,
          tailWorld: bubbleTransform.tailWorld
        });
        return;
      }

      var worldPosition = resolveSceneComponentAnchor(record.anchorId);
      if (!worldPosition) {
        element.hidden = true;
        return;
      }

      element.style.left = worldPosition.x + "px";
      element.style.top = worldPosition.y + "px";
      sceneComponentPositions[componentId] = {
        x: worldPosition.x,
        y: worldPosition.y
      };
      positions.push({
        id: componentId,
        anchorId: record.anchorId,
        x: worldPosition.x,
        y: worldPosition.y
      });
    });

    document.body.classList.toggle(
      "namora-components-preview-on",
      editorEnabled && sceneComponentPreviewEnabled
    );
    document.body.classList.toggle(
      "namora-components-preview-off",
      editorEnabled && !sceneComponentPreviewEnabled
    );
    refreshUserInputRenderers();
    return positions;
  }

  function formatSceneComponentDebugSummary() {
    var components = listSceneComponents();
    var lines = [
      "Scene Components:",
      "  Component Count: " + components.length,
      "  Component Preview: " +
        (sceneComponentPreviewEnabled ? "ON" : "OFF")
    ];
    components.forEach(function (component) {
      var p = component.worldPosition;
      var pos = sceneComponentPositions[component.id];
      var line =
        "  " +
        component.id +
        " | anchor=" +
        component.anchorId +
        " | binding=" +
        component.coordinateSpace +
        " | world=" +
        (p ? p.x.toFixed(3) + ", " + p.y.toFixed(3) : "unresolved");
      if (component.id === "speech-bubble" && pos && isFiniteNumber(pos.registrationErrorPx)) {
        line += " | tailErr=" + pos.registrationErrorPx.toFixed(4);
      }
      lines.push(line);
    });
    return lines.join("\n");
  }

  /**
   * Layout viewport size for Namora scene math.
   * Uses #namoraViewport client box (editor insets included), NOT the full document.
   * Output space: scene layout CSS px (origin = scene top-left).
   */
  function getLayoutViewportSize() {
    if (viewportEl && viewportEl.clientWidth && viewportEl.clientHeight) {
      return {
        width: viewportEl.clientWidth,
        height: viewportEl.clientHeight
      };
    }
    var docEl = document.documentElement;
    return {
      width: docEl.clientWidth,
      height: docEl.clientHeight
    };
  }

  /**
   * Browser client coordinates → Namora Scene layout coordinates.
   * Input:  event.clientX / event.clientY (browser viewport CSS px)
   * Output: x/y relative to #namoraViewport top-left, scaled into clientWidth/Height space
   *         (matches getLayoutViewportSize / fixed-world offset math; handles browser zoom)
   */
  function clientToScenePoint(clientX, clientY) {
    if (typeof clientX !== "number" || typeof clientY !== "number" ||
        !isFinite(clientX) || !isFinite(clientY)) {
      throw new Error("[NamoraWorld] clientToScenePoint: invalid client coordinates");
    }
    if (!viewportEl) {
      throw new Error("[NamoraWorld] clientToScenePoint: viewport element missing");
    }

    var rect = viewportEl.getBoundingClientRect();
    var layoutW = viewportEl.clientWidth || rect.width || 0;
    var layoutH = viewportEl.clientHeight || rect.height || 0;
    var scaleX = rect.width ? layoutW / rect.width : 1;
    var scaleY = rect.height ? layoutH / rect.height : 1;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      sceneWidth: layoutW,
      sceneHeight: layoutH
    };
  }

  function getVisualViewportScale() {
    if (window.visualViewport && window.visualViewport.scale) {
      return window.visualViewport.scale;
    }
    return 1;
  }

  function computeWorldScale(world) {
    var scaleX = world.designWorldWidth / world.sourceWidth;
    var scaleY = world.designWorldHeight / world.sourceHeight;
    var scaleMismatch = Math.abs(scaleX - scaleY) > 1e-9;

    if (scaleMismatch) {
      console.warn(
        "[NamoraWorld] scaleX (" + scaleX + ") != scaleY (" + scaleY + "); using scaleX."
      );
    }

    return {
      scaleX: scaleX,
      scaleY: scaleY,
      scale: scaleX,
      scaleMismatch: scaleMismatch
    };
  }

  function computeNanaWorldPosition(world) {
    var transform = getNanaWorldTransform(world);
    var footWorld = getAnchorWorldPosition("foot", world);

    return {
      nanaWorldScale: transform.nanaWorldScale,
      nanaWorldWidth: transform.nanaWorldWidth,
      nanaWorldHeight: transform.nanaWorldHeight,
      nanaWorldX: transform.nanaWorldX,
      nanaWorldY: transform.nanaWorldY,
      footWorldX: footWorld.x,
      footWorldY: footWorld.y
    };
  }

  /**
   * Fixed World Scale Policy (Task 017)
   * scale = designWorldWidth / sourceWidth  (== designWorldHeight / sourceHeight)
   * renderedWidth  = sourceWidth  × scale  (= designWorldWidth)
   * renderedHeight = sourceHeight × scale  (= designWorldHeight)
   * worldOffsetX = viewportWidth  - renderedWidth
   * worldOffsetY = viewportHeight - renderedHeight
   */
  function updateNamoraWorldLayout() {
    if (!viewportEl || !worldEl || !worldBgEl || !nanaEl) return;

    var world = NAMORA_WORLD;
    var layoutVp = getLayoutViewportSize();
    var visualViewportScale = getVisualViewportScale();
    var worldScale = computeWorldScale(world);
    var s = worldScale.scale;
    var renderedWidth = world.designWorldWidth;
    var renderedHeight = world.designWorldHeight;
    var worldOffsetX = layoutVp.width - renderedWidth;
    var worldOffsetY = layoutVp.height - renderedHeight;
    var nana = computeNanaWorldPosition(world);
    var standing = getEffectiveStandingPoint(world);

    worldEl.style.width = world.sourceWidth + "px";
    worldEl.style.height = world.sourceHeight + "px";
    worldEl.style.transform = "scale(" + s + ")";

    nanaEl.style.width = nana.nanaWorldWidth + "px";
    nanaEl.style.height = nana.nanaWorldHeight + "px";
    nanaEl.style.left = nana.nanaWorldX + "px";
    nanaEl.style.top = nana.nanaWorldY + "px";

    var registrationErrorPx = Math.hypot(
      nana.footWorldX - standing.x,
      nana.footWorldY - standing.y
    );

    lastLayout = {
      world: world,
      layoutViewport: layoutVp,
      visualViewportScale: visualViewportScale,
      worldScale: worldScale,
      scale: s,
      scalePolicy: world.scalePolicy || "fixed-design-world",
      profileSwitching: "DISABLED",
      renderedWidth: renderedWidth,
      renderedHeight: renderedHeight,
      worldOffsetX: worldOffsetX,
      worldOffsetY: worldOffsetY,
      nana: nana,
      standingPoint: {
        x: standing.x,
        y: standing.y,
        isTemporary: !!standing.isTemporary,
        status: standing.status,
        canonicalX: world.standingPoint.x,
        canonicalY: world.standingPoint.y
      },
      registrationErrorPx: registrationErrorPx
    };

    refreshSceneComponents();

    if (isAnchorVisualizationEnabled()) {
      renderAnchorVisualization(lastLayout);
    }

    if (layoutEditorInstance && layoutEditorInstance.isEnabled()) {
      layoutEditorInstance.refreshSelectionOverlay(lastLayout);
    }
  }

  function renderAnchorVisualization(layout) {
    if (!debugEl || !debugStandingEl || !debugFootEl || !debugPanelEl) return;

    document.body.classList.add("namora-debug-on");
    debugEl.hidden = false;

    var standing = layout.standingPoint || getEffectiveStandingPoint(layout.world);
    debugStandingEl.style.left = standing.x + "px";
    debugStandingEl.style.top = standing.y + "px";

    var anchorMarkers = [
      { id: "foot", el: debugFootEl },
      { id: "expression-center", el: debugCenterEl },
      { id: "head-center", el: debugHeadEl },
      { id: "dialogue-tail", el: debugDialogueEl },
      { id: "pearl", el: debugInteractionEl }
    ];

    anchorMarkers.forEach(function (marker) {
      if (!marker.el) return;
      var worldPos = getAnchorWorldPosition(marker.id, layout.world);
      marker.el.style.left = worldPos.x + "px";
      marker.el.style.top = worldPos.y + "px";
      marker.el.hidden = false;
    });

    var footAnchor = getAnchor("foot");

    debugPanelEl.textContent =
      "anchor visualization mode\n" +
      "asset: " + layout.world.asset + "\n" +
      "profile: " + layout.world.id + "\n" +
      "profile switching: " + layout.profileSwitching + "\n" +
      "scale policy: " + layout.scalePolicy + "\n" +
      "source size: " + layout.world.sourceWidth + " x " + layout.world.sourceHeight + "\n" +
      "world size: " + layout.renderedWidth.toFixed(2) + " x " + layout.renderedHeight.toFixed(2) + "\n" +
      "fixed world scale: " + layout.scale.toFixed(6) + "\n" +
      "scaleX: " + layout.worldScale.scaleX.toFixed(6) + "\n" +
      "scaleY: " + layout.worldScale.scaleY.toFixed(6) + "\n" +
      "standing point (" + (standing.isTemporary ? "temporary" : "canonical") + "): " +
        standing.x.toFixed(2) + ", " + standing.y.toFixed(2) + "\n" +
      "standing status: " + (standing.status || "n/a") + "\n" +
      "canonical standing: " + layout.world.standingPoint.x.toFixed(2) + ", " +
        layout.world.standingPoint.y.toFixed(2) + "\n" +
      "Foot Anchor (world px): " + layout.nana.footWorldX.toFixed(2) + ", " +
        layout.nana.footWorldY.toFixed(2) + "\n" +
      "Foot Anchor (sprite px): " + footAnchor.x + ", " + footAnchor.y + "\n" +
      "registration error: " + layout.registrationErrorPx.toFixed(4) + " css px (world space)\n" +
      "layout viewport: " + Math.round(layout.layoutViewport.width) + " x " +
        Math.round(layout.layoutViewport.height) + "\n" +
      "worldOffsetX: " + layout.worldOffsetX.toFixed(2) + "\n" +
      "worldOffsetY: " + layout.worldOffsetY.toFixed(2) + "\n" +
      "visualViewport.scale (info only): " + layout.visualViewportScale + "\n" +
      "\n" + formatAnchorVisualizationSummary(layout) + "\n\n" + formatRegistryDebugSummary() +
      "\n\n" + formatSceneRuntimeDebugSummary() +
      "\n\n" + formatSceneComponentDebugSummary();
  }

  function formatSceneRuntimeDebugSummary() {
    if (!sceneRuntimeInstance) {
      return [
        "Scene Runtime:",
        "  SceneRuntime: not initialized"
      ].join("\n");
    }
    var scene = sceneRuntimeInstance.getScene();
    var state = sceneRuntimeInstance.getSceneState();
    var layoutSourceLabel =
      layoutLoadInfo.source === "project-json"
        ? LAYOUT_EDITOR_UI.layoutSourceProjectJson
        : layoutLoadInfo.source === "builtin-fallback"
          ? LAYOUT_EDITOR_UI.layoutSourceFallback
          : layoutLoadInfo.source === "editor-import"
            ? LAYOUT_EDITOR_UI.layoutSourceEditorImport
            : "—";
    var loadStatusLabel = layoutLoadInfo.loadSuccess
      ? LAYOUT_EDITOR_UI.layoutLoadSuccess
      : layoutLoadInfo.loadSuccess === false && layoutLoadInfo.source !== "pending"
        ? LAYOUT_EDITOR_UI.layoutLoadFail
        : "—";

    var lines = [
      "Scene Runtime:",
      "  Boot Mode: debug=" +
        (NAMORA_BOOT_MODE.debug ? "true" : "false") +
        " layoutEdit=" +
        (NAMORA_BOOT_MODE.layoutEdit ? "true" : "false"),
      "  " + LAYOUT_EDITOR_UI.sceneConfig + ": " + (scene ? scene.id : "—"),
      "  " + LAYOUT_EDITOR_UI.layoutConfig + ": " + EXPECTED_LAYOUT_PROFILE_ID,
      "  " + LAYOUT_EDITOR_UI.layoutSchema + ": 1.1.0",
      "  " + LAYOUT_EDITOR_UI.layoutSource + ": " + layoutSourceLabel,
      "  " + LAYOUT_EDITOR_UI.layoutFile + ": " + layoutLoadInfo.filePath,
      "  " + LAYOUT_EDITOR_UI.layoutLoadStatus + ": " + loadStatusLabel,
      "  校验状态: " +
        (layoutLoadInfo.validationStatus === "PASS"
          ? LAYOUT_EDITOR_UI.validationPass
          : layoutLoadInfo.validationStatus === "FAIL"
            ? LAYOUT_EDITOR_UI.validationFail
            : "—"),
      "  " + LAYOUT_EDITOR_UI.reconstructionTest + ": " +
        (layoutLoadInfo.reconstructionStatus === "PASS"
          ? LAYOUT_EDITOR_UI.validationPass
          : layoutLoadInfo.reconstructionStatus === "FAIL"
            ? LAYOUT_EDITOR_UI.validationFail
            : "—"),
      "  " + LAYOUT_EDITOR_UI.reconstructionTolerance + ": " +
        LAYOUT_SERIALIZATION_TOLERANCE,
      "  " + LAYOUT_EDITOR_UI.boundCoordinateAuthority + ": " +
        LAYOUT_EDITOR_UI.boundAuthorityValue,
      "  " + LAYOUT_EDITOR_UI.serializedWorldRole + ": " +
        LAYOUT_EDITOR_UI.serializedWorldDiagnostic,
      "  " + LAYOUT_EDITOR_UI.maxReconstructionDelta + ": " +
        (layoutLoadInfo.maxReconstructionDelta
          ? "X " +
            Number(layoutLoadInfo.maxReconstructionDelta.x).toFixed(6) +
            " / Y " +
            Number(layoutLoadInfo.maxReconstructionDelta.y).toFixed(6)
          : "—"),
      "  回退: " +
        (layoutLoadInfo.source === "builtin-fallback"
          ? LAYOUT_EDITOR_UI.fallbackUsed
          : layoutLoadInfo.source === "project-json"
            ? LAYOUT_EDITOR_UI.fallbackUnused
            : "—"),
      "  Scene: " + ((scene && scene.name) || (state && state.sceneId) || "—"),
      "  Runtime: " + (state && state.sceneReady ? "Ready" : "Loading"),
      "  World: " + (state && state.worldLoaded ? "Loaded" : "Pending"),
      "  Layout: " + (state && state.layoutLoaded ? "Loaded" : "Pending"),
      "  Objects: " + (state && state.objectsBuilt ? "Built" : "Pending"),
      "  Relationships: " + (state && state.relationshipsBuilt ? "Built" : "Pending"),
      "  Renderer: " + (state && state.rendererPrepared ? "Prepared" : "Pending")
    ];

    if (layoutLoadInfo.fallbackReason) {
      lines.push(
        "  " + LAYOUT_EDITOR_UI.fallbackReason + ": " + layoutLoadInfo.fallbackReason
      );
    }

    if (
      layoutEditorInstance &&
      typeof layoutEditorInstance.isEnabled === "function" &&
      layoutEditorInstance.isEnabled()
    ) {
      var baseline = layoutEditorInstance.getActiveLayoutBaseline();
      lines.push(
        "  " + LAYOUT_EDITOR_UI.currentBaseline + ": " +
          (baseline && baseline.kind === "imported"
            ? LAYOUT_EDITOR_UI.baselineImported
            : LAYOUT_EDITOR_UI.baselineProject),
        "  " + LAYOUT_EDITOR_UI.unsavedChanges + ": " +
          (layoutEditorInstance.hasUnsavedChanges()
            ? LAYOUT_EDITOR_UI.yes
            : LAYOUT_EDITOR_UI.no)
      );
    }

    return lines.join("\n");
  }

  var worldLayoutListenersBound = false;

  function bindWorldLayout() {
    if (!worldEl) return;

    if (worldLayoutListenersBound) {
      updateNamoraWorldLayout();
      return;
    }
    worldLayoutListenersBound = true;

    var scheduled = false;
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        updateNamoraWorldLayout();
      });
    }

    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", schedule);
      window.visualViewport.addEventListener("scroll", schedule);
    }

    if (worldBgEl) {
      worldBgEl.addEventListener("load", function () {
        verifyBackgroundAssetGeometry(worldBgEl);
        schedule();
      });
      if (worldBgEl.complete && worldBgEl.naturalWidth) {
        verifyBackgroundAssetGeometry(worldBgEl);
      }
    }

    schedule();
  }

  function verifyBackgroundAssetGeometry(imgEl) {
    if (!imgEl) return;
    var naturalWidth = imgEl.naturalWidth;
    var naturalHeight = imgEl.naturalHeight;
    console.info(
      "[NamoraWorld] active background src:",
      imgEl.currentSrc || imgEl.src,
      "| naturalWidth × naturalHeight:",
      naturalWidth + " × " + naturalHeight,
      "| configured:",
      NAMORA_WORLD.sourceWidth + " × " + NAMORA_WORLD.sourceHeight,
      "| filename extension .webp / detected content may be PNG"
    );

    if (
      naturalWidth &&
      naturalHeight &&
      (naturalWidth !== NAMORA_WORLD.sourceWidth ||
        naturalHeight !== NAMORA_WORLD.sourceHeight)
    ) {
      console.warn(
        "[NamoraWorld] background natural dimensions do not match NAMORA_WORLD source geometry"
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Legacy chat logic — preserved, inactive while Stage 1 UI is hidden        */
  /* ------------------------------------------------------------------------ */

  var MOCK_REPLY =
    "我听见了。\n\n让我为这个想法寻找一个有意义的名字。";

  function initLegacyChat() {
    var messagesEl = document.getElementById("namoraMessages");
    var inputEl = document.getElementById("namoraInput");
    var sendBtn = document.getElementById("namoraSend");

    if (!messagesEl || !inputEl || !sendBtn) return;

    function appendMessage(text, role) {
      var div = document.createElement("div");
      div.className = "namora-msg namora-msg--" + role;

      if (text.indexOf("\n") !== -1) {
        text.split(/\n+/).filter(Boolean).forEach(function (part) {
          var p = document.createElement("p");
          p.textContent = part;
          div.appendChild(p);
        });
      } else {
        div.textContent = text;
      }

      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function handleSend() {
      var text = inputEl.value.trim();
      if (!text) return;

      sendBtn.disabled = true;
      appendMessage(text, "user");
      inputEl.value = "";

      window.setTimeout(function () {
        appendMessage(MOCK_REPLY, "nana");
        sendBtn.disabled = false;
        inputEl.focus();
      }, 480);
    }

    sendBtn.addEventListener("click", handleSend);

    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  /* ------------------------------------------------------------------------ */
  /* User Input Group — Input Runtime + Pearl Runtime (Task 038)               */
  /* Spatially unified via SceneRuntime; behaviourally independent.            */
  /* ------------------------------------------------------------------------ */

  var USER_INPUT_RENDER = Object.freeze({
    placeholder: "和 NANA 说说你的想法……",
    inputWidth: 280,
    inputHeight: 38,
    pearlSize: 58
  });

  var inputRuntimeInstance = null;
  var pearlRuntimeInstance = null;
  var userInputGroupRuntimeInstance = null;
  var userInputRendererBound = false;

  function createInputRuntime(config) {
    config = config || {};
    var state = {
      text: typeof config.text === "string" ? config.text : "",
      placeholder:
        typeof config.placeholder === "string"
          ? config.placeholder
          : USER_INPUT_RENDER.placeholder,
      focused: false,
      disabled: !!config.disabled,
      readonly: !!config.readonly
    };
    var fieldEl = null;
    var syncingDom = false;
    var listeners = {
      change: [],
      submit: [],
      focus: [],
      blur: []
    };

    function notify(eventName, payload) {
      var list = listeners[eventName] || [];
      for (var i = 0; i < list.length; i++) {
        try {
          list[i](payload);
        } catch (err) {
          console.error("[InputRuntime]", err);
        }
      }
    }

    function renderField() {
      if (!fieldEl) return;
      syncingDom = true;
      fieldEl.value = state.text;
      fieldEl.placeholder = state.placeholder;
      fieldEl.disabled = state.disabled;
      fieldEl.readOnly = state.readonly;
      syncingDom = false;
    }

    function bindField(element) {
      if (!element || fieldEl === element) return;
      fieldEl = element;
      fieldEl.addEventListener("input", function () {
        if (syncingDom) return;
        state.text = fieldEl.value;
        notify("change", { text: state.text });
      });
      fieldEl.addEventListener("focus", function () {
        state.focused = true;
        notify("focus", null);
      });
      fieldEl.addEventListener("blur", function () {
        state.focused = false;
        notify("blur", null);
      });
      fieldEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          /* IME composition: Enter confirms candidate, not submit (Task 039). */
          if (e.isComposing || e.keyCode === 229) return;
          e.preventDefault();
          if (userInputGroupRuntimeInstance) {
            userInputGroupRuntimeInstance.submit();
          }
        }
      });
      renderField();
    }

    return Object.freeze({
      id: "input-runtime",
      getText: function () {
        return state.text;
      },
      setText: function (text) {
        state.text = typeof text === "string" ? text : "";
        renderField();
        notify("change", { text: state.text });
        return state.text;
      },
      clear: function () {
        return this.setText("");
      },
      focus: function () {
        if (fieldEl && !state.disabled) {
          fieldEl.focus();
        }
        return state.focused;
      },
      blur: function () {
        if (fieldEl) {
          fieldEl.blur();
        }
        return state.focused;
      },
      isFocused: function () {
        return state.focused;
      },
      isDisabled: function () {
        return state.disabled;
      },
      setDisabled: function (disabled) {
        state.disabled = !!disabled;
        renderField();
      },
      isReadonly: function () {
        return state.readonly;
      },
      setReadonly: function (readonly) {
        state.readonly = !!readonly;
        renderField();
      },
      getPlaceholder: function () {
        return state.placeholder;
      },
      setPlaceholder: function (placeholder) {
        state.placeholder =
          typeof placeholder === "string"
            ? placeholder
            : USER_INPUT_RENDER.placeholder;
        renderField();
      },
      submit: function () {
        if (userInputGroupRuntimeInstance) {
          return userInputGroupRuntimeInstance.submit();
        }
        return false;
      },
      onChange: function (handler) {
        if (typeof handler === "function") listeners.change.push(handler);
      },
      onSubmit: function (handler) {
        if (typeof handler === "function") listeners.submit.push(handler);
      },
      onFocus: function (handler) {
        if (typeof handler === "function") listeners.focus.push(handler);
      },
      onBlur: function (handler) {
        if (typeof handler === "function") listeners.blur.push(handler);
      },
      bindRenderer: bindField,
      refreshRenderer: renderField
    });
  }

  function createPearlRuntime(config) {
    config = config || {};
    var state = {
      visualState: "idle",
      disabled: !!config.disabled,
      loading: false
    };
    var buttonEl = null;
    var containerEl = null;
    var listeners = {
      activate: []
    };

    function notifyActivate(payload) {
      for (var i = 0; i < listeners.activate.length; i++) {
        try {
          listeners.activate[i](payload);
        } catch (err) {
          console.error("[PearlRuntime]", err);
        }
      }
    }

    function applyVisualState() {
      if (!containerEl) return;
      containerEl.classList.remove(
        "is-pearl-idle",
        "is-pearl-hover",
        "is-pearl-pressed",
        "is-pearl-disabled",
        "is-pearl-loading"
      );
      containerEl.classList.add("is-pearl-" + state.visualState);
      if (buttonEl) {
        buttonEl.disabled = state.disabled || state.loading;
      }
    }

    function setVisualState(next) {
      if (
        next !== "idle" &&
        next !== "hover" &&
        next !== "pressed" &&
        next !== "disabled" &&
        next !== "loading"
      ) {
        return false;
      }
      state.visualState = next;
      applyVisualState();
      return true;
    }

    function bindButton(container, button) {
      if (!container || !button || buttonEl === button) return;
      containerEl = container;
      buttonEl = button;

      buttonEl.addEventListener("mouseenter", function () {
        if (state.disabled || state.loading) return;
        setVisualState("hover");
      });
      buttonEl.addEventListener("mouseleave", function () {
        if (state.disabled || state.loading) return;
        setVisualState("idle");
      });
      buttonEl.addEventListener("mousedown", function () {
        if (state.disabled || state.loading) return;
        setVisualState("pressed");
      });
      buttonEl.addEventListener("mouseup", function () {
        if (state.disabled || state.loading) return;
        setVisualState(buttonEl.matches(":hover") ? "hover" : "idle");
      });
      buttonEl.addEventListener("click", function () {
        if (state.disabled || state.loading) return;
        if (userInputGroupRuntimeInstance) {
          userInputGroupRuntimeInstance.submit();
        }
        notifyActivate(null);
      });
      applyVisualState();
    }

    return Object.freeze({
      id: "pearl-runtime",
      getState: function () {
        return state.visualState;
      },
      setState: setVisualState,
      isDisabled: function () {
        return state.disabled;
      },
      setDisabled: function (disabled) {
        state.disabled = !!disabled;
        if (state.disabled) {
          setVisualState("disabled");
        } else if (state.loading) {
          setVisualState("loading");
        } else {
          setVisualState("idle");
        }
      },
      isLoading: function () {
        return state.loading;
      },
      setLoading: function (loading) {
        state.loading = !!loading;
        if (state.loading) {
          setVisualState("loading");
        } else if (state.disabled) {
          setVisualState("disabled");
        } else {
          setVisualState("idle");
        }
      },
      activate: function () {
        if (state.disabled || state.loading) return false;
        if (userInputGroupRuntimeInstance) {
          return userInputGroupRuntimeInstance.submit();
        }
        return false;
      },
      onActivate: function (handler) {
        if (typeof handler === "function") listeners.activate.push(handler);
      },
      bindRenderer: bindButton,
      refreshRenderer: applyVisualState
    });
  }

  function createUserInputGroupRuntime(inputRuntime, pearlRuntime) {
    return Object.freeze({
      id: "user-input-group-runtime",
      getInputRuntime: function () {
        return inputRuntime;
      },
      getPearlRuntime: function () {
        return pearlRuntime;
      },
      submit: function () {
        if (!inputRuntime) return false;
        if (!this.isInteractive()) return false;
        if (conversationRuntimeInstance) {
          return conversationRuntimeInstance.submitUserText(
            inputRuntime.getText()
          );
        }
        return false;
      },
      isInteractive: function () {
        return !(
          layoutEditorInstance && layoutEditorInstance.isEnabled()
        );
      }
    });
  }

  function initUserInputRuntime() {
    if (userInputRendererBound) return;

    inputRuntimeInstance = createInputRuntime({
      placeholder: USER_INPUT_RENDER.placeholder
    });
    pearlRuntimeInstance = createPearlRuntime();
    userInputGroupRuntimeInstance = createUserInputGroupRuntime(
      inputRuntimeInstance,
      pearlRuntimeInstance
    );

    var fieldEl = document.getElementById("sceneInputField");
    var pearlEl = document.getElementById("scenePearl");
    var pearlBtn = document.getElementById("scenePearlButton");

    if (fieldEl) {
      inputRuntimeInstance.bindRenderer(fieldEl);
    }
    if (pearlEl && pearlBtn) {
      pearlRuntimeInstance.bindRenderer(pearlEl, pearlBtn);
    }

    userInputRendererBound = true;
  }

  function refreshUserInputRenderers() {
    if (!userInputRendererBound) return;
    if (inputRuntimeInstance) {
      inputRuntimeInstance.refreshRenderer();
    }
    if (pearlRuntimeInstance) {
      pearlRuntimeInstance.refreshRenderer();
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Speech Bubble Runtime — presentation state (Task 039)                     */
  /* ------------------------------------------------------------------------ */

  var speechBubbleRuntimeInstance = null;

  function createSpeechBubbleRuntime(initialDialogue) {
    var state = {
      dialogue:
        typeof initialDialogue === "string"
          ? initialDialogue
          : SPEECH_BUBBLE_DEMO_TEXT
    };

    function renderDialogue() {
      var element = document.getElementById("sceneSpeechBubble");
      if (!element) return;
      var textEl = element.querySelector(".scene-speech-bubble__text");
      if (textEl) {
        textEl.textContent = state.dialogue;
      }
      try {
        refreshSceneComponents();
      } catch (e) {
        /* non-fatal during partial boot */
      }
    }

    return Object.freeze({
      id: "speech-bubble-runtime",
      getDialogue: function () {
        return state.dialogue;
      },
      setDialogue: function (content) {
        state.dialogue = typeof content === "string" ? content : "";
        renderDialogue();
        return state.dialogue;
      },
      refreshRenderer: renderDialogue
    });
  }

  function initSpeechBubbleRuntime() {
    if (speechBubbleRuntimeInstance) return speechBubbleRuntimeInstance;
    speechBubbleRuntimeInstance = createSpeechBubbleRuntime(SPEECH_BUBBLE_DEMO_TEXT);
    return speechBubbleRuntimeInstance;
  }

  /* ------------------------------------------------------------------------ */
  /* Conversation Runtime — message lifecycle (Task 039)                       */
  /* ------------------------------------------------------------------------ */

  var LOCAL_RESPONSE_PROVIDER_CONFIG = Object.freeze({
    responseText: "收到你的想法了。我们可以继续从这里开始。",
    failureResponseText: "刚才没有回应成功，我们可以再试一次。",
    delayMinMs: 300,
    delayMaxMs: 700
  });

  var DEEPSEEK_RESPONSE_PROVIDER_CONFIG = Object.freeze({
    endpoint: "/api/nana",
    timeoutMs: 15000,
    language: "zh"
  });

  var PROVIDER_ERROR_CATEGORIES = Object.freeze({
    TIMEOUT: "timeout",
    NETWORK: "network",
    UNAUTHORIZED: "unauthorized",
    RATE_LIMITED: "rate-limited",
    BACKEND_ERROR: "backend-error",
    INVALID_RESPONSE: "invalid-response",
    PROVIDER_ERROR: "provider-error"
  });

  var conversationRuntimeInstance = null;
  var localResponseProviderInstance = null;
  var deepSeekResponseProviderInstance = null;
  var responseProviderRegistryInstance = null;
  var conversationRuntimeBootstrapped = false;

  function createProviderError(category, message) {
    var err = new Error(message || category);
    err.name = "ProviderError";
    err.category = category;
    return err;
  }

  function mapConversationMessagesForDeepSeek(messages, failureText) {
    failureText =
      typeof failureText === "string"
        ? failureText
        : LOCAL_RESPONSE_PROVIDER_CONFIG.failureResponseText;

    return (messages || [])
      .filter(function (m) {
        if (!m || (m.role !== "user" && m.role !== "assistant")) return false;
        if (m.role === "user" && m.status !== "submitted") return false;
        if (m.role === "assistant" && m.status !== "complete") return false;
        if (m.role === "assistant" && m.content === failureText) return false;
        return true;
      })
      .map(function (m) {
        return {
          role: m.role,
          content: String(m.content || "").trim()
        };
      })
      .filter(function (m) {
        return m.content;
      });
  }

  function parseProviderJsonText(rawText) {
    if (typeof rawText !== "string") return null;
    var trimmed = rawText.trim();
    if (!trimmed || trimmed.charAt(0) === "<") return null;
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      return null;
    }
  }

  function fetchWithProviderTimeout(url, options, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var controller =
        typeof AbortController !== "undefined" ? new AbortController() : null;
      var timeoutId = window.setTimeout(function () {
        if (controller) controller.abort();
        reject(
          createProviderError(
            PROVIDER_ERROR_CATEGORIES.TIMEOUT,
            "Request timed out"
          )
        );
      }, timeoutMs);

      var fetchOptions = options || {};
      if (controller) {
        fetchOptions = Object.assign({}, fetchOptions, { signal: controller.signal });
      }

      fetch(url, fetchOptions)
        .then(function (response) {
          window.clearTimeout(timeoutId);
          resolve(response);
        })
        .catch(function (err) {
          window.clearTimeout(timeoutId);
          if (err && err.category) {
            reject(err);
            return;
          }
          if (err && err.name === "AbortError") {
            reject(
              createProviderError(
                PROVIDER_ERROR_CATEGORIES.TIMEOUT,
                "Request timed out"
              )
            );
            return;
          }
          reject(
            createProviderError(
              PROVIDER_ERROR_CATEGORIES.NETWORK,
              "Network request failed"
            )
          );
        });
    });
  }

  function validateDeepSeekBackendResponse(response, data) {
    if (response && (response.status === 401 || response.status === 403)) {
      throw createProviderError(
        PROVIDER_ERROR_CATEGORIES.UNAUTHORIZED,
        "Unauthorized"
      );
    }
    if (response && response.status === 429) {
      throw createProviderError(
        PROVIDER_ERROR_CATEGORIES.RATE_LIMITED,
        "Rate limited"
      );
    }
    if (response && response.status >= 500) {
      throw createProviderError(
        PROVIDER_ERROR_CATEGORIES.BACKEND_ERROR,
        "Backend server error"
      );
    }
    if (!data || typeof data !== "object") {
      throw createProviderError(
        PROVIDER_ERROR_CATEGORIES.INVALID_RESPONSE,
        "Invalid response payload"
      );
    }
    if (data.success === false) {
      throw createProviderError(
        PROVIDER_ERROR_CATEGORIES.BACKEND_ERROR,
        data.message || "Backend rejected request"
      );
    }
    if (typeof data.reply !== "string") {
      throw createProviderError(
        PROVIDER_ERROR_CATEGORIES.INVALID_RESPONSE,
        "Missing reply content"
      );
    }
    var reply = data.reply.trim();
    if (!reply) {
      throw createProviderError(
        PROVIDER_ERROR_CATEGORIES.INVALID_RESPONSE,
        "Empty reply content"
      );
    }
    return reply;
  }

  function cloneConversationMessage(message) {
    if (!message) return null;
    return Object.freeze({
      id: message.id,
      role: message.role,
      content: message.content,
      status: message.status,
      createdAt: message.createdAt
    });
  }

  function createLocalResponseProvider(config) {
    config = config || LOCAL_RESPONSE_PROVIDER_CONFIG;
    var simulateFailureOnce = false;

    function randomDelayMs() {
      var min = config.delayMinMs;
      var max = config.delayMaxMs;
      return min + Math.floor(Math.random() * (max - min + 1));
    }

    return Object.freeze({
      id: "local-response-provider",
      respond: function (request) {
        return new Promise(function (resolve, reject) {
          var delay = randomDelayMs();
          window.setTimeout(function () {
            if (simulateFailureOnce) {
              simulateFailureOnce = false;
              reject(new Error("LocalResponseProvider simulated failure"));
              return;
            }
            resolve(
              Object.freeze({
                content: config.responseText,
                role: "assistant",
                provider: "local"
              })
            );
          }, delay);
        });
      },
      simulateFailureOnce: function () {
        simulateFailureOnce = true;
      },
      getConfig: function () {
        return config;
      }
    });
  }

  function createDeepSeekResponseProvider(config) {
    config = config || DEEPSEEK_RESPONSE_PROVIDER_CONFIG;
    var simulateFailureOnce = false;
    var simulateInvalidResponseOnce = false;
    var simulateTimeoutOnce = false;

    function respond(request) {
      request = request || {};

      if (simulateFailureOnce) {
        simulateFailureOnce = false;
        return Promise.reject(
          createProviderError(
            PROVIDER_ERROR_CATEGORIES.PROVIDER_ERROR,
            "Simulated provider failure"
          )
        );
      }

      if (simulateTimeoutOnce) {
        simulateTimeoutOnce = false;
        return new Promise(function (_resolve, reject) {
          window.setTimeout(function () {
            reject(
              createProviderError(
                PROVIDER_ERROR_CATEGORIES.TIMEOUT,
                "Simulated request timeout"
              )
            );
          }, config.timeoutMs + 500);
        });
      }

      if (simulateInvalidResponseOnce) {
        simulateInvalidResponseOnce = false;
        return Promise.reject(
          createProviderError(
            PROVIDER_ERROR_CATEGORIES.INVALID_RESPONSE,
            "Simulated invalid response"
          )
        );
      }

      var apiMessages = mapConversationMessagesForDeepSeek(request.messages);
      if (!apiMessages.some(function (m) { return m.role === "user"; })) {
        return Promise.reject(
          createProviderError(
            PROVIDER_ERROR_CATEGORIES.INVALID_RESPONSE,
            "No user messages in provider request"
          )
        );
      }

      var metadata = request.metadata && typeof request.metadata === "object"
        ? request.metadata
        : {};
      var language =
        typeof metadata.language === "string" && metadata.language
          ? metadata.language
          : config.language;

      var payload = {
        messages: apiMessages,
        language: language
      };
      if (
        metadata.focusState &&
        typeof metadata.focusState === "object"
      ) {
        payload.focusState = metadata.focusState;
      }

      var startedAt = Date.now();
      if (isDebugEnabled()) {
        console.info("[DeepSeekResponseProvider] request start", {
          messageCount: apiMessages.length
        });
      }

      return fetchWithProviderTimeout(
        config.endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        },
        config.timeoutMs
      )
        .then(function (response) {
          return response.text().then(function (rawText) {
            var data = parseProviderJsonText(rawText);
            var reply = validateDeepSeekBackendResponse(response, data);
            if (isDebugEnabled()) {
              console.info("[DeepSeekResponseProvider] request complete", {
                durationMs: Date.now() - startedAt,
                fallback: !!(data && data.fallback)
              });
            }
            return Object.freeze({
              role: "assistant",
              content: reply,
              provider: "deepseek"
            });
          });
        })
        .catch(function (err) {
          if (isDebugEnabled()) {
            console.info("[DeepSeekResponseProvider] request failed", {
              durationMs: Date.now() - startedAt,
              category:
                err && err.category
                  ? err.category
                  : PROVIDER_ERROR_CATEGORIES.PROVIDER_ERROR
            });
          }
          if (err && err.category) {
            throw err;
          }
          throw createProviderError(
            PROVIDER_ERROR_CATEGORIES.PROVIDER_ERROR,
            err && err.message ? err.message : "Provider request failed"
          );
        });
    }

    return Object.freeze({
      id: "deepseek-response-provider",
      respond: respond,
      simulateFailureOnce: function () {
        simulateFailureOnce = true;
      },
      simulateInvalidResponseOnce: function () {
        simulateInvalidResponseOnce = true;
      },
      simulateTimeoutOnce: function () {
        simulateTimeoutOnce = true;
      },
      getConfig: function () {
        return config;
      }
    });
  }

  function createResponseProviderRegistry(options) {
    options = options || {};
    var providers = Object.create(null);
    var activeName =
      options.defaultProvider === "deepseek" ||
      options.defaultProvider === "local"
        ? options.defaultProvider
        : "local";

    function register(name, provider) {
      if (!name || !provider) return false;
      providers[name] = provider;
      return true;
    }

    function getProvider(name) {
      var key = typeof name === "string" && name ? name : activeName;
      var provider = providers[key];
      if (!provider) {
        throw new Error("Unknown response provider: " + key);
      }
      return provider;
    }

    function setActiveProvider(name) {
      if (!providers[name]) return false;
      activeName = name;
      if (isDebugEnabled()) {
        console.info("[ResponseProviderRegistry] active provider:", activeName);
      }
      return true;
    }

    function getActiveProviderName() {
      return activeName;
    }

    function listProviders() {
      return Object.keys(providers);
    }

    return Object.freeze({
      register: register,
      getProvider: getProvider,
      setActiveProvider: setActiveProvider,
      getActiveProviderName: getActiveProviderName,
      listProviders: listProviders
    });
  }

  function createConversationRuntime(deps) {
    deps = deps || {};
    var inputRuntime = deps.inputRuntime || null;
    var pearlRuntime = deps.pearlRuntime || null;
    var speechBubbleRuntime = deps.speechBubbleRuntime || null;
    var getResponseProvider = deps.getResponseProvider;
    if (typeof getResponseProvider !== "function") {
      var fixedResponseProvider =
        deps.responseProvider || createLocalResponseProvider();
      getResponseProvider = function () {
        return fixedResponseProvider;
      };
    }
    var welcomeText =
      typeof deps.welcomeText === "string"
        ? deps.welcomeText
        : SPEECH_BUBBLE_DEMO_TEXT;

    var messageSeq = 0;
    var requestSeq = 0;
    var state = {
      messages: [],
      status: "idle",
      activeRequestId: null,
      lastError: null
    };
    var listeners = {
      stateChange: [],
      message: []
    };

    function notifyStateChange() {
      var snapshot = getState();
      for (var i = 0; i < listeners.stateChange.length; i++) {
        try {
          listeners.stateChange[i](snapshot);
        } catch (err) {
          console.error("[ConversationRuntime]", err);
        }
      }
    }

    function notifyMessage(eventName, message) {
      var payload = {
        type: eventName,
        message: cloneConversationMessage(message)
      };
      for (var i = 0; i < listeners.message.length; i++) {
        try {
          listeners.message[i](payload);
        } catch (err) {
          console.error("[ConversationRuntime]", err);
        }
      }
    }

    function nextMessageId() {
      messageSeq += 1;
      return "msg-" + messageSeq;
    }

    function nextRequestId() {
      requestSeq += 1;
      return "req-" + requestSeq;
    }

    function createMessage(role, content, status) {
      return Object.freeze({
        id: nextMessageId(),
        role: role,
        content: content,
        status: status,
        createdAt: Date.now()
      });
    }

    function commitMessages(nextMessages) {
      state.messages = nextMessages.slice();
    }

    function setRespondingUI(responding) {
      if (pearlRuntime) {
        pearlRuntime.setLoading(!!responding);
      }
      if (inputRuntime) {
        inputRuntime.setDisabled(!!responding);
      }
    }

    function restoreInteractiveUI() {
      setRespondingUI(false);
      if (inputRuntime) {
        inputRuntime.focus();
      }
    }

    function displayLatestAssistant(content) {
      if (speechBubbleRuntime) {
        speechBubbleRuntime.setDialogue(content);
      }
    }

    function getLatestAssistantContent() {
      for (var i = state.messages.length - 1; i >= 0; i--) {
        if (state.messages[i].role === "assistant") {
          return state.messages[i].content;
        }
      }
      return welcomeText;
    }

    function getState() {
      return Object.freeze({
        messages: state.messages.map(cloneConversationMessage),
        status: state.status,
        activeRequestId: state.activeRequestId,
        lastError: state.lastError
      });
    }

    function bootstrapWelcomeMessage() {
      if (conversationRuntimeBootstrapped) return;
      conversationRuntimeBootstrapped = true;
      var welcomeMessage = createMessage(
        "assistant",
        welcomeText,
        "complete"
      );
      commitMessages([welcomeMessage]);
      displayLatestAssistant(welcomeText);
      notifyMessage("assistant-message-created", welcomeMessage);
      notifyStateChange();
    }

    function submitUserText(text) {
      if (layoutEditorInstance && layoutEditorInstance.isEnabled()) {
        return false;
      }
      if (state.status === "responding") {
        return false;
      }

      var normalized = String(text || "").trim();
      if (!normalized) {
        return false;
      }

      var userMessage = createMessage("user", normalized, "submitted");
      commitMessages(state.messages.concat([userMessage]));
      notifyMessage("user-message-created", userMessage);

      if (inputRuntime) {
        inputRuntime.clear();
      }

      var requestId = nextRequestId();
      state.status = "responding";
      state.activeRequestId = requestId;
      state.lastError = null;
      notifyStateChange();

      setRespondingUI(true);

      var conversationSnapshot = state.messages.map(cloneConversationMessage);

      getResponseProvider()
        .respond({
          requestId: requestId,
          userMessage: cloneConversationMessage(userMessage),
          messages: conversationSnapshot,
          latestUserMessage: cloneConversationMessage(userMessage),
          metadata: Object.freeze({ language: "zh" })
        })
        .then(function (result) {
          if (state.activeRequestId !== requestId) return;

          var assistantContent =
            result && typeof result.content === "string"
              ? result.content.trim()
              : "";
          if (!assistantContent) {
            throw createProviderError(
              PROVIDER_ERROR_CATEGORIES.INVALID_RESPONSE,
              "Empty provider response"
            );
          }
          var assistantMessage = createMessage(
            "assistant",
            assistantContent,
            "complete"
          );
          commitMessages(state.messages.concat([assistantMessage]));
          notifyMessage("assistant-message-created", assistantMessage);

          displayLatestAssistant(assistantContent);

          state.status = "idle";
          state.activeRequestId = null;
          notifyStateChange();
          restoreInteractiveUI();
        })
        .catch(function (err) {
          if (state.activeRequestId !== requestId) return;

          state.lastError =
            err && err.message ? String(err.message) : "Response failed";
          state.status = "error";
          state.activeRequestId = null;
          notifyStateChange();

          var failureMessage = createMessage(
            "assistant",
            LOCAL_RESPONSE_PROVIDER_CONFIG.failureResponseText,
            "complete"
          );
          commitMessages(state.messages.concat([failureMessage]));
          notifyMessage("assistant-message-created", failureMessage);
          notifyMessage("conversation-error", failureMessage);

          displayLatestAssistant(failureMessage.content);
          restoreInteractiveUI();
        });

      return true;
    }

    return Object.freeze({
      id: "conversation-runtime",
      bootstrap: bootstrapWelcomeMessage,
      getState: getState,
      getMessages: function () {
        return getState().messages;
      },
      getMessageById: function (id) {
        for (var i = 0; i < state.messages.length; i++) {
          if (state.messages[i].id === id) {
            return cloneConversationMessage(state.messages[i]);
          }
        }
        return null;
      },
      getStatus: function () {
        return state.status;
      },
      isResponding: function () {
        return state.status === "responding";
      },
      submitUserText: submitUserText,
      acceptUserText: submitUserText,
      clearError: function () {
        if (state.status !== "error") return false;
        state.status = "idle";
        state.lastError = null;
        notifyStateChange();
        return true;
      },
      onStateChange: function (handler) {
        if (typeof handler === "function") listeners.stateChange.push(handler);
      },
      onMessage: function (handler) {
        if (typeof handler === "function") listeners.message.push(handler);
      },
      getLatestAssistantContent: getLatestAssistantContent
    });
  }

  function initConversationRuntime() {
    if (conversationRuntimeInstance) return conversationRuntimeInstance;

    initSpeechBubbleRuntime();
    localResponseProviderInstance = createLocalResponseProvider();
    deepSeekResponseProviderInstance = createDeepSeekResponseProvider();

    responseProviderRegistryInstance = createResponseProviderRegistry({
      defaultProvider: NAMORA_BOOT_MODE.responseProvider
    });
    responseProviderRegistryInstance.register(
      "local",
      localResponseProviderInstance
    );
    responseProviderRegistryInstance.register(
      "deepseek",
      deepSeekResponseProviderInstance
    );

    if (isDebugEnabled()) {
      console.info("[ResponseProviderRegistry] initialized", {
        active: responseProviderRegistryInstance.getActiveProviderName()
      });
    }

    conversationRuntimeInstance = createConversationRuntime({
      inputRuntime: inputRuntimeInstance,
      pearlRuntime: pearlRuntimeInstance,
      speechBubbleRuntime: speechBubbleRuntimeInstance,
      getResponseProvider: function () {
        return responseProviderRegistryInstance.getProvider();
      },
      welcomeText: SPEECH_BUBBLE_DEMO_TEXT
    });

    conversationRuntimeInstance.bootstrap();
    return conversationRuntimeInstance;
  }

  /* ------------------------------------------------------------------------ */
  /* Layout Editor — interactive temporary spatial editing (Task 025 / 027)    */
  /* Temporary overrides only. Canonical anchors remain immutable.             */
  /* Foot preview: marker-only (production NANA registration unchanged).       */
  /* Background Standing Point preview: moves NANA registration temporarily.   */
  /* ------------------------------------------------------------------------ */

  var LAYOUT_EDITOR_OBJECT_LABELS = {
    "world-background": "背景（Background）",
    nana: "NANA",
    "speech-bubble": "NANA 对话气泡",
    "user-input-group": "用户输入组（User Input Group）",
    pearl: "珍珠贝（Pearl）",
    "input-panel": "输入框（Input Panel）"
  };

  var LAYOUT_EDITOR_OBJECT_ICONS = {
    "__world__": "🌍",
    "world-background": "🖼",
    nana: "🐙",
    "speech-bubble": "💬",
    "user-input-group": "⬚",
    pearl: "🦪",
    "input-panel": "⌨"
  };

  var LAYOUT_EDITOR_OBJECT_TYPE_LABELS = {
    environment: "环境",
    character: "角色",
    interface: "界面",
    companion: "伴侣"
  };

  var LAYOUT_EDITOR_TREE_ORDER = [
    "world-background",
    "nana",
    "speech-bubble",
    "user-input-group",
    "pearl",
    "input-panel"
  ];

  var LAYOUT_EDITOR_ANCHOR_LABELS = {
    pearl: "珍珠锚点（已弃用 → pearl-root）",
    foot: "脚部锚点（Foot Anchor）",
    "expression-center": "表情中心（Expression Center）",
    "head-center": "头部中心（Head Center）",
    "dialogue-tail": "对话尾点（Dialogue Tail Anchor）",
    "bubble-root": "气泡根点（Bubble Root）",
    "bubble-tail": "气泡尾点（Bubble Tail Point）",
    "bubble-body-center": "气泡体中心（Bubble Body Center）",
    "bubble-text-origin": "气泡文本原点（Bubble Text Origin）",
    send: "发送锚点（Send Anchor）",
    "background-standing-point": "背景站立点（Background Standing Point）",
    "pearl-root": "珍珠贝根点（Pearl Root）",
    "input-root": "用户输入框根点（Input Root）",
    "user-input-group-root": "用户输入组根点（User Input Group Root）"
  };

  var LAYOUT_EDITOR_STATUS_LABELS = {
    approved: "已确认",
    locked: "已锁定",
    disabled: "未启用",
    planned: "规划中",
    selected: "已选择",
    active: "当前对象",
    enabled: "已启用",
    hidden: "隐藏",
    none: "无",
    resolved: "已解析",
    missing: "缺失",
    unresolved: "未解析",
    "temp-unlocked": "临时解锁",
    "temp-locked": "未解锁",
    editable: "可编辑",
    "temporary-candidate": "临时候选",
    "temporary-override": "临时覆盖",
    deprecated: "已弃用",
    "migrated-draft": "迁移草稿",
    draft: "草稿（未确认）",
    bound: "已绑定",
    unbound: "已解绑"
  };

  var LAYOUT_EDITOR_UI = {
    selectObject: "请选择一个对象",
    objectNotFound: "未找到对象",
    objectName: "对象名称",
    objectId: "对象 ID",
    objectType: "对象类型",
    coordinateSpace: "坐标空间",
    parent: "父对象",
    structuralParent: "结构父对象",
    transformParent: "变换父对象",
    coordinateOwner: "坐标所有者",
    anchor: "所属锚点",
    status: "状态",
    rendererBinding: "渲染绑定",
    controlPoints: "控制点",
    controlPointName: "控制点名称",
    controlPointId: "控制点 ID",
    productionStatus: "生产状态",
    editStatus: "编辑状态",
    sourceCoordinates: "源坐标",
    normalizedCoordinates: "归一化坐标",
    worldCoordinates: "世界坐标",
    viewportCoordinates: "视口坐标",
    canonicalCoordinates: "原始坐标",
    temporaryOffset: "临时偏移",
    localCoordinates: "局部坐标",
    bindingState: "绑定状态",
    parentGroup: "所属组",
    none: "无",
    worldRoot: "世界（World）",
    worldOrigin: "世界原点",
    standingPoint: "站立点",
    nanaOrigin: "NANA 原点",
    notEnabledBadge: "未启用",
    unlockTemporary: "临时解锁",
    lockTemporary: "临时锁定",
    needTemporaryUnlock: "请先临时解锁",
    switchToMoveTool: "请切换到「移动」工具后再拖拽",
    confirmResetAll: "确定恢复全部临时坐标？此操作不可撤销（刷新页面亦会清空）。",
    nanaLocalSpace: "nana-local（NANA 精灵源空间）",
    backgroundSourceSpace: "background-source（背景源空间）",
    worldSpace: "world（世界空间）",
    userInputGroupLocalSpace: "user-input-group-local（用户输入组局部）",
    dirty: "有临时修改",
    clean: "无临时修改",
    footPreviewNote: "脚部锚点预览：仅移动标记，不改变生产 NANA 注册位。",
    standingPointCandidateNote:
      "当前值为临时比例候选（非已批准）。请在场景中目视校准背景站立点。",
    standingPointPreviewNote:
      "移动背景站立点会临时预览 NANA 注册位；刷新或恢复后回到规范值。",
    activeSourceDimensions: "当前背景源尺寸",
    userInputGroupTitle: "用户输入组",
    bindUserInput: "绑定珍珠贝与输入框",
    unbindUserInput: "解除珍珠贝与输入框绑定",
    groupRootInactive: "组根点未激活（已解绑）",
    pearlMigrationNote:
      "珍珠贝已从 NANA 本地锚点迁移为独立世界点；不受 NANA 脚部移动影响。",
    inputDraftNote: "输入框根点为草稿位（UI 仍隐藏）；可独立拖拽，尚未冻结生产位置。",
    legendTitle: "图例",
    legendGroupRoot: "用户输入组根点（橙）",
    legendPearlRoot: "珍珠贝根点（红）",
    legendInputRoot: "用户输入框根点（白）",
    copyLayoutJson: "复制布局 JSON",
    downloadLayoutFile: "下载布局文件",
    layoutValidation: "布局校验",
    validationPass: "通过",
    validationFail: "失败",
    unsavedChanges: "未保存修改",
    yes: "是",
    no: "否",
    currentProfile: "当前配置",
    profileCopied: "布局 JSON 已复制",
    profileDownloaded: "布局文件已开始下载",
    profileBlocked: "布局导出已阻止",
    openProfilePreview: "预览布局配置",
    closePreview: "关闭",
    previewTitle: "布局配置预览",
    importLayoutJson: "导入布局 JSON",
    applyToEditor: "应用到编辑器",
    importBlocked: "布局导入已阻止",
    importApplied: "导入布局已应用到编辑器（临时）",
    restoreProjectCanonical: "恢复项目默认布局",
    currentBaseline: "当前基准",
    baselineProject: "项目默认布局",
    baselineImported: "导入布局",
    layoutSource: "布局来源",
    layoutFile: "布局文件",
    layoutLoadStatus: "加载状态",
    layoutLoadSuccess: "成功",
    layoutLoadFail: "失败",
    layoutSourceProjectJson: "项目 JSON",
    layoutSourceFallback: "内置回退",
    layoutSourceEditorImport: "导入临时配置",
    fallbackReason: "回退原因",
    sceneConfig: "场景配置",
    layoutConfig: "布局配置",
    layoutSchema: "布局 Schema",
    reconstructionTest: "重建测试",
    reconstructionTolerance: "重建容差",
    boundCoordinateAuthority: "绑定坐标权威",
    boundAuthorityValue: "组根点 + 局部偏移",
    serializedWorldRole: "序列化世界坐标",
    serializedWorldDiagnostic: "诊断值",
    maxReconstructionDelta: "最大重建差异",
    fallbackUnused: "未使用",
    fallbackUsed: "已使用",
    sceneBootErrorTitle: "场景启动失败"
  };

  /* ------------------------------------------------------------------------ */
  /* Layout Profile — build / validate / serialize (Task 030)                  */
  /* ------------------------------------------------------------------------ */

  var LAYOUT_PROFILE_META = {
    profileId: "namora-default",
    profileName: "Namora Default Layout",
    schemaVersion: "1.1.0",
    profileVersion: "0.1.0",
    source: "layout-editor",
    fileName: "namora-layout-default.v0.1.0.json"
  };

  var CANONICAL_LAYOUT_FILE_PATH = "assets/config/namora-layout-default.json";
  var EXPECTED_LAYOUT_PROFILE_ID = "namora-default";

  var LAYOUT_PROFILE_SUPPORTED_SCHEMAS = ["1.0.0", "1.1.0"];
  /**
   * Tolerance for independently rounded serialized spatial values (3 decimal places).
   * Bound group: roundedRoot + roundedOffset may differ from independently rounded
   * worldPosition by ~0.001 per axis; floating-point may add tiny extra noise.
   */
  var LAYOUT_SERIALIZATION_TOLERANCE = 0.002;
  /**
   * Stricter tolerance for live formula-enforced registration (no independent
   * serialization of both sides of the comparison).
   */
  var LIVE_REGISTRATION_TOLERANCE = 0.001;
  /** @deprecated Prefer LIVE_REGISTRATION_TOLERANCE or LAYOUT_SERIALIZATION_TOLERANCE. */
  var LAYOUT_PROFILE_RECONSTRUCTION_TOLERANCE = LIVE_REGISTRATION_TOLERANCE;
  var LAYOUT_PROFILE_REGISTRATION_TOLERANCE = 0.01;
  /** Declared path uses .webp; binary content was verified as PNG (Task 026/027). */
  var NAMORA_ASSET_FORMAT_DETECTED = "png";

  function roundLayoutNumber(value, places) {
    if (typeof value !== "number" || !isFinite(value)) return value;
    var factor = Math.pow(10, places);
    var rounded = Math.round(value * factor) / factor;
    // Avoid -0
    if (Object.is(rounded, -0)) return 0;
    return rounded;
  }

  function roundLayoutSource(value) {
    return roundLayoutNumber(value, 3);
  }

  function roundLayoutNormalized(value) {
    return roundLayoutNumber(value, 6);
  }

  function roundLayoutViewport(value) {
    return roundLayoutNumber(value, 2);
  }

  function cloneLayoutJson(value) {
    return deepCloneLayoutProfile(value);
  }

  /**
   * Deep clone for JSON-compatible layout/world data.
   * Prefer structuredClone; fall back to JSON for deterministic plain data.
   * Does not clone DOM nodes or functions.
   */
  function deepCloneLayoutProfile(profile) {
    if (profile == null) return profile;
    if (typeof structuredClone === "function") {
      try {
        return structuredClone(profile);
      } catch (err) {
        /* non-cloneable values — fall through */
      }
    }
    return JSON.parse(JSON.stringify(profile));
  }

  function freezeRuntimeWorld(world) {
    if (!world) return world;
    if (world.nana && world.nana.visibleBounds) {
      Object.freeze(world.nana.visibleBounds);
    }
    if (world.nana) {
      Object.freeze(world.nana);
    }
    if (world.standingPoint) {
      Object.freeze(world.standingPoint);
    }
    // Anchors are frozen by defineNamoraAnchorRegistry.
    return Object.freeze(world);
  }

  function buildAnchorDefinitionsFromLayoutProfile(layoutProfile, baseWorld) {
    var nanaObj = layoutProfile && layoutProfile.objects && layoutProfile.objects.nana;
    var profileAnchors = nanaObj && nanaObj.anchors;
    var definitions = [];

    NAMORA_ANCHOR_IDS.forEach(function (anchorId) {
      var fromProfile = profileAnchors && profileAnchors[anchorId];
      var fromBase =
        baseWorld && baseWorld.nana && baseWorld.nana.anchors
          ? baseWorld.nana.anchors[anchorId]
          : null;
      var fromDefault = null;
      for (var i = 0; i < DEFAULT_NANA_ANCHOR_DEFINITIONS.length; i += 1) {
        if (DEFAULT_NANA_ANCHOR_DEFINITIONS[i].id === anchorId) {
          fromDefault = DEFAULT_NANA_ANCHOR_DEFINITIONS[i];
          break;
        }
      }
      var source = fromProfile || fromBase || fromDefault;
      if (!source) return;
      definitions.push({
        id: anchorId,
        label: source.label || (fromDefault && fromDefault.label) || anchorId,
        x: source.x,
        y: source.y,
        status: source.status || "locked",
        purpose:
          source.purpose || (fromDefault && fromDefault.purpose) || ""
      });
    });

    return definitions;
  }

  /**
   * Build a brand-new runtime world graph from a layout profile.
   * Never mutates baseWorld or any frozen prior graph.
   */
  function buildRuntimeWorldFromLayoutProfile(layoutProfile, baseWorld) {
    baseWorld = baseWorld || NAMORA_WORLD;
    if (!layoutProfile || !layoutProfile.world) {
      throw new Error("[SceneRuntime] layout profile missing world data");
    }
    if (!baseWorld) {
      throw new Error("[SceneRuntime] base world required to build runtime world");
    }

    var standing = layoutProfile.world.standingPoint || baseWorld.standingPoint;
    var nanaObj = layoutProfile.objects && layoutProfile.objects.nana;
    var spriteW =
      (nanaObj && nanaObj.sprite && nanaObj.sprite.sourceWidth) ||
      baseWorld.nana.spriteSourceWidth;
    var spriteH =
      (nanaObj && nanaObj.sprite && nanaObj.sprite.sourceHeight) ||
      baseWorld.nana.spriteSourceHeight;
    var assetPath =
      (layoutProfile.world.asset && layoutProfile.world.asset.path) ||
      baseWorld.asset;
    var definitions = buildAnchorDefinitionsFromLayoutProfile(
      layoutProfile,
      baseWorld
    );

    var world = {
      id: baseWorld.id,
      asset: assetPath,
      sourceWidth:
        (layoutProfile.world.asset && layoutProfile.world.asset.sourceWidth) ||
        baseWorld.sourceWidth,
      sourceHeight:
        (layoutProfile.world.asset && layoutProfile.world.asset.sourceHeight) ||
        baseWorld.sourceHeight,
      designWorldHeight:
        (layoutProfile.world.designSize && layoutProfile.world.designSize.height) ||
        baseWorld.designWorldHeight,
      designWorldWidth:
        (layoutProfile.world.designSize && layoutProfile.world.designSize.width) ||
        baseWorld.designWorldWidth,
      scalePolicy: layoutProfile.world.scalePolicy || baseWorld.scalePolicy,
      origin: layoutProfile.world.origin || baseWorld.origin,
      standingPoint: {
        x: standing.x,
        y: standing.y,
        status: standing.status || baseWorld.standingPoint.status,
        purpose: baseWorld.standingPoint.purpose || ""
      },
      nana: {
        worldHeight:
          (nanaObj && nanaObj.worldHeight) || baseWorld.nana.worldHeight,
        spriteSourceWidth: spriteW,
        spriteSourceHeight: spriteH,
        visibleBounds: {
          minX: baseWorld.nana.visibleBounds.minX,
          minY: baseWorld.nana.visibleBounds.minY,
          maxX: baseWorld.nana.visibleBounds.maxX,
          maxY: baseWorld.nana.visibleBounds.maxY
        },
        anchors: defineNamoraAnchorRegistry(spriteW, spriteH, definitions)
      }
    };

    return freezeRuntimeWorld(world);
  }

  function getAssetFormatDeclared(path) {
    var match = /\.([a-z0-9]+)$/i.exec(path || "");
    return match ? match[1].toLowerCase() : "unknown";
  }

  function isoNow() {
    return new Date().toISOString();
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  /**
   * Finite absolute-difference comparison. Rejects NaN / Infinity.
   */
  function approximatelyEqual(a, b, tolerance) {
    if (!isFiniteNumber(a) || !isFiniteNumber(b) || !isFiniteNumber(tolerance)) {
      return false;
    }
    return Math.abs(a - b) <= tolerance;
  }

  /**
   * Point comparison with per-axis deltas. Does not use direct equality.
   */
  function pointsApproximatelyEqual(pointA, pointB, tolerance) {
    if (
      !pointA ||
      !pointB ||
      !isFiniteNumber(pointA.x) ||
      !isFiniteNumber(pointA.y) ||
      !isFiniteNumber(pointB.x) ||
      !isFiniteNumber(pointB.y) ||
      !isFiniteNumber(tolerance)
    ) {
      return {
        equal: false,
        dx: null,
        dy: null,
        absDx: null,
        absDy: null
      };
    }
    var dx = pointA.x - pointB.x;
    var dy = pointA.y - pointB.y;
    var absDx = Math.abs(dx);
    var absDy = Math.abs(dy);
    return {
      equal: absDx <= tolerance && absDy <= tolerance,
      dx: dx,
      dy: dy,
      absDx: absDx,
      absDy: absDy
    };
  }

  function pointClose(a, b, tolerance) {
    return pointsApproximatelyEqual(a, b, tolerance).equal;
  }

  function formatPointDeltaError(prefix, label, expected, actual, comparison, tolerance) {
    return (
      prefix +
      label +
      " 期望 (" +
      (expected ? expected.x + ", " + expected.y : "null") +
      ") 实际 (" +
      (actual ? actual.x + ", " + actual.y : "null") +
      ") ΔX=" +
      (comparison.absDx == null ? "—" : comparison.absDx.toFixed(6)) +
      " ΔY=" +
      (comparison.absDy == null ? "—" : comparison.absDy.toFixed(6)) +
      "（容差 " +
      tolerance +
      "）"
    );
  }

  function trackMaxPointDelta(tracker, comparison) {
    if (!tracker || !comparison || comparison.absDx == null) return tracker;
    if (!tracker.maxAbsDx || comparison.absDx > tracker.maxAbsDx) {
      tracker.maxAbsDx = comparison.absDx;
    }
    if (!tracker.maxAbsDy || comparison.absDy > tracker.maxAbsDy) {
      tracker.maxAbsDy = comparison.absDy;
    }
    return tracker;
  }

  function serializeLayoutProfile(profile) {
    var text = JSON.stringify(profile, null, 2);
    return text + "\n";
  }

  function getExportedParentFields(objectId, bound) {
    switch (objectId) {
      case "world-background":
        return { structuralParentId: null, transformParentId: null };
      case "nana":
        return {
          structuralParentId: "world-background",
          transformParentId: "world-background"
        };
      case "speech-bubble":
        return { structuralParentId: "nana", transformParentId: "nana" };
      case "user-input-group":
        return {
          structuralParentId: "world-background",
          transformParentId: "world-background"
        };
      case "pearl":
        return {
          structuralParentId: "user-input-group",
          transformParentId: bound ? "user-input-group" : null
        };
      case "input-panel":
        return {
          structuralParentId: "user-input-group",
          transformParentId: bound ? "user-input-group" : null
        };
      default:
        return { structuralParentId: null, transformParentId: null };
    }
  }

  function normalizeLayoutProfileObjectParents(profile) {
    if (!profile || !profile.objects) return profile;
    var group = profile.groups && profile.groups["user-input-group"];
    var bound = !!(group && group.bound);
    var objects = profile.objects;
    Object.keys(objects).forEach(function (objectId) {
      var record = objects[objectId];
      if (!record) return;
      if (record.structuralParentId !== undefined && record.transformParentId !== undefined) {
        return;
      }
      if (record.parentId !== undefined) {
        var legacyParent = record.parentId;
        if (objectId === "pearl" || objectId === "input-panel") {
          record.structuralParentId = legacyParent || "user-input-group";
          record.transformParentId = bound ? "user-input-group" : null;
        } else {
          record.structuralParentId = legacyParent;
          record.transformParentId = legacyParent;
        }
        delete record.parentId;
      } else {
        var parents = getExportedParentFields(objectId, bound);
        record.structuralParentId = parents.structuralParentId;
        record.transformParentId = parents.transformParentId;
      }
    });
    return profile;
  }

  function migrateLayoutProfileV1ToV1_1(profile) {
    var warnings = [];
    if (!profile || typeof profile !== "object") {
      return {
        profile: null,
        warnings: ["布局配置为空或不是对象"],
        migrated: false
      };
    }
    var out = deepCloneLayoutProfile(profile);
    if (out.schemaVersion === "1.0.0") {
      out.schemaVersion = "1.1.0";
      warnings.push("schemaVersion 已从 1.0.0 迁移到 1.1.0");
    }
    normalizeLayoutProfileObjectParents(out);
    if (profile.objects) {
      Object.keys(profile.objects).forEach(function (objectId) {
        if (profile.objects[objectId] && profile.objects[objectId].parentId !== undefined) {
          warnings.push(objectId + ": parentId 已迁移为 structuralParentId / transformParentId");
        }
      });
    }
    return {
      profile: out,
      warnings: warnings,
      migrated: true
    };
  }

  function normalizeLayoutProfile(profile) {
    if (!profile) return null;
    var out = deepCloneLayoutProfile(profile);
    if (out.schemaVersion === "1.0.0") {
      out = migrateLayoutProfileV1ToV1_1(out).profile;
    }
    normalizeLayoutProfileObjectParents(out);
    out = ensureSpeechBubbleInProfile(out);
    return out;
  }

  function buildFallbackLayoutProfile() {
    var standing = APPROVED_STANDING_POINT;
    var sw = 1672;
    var sh = 941;
    var spriteW = 1024;
    var spriteH = 1024;
    var worldHeight = 150;
    var foot = DEFAULT_NANA_ANCHOR_DEFINITIONS[0];
    var nanaScale = worldHeight / spriteH;
    var nanaOrigin = {
      x: roundLayoutSource(standing.x - foot.x * nanaScale),
      y: roundLayoutSource(standing.y - foot.y * nanaScale)
    };

    function exportAnchor(anchorDef) {
      return {
        id: anchorDef.id,
        label: anchorDef.label,
        purpose: anchorDef.purpose,
        space: "nana-local",
        x: roundLayoutSource(anchorDef.x),
        y: roundLayoutSource(anchorDef.y),
        u: roundLayoutNormalized(anchorDef.x / spriteW),
        v: roundLayoutNormalized(anchorDef.y / spriteH),
        canonical: {
          x: roundLayoutSource(anchorDef.x),
          y: roundLayoutSource(anchorDef.y)
        },
        modified: false,
        status: anchorDef.status,
        editorLockState: "locked"
      };
    }

    var anchors = Object.create(null);
    DEFAULT_NANA_ANCHOR_DEFINITIONS.forEach(function (anchorDef) {
      anchors[anchorDef.id] = exportAnchor(anchorDef);
    });

    var group = APPROVED_USER_INPUT_GROUP;
    var now = "2026-07-14T00:00:00.000Z";

    return {
      schemaVersion: "1.1.0",
      profileVersion: "0.1.0",
      profileId: "namora-default",
      profileName: "Namora Default Layout",
      createdAt: now,
      updatedAt: now,
      source: "project-canonical",
      world: {
        asset: {
          path: "assets/backgrounds/namora-bg-desktop.webp",
          formatDeclared: "webp",
          formatDetected: NAMORA_ASSET_FORMAT_DETECTED,
          sourceWidth: sw,
          sourceHeight: sh
        },
        designSize: {
          width: roundLayoutSource(APPROVED_DESIGN_WORLD_WIDTH),
          height: 1080
        },
        scalePolicy: "fixed-design-world",
        origin: "bottom-right",
        standingPoint: {
          space: "background-source",
          x: roundLayoutSource(standing.x),
          y: roundLayoutSource(standing.y),
          u: roundLayoutNormalized(standing.x / sw),
          v: roundLayoutNormalized(standing.y / sh),
          status: "locked",
          canonical: {
            x: roundLayoutSource(standing.x),
            y: roundLayoutSource(standing.y)
          },
          modified: false
        }
      },
      objects: {
        "world-background": Object.assign(
          {
            id: "world-background",
            type: "environment",
            coordinateSpace: "world"
          },
          getExportedParentFields("world-background", true)
        ),
        nana: Object.assign(
          {
            id: "nana",
            type: "character",
            coordinateSpace: "world",
            worldOrigin: nanaOrigin,
            worldHeight: worldHeight,
            sprite: {
              sourceWidth: spriteW,
              sourceHeight: spriteH
            },
            registration: {
              standingPointId: BACKGROUND_STANDING_POINT_ID,
              footAnchorId: "foot"
            },
            anchors: anchors
          },
          getExportedParentFields("nana", true)
        ),
        "user-input-group": Object.assign(
          {
            id: "user-input-group",
            type: "interface-group",
            coordinateSpace: "world"
          },
          getExportedParentFields("user-input-group", true)
        ),
        pearl: Object.assign(
          {
            id: "pearl",
            type: "interface-root",
            coordinateSpace: "user-input-group-local",
            worldPosition: {
              x: roundLayoutSource(group.pearlWorld.x),
              y: roundLayoutSource(group.pearlWorld.y)
            },
            localOffset: {
              x: roundLayoutSource(group.pearlOffset.x),
              y: roundLayoutSource(group.pearlOffset.y)
            },
            status: "locked"
          },
          getExportedParentFields("pearl", true)
        ),
        "input-panel": Object.assign(
          {
            id: "input-panel",
            type: "interface-root",
            coordinateSpace: "user-input-group-local",
            worldPosition: {
              x: roundLayoutSource(group.inputWorld.x),
              y: roundLayoutSource(group.inputWorld.y)
            },
            localOffset: {
              x: roundLayoutSource(group.inputOffset.x),
              y: roundLayoutSource(group.inputOffset.y)
            },
            status: "locked"
          },
          getExportedParentFields("input-panel", true)
        ),
        "speech-bubble": buildSpeechBubbleProfileObject(
          speechBubbleGeometryFromComponentDefaults(),
          { modified: false }
        )
      },
      groups: {
        "user-input-group": {
          id: "user-input-group",
          bound: true,
          coordinateSpace: "world",
          root: {
            x: roundLayoutSource(group.groupRoot.x),
            y: roundLayoutSource(group.groupRoot.y)
          },
          members: ["pearl", "input-panel"]
        }
      },
      relationships: [
        {
          id: "nana-standing-registration",
          type: "registration",
          source: "nana.anchors.foot",
          target: "world.standingPoint",
          enabled: true
        },
        {
          id: "user-input-group-binding",
          type: "group",
          parent: "user-input-group",
          members: ["pearl", "input-panel"],
          enabled: true
        },
        {
          id: "speech-bubble-tail-attachment",
          type: "attachment",
          source: "speech-bubble.points.tail",
          target: "nana.anchors.dialogue-tail",
          enabled: true
        }
      ],
      editorMetadata: {
        dirty: false,
        temporary: false
      }
    };
  }

  function externalProfileToInternalUserInputGroup(profile) {
    var group = profile.groups && profile.groups["user-input-group"];
    var pearl = profile.objects && profile.objects.pearl;
    var inputPanel = profile.objects && profile.objects["input-panel"];
    if (!group) return null;

    return {
      bound: !!group.bound,
      root: group.root ? { x: group.root.x, y: group.root.y } : null,
      pearlOffset:
        pearl && pearl.localOffset
          ? { x: pearl.localOffset.x, y: pearl.localOffset.y }
          : null,
      inputOffset:
        inputPanel && inputPanel.localOffset
          ? { x: inputPanel.localOffset.x, y: inputPanel.localOffset.y }
          : null,
      pearl: pearl
        ? {
            worldPosition: pearl.worldPosition,
            localOffset: pearl.localOffset,
            status: pearl.status || "locked"
          }
        : null,
      input: inputPanel
        ? {
            worldPosition: inputPanel.worldPosition,
            localOffset: inputPanel.localOffset,
            status: inputPanel.status || "locked"
          }
        : null,
      members: (group.members || ["pearl", "input-panel"]).slice()
    };
  }

  /**
   * @deprecated In-place world mutation is forbidden (Task 034B).
   * Use buildRuntimeWorldFromLayoutProfile + atomic NAMORA_WORLD replacement.
   */
  function applyExternalLayoutProfileToWorld(profile, world) {
    void world;
    if (!profile || !profile.world) return false;
    console.error(
      "[SceneRuntime] applyExternalLayoutProfileToWorld is retired; " +
        "runtime must rebuild an immutable world graph instead of mutating frozen anchors."
    );
    return false;
  }

  function testNormalizeDoesNotMutateInput(profile) {
    var input = deepCloneLayoutProfile(profile);
    var before = JSON.stringify(input);
    normalizeLayoutProfile(input);
    var after = JSON.stringify(input);
    return {
      ok: before === after,
      beforeLength: before.length,
      afterLength: after.length
    };
  }

  function testLayoutProfileSelfReconstruction(profile, tolerance) {
    var serializationTolerance =
      typeof tolerance === "number" ? tolerance : LAYOUT_SERIALIZATION_TOLERANCE;
    var liveTolerance = LIVE_REGISTRATION_TOLERANCE;
    profile = normalizeLayoutProfile(profile) || profile;
    var validation = validateLayoutProfile(profile);
    if (validation.status === "FAIL") {
      return {
        status: "FAIL",
        errors: validation.errors.slice(),
        comparisons: [],
        maxDelta: null
      };
    }

    var reconstructed = reconstructSpatialStateFromProfile(profile);
    if (!reconstructed) {
      return {
        status: "FAIL",
        errors: ["无法从布局配置重建空间状态"],
        comparisons: [],
        maxDelta: null
      };
    }

    var errors = [];
    var comparisons = [];
    var deltaTracker = { maxAbsDx: 0, maxAbsDy: 0 };

    function comparePoint(label, expected, actual, compareTolerance, errorPrefix) {
      compareTolerance =
        typeof compareTolerance === "number"
          ? compareTolerance
          : serializationTolerance;
      var comparison = pointsApproximatelyEqual(expected, actual, compareTolerance);
      trackMaxPointDelta(deltaTracker, comparison);
      comparisons.push({
        label: label,
        expected: expected,
        actual: actual,
        pass: comparison.equal,
        dx: comparison.dx,
        dy: comparison.dy,
        absDx: comparison.absDx,
        absDy: comparison.absDy,
        tolerance: compareTolerance
      });
      if (!comparison.equal) {
        errors.push(
          formatPointDeltaError(
            errorPrefix || "重建自检不一致：",
            label,
            expected,
            actual,
            comparison,
            compareTolerance
          )
        );
      }
      return comparison;
    }

    var standing = profile.world.standingPoint;
    comparePoint(
      "standingPoint",
      { x: standing.x, y: standing.y },
      reconstructed.standingPoint,
      serializationTolerance
    );

    var nana = profile.objects.nana;
    var originExpected = nana.worldOrigin;
    comparePoint(
      "nanaOrigin",
      originExpected,
      reconstructed.nanaOrigin,
      serializationTolerance
    );

    Object.keys(nana.anchors || {}).forEach(function (anchorId) {
      var anchor = nana.anchors[anchorId];
      var recon = reconstructed.anchors[anchorId];
      comparePoint(
        "anchor." + anchorId + ".local",
        { x: anchor.x, y: anchor.y },
        recon ? recon.local : null,
        serializationTolerance
      );
    });

    var pearl = profile.objects.pearl;
    var inputPanel = profile.objects["input-panel"];
    var bound = !!(
      profile.groups &&
      profile.groups["user-input-group"] &&
      profile.groups["user-input-group"].bound
    );

    if (
      profile.groups &&
      profile.groups["user-input-group"] &&
      !!profile.groups["user-input-group"].bound !==
        !!reconstructed.userInputGroup.bound
    ) {
      errors.push("重建绑定状态不一致");
    }

    if (bound && reconstructed.userInputGroup.bound) {
      var groupSpec = profile.groups && profile.groups["user-input-group"];
      comparePoint(
        "groupRoot",
        groupSpec && groupSpec.root,
        reconstructed.userInputGroup.groupRoot,
        serializationTolerance
      );
      comparePoint(
        "pearlOffset",
        pearl && pearl.localOffset,
        reconstructed.userInputGroup.pearlOffset,
        serializationTolerance
      );
      comparePoint(
        "inputOffset",
        inputPanel && inputPanel.localOffset,
        reconstructed.userInputGroup.inputOffset,
        serializationTolerance
      );
      // Bound authority: root + localOffset. Serialized worldPosition is diagnostic only.
      if (pearl && pearl.worldPosition) {
        comparePoint(
          "pearl.worldPosition(diagnostic)",
          pearl.worldPosition,
          reconstructed.userInputGroup.pearlWorld,
          serializationTolerance,
          "序列化世界坐标与组权威重建不一致："
        );
      }
      if (inputPanel && inputPanel.worldPosition) {
        comparePoint(
          "input.worldPosition(diagnostic)",
          inputPanel.worldPosition,
          reconstructed.userInputGroup.inputWorld,
          serializationTolerance,
          "序列化世界坐标与组权威重建不一致："
        );
      }
    } else {
      // Unbound: worldPosition is authoritative.
      comparePoint(
        "pearl.world",
        pearl && pearl.worldPosition,
        reconstructed.userInputGroup.pearlWorld,
        serializationTolerance
      );
      comparePoint(
        "input.world",
        inputPanel && inputPanel.worldPosition,
        reconstructed.userInputGroup.inputWorld,
        serializationTolerance
      );
    }

    if (reconstructed.speechBubble) {
      if (
        isFiniteNumber(reconstructed.speechBubble.tailRegistrationErrorPx) &&
        reconstructed.speechBubble.tailRegistrationErrorPx > liveTolerance
      ) {
        errors.push(
          "Speech Bubble 尾点注册误差超出容差：" +
            reconstructed.speechBubble.tailRegistrationErrorPx.toFixed(4)
        );
      }
    }

    return {
      status: errors.length === 0 ? "PASS" : "FAIL",
      errors: errors,
      comparisons: comparisons,
      maxDelta: {
        x: deltaTracker.maxAbsDx,
        y: deltaTracker.maxAbsDy
      },
      serializationTolerance: serializationTolerance,
      liveRegistrationTolerance: liveTolerance
    };
  }

  function validateLayoutProfileForRuntime(profile, world, expectedProfileId) {
    var normalized = normalizeLayoutProfile(profile);
    if (!normalized) {
      return {
        ok: false,
        profile: null,
        validation: { status: "FAIL", errors: ["布局配置为空"], warnings: [] },
        reconstruction: null,
        errors: ["布局配置为空"]
      };
    }

    var validation = validateLayoutProfile(normalized);
    if (validation.status !== "PASS") {
      return {
        ok: false,
        profile: normalized,
        validation: validation,
        reconstruction: null,
        errors: validation.errors.slice()
      };
    }

    var errors = [];
    if (expectedProfileId && normalized.profileId !== expectedProfileId) {
      errors.push(
        "布局 profileId 不匹配：期望 " +
          expectedProfileId +
          "，实际 " +
          normalized.profileId
      );
    }

    if (world && normalized.world && normalized.world.asset) {
      if (
        normalized.world.asset.sourceWidth !== world.sourceWidth ||
        normalized.world.asset.sourceHeight !== world.sourceHeight
      ) {
        errors.push(
          "背景源尺寸与运行时资源不匹配（配置 " +
            normalized.world.asset.sourceWidth +
            "×" +
            normalized.world.asset.sourceHeight +
            "，运行时 " +
            world.sourceWidth +
            "×" +
            world.sourceHeight +
            "）"
        );
      }
    }

    var reconstruction = testLayoutProfileSelfReconstruction(normalized);
    if (reconstruction.status !== "PASS") {
      errors = errors.concat(reconstruction.errors);
      return {
        ok: false,
        profile: normalized,
        validation: validation,
        reconstruction: reconstruction,
        errors: errors,
        maxDelta: reconstruction.maxDelta || null
      };
    }

    if (errors.length > 0) {
      return {
        ok: false,
        profile: normalized,
        validation: validation,
        reconstruction: reconstruction,
        errors: errors,
        maxDelta: reconstruction.maxDelta || null
      };
    }

    return {
      ok: true,
      profile: normalized,
      validation: validation,
      reconstruction: reconstruction,
      errors: [],
      maxDelta: reconstruction.maxDelta || null
    };
  }

  function reconstructSpatialStateFromProfile(profile) {
    if (!profile || !profile.world || !profile.objects || !profile.objects.nana) {
      return null;
    }

    var nana = profile.objects.nana;
    var standing = profile.world.standingPoint;
    var foot = nana.anchors && nana.anchors.foot;
    if (!standing || !foot) return null;

    var footprint = foot.canonical && isFiniteNumber(foot.canonical.x)
      ? foot.canonical
      : { x: foot.x, y: foot.y };
    var scale = nana.worldHeight / nana.sprite.sourceHeight;
    var origin = {
      x: standing.x - footprint.x * scale,
      y: standing.y - footprint.y * scale
    };

    var anchors = Object.create(null);
    Object.keys(nana.anchors || {}).forEach(function (anchorId) {
      var anchor = nana.anchors[anchorId];
      anchors[anchorId] = {
        local: { x: anchor.x, y: anchor.y },
        world: {
          x: origin.x + anchor.x * scale,
          y: origin.y + anchor.y * scale
        }
      };
    });

    var group = profile.groups && profile.groups["user-input-group"];
    var pearl = profile.objects.pearl;
    var inputPanel = profile.objects["input-panel"];
    var bound = !!(group && group.bound);
    var pearlWorld;
    var inputWorld;
    var groupRoot = null;
    var pearlOffset = null;
    var inputOffset = null;

    if (bound && group.root) {
      groupRoot = { x: group.root.x, y: group.root.y };
      pearlOffset = pearl && pearl.localOffset
        ? { x: pearl.localOffset.x, y: pearl.localOffset.y }
        : { x: 0, y: 0 };
      inputOffset = inputPanel && inputPanel.localOffset
        ? { x: inputPanel.localOffset.x, y: inputPanel.localOffset.y }
        : { x: 0, y: 0 };
      pearlWorld = {
        x: groupRoot.x + pearlOffset.x,
        y: groupRoot.y + pearlOffset.y
      };
      inputWorld = {
        x: groupRoot.x + inputOffset.x,
        y: groupRoot.y + inputOffset.y
      };
    } else {
      pearlWorld = pearl && pearl.worldPosition
        ? { x: pearl.worldPosition.x, y: pearl.worldPosition.y }
        : null;
      inputWorld = inputPanel && inputPanel.worldPosition
        ? { x: inputPanel.worldPosition.x, y: inputPanel.worldPosition.y }
        : null;
    }

    var footWorld = anchors.foot ? anchors.foot.world : null;
    var registrationError = footWorld
      ? Math.hypot(footWorld.x - standing.x, footWorld.y - standing.y)
      : null;

    // Registration in runtime uses canonical foot; compute that error too
    var registeredFootWorld = {
      x: origin.x + footprint.x * scale,
      y: origin.y + footprint.y * scale
    };
    var registrationErrorCanonical = Math.hypot(
      registeredFootWorld.x - standing.x,
      registeredFootWorld.y - standing.y
    );

    var speechBubbleObj = profile.objects["speech-bubble"];
    var speechBubbleGeometry = speechBubbleGeometryFromProfileObject(speechBubbleObj);
    var dialogueTailWorld =
      anchors["dialogue-tail"] && anchors["dialogue-tail"].world
        ? anchors["dialogue-tail"].world
        : null;
    var speechBubble = null;
    if (dialogueTailWorld && speechBubbleGeometry) {
      var bubbleTransform = {
        worldOrigin: {
          x: dialogueTailWorld.x - speechBubbleGeometry.points.tail.x,
          y: dialogueTailWorld.y - speechBubbleGeometry.points.tail.y
        }
      };
      function bubbleLocalToWorld(localPoint) {
        return {
          x: bubbleTransform.worldOrigin.x + localPoint.x,
          y: bubbleTransform.worldOrigin.y + localPoint.y
        };
      }
      var tailWorld = bubbleLocalToWorld(speechBubbleGeometry.points.tail);
      speechBubble = {
        geometry: speechBubbleGeometry,
        worldOrigin: bubbleTransform.worldOrigin,
        tailWorld: tailWorld,
        bodyCenterWorld: bubbleLocalToWorld(speechBubbleGeometry.points.bodyCenter),
        textOriginWorld: bubbleLocalToWorld(speechBubbleGeometry.points.textOrigin),
        tailRegistrationErrorPx: Math.hypot(
          tailWorld.x - dialogueTailWorld.x,
          tailWorld.y - dialogueTailWorld.y
        )
      };
    }

    return {
      standingPoint: { x: standing.x, y: standing.y },
      nanaOrigin: origin,
      anchors: anchors,
      userInputGroup: {
        bound: bound,
        groupRoot: groupRoot,
        pearlWorld: pearlWorld,
        inputWorld: inputWorld,
        pearlOffset: pearlOffset,
        inputOffset: inputOffset
      },
      speechBubble: speechBubble,
      registrationErrorPx: registrationErrorCanonical
    };
  }

  function validateLayoutProfile(profile) {
    var errors = [];
    var warnings = [];

    function fail(message) {
      errors.push(message);
    }

    if (!profile || typeof profile !== "object") {
      return {
        status: "FAIL",
        errors: ["布局配置为空或不是对象"],
        warnings: warnings
      };
    }

    var requiredTop = [
      "schemaVersion",
      "profileVersion",
      "profileId",
      "profileName",
      "createdAt",
      "updatedAt",
      "source",
      "world",
      "objects",
      "groups",
      "relationships",
      "editorMetadata"
    ];
    requiredTop.forEach(function (key) {
      if (profile[key] === undefined) fail("缺少顶层字段：" + key);
    });

    if (
      profile.schemaVersion &&
      LAYOUT_PROFILE_SUPPORTED_SCHEMAS.indexOf(profile.schemaVersion) === -1
    ) {
      fail("不支持的 schemaVersion：" + profile.schemaVersion);
    }

    var world = profile.world;
    if (world) {
      if (!world.asset || !isFiniteNumber(world.asset.sourceWidth) || world.asset.sourceWidth <= 0) {
        fail("世界源宽度必须为正数");
      }
      if (!world.asset || !isFiniteNumber(world.asset.sourceHeight) || world.asset.sourceHeight <= 0) {
        fail("世界源高度必须为正数");
      }
      if (
        !world.designSize ||
        !isFiniteNumber(world.designSize.width) ||
        world.designSize.width <= 0 ||
        !isFiniteNumber(world.designSize.height) ||
        world.designSize.height <= 0
      ) {
        fail("设计世界尺寸必须为正数");
      }

      var standing = world.standingPoint;
      if (!standing) {
        fail("缺少站立点");
      } else {
        if (standing.space !== "background-source") {
          fail("站立点坐标空间必须为 background-source");
        }
        if (
          !isFiniteNumber(standing.x) ||
          !isFiniteNumber(standing.y) ||
          standing.x < 0 ||
          standing.y < 0 ||
          standing.x > world.asset.sourceWidth ||
          standing.y > world.asset.sourceHeight
        ) {
          fail("站立点超出背景源范围");
        }
        if (profile.schemaVersion === "1.1.0" && standing.status === "temporary-candidate") {
          fail("已批准站立点状态不得为 temporary-candidate");
        }
        if (standing.modified === false && standing.canonical) {
          if (
            roundLayoutSource(standing.x) !== roundLayoutSource(standing.canonical.x) ||
            roundLayoutSource(standing.y) !== roundLayoutSource(standing.canonical.y)
          ) {
            fail("站立点 modified=false 时 canonical 与有效坐标不一致");
          }
        }
      }
    }

    var objects = profile.objects || {};
    var group = profile.groups && profile.groups["user-input-group"];
    var groupBound = !!(group && group.bound);
    var isV11 = profile.schemaVersion === "1.1.0";
    var ids = Object.keys(objects);
    var seen = Object.create(null);

    if (isV11) {
      function walkStructuralChain(objectId) {
        var chain = [];
        var seen = Object.create(null);
        var currentId = objectId;
        while (currentId) {
          if (seen[currentId]) return null;
          seen[currentId] = true;
          chain.push(currentId);
          var rec = objects[currentId];
          if (!rec) return null;
          currentId = rec.structuralParentId;
        }
        return chain;
      }

      function walkTransformChain(objectId) {
        var chain = [];
        var seen = Object.create(null);
        var currentId = objectId;
        while (currentId) {
          if (seen[currentId]) return null;
          seen[currentId] = true;
          chain.push(currentId);
          var rec = objects[currentId];
          if (!rec) return null;
          currentId = rec.transformParentId;
        }
        return chain;
      }

      ids.forEach(function (id) {
        if (seen[id]) fail("对象 ID 重复：" + id);
        seen[id] = true;
        var record = objects[id];
        if (!record) return;
        if (record.id && record.id !== id) {
          fail("对象键与 id 不一致：" + id);
        }
        if (record.parentId !== undefined) {
          fail("schema 1.1.0 不得包含 parentId：" + id);
        }
        if (record.structuralParentId === undefined) {
          fail("缺少 structuralParentId：" + id);
        }
        if (record.transformParentId === undefined) {
          fail("缺少 transformParentId：" + id);
        }
        if (
          record.coordinateSpace &&
          VALID_COORDINATE_SPACES.indexOf(record.coordinateSpace) === -1
        ) {
          fail("无法识别的坐标空间：" + record.coordinateSpace + "（" + id + "）");
        }
        if (record.structuralParentId && !objects[record.structuralParentId]) {
          fail("结构父对象不存在：" + record.structuralParentId + "（子：" + id + "）");
        }
        if (record.transformParentId && !objects[record.transformParentId]) {
          fail("变换父对象不存在：" + record.transformParentId + "（子：" + id + "）");
        }
        if (walkStructuralChain(id) === null) {
          fail("结构层级存在循环或缺失父对象：" + id);
        }
        if (walkTransformChain(id) === null) {
          fail("变换层级存在循环或缺失父对象：" + id);
        }

        if (id === "pearl" && record.structuralParentId === "nana") {
          fail("珍珠贝不得结构隶属于 NANA");
        }
        if (id === "input-panel" && record.structuralParentId === "nana") {
          fail("输入框不得结构隶属于 NANA");
        }

        if (groupBound) {
          if (id === "pearl" || id === "input-panel") {
            if (record.coordinateSpace !== "user-input-group-local") {
              fail("绑定状态下 " + id + " 坐标空间必须为 user-input-group-local");
            }
            if (record.transformParentId !== "user-input-group") {
              fail("绑定状态下 " + id + " 变换父对象必须为 user-input-group");
            }
          }
        } else if (id === "pearl" || id === "input-panel") {
          if (record.coordinateSpace !== "world") {
            fail("解绑状态下 " + id + " 坐标空间必须为 world");
          }
          if (record.transformParentId !== null) {
            fail("解绑状态下 " + id + " 变换父对象必须为 null");
          }
        }

        if (record.coordinateSpace === "user-input-group-local" &&
            record.transformParentId !== "user-input-group") {
          fail(id + "：局部空间对象必须有变换父对象 user-input-group");
        }
      });
    } else {
      ids.forEach(function (id) {
        if (seen[id]) fail("对象 ID 重复：" + id);
        seen[id] = true;
        var record = objects[id];
        if (!record) return;
        if (record.id && record.id !== id) {
          fail("对象键与 id 不一致：" + id);
        }
        if (
          record.coordinateSpace &&
          VALID_COORDINATE_SPACES.indexOf(record.coordinateSpace) === -1
        ) {
          fail("无法识别的坐标空间：" + record.coordinateSpace + "（" + id + "）");
        }
        var legacyParent = record.parentId;
        if (legacyParent && !objects[legacyParent]) {
          fail("父对象不存在：" + legacyParent + "（子：" + id + "）");
        }
      });
      if (objects.pearl && objects.pearl.parentId === "nana") {
        fail("珍珠贝不得隶属于 NANA");
      }
      if (objects["input-panel"] && objects["input-panel"].parentId === "nana") {
        fail("输入框不得隶属于 NANA");
      }
    }

    if (objects.nana && !objects["world-background"]) {
      fail("缺少对象：world-background");
    }

    var nana = objects.nana;
    if (!nana) {
      fail("缺少 NANA 对象");
    } else {
      var spriteW = nana.sprite && nana.sprite.sourceWidth;
      var spriteH = nana.sprite && nana.sprite.sourceHeight;
      if (!isFiniteNumber(spriteW) || !isFiniteNumber(spriteH) || spriteW <= 0 || spriteH <= 0) {
        fail("NANA 精灵尺寸无效");
      }
      var requiredAnchors = [
        "foot",
        "expression-center",
        "head-center",
        "dialogue-tail"
      ];
      requiredAnchors.forEach(function (anchorId) {
        var anchor = nana.anchors && nana.anchors[anchorId];
        if (!anchor) {
          fail("缺少 NANA 锚点：" + anchorId);
          return;
        }
        if (anchor.space !== "nana-local") {
          fail("NANA 锚点坐标空间错误：" + anchorId);
        }
        if (
          !isFiniteNumber(anchor.x) ||
          !isFiniteNumber(anchor.y) ||
          anchor.x < 0 ||
          anchor.y < 0 ||
          anchor.x > spriteW ||
          anchor.y > spriteH
        ) {
          fail("NANA 锚点超出精灵范围：" + anchorId);
        }
        if (anchorId === "foot") {
          // already covered
        }
        if (anchor.modified === false && anchor.canonical) {
          if (
            roundLayoutSource(anchor.x) !== roundLayoutSource(anchor.canonical.x) ||
            roundLayoutSource(anchor.y) !== roundLayoutSource(anchor.canonical.y)
          ) {
            fail("NANA 锚点 " + anchorId + " modified=false 时 canonical 与有效坐标不一致");
          }
        }
      });
      if (nana.anchors && nana.anchors.pearl) {
        fail("不得将 Pearl 作为 NANA 锚点导出");
      }
    }

    var userInputGroup = profile.groups && profile.groups["user-input-group"];
    if (!userInputGroup) {
      fail("缺少用户输入组");
    } else {
      if (!Array.isArray(userInputGroup.members)) {
        fail("用户输入组成员列表无效");
      } else {
        userInputGroup.members.forEach(function (memberId) {
          if (!objects[memberId]) fail("用户输入组成员不存在：" + memberId);
        });
      }
      if (userInputGroup.bound) {
        if (!userInputGroup.root || !isFiniteNumber(userInputGroup.root.x) || !isFiniteNumber(userInputGroup.root.y)) {
          fail("绑定状态下缺少组根点");
        }
        if (
          !objects.pearl ||
          !objects.pearl.localOffset ||
          !isFiniteNumber(objects.pearl.localOffset.x) ||
          !isFiniteNumber(objects.pearl.localOffset.y)
        ) {
          fail("绑定状态下缺少珍珠贝局部偏移");
        }
        if (
          !objects["input-panel"] ||
          !objects["input-panel"].localOffset ||
          !isFiniteNumber(objects["input-panel"].localOffset.x) ||
          !isFiniteNumber(objects["input-panel"].localOffset.y)
        ) {
          fail("绑定状态下缺少输入框局部偏移");
        }
      } else {
        if (
          !objects.pearl ||
          !objects.pearl.worldPosition ||
          !isFiniteNumber(objects.pearl.worldPosition.x) ||
          !isFiniteNumber(objects.pearl.worldPosition.y)
        ) {
          fail("解绑状态下缺少珍珠贝世界坐标");
        }
        if (
          !objects["input-panel"] ||
          !objects["input-panel"].worldPosition ||
          !isFiniteNumber(objects["input-panel"].worldPosition.x) ||
          !isFiniteNumber(objects["input-panel"].worldPosition.y)
        ) {
          fail("解绑状态下缺少输入框世界坐标");
        }
      }
    }

    if (!objects["speech-bubble"]) {
      fail("缺少 Speech Bubble 对象");
    } else {
      var bubbleObj = objects["speech-bubble"];
      if (bubbleObj.coordinateSpace !== "speech-bubble-local") {
        fail("Speech Bubble 坐标空间必须为 speech-bubble-local");
      }
      if (bubbleObj.structuralParentId !== "nana") {
        fail("Speech Bubble 结构父对象必须为 nana");
      }
      if (bubbleObj.transformParentId !== "nana") {
        fail("Speech Bubble 变换父对象必须为 nana");
      }
      if (
        bubbleObj.attachment &&
        bubbleObj.attachment.targetAnchor !== "nana.anchors.dialogue-tail"
      ) {
        fail("Speech Bubble 附着目标必须为 nana.anchors.dialogue-tail");
      }
      validateSpeechBubbleGeometry(
        speechBubbleGeometryFromProfileObject(bubbleObj),
        errors,
        fail
      );
    }

    if (!Array.isArray(profile.relationships)) {
      fail("relationships 必须为数组");
    } else {
      profile.relationships.forEach(function (rel) {
        if (!rel || !rel.id) {
          fail("关系缺少 id");
          return;
        }
        if (rel.type === "group") {
          if (!rel.parent || !(profile.groups && profile.groups[rel.parent])) {
            fail("关系引用的组不存在：" + (rel.parent || "?"));
          }
          (rel.members || []).forEach(function (memberId) {
            if (!objects[memberId]) fail("关系成员不存在：" + memberId);
          });
        }
      });
    }

    function walkForBadNumbers(value, path) {
      if (value === undefined) {
        fail("存在 undefined：" + path);
        return;
      }
      if (typeof value === "number") {
        if (!isFinite(value)) fail("非法数值（NaN/Infinity）：" + path);
        return;
      }
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach(function (item, index) {
          walkForBadNumbers(item, path + "[" + index + "]");
        });
        return;
      }
      Object.keys(value).forEach(function (key) {
        walkForBadNumbers(value[key], path + "." + key);
      });
    }
    walkForBadNumbers(profile, "profile");

    var reconstructed = reconstructSpatialStateFromProfile(profile);
    if (reconstructed && isFiniteNumber(reconstructed.registrationErrorPx)) {
      if (reconstructed.registrationErrorPx > LAYOUT_PROFILE_REGISTRATION_TOLERANCE) {
        fail(
          "注册误差超出容差：" +
            reconstructed.registrationErrorPx.toFixed(4) +
            "（容差 " +
            LAYOUT_PROFILE_REGISTRATION_TOLERANCE +
            "）"
        );
      }
    }

    if (
      reconstructed &&
      reconstructed.speechBubble &&
      isFiniteNumber(reconstructed.speechBubble.tailRegistrationErrorPx)
    ) {
      if (
        reconstructed.speechBubble.tailRegistrationErrorPx >
        LIVE_REGISTRATION_TOLERANCE
      ) {
        fail(
          "Speech Bubble 尾点注册误差超出容差：" +
            reconstructed.speechBubble.tailRegistrationErrorPx.toFixed(4) +
            "（容差 " +
            LIVE_REGISTRATION_TOLERANCE +
            "）"
        );
      }
    }

    if (
      reconstructed &&
      reconstructed.userInputGroup &&
      reconstructed.userInputGroup.bound
    ) {
      var pearlObj = objects.pearl;
      var inputObj = objects["input-panel"];
      if (pearlObj && pearlObj.worldPosition) {
        var pearlDiag = pointsApproximatelyEqual(
          pearlObj.worldPosition,
          reconstructed.userInputGroup.pearlWorld,
          LAYOUT_SERIALIZATION_TOLERANCE
        );
        if (!pearlDiag.equal) {
          fail(
            formatPointDeltaError(
              "序列化世界坐标与组权威重建不一致：",
              "pearl.worldPosition",
              pearlObj.worldPosition,
              reconstructed.userInputGroup.pearlWorld,
              pearlDiag,
              LAYOUT_SERIALIZATION_TOLERANCE
            )
          );
        }
      }
      if (inputObj && inputObj.worldPosition) {
        var inputDiag = pointsApproximatelyEqual(
          inputObj.worldPosition,
          reconstructed.userInputGroup.inputWorld,
          LAYOUT_SERIALIZATION_TOLERANCE
        );
        if (!inputDiag.equal) {
          fail(
            formatPointDeltaError(
              "序列化世界坐标与组权威重建不一致：",
              "input.worldPosition",
              inputObj.worldPosition,
              reconstructed.userInputGroup.inputWorld,
              inputDiag,
              LAYOUT_SERIALIZATION_TOLERANCE
            )
          );
        }
      }
    }

    return {
      status: errors.length === 0 ? "PASS" : "FAIL",
      errors: errors,
      warnings: warnings,
      reconstructed: reconstructed
    };
  }

  function testLayoutProfileReconstruction(profile, liveSnapshot, tolerance) {
    var serializationTolerance =
      typeof tolerance === "number" ? tolerance : LAYOUT_SERIALIZATION_TOLERANCE;
    var liveTolerance = LIVE_REGISTRATION_TOLERANCE;
    profile = normalizeLayoutProfile(profile) || profile;
    var validation = validateLayoutProfile(profile);
    if (validation.status === "FAIL") {
      return {
        status: "FAIL",
        errors: validation.errors.slice(),
        comparisons: [],
        maxDelta: null
      };
    }

    var reconstructed = reconstructSpatialStateFromProfile(profile);
    var errors = [];
    var comparisons = [];
    var deltaTracker = { maxAbsDx: 0, maxAbsDy: 0 };

    function comparePoint(label, expected, actual, compareTolerance, errorPrefix) {
      compareTolerance =
        typeof compareTolerance === "number"
          ? compareTolerance
          : serializationTolerance;
      var comparison = pointsApproximatelyEqual(expected, actual, compareTolerance);
      trackMaxPointDelta(deltaTracker, comparison);
      comparisons.push({
        label: label,
        expected: expected,
        actual: actual,
        pass: comparison.equal,
        dx: comparison.dx,
        dy: comparison.dy,
        absDx: comparison.absDx,
        absDy: comparison.absDy,
        tolerance: compareTolerance
      });
      if (!comparison.equal) {
        errors.push(
          formatPointDeltaError(
            errorPrefix || "重建不一致：",
            label,
            expected,
            actual,
            comparison,
            compareTolerance
          )
        );
      }
      return comparison;
    }

    if (!liveSnapshot) {
      return {
        status: "FAIL",
        errors: ["缺少当前编辑器空间快照，无法进行重建比对"],
        comparisons: comparisons,
        maxDelta: null
      };
    }

    comparePoint(
      "standingPoint",
      liveSnapshot.nana.standingPoint,
      reconstructed.standingPoint,
      serializationTolerance
    );
    comparePoint(
      "nanaOrigin",
      liveSnapshot.nana.worldOrigin,
      reconstructed.nanaOrigin,
      serializationTolerance
    );

    Object.keys(liveSnapshot.nana.anchors || {}).forEach(function (anchorId) {
      var live = liveSnapshot.nana.anchors[anchorId];
      var recon = reconstructed.anchors[anchorId];
      comparePoint(
        "anchor." + anchorId + ".local",
        live.local,
        recon ? recon.local : null,
        serializationTolerance
      );
      comparePoint(
        "anchor." + anchorId + ".world",
        live.world,
        recon ? recon.world : null,
        serializationTolerance
      );
    });

    if (!!liveSnapshot.userInputGroup.bound !== !!reconstructed.userInputGroup.bound) {
      errors.push("重建绑定状态不一致");
      comparisons.push({
        label: "userInputGroup.bound",
        expected: liveSnapshot.userInputGroup.bound,
        actual: reconstructed.userInputGroup.bound,
        pass: false
      });
    }

    if (liveSnapshot.userInputGroup.bound && reconstructed.userInputGroup.bound) {
      comparePoint(
        "groupRoot",
        liveSnapshot.userInputGroup.groupRoot &&
          liveSnapshot.userInputGroup.groupRoot.world,
        reconstructed.userInputGroup.groupRoot,
        serializationTolerance
      );
      comparePoint(
        "pearlOffset",
        liveSnapshot.userInputGroup.offsets &&
          liveSnapshot.userInputGroup.offsets.pearlOffset,
        reconstructed.userInputGroup.pearlOffset,
        serializationTolerance
      );
      comparePoint(
        "inputOffset",
        liveSnapshot.userInputGroup.offsets &&
          liveSnapshot.userInputGroup.offsets.inputOffset,
        reconstructed.userInputGroup.inputOffset,
        serializationTolerance
      );
      // Authority is root + offset on both sides; still tolerate serialization noise.
      comparePoint(
        "pearl.world",
        liveSnapshot.userInputGroup.pearl.world,
        reconstructed.userInputGroup.pearlWorld,
        serializationTolerance
      );
      comparePoint(
        "input.world",
        liveSnapshot.userInputGroup.input.world,
        reconstructed.userInputGroup.inputWorld,
        serializationTolerance
      );
    } else {
      comparePoint(
        "pearl.world",
        liveSnapshot.userInputGroup.pearl.world,
        reconstructed.userInputGroup.pearlWorld,
        serializationTolerance
      );
      comparePoint(
        "input.world",
        liveSnapshot.userInputGroup.input.world,
        reconstructed.userInputGroup.inputWorld,
        serializationTolerance
      );
    }

    if (liveSnapshot.speechBubble && reconstructed.speechBubble) {
      comparePoint(
        "speechBubble.tailWorld",
        liveSnapshot.speechBubble.tailWorld,
        reconstructed.speechBubble.tailWorld,
        liveTolerance
      );
      comparePoint(
        "speechBubble.worldOrigin",
        liveSnapshot.speechBubble.worldOrigin,
        reconstructed.speechBubble.worldOrigin,
        liveTolerance
      );
      comparePoint(
        "speechBubble.bodyCenterWorld",
        liveSnapshot.speechBubble.bodyCenterWorld,
        reconstructed.speechBubble.bodyCenterWorld,
        liveTolerance
      );
      if (
        isFiniteNumber(liveSnapshot.speechBubble.tailRegistrationErrorPx) &&
        liveSnapshot.speechBubble.tailRegistrationErrorPx > liveTolerance
      ) {
        errors.push(
          "Speech Bubble 尾点注册误差超出容差：" +
            liveSnapshot.speechBubble.tailRegistrationErrorPx.toFixed(4)
        );
      }
    }

    return {
      status: errors.length === 0 ? "PASS" : "FAIL",
      errors: errors,
      comparisons: comparisons,
      reconstructed: reconstructed,
      maxDelta: {
        x: deltaTracker.maxAbsDx,
        y: deltaTracker.maxAbsDy
      },
      serializationTolerance: serializationTolerance,
      liveRegistrationTolerance: liveTolerance
    };
  }

  function formatLayoutEditorSource(value) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    var rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function formatLayoutEditorUv(value) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    return value.toFixed(6);
  }

  function formatLayoutEditorWorld(value) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    return value.toFixed(2);
  }

  function getLayoutEditorAnchorLabel(anchorId, fallbackLabel) {
    return LAYOUT_EDITOR_ANCHOR_LABELS[anchorId] || fallbackLabel || anchorId;
  }

  function getLayoutEditorStatusLabel(statusKey) {
    if (!statusKey) return LAYOUT_EDITOR_STATUS_LABELS.none;
    return LAYOUT_EDITOR_STATUS_LABELS[statusKey] || statusKey;
  }

  function isEditableSpatialAnchor(anchorId) {
    return NAMORA_ANCHOR_IDS.indexOf(anchorId) !== -1;
  }

  function isBackgroundStandingPoint(pointId) {
    return pointId === BACKGROUND_STANDING_POINT_ID;
  }

  function isUserInputPoint(pointId) {
    return USER_INPUT_POINT_IDS.indexOf(pointId) !== -1;
  }

  function isSpeechBubblePoint(pointId) {
    return SPEECH_BUBBLE_POINT_IDS.indexOf(pointId) !== -1;
  }

  function isEditableControlPointId(pointId) {
    return (
      isEditableSpatialAnchor(pointId) ||
      isBackgroundStandingPoint(pointId) ||
      isUserInputPoint(pointId) ||
      isSpeechBubblePoint(pointId)
    );
  }

  function objectIdForSpeechBubblePoint(pointId) {
    if (isSpeechBubblePoint(pointId)) return SPEECH_BUBBLE_COMPONENT_ID;
    return null;
  }

  function objectIdForUserInputPoint(pointId) {
    if (pointId === PEARL_ROOT_ID) return "pearl";
    if (pointId === INPUT_ROOT_ID) return "input-panel";
    if (pointId === USER_INPUT_GROUP_ROOT_ID) return "user-input-group";
    return null;
  }

  function createLayoutEditor() {
    var enabled = false;
    var activeTool = "select";
    var selectedObjectId = null;
    var selectedControlPointId = null;
    var temporaryAnchorOverrides = Object.create(null);
    var temporarilyUnlockedAnchorIds = Object.create(null);
    var temporaryWorldOverrides = {
      standingPoint: null
    };
    var temporaryUserInputState = {
      bound: false,
      groupRoot: null,
      pearlWorld: null,
      inputWorld: null,
      pearlOffset: null,
      inputOffset: null
    };
    var dragState = null;
    var editorEl = null;
    var treeEl = null;
    var propsEl = null;
    var toolbarEl = null;
    var uigPanelEl = null;
    var uigStatusEl = null;
    var selectionEl = null;
    var selectionBoundsEl = null;
    var selectionPointsEl = null;
    var pointElements = Object.create(null);
    var handlersBound = false;
    var propsActionsBound = false;
    var onPointerMove = null;
    var onPointerUp = null;
    var onKeyDown = null;
    var suppressSceneClickUntil = 0;
    var editFeedbackMessage = null;
    var importedBaselineProfile = null;
    var pendingImportPreview = null;
    var temporarySpeechBubbleGeometry = null;
    var editorUserInputLifecycle = {
      initialized: false,
      initializing: false
    };

    function clonePoint(point) {
      if (!point) return null;
      return { x: point.x, y: point.y };
    }

    function applyCanonicalSpeechBubbleState() {
      temporarySpeechBubbleGeometry = null;
    }

    function getSpeechBubbleGeometryOverride(base) {
      base = base || getCanonicalSpeechBubbleGeometry();
      if (!temporarySpeechBubbleGeometry) return cloneSpeechBubbleGeometry(base);
      return cloneSpeechBubbleGeometry(temporarySpeechBubbleGeometry);
    }

    function ensureSpeechBubbleEditorInitialized() {
      if (!SPEECH_BUBBLE_DEFAULTS) initSpeechBubbleDefaults(runtimeLayoutState);
    }

    function getEffectiveSpeechBubbleGeometryEditor() {
      ensureSpeechBubbleEditorInitialized();
      return getSpeechBubbleGeometryOverride(getCanonicalSpeechBubbleGeometry());
    }

    function getSpeechBubbleWorldTransformEditor() {
      return computeSpeechBubbleWorldTransform(
        NAMORA_WORLD,
        getEffectiveSpeechBubbleGeometryEditor()
      );
    }

    function getSpeechBubblePointLocal(pointId) {
      var geometry = getEffectiveSpeechBubbleGeometryEditor();
      if (pointId === BUBBLE_ROOT_ID) return clonePoint(geometry.points.root);
      if (pointId === BUBBLE_TAIL_ID) return clonePoint(geometry.points.tail);
      if (pointId === BUBBLE_BODY_CENTER_ID) {
        return clonePoint(geometry.points.bodyCenter);
      }
      if (pointId === BUBBLE_TEXT_ORIGIN_ID) {
        return clonePoint(geometry.points.textOrigin);
      }
      return null;
    }

    function getSpeechBubblePointWorld(pointId) {
      var transform = getSpeechBubbleWorldTransformEditor();
      if (!transform) return null;
      var local = getSpeechBubblePointLocal(pointId);
      if (!local) return null;
      return speechBubbleLocalToWorld(local, transform.worldOrigin);
    }

    function getSpeechBubblePointCanonical(pointId) {
      ensureSpeechBubbleEditorInitialized();
      var canonical = getCanonicalSpeechBubbleGeometry();
      if (pointId === BUBBLE_ROOT_ID) return canonical.points.root;
      if (pointId === BUBBLE_TAIL_ID) return canonical.points.tail;
      if (pointId === BUBBLE_BODY_CENTER_ID) return canonical.points.bodyCenter;
      if (pointId === BUBBLE_TEXT_ORIGIN_ID) return canonical.points.textOrigin;
      return null;
    }

    function getSpeechBubbleControlPointSource(pointId) {
      var local = getSpeechBubblePointLocal(pointId);
      var canonical = getSpeechBubblePointCanonical(pointId);
      var world = getSpeechBubblePointWorld(pointId);
      if (!local || !canonical || !world) return null;
      return {
        id: pointId,
        label: LAYOUT_EDITOR_ANCHOR_LABELS[pointId],
        status: "draft",
        purpose: "Speech Bubble local control point",
        x: local.x,
        y: local.y,
        u: null,
        v: null,
        canonicalX: canonical.x,
        canonicalY: canonical.y,
        deltaX: local.x - canonical.x,
        deltaY: local.y - canonical.y,
        isTemporary:
          !!temporarySpeechBubbleGeometry &&
          (local.x !== canonical.x || local.y !== canonical.y),
        coordinateSpace: "speech-bubble-local",
        local: clonePoint(local),
        world: clonePoint(world)
      };
    }

    function setSpeechBubblePointLocal(pointId, x, y) {
      ensureSpeechBubbleEditorInitialized();
      if (!temporarySpeechBubbleGeometry) {
        temporarySpeechBubbleGeometry = getEffectiveSpeechBubbleGeometryEditor();
      }
      if (pointId === BUBBLE_ROOT_ID) {
        temporarySpeechBubbleGeometry.points.root = { x: x, y: y };
      } else if (pointId === BUBBLE_TAIL_ID) {
        temporarySpeechBubbleGeometry.points.tail = { x: x, y: y };
      } else if (pointId === BUBBLE_BODY_CENTER_ID) {
        temporarySpeechBubbleGeometry.points.bodyCenter = { x: x, y: y };
      } else if (pointId === BUBBLE_TEXT_ORIGIN_ID) {
        temporarySpeechBubbleGeometry.points.textOrigin = { x: x, y: y };
      } else {
        return false;
      }
      return true;
    }

    function hasSpeechBubbleTemporaryChanges() {
      if (!temporarySpeechBubbleGeometry) return false;
      var canonical = getCanonicalSpeechBubbleGeometry();
      var current = getEffectiveSpeechBubbleGeometryEditor();
      return (
        current.localSize.width !== canonical.localSize.width ||
        current.localSize.height !== canonical.localSize.height ||
        current.points.tail.x !== canonical.points.tail.x ||
        current.points.tail.y !== canonical.points.tail.y ||
        current.points.bodyCenter.x !== canonical.points.bodyCenter.x ||
        current.points.bodyCenter.y !== canonical.points.bodyCenter.y ||
        current.points.textOrigin.x !== canonical.points.textOrigin.x ||
        current.points.textOrigin.y !== canonical.points.textOrigin.y
      );
    }

    function resetSpeechBubbleDefaults() {
      applyCanonicalSpeechBubbleState();
    }

    /* ------------------------------------------------------------------ */
    /* User Input lifecycle — one-way only (Task 035B)                      */
    /* ensure → initialize → apply → refresh                                */
    /* ------------------------------------------------------------------ */

    /**
     * Pure allocation: guarantee temporaryUserInputState object exists.
     * Does not copy canonical data or refresh UI.
     */
    function ensureUserInputStateExists() {
      if (!temporaryUserInputState || typeof temporaryUserInputState !== "object") {
        temporaryUserInputState = {
          bound: false,
          groupRoot: null,
          pearlWorld: null,
          inputWorld: null,
          pearlOffset: null,
          inputOffset: null
        };
      }
      return temporaryUserInputState;
    }

    /**
     * Render-only: Pearl / Input / group root / bind chrome.
     * Does not apply canonical or initialize.
     */
    function refreshUserInputComponents() {
      // Render-only: bind chrome + placeholders (+ selection markers when editor on).
      // Does not apply canonical or initialize.
      syncUserInputGroupPanel();
      if (enabled) {
        refreshSelectionOverlay(lastLayout);
      } else {
        refreshSceneComponents();
      }
    }

    /**
     * Data copy only: runtime canonical → editor temporary state.
     * Then refreshUserInputComponents(). No ensure / initialize.
     */
    function applyCanonicalUserInputState() {
      if (!USER_INPUT_DEFAULTS) {
        initUserInputDefaults(runtimeLayoutState);
      }
      var d = USER_INPUT_DEFAULTS;
      if (!d || !temporaryUserInputState) return;

      temporaryUserInputState.bound = !!d.bound;
      temporaryUserInputState.pearlWorld = clonePoint(d.pearlWorld);
      temporaryUserInputState.inputWorld = clonePoint(d.inputWorld);
      if (d.bound) {
        temporaryUserInputState.groupRoot = clonePoint(d.groupRoot);
        temporaryUserInputState.pearlOffset = clonePoint(d.pearlOffset);
        temporaryUserInputState.inputOffset = clonePoint(d.inputOffset);
      } else {
        temporaryUserInputState.groupRoot = null;
        temporaryUserInputState.pearlOffset = null;
        temporaryUserInputState.inputOffset = null;
      }
      refreshUserInputComponents();
    }

    /**
     * One-time editor boot orchestration. Never called from apply/refresh.
     */
    function initializeUserInputState() {
      if (editorUserInputLifecycle.initializing) return;
      if (editorUserInputLifecycle.initialized) return;

      editorUserInputLifecycle.initializing = true;
      try {
        ensureUserInputStateExists();
        if (!USER_INPUT_DEFAULTS) {
          initUserInputDefaults(runtimeLayoutState);
        }
        applyCanonicalUserInputState();
        editorUserInputLifecycle.initialized = true;
      } finally {
        editorUserInputLifecycle.initializing = false;
      }
    }

    function isUserInputGroupBound() {
      return !!(temporaryUserInputState && temporaryUserInputState.bound);
    }

    function getUserInputPearlWorld() {
      ensureUserInputStateExists();
      if (temporaryUserInputState.bound && temporaryUserInputState.groupRoot) {
        return {
          x: temporaryUserInputState.groupRoot.x + temporaryUserInputState.pearlOffset.x,
          y: temporaryUserInputState.groupRoot.y + temporaryUserInputState.pearlOffset.y
        };
      }
      return clonePoint(temporaryUserInputState.pearlWorld);
    }

    function getUserInputInputWorld() {
      ensureUserInputStateExists();
      if (temporaryUserInputState.bound && temporaryUserInputState.groupRoot) {
        return {
          x: temporaryUserInputState.groupRoot.x + temporaryUserInputState.inputOffset.x,
          y: temporaryUserInputState.groupRoot.y + temporaryUserInputState.inputOffset.y
        };
      }
      return clonePoint(temporaryUserInputState.inputWorld);
    }

    function getUserInputGroupRootWorld() {
      if (!temporaryUserInputState.bound || !temporaryUserInputState.groupRoot) return null;
      return clonePoint(temporaryUserInputState.groupRoot);
    }

    function getUserInputWorldPosition(pointId) {
      if (pointId === PEARL_ROOT_ID) return getUserInputPearlWorld();
      if (pointId === INPUT_ROOT_ID) return getUserInputInputWorld();
      if (pointId === USER_INPUT_GROUP_ROOT_ID) return getUserInputGroupRootWorld();
      return null;
    }

    function getUserInputEffectiveSource(pointId) {
      ensureUserInputStateExists();
      if (!USER_INPUT_DEFAULTS) initUserInputDefaults(runtimeLayoutState);
      var worldPos = getUserInputWorldPosition(pointId);
      if (!worldPos && pointId !== USER_INPUT_GROUP_ROOT_ID) return null;
      if (pointId === USER_INPUT_GROUP_ROOT_ID && !temporaryUserInputState.bound) {
        return {
          id: pointId,
          label: LAYOUT_EDITOR_ANCHOR_LABELS[pointId],
          status: "unbound",
          purpose: LAYOUT_EDITOR_UI.groupRootInactive,
          x: null,
          y: null,
          canonicalX: USER_INPUT_DEFAULTS.groupRoot.x,
          canonicalY: USER_INPUT_DEFAULTS.groupRoot.y,
          deltaX: 0,
          deltaY: 0,
          isTemporary: false,
          coordinateSpace: "world",
          bound: false,
          parentGroup: "user-input-group",
          local: null
        };
      }

      var bound = isUserInputGroupBound();
      var coordinateSpace = "world";
      var local = null;
      var canonical;
      var status;

      if (pointId === PEARL_ROOT_ID) {
        status = USER_INPUT_DEFAULTS.pearlStatus;
        canonical = USER_INPUT_DEFAULTS.pearlWorld;
        if (bound) {
          coordinateSpace = "user-input-group-local";
          local = clonePoint(temporaryUserInputState.pearlOffset);
        }
      } else if (pointId === INPUT_ROOT_ID) {
        status = USER_INPUT_DEFAULTS.inputStatus;
        canonical = USER_INPUT_DEFAULTS.inputWorld;
        if (bound) {
          coordinateSpace = "user-input-group-local";
          local = clonePoint(temporaryUserInputState.inputOffset);
        }
      } else {
        status = "temporary-override";
        canonical = USER_INPUT_DEFAULTS.groupRoot;
        coordinateSpace = "world";
        local = { x: 0, y: 0 };
      }

      var sourceX = bound && local ? local.x : worldPos.x;
      var sourceY = bound && local ? local.y : worldPos.y;
      if (!bound || pointId === USER_INPUT_GROUP_ROOT_ID) {
        sourceX = worldPos.x;
        sourceY = worldPos.y;
      }

      return {
        id: pointId,
        label: LAYOUT_EDITOR_ANCHOR_LABELS[pointId],
        status: status,
        purpose:
          pointId === PEARL_ROOT_ID
            ? LAYOUT_EDITOR_UI.pearlMigrationNote
            : pointId === INPUT_ROOT_ID
              ? LAYOUT_EDITOR_UI.inputDraftNote
              : "User Input Group Root",
        x: sourceX,
        y: sourceY,
        u: null,
        v: null,
        canonicalX: canonical.x,
        canonicalY: canonical.y,
        deltaX: worldPos.x - canonical.x,
        deltaY: worldPos.y - canonical.y,
        isTemporary:
          worldPos.x !== canonical.x ||
          worldPos.y !== canonical.y ||
          bound,
        coordinateSpace: coordinateSpace,
        bound: bound,
        parentGroup: "user-input-group",
        local: local,
        world: clonePoint(worldPos)
      };
    }

    function setUserInputWorldOverride(pointId, x, y) {
      ensureUserInputStateExists();
      if (pointId === PEARL_ROOT_ID) {
        if (temporaryUserInputState.bound) {
          temporaryUserInputState.pearlOffset = {
            x: x - temporaryUserInputState.groupRoot.x,
            y: y - temporaryUserInputState.groupRoot.y
          };
        } else {
          temporaryUserInputState.pearlWorld = { x: x, y: y };
        }
        return true;
      }
      if (pointId === INPUT_ROOT_ID) {
        if (temporaryUserInputState.bound) {
          temporaryUserInputState.inputOffset = {
            x: x - temporaryUserInputState.groupRoot.x,
            y: y - temporaryUserInputState.groupRoot.y
          };
        } else {
          temporaryUserInputState.inputWorld = { x: x, y: y };
        }
        return true;
      }
      if (pointId === USER_INPUT_GROUP_ROOT_ID) {
        if (!temporaryUserInputState.bound) return false;
        temporaryUserInputState.groupRoot = { x: x, y: y };
        return true;
      }
      return false;
    }

    function setUserInputLocalOverride(pointId, lx, ly) {
      if (!temporaryUserInputState.bound) return false;
      if (pointId === PEARL_ROOT_ID) {
        temporaryUserInputState.pearlOffset = { x: lx, y: ly };
        return true;
      }
      if (pointId === INPUT_ROOT_ID) {
        temporaryUserInputState.inputOffset = { x: lx, y: ly };
        return true;
      }
      return false;
    }

    function bindUserInputGroup() {
      ensureUserInputStateExists();
      if (temporaryUserInputState.bound) return true;

      var pearl = getUserInputPearlWorld();
      var input = getUserInputInputWorld();
      if (!pearl || !input) return false;
      temporaryUserInputState.groupRoot = { x: pearl.x, y: pearl.y };
      temporaryUserInputState.pearlOffset = {
        x: pearl.x - temporaryUserInputState.groupRoot.x,
        y: pearl.y - temporaryUserInputState.groupRoot.y
      };
      temporaryUserInputState.inputOffset = {
        x: input.x - temporaryUserInputState.groupRoot.x,
        y: input.y - temporaryUserInputState.groupRoot.y
      };
      temporaryUserInputState.bound = true;
      editFeedbackMessage = null;
      refreshUserInputComponents();
      return true;
    }

    function unbindUserInputGroup() {
      if (!temporaryUserInputState.bound) return true;
      var pearl = getUserInputPearlWorld();
      var input = getUserInputInputWorld();
      temporaryUserInputState.pearlWorld = clonePoint(pearl);
      temporaryUserInputState.inputWorld = clonePoint(input);
      temporaryUserInputState.groupRoot = null;
      temporaryUserInputState.pearlOffset = null;
      temporaryUserInputState.inputOffset = null;
      temporaryUserInputState.bound = false;
      if (selectedControlPointId === USER_INPUT_GROUP_ROOT_ID) {
        selectedControlPointId = PEARL_ROOT_ID;
        selectedObjectId = "pearl";
      }
      editFeedbackMessage = null;
      refreshUserInputComponents();
      return true;
    }

    function resetUserInputDefaults() {
      applyCanonicalUserInputState();
    }

    function hasUserInputTemporaryChanges() {
      ensureUserInputStateExists();
      if (!USER_INPUT_DEFAULTS) initUserInputDefaults(runtimeLayoutState);
      var d = USER_INPUT_DEFAULTS;
      if (!d) return false;
      if (!!temporaryUserInputState.bound !== !!d.bound) return true;
      if (temporaryUserInputState.bound) {
        var gr = temporaryUserInputState.groupRoot;
        var dg = d.groupRoot;
        if (!gr || !dg || gr.x !== dg.x || gr.y !== dg.y) return true;
        var po = temporaryUserInputState.pearlOffset;
        var dpo = d.pearlOffset;
        if (!po || !dpo || po.x !== dpo.x || po.y !== dpo.y) return true;
        var io = temporaryUserInputState.inputOffset;
        var dio = d.inputOffset;
        if (!io || !dio || io.x !== dio.x || io.y !== dio.y) return true;
        return false;
      }
      var pearl = temporaryUserInputState.pearlWorld;
      var input = temporaryUserInputState.inputWorld;
      if (!pearl || !input) return false;
      return (
        pearl.x !== d.pearlWorld.x ||
        pearl.y !== d.pearlWorld.y ||
        input.x !== d.inputWorld.x ||
        input.y !== d.inputWorld.y
      );
    }

    function getDisplayLabel(objectId) {
      return LAYOUT_EDITOR_OBJECT_LABELS[objectId] || objectId;
    }

    function getObjectIcon(objectId) {
      return LAYOUT_EDITOR_OBJECT_ICONS[objectId] || "•";
    }

    function getObjectStatus(record) {
      if (!record.enabled && !record.visible) return "disabled";
      if (record.enabled && record.visible) return "active";
      if (record.enabled) return "enabled";
      return "hidden";
    }

    function getCanonicalAnchor(anchorId) {
      return getAnchor(anchorId);
    }

    function getTemporaryStandingPoint() {
      if (!temporaryWorldOverrides.standingPoint) return null;
      return {
        x: temporaryWorldOverrides.standingPoint.x,
        y: temporaryWorldOverrides.standingPoint.y
      };
    }

    function getEffectiveStandingSource() {
      var canonical = NAMORA_WORLD.standingPoint;
      var override = temporaryWorldOverrides.standingPoint;
      var x = override ? override.x : canonical.x;
      var y = override ? override.y : canonical.y;
      return {
        id: BACKGROUND_STANDING_POINT_ID,
        label: LAYOUT_EDITOR_ANCHOR_LABELS[BACKGROUND_STANDING_POINT_ID],
        status: canonical.status || "temporary-candidate",
        purpose: canonical.purpose || "",
        x: x,
        y: y,
        u: x / NAMORA_WORLD.sourceWidth,
        v: y / NAMORA_WORLD.sourceHeight,
        canonicalX: canonical.x,
        canonicalY: canonical.y,
        deltaX: x - canonical.x,
        deltaY: y - canonical.y,
        isTemporary: !!override,
        coordinateSpace: "background-source",
        sourceWidth: NAMORA_WORLD.sourceWidth,
        sourceHeight: NAMORA_WORLD.sourceHeight
      };
    }

    function setStandingPointOverride(x, y) {
      temporaryWorldOverrides.standingPoint = { x: x, y: y };
      updateNamoraWorldLayout();
      return true;
    }

    function clearStandingPointOverride() {
      if (!temporaryWorldOverrides.standingPoint) return false;
      temporaryWorldOverrides.standingPoint = null;
      updateNamoraWorldLayout();
      return true;
    }

    function getEffectiveSource(anchorId) {
      if (isBackgroundStandingPoint(anchorId)) {
        return getEffectiveStandingSource();
      }
      if (isUserInputPoint(anchorId)) {
        return getUserInputEffectiveSource(anchorId);
      }
      var canonical = getCanonicalAnchor(anchorId);
      if (!canonical) return null;
      var override = temporaryAnchorOverrides[anchorId];
      var x = override ? override.x : canonical.x;
      var y = override ? override.y : canonical.y;
      var sw = NAMORA_WORLD.nana.spriteSourceWidth;
      var sh = NAMORA_WORLD.nana.spriteSourceHeight;
      return {
        id: canonical.id,
        label: canonical.label,
        status: canonical.status,
        purpose: canonical.purpose,
        x: x,
        y: y,
        u: x / sw,
        v: y / sh,
        canonicalX: canonical.x,
        canonicalY: canonical.y,
        deltaX: x - canonical.x,
        deltaY: y - canonical.y,
        isTemporary: !!override,
        coordinateSpace: "nana-local"
      };
    }

    function getEffectiveWorldPosition(anchorId) {
      if (isBackgroundStandingPoint(anchorId)) {
        var standing = getEffectiveStandingSource();
        return {
          id: standing.id,
          label: standing.label,
          x: standing.x,
          y: standing.y,
          status: standing.status,
          source: standing,
          nanaWorldOrigin: null,
          nanaWorldScale: null
        };
      }
      if (isUserInputPoint(anchorId)) {
        var sourceUi = getUserInputEffectiveSource(anchorId);
        var worldUi = getUserInputWorldPosition(anchorId);
        if (!sourceUi) return null;
        if (!worldUi && anchorId === USER_INPUT_GROUP_ROOT_ID) return null;
        return {
          id: sourceUi.id,
          label: sourceUi.label,
          x: worldUi.x,
          y: worldUi.y,
          status: sourceUi.status,
          source: sourceUi,
          nanaWorldOrigin: null,
          nanaWorldScale: null
        };
      }
      if (isSpeechBubblePoint(anchorId)) {
        var bubbleSource = getSpeechBubbleControlPointSource(anchorId);
        if (!bubbleSource) return null;
        return {
          id: bubbleSource.id,
          label: bubbleSource.label,
          x: bubbleSource.world.x,
          y: bubbleSource.world.y,
          status: bubbleSource.status,
          source: bubbleSource,
          nanaWorldOrigin: null,
          nanaWorldScale: null
        };
      }
      var source = getEffectiveSource(anchorId);
      if (!source) return null;
      var worldPoint = nanaLocalToWorldPoint(source.x, source.y);
      return {
        id: source.id,
        label: source.label,
        x: worldPoint.x,
        y: worldPoint.y,
        status: source.status,
        source: source,
        nanaWorldOrigin: worldPoint.nanaWorldOrigin,
        nanaWorldScale: worldPoint.nanaWorldScale
      };
    }

    function getComponentAnchorWorldPosition(anchorId) {
      var position = getEffectiveWorldPosition(anchorId);
      if (!position) return null;
      return { x: position.x, y: position.y };
    }

    function getEffectiveViewportPosition(anchorId) {
      var worldPos = getEffectiveWorldPosition(anchorId);
      if (!worldPos) return null;
      var viewport = worldToViewportPoint(worldPos.x, worldPos.y);
      return {
        id: worldPos.id,
        label: worldPos.label,
        x: viewport.x,
        y: viewport.y,
        worldX: worldPos.x,
        worldY: worldPos.y,
        status: worldPos.status,
        source: worldPos.source
      };
    }

    function requiresTemporaryUnlock(anchorId) {
      if (isBackgroundStandingPoint(anchorId)) return false;
      if (isUserInputPoint(anchorId)) return false;
      var canonical = getCanonicalAnchor(anchorId);
      if (!canonical) return true;
      return canonical.status === "locked";
    }

    function isControlPointTemporarilyUnlocked(anchorId) {
      if (!isEditableSpatialAnchor(anchorId)) return false;
      return Object.prototype.hasOwnProperty.call(temporarilyUnlockedAnchorIds, anchorId) &&
        !!temporarilyUnlockedAnchorIds[anchorId];
    }

    function isTemporarilyEditable(anchorId) {
      if (isSpeechBubblePoint(anchorId)) return true;
      if (isBackgroundStandingPoint(anchorId)) return true;
      if (isUserInputPoint(anchorId)) {
        if (anchorId === USER_INPUT_GROUP_ROOT_ID) return isUserInputGroupBound();
        return true;
      }
      if (!isEditableSpatialAnchor(anchorId)) return false;
      // approved: editable without unlock
      if (!requiresTemporaryUnlock(anchorId)) return true;
      // locked anchors: require temporary unlock
      return isControlPointTemporarilyUnlocked(anchorId);
    }

    function getEditStatusKey(anchorId) {
      if (isBackgroundStandingPoint(anchorId)) return "editable";
      if (isUserInputPoint(anchorId)) {
        if (anchorId === USER_INPUT_GROUP_ROOT_ID && !isUserInputGroupBound()) {
          return "unbound";
        }
        return "editable";
      }
      if (!isEditableSpatialAnchor(anchorId)) return "none";
      if (!requiresTemporaryUnlock(anchorId)) return "editable";
      if (isControlPointTemporarilyUnlocked(anchorId)) return "temp-unlocked";
      return "temp-locked";
    }

    function isControlPointEditable(anchorId) {
      return isTemporarilyEditable(anchorId);
    }

    function hasUnsavedChanges() {
      if (importedBaselineProfile) {
        var reconstruction = testLayoutProfileReconstruction(
          importedBaselineProfile,
          getSpatialSnapshot()
        );
        return reconstruction.status !== "PASS";
      }
      return (
        Object.keys(temporaryAnchorOverrides).length > 0 ||
        !!temporaryWorldOverrides.standingPoint ||
        hasUserInputTemporaryChanges() ||
        hasSpeechBubbleTemporaryChanges()
      );
    }

    function syncEditorFromRuntimeCanonical() {
      USER_INPUT_DEFAULTS = null;
      initUserInputDefaults(runtimeLayoutState);
      SPEECH_BUBBLE_DEFAULTS = null;
      initSpeechBubbleDefaults(runtimeLayoutState);
      // Restore / reload path: apply only — do not re-initialize editor lifecycle.
      applyCanonicalUserInputState();
      applyCanonicalSpeechBubbleState();
      temporaryWorldOverrides.standingPoint = null;
      temporaryAnchorOverrides = Object.create(null);
      temporarilyUnlockedAnchorIds = Object.create(null);
    }

    function applyProfileToEditorState(profile) {
      profile = normalizeLayoutProfile(profile);
      if (!profile) return false;

      temporaryAnchorOverrides = Object.create(null);
      temporarilyUnlockedAnchorIds = Object.create(null);
      temporaryWorldOverrides.standingPoint = null;

      var standing = profile.world.standingPoint;
      if (
        standing &&
        (standing.x !== NAMORA_WORLD.standingPoint.x ||
          standing.y !== NAMORA_WORLD.standingPoint.y)
      ) {
        temporaryWorldOverrides.standingPoint = { x: standing.x, y: standing.y };
      }

      var nanaAnchors =
        profile.objects && profile.objects.nana && profile.objects.nana.anchors;
      if (nanaAnchors) {
        NAMORA_ANCHOR_IDS.forEach(function (anchorId) {
          var imported = nanaAnchors[anchorId];
          var canonical = NAMORA_WORLD.nana.anchors[anchorId];
          if (
            imported &&
            canonical &&
            (imported.x !== canonical.x || imported.y !== canonical.y)
          ) {
            temporaryAnchorOverrides[anchorId] = {
              x: imported.x,
              y: imported.y
            };
          }
        });
      }

      var reconstructed = reconstructSpatialStateFromProfile(profile);
      if (!reconstructed || !reconstructed.userInputGroup) return false;
      var uig = reconstructed.userInputGroup;
      temporaryUserInputState.bound = !!uig.bound;
      if (uig.bound && uig.groupRoot) {
        temporaryUserInputState.groupRoot = clonePoint(uig.groupRoot);
        temporaryUserInputState.pearlOffset = clonePoint(uig.pearlOffset);
        temporaryUserInputState.inputOffset = clonePoint(uig.inputOffset);
        temporaryUserInputState.pearlWorld = clonePoint(uig.pearlWorld);
        temporaryUserInputState.inputWorld = clonePoint(uig.inputWorld);
      } else {
        temporaryUserInputState.pearlWorld = clonePoint(uig.pearlWorld);
        temporaryUserInputState.inputWorld = clonePoint(uig.inputWorld);
        temporaryUserInputState.groupRoot = null;
        temporaryUserInputState.pearlOffset = null;
        temporaryUserInputState.inputOffset = null;
      }

      if (profile.objects && profile.objects["speech-bubble"]) {
        temporarySpeechBubbleGeometry = speechBubbleGeometryFromProfileObject(
          profile.objects["speech-bubble"]
        );
      } else {
        applyCanonicalSpeechBubbleState();
      }
      return true;
    }

    function getActiveLayoutBaseline() {
      if (importedBaselineProfile) {
        return {
          kind: "imported",
          profileId: importedBaselineProfile.profileId,
          profileName: importedBaselineProfile.profileName,
          profileVersion: importedBaselineProfile.profileVersion,
          source: importedBaselineProfile.source || "imported"
        };
      }
      var canonical =
        sceneRuntimeInstance &&
        typeof sceneRuntimeInstance.getCanonicalLayoutProfile === "function"
          ? sceneRuntimeInstance.getCanonicalLayoutProfile()
          : null;
      return {
        kind: "project",
        profileId: canonical ? canonical.profileId : EXPECTED_LAYOUT_PROFILE_ID,
        profileName: canonical
          ? canonical.profileName
          : LAYOUT_PROFILE_META.profileName,
        profileVersion: canonical
          ? canonical.profileVersion
          : LAYOUT_PROFILE_META.profileVersion,
        source: "project-canonical",
        filePath: CANONICAL_LAYOUT_FILE_PATH
      };
    }

    function syncProfileStatusPanel() {
      var baselineEl = document.getElementById("namoraLayoutBaselineStatus");
      var dirtyEl = document.getElementById("namoraLayoutDirtyStatus");
      var sourceEl = document.getElementById("namoraLayoutSourceStatus");
      if (!baselineEl || !dirtyEl || !sourceEl) return;
      var baseline = getActiveLayoutBaseline();
      baselineEl.textContent =
        LAYOUT_EDITOR_UI.currentBaseline +
        "：" +
        (baseline.kind === "imported"
          ? LAYOUT_EDITOR_UI.baselineImported
          : LAYOUT_EDITOR_UI.baselineProject);
      dirtyEl.textContent =
        LAYOUT_EDITOR_UI.unsavedChanges +
        "：" +
        (hasUnsavedChanges() ? LAYOUT_EDITOR_UI.yes : LAYOUT_EDITOR_UI.no);
      sourceEl.textContent =
        LAYOUT_EDITOR_UI.layoutSource +
        "：" +
        (baseline.kind === "imported"
          ? LAYOUT_EDITOR_UI.layoutSourceEditorImport
          : CANONICAL_LAYOUT_FILE_PATH);
    }

    function previewImportedLayoutProfile(profile) {
      profile = normalizeLayoutProfile(profile);
      if (!profile) {
        return {
          ok: false,
          errors: ["布局配置为空或无法解析"],
          preview: null
        };
      }
      var validation = validateLayoutProfile(profile);
      var reconstruction = testLayoutProfileSelfReconstruction(profile);
      var preview = getLayoutProfilePreview(profile);
      preview.validationStatus = validation.status;
      preview.validationErrors = validation.errors.slice();
      preview.reconstructionStatus = reconstruction.status;
      preview.reconstructionErrors = reconstruction.errors.slice();
      return {
        ok: validation.status === "PASS" && reconstruction.status === "PASS",
        errors: validation.errors.concat(reconstruction.errors),
        preview: preview,
        profile: cloneLayoutJson(profile)
      };
    }

    function applyImportedLayoutProfile(profile) {
      var prepared = previewImportedLayoutProfile(profile);
      if (!prepared.ok) {
        return {
          ok: false,
          errors: prepared.errors,
          preview: prepared.preview
        };
      }
      importedBaselineProfile = deepCloneLayoutProfile(prepared.profile);
      applyProfileToEditorState(importedBaselineProfile);
      pendingImportPreview = null;
      updateNamoraWorldLayout();
      refreshUserInputComponents();
      refreshAllViews();
      syncProfileStatusPanel();
      return {
        ok: true,
        errors: [],
        preview: prepared.preview
      };
    }

    function clearImportedLayoutProfile() {
      importedBaselineProfile = null;
      pendingImportPreview = null;
    }

    function restoreProjectCanonicalLayout() {
      clearImportedLayoutProfile();
      syncEditorFromRuntimeCanonical();
      cancelDrag(false);
      selectedControlPointId = null;
      updateNamoraWorldLayout();
      refreshAllViews();
      syncProfileStatusPanel();
      showProfileExportFeedback("已恢复项目默认布局", false);
      return true;
    }

    function importLayoutProfileFile(file) {
      if (!file) {
        return Promise.resolve({
          ok: false,
          errors: ["未选择文件"],
          preview: null
        });
      }
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var parsed = JSON.parse(String(reader.result || ""));
            var prepared = previewImportedLayoutProfile(parsed);
            resolve(prepared);
          } catch (err) {
            resolve({
              ok: false,
              errors: ["JSON 解析失败：" + (err.message || err)],
              preview: null
            });
          }
        };
        reader.onerror = function () {
          reject(new Error("文件读取失败"));
        };
        reader.readAsText(file, "utf-8");
      });
    }

    function clearAllTemporaryState() {
      temporaryAnchorOverrides = Object.create(null);
      temporarilyUnlockedAnchorIds = Object.create(null);
      temporaryWorldOverrides.standingPoint = null;
      resetUserInputDefaults();
      resetSpeechBubbleDefaults();
      cancelDrag(false);
      selectedControlPointId = null;
      if (enabled) updateNamoraWorldLayout();
    }

    function setOverride(anchorId, x, y) {
      if (!isEditableSpatialAnchor(anchorId)) return false;
      temporaryAnchorOverrides[anchorId] = { x: x, y: y };
      return true;
    }

    function removeOverride(anchorId) {
      if (!temporaryAnchorOverrides[anchorId]) return false;
      delete temporaryAnchorOverrides[anchorId];
      return true;
    }

    function cloneTemporaryCoordinates() {
      var out = Object.create(null);
      Object.keys(temporaryAnchorOverrides).forEach(function (anchorId) {
        out[anchorId] = {
          x: temporaryAnchorOverrides[anchorId].x,
          y: temporaryAnchorOverrides[anchorId].y
        };
      });
      return out;
    }

    function resolveObjectControlPoints(objectId, layout) {
      layout = layout || lastLayout;
      if (!layout) return [];

      var record = getObject(objectId);
      if (!record) return [];
      var points = [];

      if (objectId === "world-background") {
        points.push({
          id: "origin",
          label: LAYOUT_EDITOR_UI.worldOrigin,
          editable: false,
          x: 0,
          y: 0,
          space: "world"
        });

        var standingSource = getEffectiveStandingSource();
        points.push({
          id: BACKGROUND_STANDING_POINT_ID,
          label: standingSource.label,
          editable: true,
          x: standingSource.x,
          y: standingSource.y,
          space: "background-source",
          source: standingSource,
          status: standingSource.status
        });
      }

      if (objectId === "nana") {
        points.push({
          id: "origin",
          label: LAYOUT_EDITOR_UI.nanaOrigin,
          editable: false,
          x: layout.nana.nanaWorldX,
          y: layout.nana.nanaWorldY,
          space: "world"
        });

        NAMORA_ANCHOR_IDS.forEach(function (anchorId) {
          var worldPos = getEffectiveWorldPosition(anchorId);
          var source = getEffectiveSource(anchorId);
          if (!worldPos || !source) return;
          points.push({
            id: anchorId,
            label: getLayoutEditorAnchorLabel(anchorId, source.label),
            editable: true,
            x: worldPos.x,
            y: worldPos.y,
            space: "nana-local",
            source: source,
            status: source.status
          });
        });
      }

      if (objectId === "user-input-group" || objectId === "pearl" || objectId === "input-panel") {
        var pearlWorld = getUserInputWorldPosition(PEARL_ROOT_ID);
        var inputWorld = getUserInputWorldPosition(INPUT_ROOT_ID);
        var groupWorld = getUserInputWorldPosition(USER_INPUT_GROUP_ROOT_ID);
        var bound = isUserInputGroupBound();

        if (objectId === "user-input-group" || objectId === "pearl") {
          points.push({
            id: PEARL_ROOT_ID,
            label: getLayoutEditorAnchorLabel(PEARL_ROOT_ID),
            editable: true,
            x: pearlWorld.x,
            y: pearlWorld.y,
            space: bound ? "user-input-group-local" : "world",
            source: getUserInputEffectiveSource(PEARL_ROOT_ID),
            status: USER_INPUT_DEFAULTS.pearlStatus
          });
        }

        if (objectId === "user-input-group" || objectId === "input-panel") {
          points.push({
            id: INPUT_ROOT_ID,
            label: getLayoutEditorAnchorLabel(INPUT_ROOT_ID),
            editable: true,
            x: inputWorld.x,
            y: inputWorld.y,
            space: bound ? "user-input-group-local" : "world",
            source: getUserInputEffectiveSource(INPUT_ROOT_ID),
            status: USER_INPUT_DEFAULTS.inputStatus
          });
        }

        if (objectId === "user-input-group") {
          points.push({
            id: USER_INPUT_GROUP_ROOT_ID,
            label: getLayoutEditorAnchorLabel(USER_INPUT_GROUP_ROOT_ID),
            editable: bound,
            x: groupWorld ? groupWorld.x : null,
            y: groupWorld ? groupWorld.y : null,
            space: "world",
            source: getUserInputEffectiveSource(USER_INPUT_GROUP_ROOT_ID),
            status: bound ? "bound" : "unbound",
            inactive: !bound
          });
        }
      }

      if (record.anchor && isEditableSpatialAnchor(record.anchor)) {
        var existing = points.some(function (point) {
          return point.id === record.anchor;
        });
        if (!existing) {
          var worldPosLinked = getEffectiveWorldPosition(record.anchor);
          var sourceLinked = getEffectiveSource(record.anchor);
          if (worldPosLinked && sourceLinked) {
            points.push({
              id: record.anchor,
              label: getLayoutEditorAnchorLabel(record.anchor, sourceLinked.label),
              editable: true,
              x: worldPosLinked.x,
              y: worldPosLinked.y,
              space: "nana-local",
              source: sourceLinked,
              status: sourceLinked.status
            });
          }
        }
      } else if (record.anchor === PEARL_ROOT_ID || record.anchor === INPUT_ROOT_ID) {
        var existingUi = points.some(function (point) {
          return point.id === record.anchor;
        });
        if (!existingUi) {
          var worldUiLinked = getEffectiveWorldPosition(record.anchor);
          var sourceUiLinked = getEffectiveSource(record.anchor);
          if (worldUiLinked && sourceUiLinked) {
            points.push({
              id: record.anchor,
              label: getLayoutEditorAnchorLabel(record.anchor, sourceUiLinked.label),
              editable: true,
              x: worldUiLinked.x,
              y: worldUiLinked.y,
              space: sourceUiLinked.coordinateSpace,
              source: sourceUiLinked,
              status: sourceUiLinked.status
            });
          }
        }
      } else       if (record.anchor === "send") {
        points.push({
          id: "send",
          label: getLayoutEditorAnchorLabel("send", "Send Anchor"),
          editable: false,
          x: null,
          y: null,
          space: "input-local",
          planned: true
        });
      }

      if (objectId === "speech-bubble") {
        SPEECH_BUBBLE_POINT_IDS.forEach(function (pointId) {
          var worldPos = getSpeechBubblePointWorld(pointId);
          var source = getSpeechBubbleControlPointSource(pointId);
          if (!worldPos || !source) return;
          points.push({
            id: pointId,
            label: getLayoutEditorAnchorLabel(pointId, source.label),
            editable: pointId !== BUBBLE_ROOT_ID,
            x: worldPos.x,
            y: worldPos.y,
            space: "speech-bubble-local",
            source: source,
            status: source.status,
            readonly: pointId === BUBBLE_ROOT_ID
          });
        });
      }

      return points;
    }

    function resolveObjectBounds(objectId, layout) {
      layout = layout || lastLayout;
      if (!layout) return null;

      if (objectId === "world-background") {
        return {
          x: 0,
          y: 0,
          width: layout.world.sourceWidth,
          height: layout.world.sourceHeight
        };
      }

      if (objectId === "nana") {
        return {
          x: layout.nana.nanaWorldX,
          y: layout.nana.nanaWorldY,
          width: layout.nana.nanaWorldWidth,
          height: layout.nana.nanaWorldHeight
        };
      }

      if (objectId === "speech-bubble") {
        var geometry = getEffectiveSpeechBubbleGeometryEditor();
        var transform = getSpeechBubbleWorldTransformEditor();
        if (!geometry || !transform) return null;
        return {
          x: transform.worldOrigin.x,
          y: transform.worldOrigin.y,
          width: geometry.localSize.width,
          height: geometry.localSize.height
        };
      }

      return null;
    }

    function buildObjectTreeData() {
      var recordsById = Object.create(null);
      listObjects().forEach(function (record) {
        recordsById[record.id] = record;
      });

      var childrenByParent = Object.create(null);
      LAYOUT_EDITOR_TREE_ORDER.forEach(function (objectId) {
        var record = recordsById[objectId];
        if (!record) return;
        var parentKey = getStructuralParentId(record) || "__root__";
        if (!childrenByParent[parentKey]) childrenByParent[parentKey] = [];
        childrenByParent[parentKey].push(objectId);
      });

      function buildBranch(parentId, depth) {
        var ids = childrenByParent[parentId || "__root__"] || [];
        return ids.map(function (objectId) {
          var record = recordsById[objectId];
          return {
            id: objectId,
            label: getDisplayLabel(objectId),
            icon: getObjectIcon(objectId),
            depth: depth,
            disabled: !record.enabled,
            status: getObjectStatus(record),
            children: buildBranch(objectId, depth + 1)
          };
        });
      }

      return [
        {
          id: null,
          label: LAYOUT_EDITOR_UI.worldRoot,
          icon: getObjectIcon("__world__"),
          depth: 0,
          disabled: false,
          status: "active",
          isGroup: true,
          children: buildBranch(null, 1)
        }
      ];
    }

    function renderTreeNode(node) {
      var li = document.createElement("li");
      li.className = "namora-layout-editor__node";
      li.setAttribute("role", "treeitem");

      if (node.isGroup) {
        var groupLabel = document.createElement("span");
        groupLabel.className = "namora-layout-editor__group-label";
        groupLabel.style.paddingLeft = (0.85 + node.depth * 0.75) + "rem";
        groupLabel.textContent = (node.icon ? node.icon + " " : "") + node.label;
        li.appendChild(groupLabel);
      } else {
        li.setAttribute("aria-selected", node.id === selectedObjectId ? "true" : "false");

        var button = document.createElement("button");
        button.type = "button";
        button.className = "namora-layout-editor__label";
        button.style.paddingLeft = (0.85 + node.depth * 0.75) + "rem";
        button.dataset.objectId = node.id;
        button.title = node.label;

        if (node.id === selectedObjectId) button.classList.add("is-selected");
        if (node.disabled) button.classList.add("is-disabled");

        var nameSpan = document.createElement("span");
        nameSpan.textContent = (node.icon ? node.icon + " " : "") + node.label;
        button.appendChild(nameSpan);

        if (node.disabled) {
          var badge = document.createElement("span");
          badge.className = "namora-layout-editor__badge";
          badge.textContent = LAYOUT_EDITOR_UI.notEnabledBadge;
          button.appendChild(badge);
        }

        button.addEventListener("click", function () {
          selectObject(node.id);
        });

        li.appendChild(button);
      }

      if (node.children.length > 0) {
        var childList = document.createElement("ul");
        childList.setAttribute("role", "group");
        node.children.forEach(function (child) {
          childList.appendChild(renderTreeNode(child));
        });
        li.appendChild(childList);
      }

      return li;
    }

    function renderObjectTree() {
      if (!treeEl) return;
      treeEl.textContent = "";
      buildObjectTreeData().forEach(function (node) {
        treeEl.appendChild(renderTreeNode(node));
      });
    }

    function appendField(container, label, value, options) {
      options = options || {};
      var fieldEl = document.createElement("div");
      fieldEl.className = "namora-layout-editor__field";
      if (options.className) fieldEl.className += " " + options.className;

      var labelEl = document.createElement("span");
      labelEl.className = "namora-layout-editor__field-label";
      labelEl.textContent = label;

      var valueEl = document.createElement("div");
      valueEl.className = "namora-layout-editor__field-value";
      if (options.muted) valueEl.classList.add("namora-layout-editor__field-value--muted");
      if (options.html) {
        valueEl.innerHTML = value;
      } else {
        valueEl.textContent = value;
      }

      fieldEl.appendChild(labelEl);
      fieldEl.appendChild(valueEl);
      container.appendChild(fieldEl);
      return fieldEl;
    }

    function appendCoordPair(container, label, xLabel, xValue, yLabel, yValue) {
      var fieldEl = document.createElement("div");
      fieldEl.className = "namora-layout-editor__field";

      var labelEl = document.createElement("span");
      labelEl.className = "namora-layout-editor__field-label";
      labelEl.textContent = label;
      fieldEl.appendChild(labelEl);

      var grid = document.createElement("div");
      grid.className = "namora-layout-editor__coord-grid";
      grid.innerHTML =
        "<div><span>" + xLabel + "</span><strong>" + xValue + "</strong></div>" +
        "<div><span>" + yLabel + "</span><strong>" + yValue + "</strong></div>";
      fieldEl.appendChild(grid);
      container.appendChild(fieldEl);
    }

    function renderControlPointDetails(container, anchorId) {
      if (isSpeechBubblePoint(anchorId)) {
        var bubbleSource = getSpeechBubbleControlPointSource(anchorId);
        var bubbleWorld = getSpeechBubblePointWorld(anchorId);
        var bubbleViewport = bubbleWorld
          ? worldToViewportPoint(bubbleWorld.x, bubbleWorld.y)
          : null;
        if (!bubbleSource || !bubbleWorld || !bubbleViewport) return;

        appendField(
          container,
          LAYOUT_EDITOR_UI.controlPointName,
          getLayoutEditorAnchorLabel(anchorId, bubbleSource.label)
        );
        appendField(container, LAYOUT_EDITOR_UI.controlPointId, anchorId, { muted: true });
        appendField(
          container,
          LAYOUT_EDITOR_UI.coordinateSpace,
          "speech-bubble-local（Speech Bubble 局部）"
        );
        appendField(
          container,
          "附着目标",
          "nana.anchors.dialogue-tail",
          { muted: true }
        );
        appendCoordPair(
          container,
          LAYOUT_EDITOR_UI.localCoordinates,
          "X",
          formatLayoutEditorWorld(bubbleSource.x),
          "Y",
          formatLayoutEditorWorld(bubbleSource.y)
        );
        appendCoordPair(
          container,
          LAYOUT_EDITOR_UI.worldCoordinates,
          "X",
          formatLayoutEditorWorld(bubbleWorld.x),
          "Y",
          formatLayoutEditorWorld(bubbleWorld.y)
        );
        appendCoordPair(
          container,
          LAYOUT_EDITOR_UI.viewportCoordinates,
          "X",
          formatLayoutEditorWorld(bubbleViewport.x),
          "Y",
          formatLayoutEditorWorld(bubbleViewport.y)
        );
        appendCoordPair(
          container,
          LAYOUT_EDITOR_UI.canonicalCoordinates,
          "X",
          formatLayoutEditorWorld(bubbleSource.canonicalX),
          "Y",
          formatLayoutEditorWorld(bubbleSource.canonicalY)
        );
        return;
      }

      var source = getEffectiveSource(anchorId);
      var worldPos = getEffectiveWorldPosition(anchorId);
      var viewportPos = getEffectiveViewportPosition(anchorId);

      if (isUserInputPoint(anchorId)) {
        if (!source) return;
        var isGroupInactive =
          anchorId === USER_INPUT_GROUP_ROOT_ID && !isUserInputGroupBound();

        appendField(
          container,
          LAYOUT_EDITOR_UI.controlPointName,
          getLayoutEditorAnchorLabel(anchorId, source.label)
        );
        appendField(container, LAYOUT_EDITOR_UI.controlPointId, anchorId, { muted: true });
        appendField(
          container,
          LAYOUT_EDITOR_UI.productionStatus,
          getLayoutEditorStatusLabel(source.status)
        );
        appendField(
          container,
          LAYOUT_EDITOR_UI.editStatus,
          getLayoutEditorStatusLabel(getEditStatusKey(anchorId))
        );
        appendField(
          container,
          LAYOUT_EDITOR_UI.bindingState,
          getLayoutEditorStatusLabel(isUserInputGroupBound() ? "bound" : "unbound")
        );
        appendField(
          container,
          LAYOUT_EDITOR_UI.parentGroup,
          "user-input-group",
          { muted: true }
        );
        appendField(
          container,
          LAYOUT_EDITOR_UI.coordinateSpace,
          source.coordinateSpace === "user-input-group-local"
            ? LAYOUT_EDITOR_UI.userInputGroupLocalSpace
            : LAYOUT_EDITOR_UI.worldSpace
        );

        if (isGroupInactive) {
          appendField(container, "说明", LAYOUT_EDITOR_UI.groupRootInactive, { muted: true });
          return;
        }

        if (!worldPos || !viewportPos) return;

        if (source.purpose) {
          appendField(container, "说明", source.purpose, { muted: true });
        }

        appendCoordPair(
          container,
          LAYOUT_EDITOR_UI.worldCoordinates,
          "X",
          formatLayoutEditorWorld(worldPos.x),
          "Y",
          formatLayoutEditorWorld(worldPos.y)
        );

        if (source.local) {
          appendCoordPair(
            container,
            LAYOUT_EDITOR_UI.localCoordinates,
            "X",
            formatLayoutEditorWorld(source.local.x),
            "Y",
            formatLayoutEditorWorld(source.local.y)
          );
        }

        appendCoordPair(
          container,
          LAYOUT_EDITOR_UI.viewportCoordinates,
          "X",
          formatLayoutEditorWorld(viewportPos.x),
          "Y",
          formatLayoutEditorWorld(viewportPos.y)
        );
        appendCoordPair(
          container,
          LAYOUT_EDITOR_UI.canonicalCoordinates,
          "X",
          formatLayoutEditorWorld(source.canonicalX),
          "Y",
          formatLayoutEditorWorld(source.canonicalY)
        );
        appendCoordPair(
          container,
          LAYOUT_EDITOR_UI.temporaryOffset,
          "ΔX",
          formatLayoutEditorWorld(source.deltaX),
          "ΔY",
          formatLayoutEditorWorld(source.deltaY)
        );
        return;
      }

      if (!source || !worldPos || !viewportPos) return;

      var isStanding = isBackgroundStandingPoint(anchorId);

      appendField(
        container,
        LAYOUT_EDITOR_UI.controlPointName,
        getLayoutEditorAnchorLabel(anchorId, source.label)
      );
      appendField(container, LAYOUT_EDITOR_UI.controlPointId, anchorId, { muted: true });
      appendField(
        container,
        LAYOUT_EDITOR_UI.productionStatus,
        getLayoutEditorStatusLabel(source.status)
      );
      appendField(
        container,
        LAYOUT_EDITOR_UI.editStatus,
        getLayoutEditorStatusLabel(getEditStatusKey(anchorId))
      );

      if (requiresTemporaryUnlock(anchorId)) {
        var actions = document.createElement("div");
        actions.className = "namora-layout-editor__actions";

        var unlockBtn = document.createElement("button");
        unlockBtn.type = "button";
        unlockBtn.className = "namora-layout-editor__action-btn";
        unlockBtn.setAttribute("data-editor-action", isControlPointTemporarilyUnlocked(anchorId)
          ? "temp-lock"
          : "temp-unlock");
        unlockBtn.setAttribute("data-anchor-id", anchorId);
        unlockBtn.textContent = isControlPointTemporarilyUnlocked(anchorId)
          ? LAYOUT_EDITOR_UI.lockTemporary
          : LAYOUT_EDITOR_UI.unlockTemporary;
        actions.appendChild(unlockBtn);
        container.appendChild(actions);
      }

      if (editFeedbackMessage) {
        appendField(container, "提示", editFeedbackMessage, { muted: false });
      }

      appendField(
        container,
        LAYOUT_EDITOR_UI.coordinateSpace,
        isStanding ? LAYOUT_EDITOR_UI.backgroundSourceSpace : LAYOUT_EDITOR_UI.nanaLocalSpace
      );

      if (isStanding) {
        appendField(
          container,
          LAYOUT_EDITOR_UI.activeSourceDimensions,
          NAMORA_WORLD.sourceWidth + " × " + NAMORA_WORLD.sourceHeight
        );
        appendField(
          container,
          "说明",
          standingSource.status === "temporary-candidate"
            ? LAYOUT_EDITOR_UI.standingPointCandidateNote
            : "已批准站立点（locked）。",
          { muted: true }
        );
        appendField(
          container,
          "预览说明",
          LAYOUT_EDITOR_UI.standingPointPreviewNote,
          { muted: true }
        );
      }

      appendCoordPair(
        container,
        LAYOUT_EDITOR_UI.sourceCoordinates,
        "X",
        formatLayoutEditorSource(source.x),
        "Y",
        formatLayoutEditorSource(source.y)
      );
      appendCoordPair(
        container,
        LAYOUT_EDITOR_UI.normalizedCoordinates,
        "U",
        formatLayoutEditorUv(source.u),
        "V",
        formatLayoutEditorUv(source.v)
      );
      appendCoordPair(
        container,
        LAYOUT_EDITOR_UI.worldCoordinates,
        "X",
        formatLayoutEditorWorld(worldPos.x),
        "Y",
        formatLayoutEditorWorld(worldPos.y)
      );
      appendCoordPair(
        container,
        LAYOUT_EDITOR_UI.viewportCoordinates,
        "X",
        formatLayoutEditorWorld(viewportPos.x),
        "Y",
        formatLayoutEditorWorld(viewportPos.y)
      );
      appendCoordPair(
        container,
        LAYOUT_EDITOR_UI.canonicalCoordinates,
        "X",
        formatLayoutEditorSource(source.canonicalX),
        "Y",
        formatLayoutEditorSource(source.canonicalY)
      );
      appendCoordPair(
        container,
        LAYOUT_EDITOR_UI.temporaryOffset,
        "ΔX",
        formatLayoutEditorSource(source.deltaX),
        "ΔY",
        formatLayoutEditorSource(source.deltaY)
      );

      if (anchorId === "foot") {
        appendField(container, "预览说明", LAYOUT_EDITOR_UI.footPreviewNote, { muted: true });
      }
    }

    function renderPropertiesPanel() {
      if (!propsEl) return;

      if (!selectedObjectId && !selectedControlPointId) {
        propsEl.innerHTML =
          '<p class="namora-layout-editor__empty">' + LAYOUT_EDITOR_UI.selectObject + "</p>";
        return;
      }

      propsEl.textContent = "";

      if (selectedObjectId) {
        var record = getObject(selectedObjectId);
        if (!record) {
          propsEl.innerHTML =
            '<p class="namora-layout-editor__empty">' + LAYOUT_EDITOR_UI.objectNotFound + "</p>";
          return;
        }

        var typeLabel =
          LAYOUT_EDITOR_OBJECT_TYPE_LABELS[record.type] || record.type || LAYOUT_EDITOR_UI.none;
        var structuralLabel = record.structuralParentId
          ? getDisplayLabel(record.structuralParentId) + " (" + record.structuralParentId + ")"
          : LAYOUT_EDITOR_UI.none;
        var transformLabel = record.transformParentId
          ? getDisplayLabel(record.transformParentId) + " (" + record.transformParentId + ")"
          : LAYOUT_EDITOR_UI.none;
        if (
          (record.id === "pearl" || record.id === "input-panel") &&
          layoutEditorInstance &&
          typeof layoutEditorInstance.isUserInputGroupBound === "function" &&
          !layoutEditorInstance.isUserInputGroupBound()
        ) {
          transformLabel = LAYOUT_EDITOR_UI.none;
        }
        var anchorLabel = record.anchor
          ? getLayoutEditorAnchorLabel(record.anchor, record.anchor) + " (" + record.anchor + ")"
          : "null";

        appendField(propsEl, LAYOUT_EDITOR_UI.objectName, getDisplayLabel(record.id));
        appendField(propsEl, LAYOUT_EDITOR_UI.objectId, record.id, { muted: true });
        appendField(propsEl, LAYOUT_EDITOR_UI.objectType, typeLabel);
        var displayCoordinateSpace = record.coordinateSpace;
        if (
          (record.id === "pearl" || record.id === "input-panel") &&
          layoutEditorInstance &&
          typeof layoutEditorInstance.isUserInputGroupBound === "function"
        ) {
          displayCoordinateSpace = layoutEditorInstance.isUserInputGroupBound()
            ? "user-input-group-local"
            : "world";
        }
        appendField(propsEl, LAYOUT_EDITOR_UI.coordinateSpace, displayCoordinateSpace);
        appendField(propsEl, LAYOUT_EDITOR_UI.structuralParent, structuralLabel, { muted: true });
        appendField(propsEl, LAYOUT_EDITOR_UI.transformParent, transformLabel, { muted: true });
        appendField(propsEl, LAYOUT_EDITOR_UI.coordinateOwner, record.coordinateOwner, {
          muted: true
        });
        appendField(propsEl, LAYOUT_EDITOR_UI.anchor, anchorLabel, { muted: true });
        appendField(
          propsEl,
          LAYOUT_EDITOR_UI.status,
          getLayoutEditorStatusLabel(getObjectStatus(record))
        );
        appendField(
          propsEl,
          LAYOUT_EDITOR_UI.rendererBinding,
          record.rendererBinding || "null",
          { muted: true }
        );

        if (record.id === "speech-bubble") {
          var bubbleGeometry = getEffectiveSpeechBubbleGeometryEditor();
          var bubbleTransform = getSpeechBubbleWorldTransformEditor();
          if (bubbleGeometry && bubbleTransform) {
            appendField(
              propsEl,
              "附着目标",
              "nana.anchors.dialogue-tail",
              { muted: true }
            );
            appendField(
              propsEl,
              "局部尺寸",
              bubbleGeometry.localSize.width +
                " × " +
                bubbleGeometry.localSize.height
            );
            appendCoordPair(
              propsEl,
              "世界原点",
              "X",
              formatLayoutEditorWorld(bubbleTransform.worldOrigin.x),
              "Y",
              formatLayoutEditorWorld(bubbleTransform.worldOrigin.y)
            );
            var bubbleBounds = resolveObjectBounds("speech-bubble", lastLayout);
            if (bubbleBounds) {
              var vpTopLeft = worldToViewportPoint(bubbleBounds.x, bubbleBounds.y);
              var vpBottomRight = worldToViewportPoint(
                bubbleBounds.x + bubbleBounds.width,
                bubbleBounds.y + bubbleBounds.height
              );
              appendField(
                propsEl,
                "视口边界",
                formatLayoutEditorWorld(vpTopLeft.x) +
                  ", " +
                  formatLayoutEditorWorld(vpTopLeft.y) +
                  " → " +
                  formatLayoutEditorWorld(vpBottomRight.x) +
                  ", " +
                  formatLayoutEditorWorld(vpBottomRight.y),
                { muted: true }
              );
            }
            appendField(
              propsEl,
              "尾点注册误差",
              bubbleTransform.registrationErrorPx.toFixed(4) + " px",
              { muted: true }
            );
          }
        }

        var controlPoints = resolveObjectControlPoints(selectedObjectId);
        var listLabel = document.createElement("div");
        listLabel.className = "namora-layout-editor__field";
        listLabel.innerHTML =
          '<span class="namora-layout-editor__field-label">' +
          LAYOUT_EDITOR_UI.controlPoints +
          "</span>";
        propsEl.appendChild(listLabel);

        var list = document.createElement("div");
        list.className = "namora-layout-editor__cp-list";

        if (controlPoints.length === 0) {
          list.textContent = LAYOUT_EDITOR_UI.none;
        } else {
          controlPoints.forEach(function (point) {
            var row = document.createElement("button");
            row.type = "button";
            row.className = "namora-layout-editor__cp-row";
            if (point.id === selectedControlPointId) row.classList.add("is-selected");
            if (point.editable) row.classList.add("is-editable");
            row.dataset.controlPointId = point.id;

            var title = point.label;
            if (point.planned) title += " · " + getLayoutEditorStatusLabel("planned");
            if (point.editable && point.source && point.source.isTemporary) {
              title += " · " + LAYOUT_EDITOR_UI.dirty;
            }
            row.textContent = title;

            if (point.inactive) {
              row.disabled = true;
            } else if (point.editable || isEditableControlPointId(point.id)) {
              row.addEventListener("click", function () {
                selectControlPoint(point.id);
              });
            } else {
              row.disabled = true;
            }

            list.appendChild(row);
          });
        }

        propsEl.appendChild(list);
      }

      if (selectedControlPointId && isEditableControlPointId(selectedControlPointId)) {
        var divider = document.createElement("div");
        divider.className = "namora-layout-editor__divider";
        divider.textContent = "控制点详情";
        propsEl.appendChild(divider);
        renderControlPointDetails(propsEl, selectedControlPointId);
      }

      var dirtyEl = document.createElement("div");
      dirtyEl.className = "namora-layout-editor__dirty";
      dirtyEl.textContent = hasUnsavedChanges()
        ? LAYOUT_EDITOR_UI.dirty
        : LAYOUT_EDITOR_UI.clean;
      propsEl.appendChild(dirtyEl);
    }

    function ensurePointElement(pointId) {
      if (pointElements[pointId]) return pointElements[pointId];
      var el = document.createElement("div");
      el.className = "namora-layout-selection__point";
      el.dataset.pointId = pointId;
      el.setAttribute("role", "button");
      selectionPointsEl.appendChild(el);
      pointElements[pointId] = el;
      return el;
    }

    function syncToolbar() {
      if (!toolbarEl) return;
      var tools = toolbarEl.querySelectorAll("[data-tool]");
      tools.forEach(function (btn) {
        var tool = btn.getAttribute("data-tool");
        if (tool === "select" || tool === "move") {
          btn.disabled = false;
          btn.classList.toggle("is-active", tool === activeTool);
        } else if (tool === "components") {
          btn.disabled = false;
          btn.classList.toggle("is-active", sceneComponentPreviewEnabled);
          btn.setAttribute(
            "aria-pressed",
            sceneComponentPreviewEnabled ? "true" : "false"
          );
          btn.textContent =
            "显示组件：" + (sceneComponentPreviewEnabled ? "开" : "关");
        } else if (
          tool === "reset-current" ||
          tool === "reset-all" ||
          tool === "copy" ||
          tool === "export" ||
          tool === "preview-profile" ||
          tool === "import" ||
          tool === "restore-canonical"
        ) {
          btn.disabled = false;
          btn.classList.remove("is-active");
        }
      });
    }

    function refreshSelectionOverlay(layout) {
      if (!enabled || !selectionEl || !selectionBoundsEl || !selectionPointsEl) return;
      layout = layout || lastLayout;

      selectionEl.hidden = false;

      var bounds = selectedObjectId ? resolveObjectBounds(selectedObjectId, layout) : null;
      if (bounds) {
        selectionBoundsEl.classList.remove("is-hidden");
        selectionBoundsEl.style.left = bounds.x + "px";
        selectionBoundsEl.style.top = bounds.y + "px";
        selectionBoundsEl.style.width = bounds.width + "px";
        selectionBoundsEl.style.height = bounds.height + "px";
      } else {
        selectionBoundsEl.classList.add("is-hidden");
      }

      var activePointIds = Object.create(null);

      NAMORA_ANCHOR_IDS.forEach(function (anchorId) {
        var worldPos = getEffectiveWorldPosition(anchorId);
        if (!worldPos) return;
        activePointIds[anchorId] = true;
        var el = ensurePointElement(anchorId);
        el.hidden = false;
        el.style.left = worldPos.x + "px";
        el.style.top = worldPos.y + "px";
        el.title = getLayoutEditorAnchorLabel(anchorId, worldPos.label);
        el.classList.toggle("is-active-point", anchorId === selectedControlPointId);
        el.classList.toggle(
          "is-editable",
          isTemporarilyEditable(anchorId) && activeTool === "move"
        );
        el.classList.toggle("is-locked-temp", !isTemporarilyEditable(anchorId));
        el.classList.toggle(
          "is-temp-unlocked",
          requiresTemporaryUnlock(anchorId) && isControlPointTemporarilyUnlocked(anchorId)
        );
        el.classList.remove("is-standing-point");
        el.classList.remove("is-pearl-root", "is-input-root", "is-user-input-group-root");
        el.dataset.tempUnlocked = isTemporarilyEditable(anchorId) ? "1" : "0";
        el.style.pointerEvents = "auto";
        el.style.cursor =
          activeTool === "move" && isTemporarilyEditable(anchorId) ? "grab" : "pointer";
        el.style.touchAction = "none";
        el.setAttribute("aria-grabbed", dragState && dragState.anchorId === anchorId ? "true" : "false");
      });

      // Background Standing Point — always visible in editor mode (registration preview)
      var standingWorld = getEffectiveWorldPosition(BACKGROUND_STANDING_POINT_ID);
      if (standingWorld) {
        activePointIds[BACKGROUND_STANDING_POINT_ID] = true;
        var standingEl = ensurePointElement(BACKGROUND_STANDING_POINT_ID);
        standingEl.hidden = false;
        standingEl.style.left = standingWorld.x + "px";
        standingEl.style.top = standingWorld.y + "px";
        standingEl.title = standingWorld.label;
        standingEl.classList.add("is-standing-point");
        standingEl.classList.remove(
          "is-pearl-root",
          "is-input-root",
          "is-user-input-group-root"
        );
        standingEl.classList.toggle(
          "is-active-point",
          selectedControlPointId === BACKGROUND_STANDING_POINT_ID
        );
        standingEl.classList.toggle(
          "is-editable",
          activeTool === "move"
        );
        standingEl.classList.remove("is-locked-temp", "is-temp-unlocked", "is-readonly-point");
        standingEl.dataset.tempUnlocked = "1";
        standingEl.style.pointerEvents = "auto";
        standingEl.style.cursor = activeTool === "move" ? "grab" : "pointer";
        standingEl.style.touchAction = "none";
        standingEl.setAttribute(
          "aria-grabbed",
          dragState && dragState.anchorId === BACKGROUND_STANDING_POINT_ID ? "true" : "false"
        );
      }

      // User Input spatial points (independent of NANA)
      ensureUserInputStateExists();
      var userInputVisibleIds = [PEARL_ROOT_ID, INPUT_ROOT_ID];
      if (isUserInputGroupBound()) {
        userInputVisibleIds.push(USER_INPUT_GROUP_ROOT_ID);
      }

      userInputVisibleIds.forEach(function (pointId) {
        var uiWorld = getEffectiveWorldPosition(pointId);
        if (!uiWorld) return;
        activePointIds[pointId] = true;
        var uiEl = ensurePointElement(pointId);
        uiEl.hidden = false;
        uiEl.style.left = uiWorld.x + "px";
        uiEl.style.top = uiWorld.y + "px";
        uiEl.title = getLayoutEditorAnchorLabel(pointId, uiWorld.label);
        uiEl.classList.remove("is-standing-point", "is-locked-temp", "is-temp-unlocked", "is-readonly-point");
        uiEl.classList.toggle("is-pearl-root", pointId === PEARL_ROOT_ID);
        uiEl.classList.toggle("is-input-root", pointId === INPUT_ROOT_ID);
        uiEl.classList.toggle(
          "is-user-input-group-root",
          pointId === USER_INPUT_GROUP_ROOT_ID
        );
        uiEl.classList.toggle("is-active-point", pointId === selectedControlPointId);
        uiEl.classList.toggle(
          "is-editable",
          isTemporarilyEditable(pointId) && activeTool === "move"
        );
        uiEl.dataset.tempUnlocked = "1";
        uiEl.style.pointerEvents = "auto";
        uiEl.style.cursor =
          activeTool === "move" && isTemporarilyEditable(pointId) ? "grab" : "pointer";
        uiEl.style.touchAction = "none";
        uiEl.setAttribute(
          "aria-grabbed",
          dragState && dragState.anchorId === pointId ? "true" : "false"
        );
      });

      if (
        selectedObjectId === "speech-bubble" ||
        isSpeechBubblePoint(selectedControlPointId)
      ) {
        SPEECH_BUBBLE_POINT_IDS.forEach(function (pointId) {
          var bubbleWorld = getSpeechBubblePointWorld(pointId);
          if (!bubbleWorld) return;
          activePointIds[pointId] = true;
          var bubbleEl = ensurePointElement(pointId);
          bubbleEl.hidden = false;
          bubbleEl.style.left = bubbleWorld.x + "px";
          bubbleEl.style.top = bubbleWorld.y + "px";
          bubbleEl.title = getLayoutEditorAnchorLabel(pointId);
          bubbleEl.classList.remove(
            "is-standing-point",
            "is-pearl-root",
            "is-input-root",
            "is-user-input-group-root",
            "is-locked-temp",
            "is-temp-unlocked"
          );
          bubbleEl.classList.toggle("is-bubble-root", pointId === BUBBLE_ROOT_ID);
          bubbleEl.classList.toggle("is-bubble-tail", pointId === BUBBLE_TAIL_ID);
          bubbleEl.classList.toggle(
            "is-bubble-body-center",
            pointId === BUBBLE_BODY_CENTER_ID
          );
          bubbleEl.classList.toggle(
            "is-bubble-text-origin",
            pointId === BUBBLE_TEXT_ORIGIN_ID
          );
          bubbleEl.classList.toggle("is-active-point", pointId === selectedControlPointId);
          bubbleEl.classList.toggle(
            "is-editable",
            pointId !== BUBBLE_ROOT_ID && activeTool === "move"
          );
          bubbleEl.classList.toggle("is-readonly-point", pointId === BUBBLE_ROOT_ID);
          bubbleEl.dataset.tempUnlocked = pointId === BUBBLE_ROOT_ID ? "0" : "1";
          bubbleEl.style.pointerEvents = pointId === BUBBLE_ROOT_ID ? "none" : "auto";
          bubbleEl.style.cursor =
            pointId !== BUBBLE_ROOT_ID && activeTool === "move" ? "grab" : "default";
          bubbleEl.style.touchAction = "none";
          bubbleEl.setAttribute(
            "aria-grabbed",
            dragState && dragState.anchorId === pointId ? "true" : "false"
          );
        });
      }

      if (selectedObjectId === "world-background" && layout) {
        activePointIds.origin = true;
        var originEl = ensurePointElement("origin");
        originEl.hidden = false;
        originEl.style.left = "0px";
        originEl.style.top = "0px";
        originEl.title = LAYOUT_EDITOR_UI.worldOrigin;
        originEl.classList.remove(
          "is-active-point",
          "is-editable",
          "is-standing-point",
          "is-pearl-root",
          "is-input-root",
          "is-user-input-group-root"
        );
        originEl.classList.add("is-readonly-point");
        originEl.style.pointerEvents = "none";
        originEl.style.cursor = "default";
      }

      Object.keys(pointElements).forEach(function (pointId) {
        if (!activePointIds[pointId]) pointElements[pointId].hidden = true;
      });

      if (sceneComponentPreviewEnabled) {
        [PEARL_ROOT_ID, INPUT_ROOT_ID].forEach(function (pointId) {
          if (pointElements[pointId]) pointElements[pointId].hidden = true;
        });
      }

      // Rebinding during an active drag can disrupt pointer capture / scene math
      if (!dragState) {
        bindPointElementHandlers();
      }

      syncUserInputGroupPanel();
      refreshSceneComponents();
    }

    function syncUserInputGroupPanel() {
      if (!uigStatusEl) return;
      uigStatusEl.textContent = isUserInputGroupBound()
        ? getLayoutEditorStatusLabel("bound")
        : getLayoutEditorStatusLabel("unbound");
      if (!uigPanelEl) return;
      var bindBtn = uigPanelEl.querySelector('[data-editor-action="bind-user-input"]');
      var unbindBtn = uigPanelEl.querySelector('[data-editor-action="unbind-user-input"]');
      if (bindBtn) bindBtn.disabled = isUserInputGroupBound();
      if (unbindBtn) unbindBtn.disabled = !isUserInputGroupBound();
    }

    function syncProfileStatusChrome() {
      var statusEl = document.getElementById("namoraLayoutProfileStatus");
      if (!statusEl) return;
      var dirtyLabel = hasUnsavedChanges()
        ? LAYOUT_EDITOR_UI.yes
        : LAYOUT_EDITOR_UI.no;
      var label = statusEl.querySelector("[data-profile-status-label]");
      if (!label) {
        label = statusEl.querySelector("span");
      }
      if (label && !label.id) {
        label.setAttribute("data-profile-status-label", "1");
        label.textContent =
          LAYOUT_EDITOR_UI.currentProfile +
          "：" +
          LAYOUT_PROFILE_META.profileName +
          " · " +
          LAYOUT_EDITOR_UI.unsavedChanges +
          "：" +
          dirtyLabel;
      } else if (label) {
        label.textContent =
          LAYOUT_EDITOR_UI.currentProfile +
          "：" +
          LAYOUT_PROFILE_META.profileName +
          " · " +
          LAYOUT_EDITOR_UI.unsavedChanges +
          "：" +
          dirtyLabel;
      }
    }

    function refreshAllViews() {
      renderObjectTree();
      renderPropertiesPanel();
      refreshSelectionOverlay(lastLayout);
      syncToolbar();
      syncProfileStatusChrome();
    }

    function selectObject(objectId) {
      if (!objectId || !getObject(objectId)) return null;
      selectedObjectId = objectId;
      if (
        selectedControlPointId &&
        !resolveObjectControlPoints(objectId).some(function (point) {
          return point.id === selectedControlPointId;
        }) &&
        !(objectId === "nana" && isEditableSpatialAnchor(selectedControlPointId)) &&
        !(objectId === "world-background" && isBackgroundStandingPoint(selectedControlPointId)) &&
        !(
          (objectId === "user-input-group" ||
            objectId === "pearl" ||
            objectId === "input-panel") &&
          isUserInputPoint(selectedControlPointId)
        ) &&
        !(objectId === "speech-bubble" && isSpeechBubblePoint(selectedControlPointId))
      ) {
        selectedControlPointId = null;
      }
      refreshAllViews();
      return getSelectedObject();
    }

    function selectControlPoint(anchorId, options) {
      options = options || {};
      if (!anchorId || !isEditableControlPointId(anchorId)) return null;
      if (anchorId === USER_INPUT_GROUP_ROOT_ID && !isUserInputGroupBound()) {
        return null;
      }
      selectedControlPointId = anchorId;
      if (isBackgroundStandingPoint(anchorId)) {
        selectedObjectId = "world-background";
      } else if (isUserInputPoint(anchorId)) {
        selectedObjectId = objectIdForUserInputPoint(anchorId);
      } else if (isSpeechBubblePoint(anchorId)) {
        selectedObjectId = SPEECH_BUBBLE_COMPONENT_ID;
      } else {
        selectedObjectId = "nana";
      }
      if (!options.silent) {
        editFeedbackMessage = null;
        refreshAllViews();
      } else {
        refreshSelectionOverlay(lastLayout);
        renderObjectTree();
      }
      return getSelectedControlPoint();
    }

    function getSelectedObject() {
      return selectedObjectId ? getObject(selectedObjectId) : null;
    }

    function getSelectedControlPoint() {
      if (!selectedControlPointId) return null;
      if (isSpeechBubblePoint(selectedControlPointId)) {
        var bubbleSource = getSpeechBubbleControlPointSource(selectedControlPointId);
        if (!bubbleSource) return null;
        var bubbleWorld = getSpeechBubblePointWorld(selectedControlPointId);
        var bubbleViewport = bubbleWorld
          ? worldToViewportPoint(bubbleWorld.x, bubbleWorld.y)
          : null;
        return {
          id: bubbleSource.id,
          label: getLayoutEditorAnchorLabel(bubbleSource.id, bubbleSource.label),
          productionStatus: bubbleSource.status,
          editStatus: "editable",
          coordinateSpace: "speech-bubble-local",
          bindingState: "attached",
          parentGroup: "speech-bubble",
          source: { x: bubbleSource.x, y: bubbleSource.y },
          local: clonePoint(bubbleSource.local),
          normalized: null,
          world: bubbleWorld ? { x: bubbleWorld.x, y: bubbleWorld.y } : null,
          viewport: bubbleViewport
            ? { x: bubbleViewport.x, y: bubbleViewport.y }
            : null,
          canonical: {
            x: bubbleSource.canonicalX,
            y: bubbleSource.canonicalY
          },
          temporaryOffset: {
            x: bubbleSource.deltaX,
            y: bubbleSource.deltaY
          },
          isTemporary: bubbleSource.isTemporary,
          temporarilyEditable: true,
          temporarilyUnlocked: false,
          activeSourceDimensions: null
        };
      }
      var source = getEffectiveSource(selectedControlPointId);
      if (!source) return null;
      var worldPos = getEffectiveWorldPosition(selectedControlPointId);
      var viewportPos = getEffectiveViewportPosition(selectedControlPointId);
      var coordinateSpace = source.coordinateSpace ||
        (isBackgroundStandingPoint(source.id)
          ? "background-source"
          : isUserInputPoint(source.id)
            ? "world"
            : "nana-local");
      return {
        id: source.id,
        label: getLayoutEditorAnchorLabel(source.id, source.label),
        productionStatus: source.status,
        editStatus: getEditStatusKey(source.id),
        coordinateSpace: coordinateSpace,
        bindingState: isUserInputPoint(source.id)
          ? (isUserInputGroupBound() ? "bound" : "unbound")
          : null,
        parentGroup: isUserInputPoint(source.id) ? "user-input-group" : null,
        source: { x: source.x, y: source.y },
        local: source.local ? { x: source.local.x, y: source.local.y } : null,
        normalized: source.u != null && source.v != null
          ? { u: source.u, v: source.v }
          : null,
        world: worldPos ? { x: worldPos.x, y: worldPos.y } : null,
        viewport: viewportPos ? { x: viewportPos.x, y: viewportPos.y } : null,
        canonical: { x: source.canonicalX, y: source.canonicalY },
        temporaryOffset: { x: source.deltaX, y: source.deltaY },
        isTemporary: source.isTemporary,
        temporarilyEditable: isTemporarilyEditable(source.id),
        temporarilyUnlocked: isControlPointTemporarilyUnlocked(source.id),
        activeSourceDimensions: isBackgroundStandingPoint(source.id)
          ? { width: NAMORA_WORLD.sourceWidth, height: NAMORA_WORLD.sourceHeight }
          : null
      };
    }

    function setActiveTool(toolId) {
      if (toolId !== "select" && toolId !== "move") return false;
      activeTool = toolId;
      if (dragState) cancelDrag(true);
      refreshAllViews();
      return true;
    }

    function getActiveTool() {
      return activeTool;
    }

    function toggleComponentPreview(forceEnabled) {
      sceneComponentPreviewEnabled =
        typeof forceEnabled === "boolean"
          ? forceEnabled
          : !sceneComponentPreviewEnabled;
      refreshAllViews();
      return sceneComponentPreviewEnabled;
    }

    function isComponentPreviewEnabled() {
      return !!sceneComponentPreviewEnabled;
    }

    function unlockControlPointTemporarily(anchorId) {
      if (!isEditableSpatialAnchor(anchorId)) return false;
      if (!requiresTemporaryUnlock(anchorId)) {
        // already permanently editable in editor (approved)
        selectedControlPointId = anchorId;
        selectedObjectId = "nana";
        editFeedbackMessage = null;
        refreshAllViews();
        return true;
      }

      temporarilyUnlockedAnchorIds[anchorId] = true;
      selectedControlPointId = anchorId;
      selectedObjectId = "nana";
      editFeedbackMessage = activeTool === "move" ? null : LAYOUT_EDITOR_UI.switchToMoveTool;
      refreshAllViews();
      return true;
    }

    function lockControlPointTemporarily(anchorId) {
      if (!isEditableSpatialAnchor(anchorId)) return false;
      delete temporarilyUnlockedAnchorIds[anchorId];
      if (dragState && dragState.anchorId === anchorId) cancelDrag(false);
      if (selectedControlPointId === anchorId) {
        editFeedbackMessage = null;
      }
      refreshAllViews();
      return true;
    }

    function moveSelectedPoint(dx, dy) {
      if (!selectedControlPointId) return false;
      if (!isTemporarilyEditable(selectedControlPointId)) return false;
      var source = getEffectiveSource(selectedControlPointId);
      if (!source) return false;

      if (isBackgroundStandingPoint(selectedControlPointId)) {
        setStandingPointOverride(source.x + dx, source.y + dy);
        refreshAllViews();
        return true;
      }

      if (isUserInputPoint(selectedControlPointId)) {
        if (
          isUserInputGroupBound() &&
          (selectedControlPointId === PEARL_ROOT_ID ||
            selectedControlPointId === INPUT_ROOT_ID)
        ) {
          setUserInputLocalOverride(selectedControlPointId, source.x + dx, source.y + dy);
        } else {
          var worldPos = getUserInputWorldPosition(selectedControlPointId);
          if (!worldPos) return false;
          setUserInputWorldOverride(selectedControlPointId, worldPos.x + dx, worldPos.y + dy);
        }
        refreshAllViews();
        return true;
      }

      if (isSpeechBubblePoint(selectedControlPointId)) {
        var bubbleSource = getSpeechBubbleControlPointSource(selectedControlPointId);
        if (!bubbleSource) return false;
        setSpeechBubblePointLocal(
          selectedControlPointId,
          bubbleSource.x + dx,
          bubbleSource.y + dy
        );
        refreshAllViews();
        return true;
      }

      setOverride(selectedControlPointId, source.x + dx, source.y + dy);
      refreshAllViews();
      return true;
    }

    function resetSelectedControlPoint() {
      if (!selectedControlPointId) return false;
      var changed = false;
      if (isBackgroundStandingPoint(selectedControlPointId)) {
        changed = clearStandingPointOverride();
      } else if (isUserInputPoint(selectedControlPointId)) {
        ensureUserInputStateExists();
        if (!USER_INPUT_DEFAULTS) initUserInputDefaults(runtimeLayoutState);
        if (selectedControlPointId === PEARL_ROOT_ID) {
          if (isUserInputGroupBound()) {
            temporaryUserInputState.pearlOffset = {
              x: USER_INPUT_DEFAULTS.pearlWorld.x - temporaryUserInputState.groupRoot.x,
              y: USER_INPUT_DEFAULTS.pearlWorld.y - temporaryUserInputState.groupRoot.y
            };
          } else {
            temporaryUserInputState.pearlWorld = clonePoint(USER_INPUT_DEFAULTS.pearlWorld);
          }
          changed = true;
        } else if (selectedControlPointId === INPUT_ROOT_ID) {
          if (isUserInputGroupBound()) {
            temporaryUserInputState.inputOffset = {
              x: USER_INPUT_DEFAULTS.inputWorld.x - temporaryUserInputState.groupRoot.x,
              y: USER_INPUT_DEFAULTS.inputWorld.y - temporaryUserInputState.groupRoot.y
            };
          } else {
            temporaryUserInputState.inputWorld = clonePoint(USER_INPUT_DEFAULTS.inputWorld);
          }
          changed = true;
        } else if (selectedControlPointId === USER_INPUT_GROUP_ROOT_ID) {
          // Reset group root to pearl world while preserving relative offsets
          if (isUserInputGroupBound()) {
            var pearlW = getUserInputPearlWorld();
            var inputW = getUserInputInputWorld();
            temporaryUserInputState.groupRoot = { x: pearlW.x, y: pearlW.y };
            temporaryUserInputState.pearlOffset = {
              x: pearlW.x - temporaryUserInputState.groupRoot.x,
              y: pearlW.y - temporaryUserInputState.groupRoot.y
            };
            temporaryUserInputState.inputOffset = {
              x: inputW.x - temporaryUserInputState.groupRoot.x,
              y: inputW.y - temporaryUserInputState.groupRoot.y
            };
            changed = true;
          }
        }
      } else if (isSpeechBubblePoint(selectedControlPointId)) {
        var canonicalPoint = getSpeechBubblePointCanonical(selectedControlPointId);
        if (canonicalPoint) {
          changed = setSpeechBubblePointLocal(
            selectedControlPointId,
            canonicalPoint.x,
            canonicalPoint.y
          );
        }
      } else {
        changed = removeOverride(selectedControlPointId);
      }
      refreshAllViews();
      return changed;
    }

    function resetAllTemporaryCoordinates() {
      if (!hasUnsavedChanges()) {
        temporarilyUnlockedAnchorIds = Object.create(null);
        refreshAllViews();
        return true;
      }
      if (!window.confirm(LAYOUT_EDITOR_UI.confirmResetAll)) return false;
      temporaryAnchorOverrides = Object.create(null);
      temporarilyUnlockedAnchorIds = Object.create(null);
      temporaryWorldOverrides.standingPoint = null;
      if (importedBaselineProfile) {
        applyProfileToEditorState(importedBaselineProfile);
      } else {
        resetUserInputDefaults();
        resetSpeechBubbleDefaults();
      }
      cancelDrag(false);
      updateNamoraWorldLayout();
      refreshAllViews();
      syncProfileStatusPanel();
      return true;
    }

    function beginDrag(anchorId, pointerId, targetEl, clientX, clientY) {
      if (activeTool !== "move") return false;
      if (!isTemporarilyEditable(anchorId)) return false;
      var source = isSpeechBubblePoint(anchorId)
        ? getSpeechBubbleControlPointSource(anchorId)
        : getEffectiveSource(anchorId);
      if (!source) return false;

      var worldPos = getEffectiveWorldPosition(anchorId);
      if (!worldPos) return false;

      var scene = clientToScenePoint(clientX, clientY);
      var markerScene = worldToViewportPoint(worldPos.x, worldPos.y);

      var space = "nana-local";
      if (isBackgroundStandingPoint(anchorId)) {
        space = "background-source";
      } else if (isUserInputPoint(anchorId)) {
        if (
          isUserInputGroupBound() &&
          (anchorId === PEARL_ROOT_ID || anchorId === INPUT_ROOT_ID)
        ) {
          space = "user-input-group-local";
        } else {
          space = "world";
        }
      } else if (isSpeechBubblePoint(anchorId)) {
        space =
          anchorId === BUBBLE_TAIL_ID
            ? "speech-bubble-tail-adjust"
            : "speech-bubble-local";
      }

      dragState = {
        anchorId: anchorId,
        pointerId: pointerId,
        startX: source.x,
        startY: source.y,
        startWorldX: worldPos.x,
        startWorldY: worldPos.y,
        moved: false,
        space: space,
        grabOffsetX: scene.x - markerScene.x,
        grabOffsetY: scene.y - markerScene.y
      };

      document.body.classList.add("namora-layout-dragging");
      if (targetEl && targetEl.setPointerCapture) {
        try {
          targetEl.setPointerCapture(pointerId);
        } catch (e) {
          /* ignore */
        }
      }
      return true;
    }

    function updateDrag(clientX, clientY) {
      if (!dragState) return;
      try {
        var scene = clientToScenePoint(clientX, clientY);
        // Preserve grab point: marker scene center tracks pointer minus grab offset
        var markerSceneX = scene.x - dragState.grabOffsetX;
        var markerSceneY = scene.y - dragState.grabOffsetY;

        var nextX;
        var nextY;
        if (dragState.space === "background-source" || dragState.space === "world") {
          var worldPoint = viewportToWorldPoint(markerSceneX, markerSceneY);
          nextX = worldPoint.x;
          nextY = worldPoint.y;
        } else if (dragState.space === "user-input-group-local") {
          var worldLocal = viewportToWorldPoint(markerSceneX, markerSceneY);
          nextX = worldLocal.x - temporaryUserInputState.groupRoot.x;
          nextY = worldLocal.y - temporaryUserInputState.groupRoot.y;
        } else if (dragState.space === "speech-bubble-tail-adjust") {
          var tailWorldPoint = viewportToWorldPoint(markerSceneX, markerSceneY);
          nextX = dragState.startX + (tailWorldPoint.x - dragState.startWorldX);
          nextY = dragState.startY + (tailWorldPoint.y - dragState.startWorldY);
        } else if (dragState.space === "speech-bubble-local") {
          var bubbleWorldPoint = viewportToWorldPoint(markerSceneX, markerSceneY);
          var bubbleTransform = getSpeechBubbleWorldTransformEditor();
          if (!bubbleTransform) return;
          nextX = bubbleWorldPoint.x - bubbleTransform.worldOrigin.x;
          nextY = bubbleWorldPoint.y - bubbleTransform.worldOrigin.y;
        } else {
          var local = viewportToNanaLocalPoint(markerSceneX, markerSceneY);
          nextX = local.x;
          nextY = local.y;
        }

        dragState.moved = true;
        if (dragState.space === "background-source") {
          setStandingPointOverride(nextX, nextY);
        } else if (dragState.space === "world") {
          setUserInputWorldOverride(dragState.anchorId, nextX, nextY);
          refreshSelectionOverlay(lastLayout);
        } else if (dragState.space === "user-input-group-local") {
          setUserInputLocalOverride(dragState.anchorId, nextX, nextY);
          refreshSelectionOverlay(lastLayout);
        } else if (
          dragState.space === "speech-bubble-local" ||
          dragState.space === "speech-bubble-tail-adjust"
        ) {
          setSpeechBubblePointLocal(dragState.anchorId, nextX, nextY);
          refreshSceneComponents();
          refreshSelectionOverlay(lastLayout);
        } else {
          setOverride(dragState.anchorId, nextX, nextY);
          refreshSelectionOverlay(lastLayout);
        }
        // Live coordinates only — do not rebuild object tree
        renderPropertiesPanel();
      } catch (err) {
        console.warn("[LayoutEditor] drag mapping failed:", err.message);
      }
    }

    function endDrag() {
      if (!dragState) return;
      var suppressClick = dragState.moved;
      dragState = null;
      document.body.classList.remove("namora-layout-dragging");
      if (suppressClick) {
        suppressSceneClickUntil = Date.now() + 250;
      }
      refreshAllViews();
    }

    function cancelDrag(restoreStart) {
      if (!dragState) {
        document.body.classList.remove("namora-layout-dragging");
        return;
      }
      if (restoreStart) {
        if (dragState.space === "background-source") {
          var canonicalStanding = NAMORA_WORLD.standingPoint;
          if (
            dragState.startX === canonicalStanding.x &&
            dragState.startY === canonicalStanding.y
          ) {
            clearStandingPointOverride();
          } else {
            setStandingPointOverride(dragState.startX, dragState.startY);
          }
        } else if (
          dragState.space === "world" ||
          dragState.space === "user-input-group-local"
        ) {
          if (dragState.space === "user-input-group-local") {
            setUserInputLocalOverride(
              dragState.anchorId,
              dragState.startX,
              dragState.startY
            );
          } else {
            setUserInputWorldOverride(
              dragState.anchorId,
              dragState.startWorldX,
              dragState.startWorldY
            );
          }
        } else if (
          dragState.space === "speech-bubble-local" ||
          dragState.space === "speech-bubble-tail-adjust"
        ) {
          setSpeechBubblePointLocal(
            dragState.anchorId,
            dragState.startX,
            dragState.startY
          );
        } else {
          setOverride(dragState.anchorId, dragState.startX, dragState.startY);
          var canonical = getCanonicalAnchor(dragState.anchorId);
          if (
            canonical &&
            dragState.startX === canonical.x &&
            dragState.startY === canonical.y
          ) {
            removeOverride(dragState.anchorId);
          }
        }
      }
      dragState = null;
      document.body.classList.remove("namora-layout-dragging");
      refreshAllViews();
    }

    function resolveObjectIdFromSceneClick(clientX, clientY) {
      if (!lastLayout || !worldEl) return null;
      try {
        var scene = clientToScenePoint(clientX, clientY);
        var worldPoint = viewportToWorldPoint(scene.x, scene.y);
        var nanaBounds = resolveObjectBounds("nana", lastLayout);
        if (
          nanaBounds &&
          worldPoint.x >= nanaBounds.x &&
          worldPoint.x <= nanaBounds.x + nanaBounds.width &&
          worldPoint.y >= nanaBounds.y &&
          worldPoint.y <= nanaBounds.y + nanaBounds.height
        ) {
          return "nana";
        }
        var worldBounds = resolveObjectBounds("world-background", lastLayout);
        if (
          worldBounds &&
          worldPoint.x >= worldBounds.x &&
          worldPoint.x <= worldBounds.x + worldBounds.width &&
          worldPoint.y >= worldBounds.y &&
          worldPoint.y <= worldBounds.y + worldBounds.height
        ) {
          return "world-background";
        }
      } catch (err) {
        return null;
      }
      return null;
    }

    function onPointPointerDown(event) {
      if (!enabled) return;
      var anchorId = event.currentTarget.dataset.pointId;
      if (!isEditableControlPointId(anchorId)) return;

      event.preventDefault();
      event.stopPropagation();

      // Lightweight selection first — avoid full props DOM rebuild mid-gesture
      selectControlPoint(anchorId, { silent: true });

      if (activeTool === "move") {
        if (isTemporarilyEditable(anchorId)) {
          editFeedbackMessage = null;
          beginDrag(
            anchorId,
            event.pointerId,
            event.currentTarget,
            event.clientX,
            event.clientY
          );
          return;
        }
        editFeedbackMessage = LAYOUT_EDITOR_UI.needTemporaryUnlock;
        refreshAllViews();
        return;
      }

      editFeedbackMessage = null;
      refreshAllViews();
    }

    function onSceneComponentPointerDown(event) {
      if (!enabled || !sceneComponentPreviewEnabled) return;
      var componentId =
        event.currentTarget &&
        event.currentTarget.dataset &&
        event.currentTarget.dataset.sceneComponentId;
      var component = SCENE_COMPONENTS[componentId];
      if (!component) return;

      var anchorId = component.anchorId;
      event.preventDefault();
      event.stopPropagation();
      if (componentId === "speech-bubble") {
        selectObject("speech-bubble");
        selectControlPoint(BUBBLE_BODY_CENTER_ID, { silent: true });
      } else {
        selectControlPoint(anchorId, { silent: true });
      }

      if (activeTool === "move") {
        var dragAnchorId =
          componentId === "speech-bubble" ? BUBBLE_BODY_CENTER_ID : anchorId;
        if (isTemporarilyEditable(dragAnchorId)) {
          editFeedbackMessage = null;
          beginDrag(
            dragAnchorId,
            event.pointerId,
            event.currentTarget,
            event.clientX,
            event.clientY
          );
          return;
        }
        editFeedbackMessage = LAYOUT_EDITOR_UI.needTemporaryUnlock;
      } else {
        editFeedbackMessage = null;
      }
      refreshAllViews();
    }

    function bindHandlers() {
      if (handlersBound) return;
      handlersBound = true;

      onPointerMove = function (event) {
        if (!enabled || !dragState) return;
        if (event.pointerId !== dragState.pointerId) return;
        event.preventDefault();
        updateDrag(event.clientX, event.clientY);
      };

      onPointerUp = function (event) {
        if (!enabled || !dragState) return;
        if (event.pointerId !== dragState.pointerId) return;
        event.preventDefault();
        endDrag();
      };

      onKeyDown = function (event) {
        if (!enabled) return;

        if (event.key === "Escape") {
          if (dragState) {
            event.preventDefault();
            cancelDrag(true);
            return;
          }
          if (selectedControlPointId) {
            event.preventDefault();
            selectedControlPointId = null;
            editFeedbackMessage = null;
            refreshAllViews();
          }
          return;
        }

        if (
          event.key !== "ArrowLeft" &&
          event.key !== "ArrowRight" &&
          event.key !== "ArrowUp" &&
          event.key !== "ArrowDown"
        ) {
          return;
        }

        if (!selectedControlPointId) return;

        // Always prevent page scroll while a control point is selected
        event.preventDefault();

        if (!isTemporarilyEditable(selectedControlPointId)) {
          editFeedbackMessage = LAYOUT_EDITOR_UI.needTemporaryUnlock;
          renderPropertiesPanel();
          return;
        }

        var step = 1;
        if (event.shiftKey) step = 10;
        if (event.ctrlKey || event.metaKey) step = 0.1;

        var dx = 0;
        var dy = 0;
        if (event.key === "ArrowLeft") dx = -step;
        if (event.key === "ArrowRight") dx = step;
        if (event.key === "ArrowUp") dy = -step;
        if (event.key === "ArrowDown") dy = step;
        editFeedbackMessage = null;
        moveSelectedPoint(dx, dy);
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerUp);
      document.addEventListener("keydown", onKeyDown);

      if (propsEl && !propsActionsBound) {
        propsActionsBound = true;
        propsEl.addEventListener("click", function (event) {
          if (!enabled) return;
          var btn = event.target.closest("[data-editor-action]");
          if (!btn || !propsEl.contains(btn)) return;

          var action = btn.getAttribute("data-editor-action");
          var anchorId = btn.getAttribute("data-anchor-id");

          event.preventDefault();
          event.stopPropagation();

          if (action === "temp-unlock") {
            if (!anchorId) return;
            unlockControlPointTemporarily(anchorId);
          } else if (action === "temp-lock") {
            if (!anchorId) return;
            lockControlPointTemporarily(anchorId);
          }
        });
      }

      if (uigPanelEl) {
        uigPanelEl.addEventListener("click", function (event) {
          if (!enabled) return;
          var btn = event.target.closest("[data-editor-action]");
          if (!btn || !uigPanelEl.contains(btn)) return;
          var action = btn.getAttribute("data-editor-action");
          event.preventDefault();
          event.stopPropagation();
          if (action === "bind-user-input") {
            bindUserInputGroup();
          } else if (action === "unbind-user-input") {
            unbindUserInputGroup();
          }
        });
      }

      if (worldEl) {
        worldEl.addEventListener("click", function (event) {
          if (!enabled || dragState) return;
          if (Date.now() < suppressSceneClickUntil) return;
          if (event.target && event.target.dataset && event.target.dataset.pointId) return;
          if (
            event.target &&
            event.target.closest &&
            event.target.closest("[data-scene-component-id]")
          ) {
            return;
          }
          var objectId = resolveObjectIdFromSceneClick(event.clientX, event.clientY);
          if (objectId) selectObject(objectId);
        });
      }

      if (toolbarEl) {
        toolbarEl.addEventListener("click", function (event) {
          var btn = event.target.closest("[data-tool]");
          if (!btn || btn.disabled || !enabled) return;
          var tool = btn.getAttribute("data-tool");
          if (tool === "select" || tool === "move") {
            editFeedbackMessage = null;
            setActiveTool(tool);
          } else if (tool === "reset-current") {
            resetSelectedControlPoint();
          } else if (tool === "reset-all") {
            resetAllTemporaryCoordinates();
          } else if (tool === "components") {
            toggleComponentPreview();
          } else if (tool === "copy") {
            copyLayoutProfile();
          } else if (tool === "export") {
            downloadLayoutProfile();
          } else if (tool === "preview-profile") {
            var prepared = prepareExportableProfile();
            renderProfilePreviewModal(prepared.preview, {
              message: prepared.ok
                ? LAYOUT_EDITOR_UI.previewTitle
                : LAYOUT_EDITOR_UI.profileBlocked,
              isError: !prepared.ok,
              showApply: false
            });
          } else if (tool === "import") {
            var importInput = document.getElementById("namoraLayoutProfileImportInput");
            if (importInput) importInput.click();
          } else if (tool === "restore-canonical") {
            restoreProjectCanonicalLayout();
          }
        });
      }

      var importInputEl = document.getElementById("namoraLayoutProfileImportInput");
      if (importInputEl && !importInputEl.dataset.bound) {
        importInputEl.dataset.bound = "1";
        importInputEl.addEventListener("change", function (event) {
          if (!enabled) return;
          var file = event.target.files && event.target.files[0];
          event.target.value = "";
          if (!file) return;
          importLayoutProfileFile(file).then(function (prepared) {
            if (!prepared.ok) {
              showProfileExportFeedback(
                LAYOUT_EDITOR_UI.importBlocked +
                  "：" +
                  (prepared.errors || []).join("；"),
                true
              );
              if (prepared.preview) {
                renderProfilePreviewModal(prepared.preview, {
                  message: LAYOUT_EDITOR_UI.importBlocked,
                  isError: true,
                  showApply: false
                });
              }
              return;
            }
            pendingImportPreview = prepared.profile;
            renderProfilePreviewModal(prepared.preview, {
              message: LAYOUT_EDITOR_UI.previewTitle,
              isError: false,
              showApply: true
            });
          });
        });
      }

      var importApplyBtn = document.getElementById("namoraProfilePreviewApply");
      if (importApplyBtn && !importApplyBtn.dataset.bound) {
        importApplyBtn.dataset.bound = "1";
        importApplyBtn.addEventListener("click", function () {
          if (!enabled || !pendingImportPreview) return;
          var result = applyImportedLayoutProfile(pendingImportPreview);
          if (!result.ok) {
            showProfileExportFeedback(
              LAYOUT_EDITOR_UI.importBlocked +
                "：" +
                (result.errors || []).join("；"),
              true
            );
            return;
          }
          hideProfilePreviewModal();
          showProfileExportFeedback(LAYOUT_EDITOR_UI.importApplied, false);
        });
      }

      Object.keys(SCENE_COMPONENTS).forEach(function (componentId) {
        var component = SCENE_COMPONENTS[componentId];
        var element = document.querySelector(component.rendererBinding);
        if (!element) return;
        element.removeEventListener(
          "pointerdown",
          onSceneComponentPointerDown
        );
        element.addEventListener("pointerdown", onSceneComponentPointerDown);
      });

      var modalClose = document.getElementById("namoraLayoutProfileModalClose");
      if (modalClose) {
        modalClose.addEventListener("click", function () {
          hideProfilePreviewModal();
        });
      }
      var modalBackdrop = document.getElementById("namoraLayoutProfileModal");
      if (modalBackdrop) {
        modalBackdrop.addEventListener("click", function (event) {
          if (event.target === modalBackdrop) hideProfilePreviewModal();
        });
      }
    }

    function bindPointElementHandlers() {
      if (!selectionPointsEl) return;
      var ids = NAMORA_ANCHOR_IDS.concat([BACKGROUND_STANDING_POINT_ID]).concat(
        USER_INPUT_POINT_IDS,
        SPEECH_BUBBLE_POINT_IDS
      );
      ids.forEach(function (anchorId) {
        var el = ensurePointElement(anchorId);
        el.removeEventListener("pointerdown", onPointPointerDown);
        el.addEventListener("pointerdown", onPointPointerDown);
      });
    }

    function mountEditorChrome() {
      editorEl = document.getElementById("namoraLayoutEditor");
      treeEl = document.getElementById("namoraLayoutTree");
      propsEl = document.getElementById("namoraLayoutProps");
      toolbarEl = document.getElementById("namoraLayoutToolbar");
      uigPanelEl = document.getElementById("namoraLayoutUserInputGroup");
      uigStatusEl = document.getElementById("namoraLayoutUserInputBindStatus");
      selectionEl = document.getElementById("namoraLayoutSelection");
      selectionBoundsEl = document.getElementById("namoraLayoutSelectionBounds");
      selectionPointsEl = document.getElementById("namoraLayoutSelectionPoints");
    }

    function enable() {
      if (enabled) return;
      mountEditorChrome();
      if (!editorEl || !treeEl || !propsEl || !selectionEl || !selectionPointsEl) {
        console.warn("[LayoutEditor] editor chrome missing from DOM");
        return;
      }

      initializeUserInputState();
      sceneComponentPreviewEnabled = false;
      enabled = true;
      document.body.classList.add("namora-layout-edit");
      editorEl.hidden = false;
      bindHandlers();
      bindPointElementHandlers();
      syncToolbar();
      syncProfileStatusPanel();
      refreshAllViews();
    }

    function disable() {
      if (!enabled) return;
      cancelDrag(false);
      clearAllTemporaryState();
      clearImportedLayoutProfile();
      editorUserInputLifecycle.initialized = false;
      editorUserInputLifecycle.initializing = false;
      enabled = false;
      sceneComponentPreviewEnabled = false;
      selectedObjectId = null;
      selectedControlPointId = null;
      document.body.classList.remove("namora-layout-edit");
      document.body.classList.remove("namora-layout-dragging");
      if (editorEl) editorEl.hidden = true;
      if (selectionEl) selectionEl.hidden = true;
      if (selectionBoundsEl) selectionBoundsEl.classList.add("is-hidden");
      Object.keys(pointElements).forEach(function (pointId) {
        pointElements[pointId].hidden = true;
      });
      hideProfilePreviewModal();
      var feedback = document.getElementById("namoraLayoutProfileFeedback");
      if (feedback) {
        feedback.hidden = true;
        feedback.textContent = "";
      }
      document.body.classList.remove(
        "namora-components-preview-on",
        "namora-components-preview-off"
      );
      refreshSceneComponents();
    }

    function isEnabled() {
      return enabled;
    }

    function buildExportedAnchorRecord(anchorId) {
      var source = getEffectiveSource(anchorId);
      var canonical = getCanonicalAnchor(anchorId);
      if (!source || !canonical) return null;
      var sw = NAMORA_WORLD.nana.spriteSourceWidth;
      var sh = NAMORA_WORLD.nana.spriteSourceHeight;
      return {
        id: anchorId,
        label: canonical.label,
        purpose: canonical.purpose,
        space: "nana-local",
        x: roundLayoutSource(source.x),
        y: roundLayoutSource(source.y),
        u: roundLayoutNormalized(source.x / sw),
        v: roundLayoutNormalized(source.y / sh),
        canonical: {
          x: roundLayoutSource(canonical.x),
          y: roundLayoutSource(canonical.y)
        },
        modified: !!source.isTemporary,
        status: canonical.status,
        editorLockState: getEditStatusKey(anchorId)
      };
    }

    function buildLayoutProfile() {
      ensureUserInputStateExists();
      var now = isoNow();
      var transform = getNanaWorldTransform(NAMORA_WORLD);
      var standingSource = getEffectiveStandingSource();
      var dirty = hasUnsavedChanges();
      var bound = isUserInputGroupBound();
      var pearlWorld = getUserInputPearlWorld();
      var inputWorld = getUserInputInputWorld();
      var groupWorld = getUserInputGroupRootWorld();
      var layoutVp = getLayoutViewportSize();

      var anchors = Object.create(null);
      NAMORA_ANCHOR_IDS.forEach(function (anchorId) {
        anchors[anchorId] = buildExportedAnchorRecord(anchorId);
      });

      var pearlCoordSpace = bound ? "user-input-group-local" : "world";
      var inputCoordSpace = bound ? "user-input-group-local" : "world";

      var profile = {
        schemaVersion: LAYOUT_PROFILE_META.schemaVersion,
        profileVersion: LAYOUT_PROFILE_META.profileVersion,
        profileId: LAYOUT_PROFILE_META.profileId,
        profileName: LAYOUT_PROFILE_META.profileName,
        createdAt: now,
        updatedAt: now,
        source: LAYOUT_PROFILE_META.source,
        world: {
          asset: {
            path: NAMORA_WORLD.asset,
            formatDeclared: getAssetFormatDeclared(NAMORA_WORLD.asset),
            formatDetected: NAMORA_ASSET_FORMAT_DETECTED,
            sourceWidth: NAMORA_WORLD.sourceWidth,
            sourceHeight: NAMORA_WORLD.sourceHeight
          },
          designSize: {
            width: roundLayoutSource(NAMORA_WORLD.designWorldWidth),
            height: NAMORA_WORLD.designWorldHeight
          },
          scalePolicy: "fixed-design-world",
          origin: "bottom-right",
          standingPoint: {
            space: "background-source",
            x: roundLayoutSource(standingSource.x),
            y: roundLayoutSource(standingSource.y),
            u: roundLayoutNormalized(standingSource.x / NAMORA_WORLD.sourceWidth),
            v: roundLayoutNormalized(standingSource.y / NAMORA_WORLD.sourceHeight),
            status: standingSource.status,
            canonical: {
              x: roundLayoutSource(standingSource.canonicalX),
              y: roundLayoutSource(standingSource.canonicalY)
            },
            modified: !!standingSource.isTemporary
          }
        },
        objects: {
          "world-background": Object.assign(
            {
              id: "world-background",
              type: "environment",
              coordinateSpace: "world"
            },
            getExportedParentFields("world-background", bound)
          ),
          nana: Object.assign(
            {
              id: "nana",
              type: "character",
              coordinateSpace: "world",
              worldOrigin: {
                x: roundLayoutSource(transform.nanaWorldX),
                y: roundLayoutSource(transform.nanaWorldY)
              },
              worldHeight: NAMORA_WORLD.nana.worldHeight,
              sprite: {
                sourceWidth: NAMORA_WORLD.nana.spriteSourceWidth,
                sourceHeight: NAMORA_WORLD.nana.spriteSourceHeight
              },
              registration: {
                standingPointId: BACKGROUND_STANDING_POINT_ID,
                footAnchorId: "foot"
              },
              anchors: anchors
            },
            getExportedParentFields("nana", bound)
          ),
          "user-input-group": Object.assign(
            {
              id: "user-input-group",
              type: "interface-group",
              coordinateSpace: "world"
            },
            getExportedParentFields("user-input-group", bound)
          ),
          pearl: Object.assign(
            {
              id: "pearl",
              type: "interface-root",
              coordinateSpace: pearlCoordSpace,
              worldPosition: {
                x: roundLayoutSource(pearlWorld.x),
                y: roundLayoutSource(pearlWorld.y)
              },
              localOffset: bound
                ? {
                    x: roundLayoutSource(temporaryUserInputState.pearlOffset.x),
                    y: roundLayoutSource(temporaryUserInputState.pearlOffset.y)
                  }
                : null,
              status: USER_INPUT_DEFAULTS.pearlStatus
            },
            getExportedParentFields("pearl", bound)
          ),
          "input-panel": Object.assign(
            {
              id: "input-panel",
              type: "interface-root",
              coordinateSpace: inputCoordSpace,
              worldPosition: {
                x: roundLayoutSource(inputWorld.x),
                y: roundLayoutSource(inputWorld.y)
              },
              localOffset: bound
                ? {
                    x: roundLayoutSource(temporaryUserInputState.inputOffset.x),
                    y: roundLayoutSource(temporaryUserInputState.inputOffset.y)
                  }
                : null,
              status: USER_INPUT_DEFAULTS.inputStatus
            },
            getExportedParentFields("input-panel", bound)
          ),
          "speech-bubble": buildSpeechBubbleProfileObject(
            getEffectiveSpeechBubbleGeometryEditor(),
            {
              canonical: getCanonicalSpeechBubbleGeometry(),
              modified: hasSpeechBubbleTemporaryChanges()
            }
          )
        },
        groups: {
          "user-input-group": {
            id: "user-input-group",
            bound: bound,
            coordinateSpace: "world",
            root: bound && groupWorld
              ? {
                  x: roundLayoutSource(groupWorld.x),
                  y: roundLayoutSource(groupWorld.y)
                }
              : null,
            members: ["pearl", "input-panel"]
          }
        },
        relationships: [
          {
            id: "nana-standing-registration",
            type: "registration",
            source: "nana.anchors.foot",
            target: "world.standingPoint",
            enabled: true
          },
          {
            id: "user-input-group-binding",
            type: "group",
            parent: "user-input-group",
            members: ["pearl", "input-panel"],
            enabled: bound
          },
          {
            id: "speech-bubble-tail-attachment",
            type: "attachment",
            source: "speech-bubble.points.tail",
            target: "nana.anchors.dialogue-tail",
            enabled: true
          }
        ],
        editorMetadata: {
          dirty: dirty,
          temporary: true,
          viewportAtExport: {
            width: roundLayoutViewport(layoutVp.width),
            height: roundLayoutViewport(layoutVp.height)
          },
          registrationErrorPx: lastLayout
            ? roundLayoutSource(lastLayout.registrationErrorPx)
            : null
        }
      };

      return profile;
    }

    function getLayoutProfilePreview(profile) {
      profile = profile || buildLayoutProfile();
      var validation = validateLayoutProfile(profile);
      var reconstruction = testLayoutProfileReconstruction(
        profile,
        getSpatialSnapshot()
      );
      var standing = profile.world && profile.world.standingPoint;
      var group = profile.groups && profile.groups["user-input-group"];
      var pearl = profile.objects && profile.objects.pearl;
      var inputPanel = profile.objects && profile.objects["input-panel"];
      var nanaAnchors =
        profile.objects && profile.objects.nana && profile.objects.nana.anchors
          ? Object.keys(profile.objects.nana.anchors).length
          : 0;

      return {
        profileId: profile.profileId,
        profileName: profile.profileName,
        profileVersion: profile.profileVersion,
        schemaVersion: profile.schemaVersion,
        validationStatus: validation.status,
        validationErrors: validation.errors.slice(),
        reconstructionStatus: reconstruction.status,
        reconstructionErrors: reconstruction.errors.slice(),
        worldAsset: profile.world && profile.world.asset
          ? profile.world.asset.path
          : null,
        standingPoint: standing
          ? { x: standing.x, y: standing.y, status: standing.status }
          : null,
        nanaAnchorCount: nanaAnchors,
        userInputGroupBound: !!(group && group.bound),
        pearlPosition: pearl && pearl.worldPosition
          ? { x: pearl.worldPosition.x, y: pearl.worldPosition.y }
          : null,
        inputPosition: inputPanel && inputPanel.worldPosition
          ? { x: inputPanel.worldPosition.x, y: inputPanel.worldPosition.y }
          : null,
        relationshipCount: Array.isArray(profile.relationships)
          ? profile.relationships.length
          : 0,
        dirty: !!(profile.editorMetadata && profile.editorMetadata.dirty),
        fileName: LAYOUT_PROFILE_META.fileName,
        json: serializeLayoutProfile(profile)
      };
    }

    function prepareExportableProfile() {
      var profile = buildLayoutProfile();
      var validation = validateLayoutProfile(profile);
      if (validation.status !== "PASS") {
        return {
          ok: false,
          profile: profile,
          validation: validation,
          reconstruction: null,
          json: null,
          preview: getLayoutProfilePreview(profile)
        };
      }
      var reconstruction = testLayoutProfileReconstruction(
        profile,
        getSpatialSnapshot()
      );
      if (reconstruction.status !== "PASS") {
        return {
          ok: false,
          profile: profile,
          validation: validation,
          reconstruction: reconstruction,
          json: null,
          preview: getLayoutProfilePreview(profile)
        };
      }
      return {
        ok: true,
        profile: profile,
        validation: validation,
        reconstruction: reconstruction,
        json: serializeLayoutProfile(profile),
        preview: getLayoutProfilePreview(profile)
      };
    }

    function copyTextToClipboard(text) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        return navigator.clipboard.writeText(text).then(function () {
          return true;
        });
      }
      return new Promise(function (resolve, reject) {
        try {
          var area = document.createElement("textarea");
          area.value = text;
          area.setAttribute("readonly", "");
          area.style.position = "fixed";
          area.style.left = "-9999px";
          document.body.appendChild(area);
          area.select();
          var ok = document.execCommand("copy");
          document.body.removeChild(area);
          if (ok) resolve(true);
          else reject(new Error("clipboard copy failed"));
        } catch (err) {
          reject(err);
        }
      });
    }

    function showProfileExportFeedback(message, isError) {
      var el = document.getElementById("namoraLayoutProfileFeedback");
      if (!el) return;
      el.hidden = false;
      el.textContent = message;
      el.classList.toggle("is-error", !!isError);
      el.classList.toggle("is-success", !isError);
    }

    function renderProfilePreviewModal(preview, options) {
      options = options || {};
      var modal = document.getElementById("namoraLayoutProfileModal");
      if (!modal) return;
      modal.hidden = false;

      function setText(id, value) {
        var node = document.getElementById(id);
        if (node) node.textContent = value;
      }

      setText("namoraProfilePreviewId", preview.profileId || "—");
      setText("namoraProfilePreviewVersion", preview.profileVersion || "—");
      setText(
        "namoraProfilePreviewValidation",
        preview.validationStatus === "PASS"
          ? LAYOUT_EDITOR_UI.validationPass
          : LAYOUT_EDITOR_UI.validationFail
      );
      setText("namoraProfilePreviewAsset", preview.worldAsset || "—");
      setText(
        "namoraProfilePreviewStanding",
        preview.standingPoint
          ? preview.standingPoint.x + ", " + preview.standingPoint.y
          : "—"
      );
      setText("namoraProfilePreviewAnchorCount", String(preview.nanaAnchorCount));
      setText(
        "namoraProfilePreviewBound",
        preview.userInputGroupBound
          ? getLayoutEditorStatusLabel("bound")
          : getLayoutEditorStatusLabel("unbound")
      );
      setText(
        "namoraProfilePreviewPearl",
        preview.pearlPosition
          ? preview.pearlPosition.x + ", " + preview.pearlPosition.y
          : "—"
      );
      setText(
        "namoraProfilePreviewInput",
        preview.inputPosition
          ? preview.inputPosition.x + ", " + preview.inputPosition.y
          : "—"
      );
      setText(
        "namoraProfilePreviewRelationships",
        String(preview.relationshipCount)
      );
      setText(
        "namoraProfilePreviewDirty",
        preview.dirty ? LAYOUT_EDITOR_UI.yes : LAYOUT_EDITOR_UI.no
      );

      var errorsEl = document.getElementById("namoraProfilePreviewErrors");
      if (errorsEl) {
        var allErrors = (preview.validationErrors || []).concat(
          preview.reconstructionErrors || []
        );
        if (allErrors.length === 0) {
          errorsEl.hidden = true;
          errorsEl.textContent = "";
        } else {
          errorsEl.hidden = false;
          errorsEl.textContent = allErrors.join("\n");
        }
      }

      var jsonEl = document.getElementById("namoraProfilePreviewJson");
      if (jsonEl) {
        jsonEl.value = preview.json || "";
      }

      if (options.message) {
        showProfileExportFeedback(options.message, !!options.isError);
      }

      var applyBtn = document.getElementById("namoraProfilePreviewApply");
      if (applyBtn) {
        var showApply = !!options.showApply && pendingImportPreview;
        applyBtn.hidden = !showApply;
        applyBtn.disabled = preview.validationStatus !== "PASS";
      }
    }

    function hideProfilePreviewModal() {
      var modal = document.getElementById("namoraLayoutProfileModal");
      if (modal) modal.hidden = true;
      pendingImportPreview = null;
      var applyBtn = document.getElementById("namoraProfilePreviewApply");
      if (applyBtn) applyBtn.hidden = true;
    }

    function copyLayoutProfile() {
      if (!enabled) {
        return Promise.resolve({
          ok: false,
          errors: ["布局编辑器未启用"]
        });
      }
      var prepared = prepareExportableProfile();
      renderProfilePreviewModal(prepared.preview, {
        message: prepared.ok
          ? null
          : LAYOUT_EDITOR_UI.profileBlocked,
        isError: !prepared.ok
      });
      if (!prepared.ok) {
        var failErrors = (prepared.validation.errors || []).concat(
          (prepared.reconstruction && prepared.reconstruction.errors) || []
        );
        showProfileExportFeedback(
          LAYOUT_EDITOR_UI.profileBlocked + "：" + failErrors.join("；"),
          true
        );
        return Promise.resolve({
          ok: false,
          errors: failErrors,
          validation: prepared.validation,
          reconstruction: prepared.reconstruction,
          preview: prepared.preview
        });
      }

      return copyTextToClipboard(prepared.json).then(function () {
        showProfileExportFeedback(LAYOUT_EDITOR_UI.profileCopied, false);
        renderProfilePreviewModal(prepared.preview, {
          message: LAYOUT_EDITOR_UI.profileCopied,
          isError: false
        });
        return {
          ok: true,
          profile: cloneLayoutJson(prepared.profile),
          preview: prepared.preview
        };
      }).catch(function (err) {
        showProfileExportFeedback("复制失败：" + (err && err.message ? err.message : "未知错误"), true);
        return {
          ok: false,
          errors: [err && err.message ? err.message : "clipboard failure"]
        };
      });
    }

    function downloadLayoutProfile() {
      if (!enabled) {
        return {
          ok: false,
          errors: ["布局编辑器未启用"]
        };
      }
      var prepared = prepareExportableProfile();
      renderProfilePreviewModal(prepared.preview, {
        message: prepared.ok ? null : LAYOUT_EDITOR_UI.profileBlocked,
        isError: !prepared.ok
      });
      if (!prepared.ok) {
        var failErrors = (prepared.validation.errors || []).concat(
          (prepared.reconstruction && prepared.reconstruction.errors) || []
        );
        showProfileExportFeedback(
          LAYOUT_EDITOR_UI.profileBlocked + "：" + failErrors.join("；"),
          true
        );
        return {
          ok: false,
          errors: failErrors,
          validation: prepared.validation,
          reconstruction: prepared.reconstruction,
          preview: prepared.preview
        };
      }

      var blob = new Blob([prepared.json], {
        type: "application/json;charset=utf-8"
      });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = LAYOUT_PROFILE_META.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 0);

      showProfileExportFeedback(LAYOUT_EDITOR_UI.profileDownloaded, false);
      renderProfilePreviewModal(prepared.preview, {
        message: LAYOUT_EDITOR_UI.profileDownloaded,
        isError: false
      });
      return {
        ok: true,
        profile: cloneLayoutJson(prepared.profile),
        fileName: LAYOUT_PROFILE_META.fileName,
        preview: prepared.preview
      };
    }

    function getSpatialSnapshot() {
      ensureUserInputStateExists();
      var transform = getNanaWorldTransform(NAMORA_WORLD);
      var nanaAnchors = Object.create(null);
      NAMORA_ANCHOR_IDS.forEach(function (anchorId) {
        var src = getEffectiveSource(anchorId);
        var world = getEffectiveWorldPosition(anchorId);
        nanaAnchors[anchorId] = {
          id: anchorId,
          coordinateSpace: "nana-local",
          local: src ? { x: src.x, y: src.y } : null,
          world: world ? { x: world.x, y: world.y } : null,
          isTemporary: !!(src && src.isTemporary)
        };
      });

      var pearlWorld = getUserInputPearlWorld();
      var inputWorld = getUserInputInputWorld();
      var groupWorld = getUserInputGroupRootWorld();
      var bound = isUserInputGroupBound();

      return {
        timestamp: Date.now(),
        persistent: false,
        nana: {
          worldOrigin: { x: transform.nanaWorldX, y: transform.nanaWorldY },
          worldScale: transform.nanaWorldScale,
          standingPoint: {
            x: transform.standingPoint.x,
            y: transform.standingPoint.y,
            isTemporary: !!transform.standingPoint.isTemporary,
            status: transform.standingPoint.status
          },
          anchors: nanaAnchors
        },
        userInputGroup: {
          bound: bound,
          groupRoot: groupWorld
            ? {
                id: USER_INPUT_GROUP_ROOT_ID,
                coordinateSpace: "world",
                world: clonePoint(groupWorld)
              }
            : null,
          pearl: {
            id: PEARL_ROOT_ID,
            coordinateSpace: bound ? "user-input-group-local" : "world",
            world: clonePoint(pearlWorld),
            local: bound ? clonePoint(temporaryUserInputState.pearlOffset) : null
          },
          input: {
            id: INPUT_ROOT_ID,
            coordinateSpace: bound ? "user-input-group-local" : "world",
            world: clonePoint(inputWorld),
            local: bound ? clonePoint(temporaryUserInputState.inputOffset) : null
          },
          offsets: bound
            ? {
                pearlOffset: clonePoint(temporaryUserInputState.pearlOffset),
                inputOffset: clonePoint(temporaryUserInputState.inputOffset)
              }
            : null
        },
        speechBubble: (function () {
          var geometry = getEffectiveSpeechBubbleGeometryEditor();
          var bubbleTransform = getSpeechBubbleWorldTransformEditor();
          if (!geometry || !bubbleTransform) return null;
          return {
            geometry: cloneSpeechBubbleGeometry(geometry),
            worldOrigin: clonePoint(bubbleTransform.worldOrigin),
            tailWorld: clonePoint(bubbleTransform.tailWorld),
            bodyCenterWorld: clonePoint(bubbleTransform.bodyCenterWorld),
            textOriginWorld: clonePoint(bubbleTransform.textOriginWorld),
            tailRegistrationErrorPx: bubbleTransform.registrationErrorPx
          };
        })()
      };
    }

    function getTemporaryComponentOverridesPublic() {
      if (!temporarySpeechBubbleGeometry) return {};
      return {
        "speech-bubble": cloneSpeechBubbleGeometry(temporarySpeechBubbleGeometry)
      };
    }

    function selectComponentControlPoint(componentId, pointId) {
      if (componentId !== SPEECH_BUBBLE_COMPONENT_ID || !isSpeechBubblePoint(pointId)) {
        return false;
      }
      selectObject(SPEECH_BUBBLE_COMPONENT_ID);
      return selectControlPoint(pointId);
    }

    function getSelectedComponentControlPoint() {
      if (!selectedControlPointId || !isSpeechBubblePoint(selectedControlPointId)) {
        return null;
      }
      return {
        componentId: SPEECH_BUBBLE_COMPONENT_ID,
        pointId: selectedControlPointId
      };
    }

    function moveSelectedComponentPoint(dx, dy) {
      if (!selectedControlPointId || !isSpeechBubblePoint(selectedControlPointId)) {
        return false;
      }
      return moveSelectedPoint(dx, dy);
    }

    function resetComponentOverrides(componentId) {
      if (componentId !== SPEECH_BUBBLE_COMPONENT_ID) return false;
      resetSpeechBubbleDefaults();
      refreshAllViews();
      return true;
    }

    return {
      enable: enable,
      disable: disable,
      selectObject: selectObject,
      getSelectedObject: getSelectedObject,
      selectControlPoint: selectControlPoint,
      getSelectedControlPoint: getSelectedControlPoint,
      setActiveTool: setActiveTool,
      getActiveTool: getActiveTool,
      moveSelectedPoint: moveSelectedPoint,
      unlockControlPointTemporarily: unlockControlPointTemporarily,
      lockControlPointTemporarily: lockControlPointTemporarily,
      isControlPointTemporarilyUnlocked: isControlPointTemporarilyUnlocked,
      isControlPointEditable: isControlPointEditable,
      resetSelectedControlPoint: resetSelectedControlPoint,
      resetAllTemporaryCoordinates: resetAllTemporaryCoordinates,
      getTemporaryCoordinates: cloneTemporaryCoordinates,
      hasUnsavedChanges: hasUnsavedChanges,
      listObjects: listObjects,
      isEnabled: isEnabled,
      refreshSelectionOverlay: refreshSelectionOverlay,
      getTemporaryStandingPoint: getTemporaryStandingPoint,
      getUserInputWorldPosition: getUserInputWorldPosition,
      getComponentAnchorWorldPosition: getComponentAnchorWorldPosition,
      isUserInputGroupBound: isUserInputGroupBound,
      bindUserInputGroup: bindUserInputGroup,
      unbindUserInputGroup: unbindUserInputGroup,
      toggleComponentPreview: toggleComponentPreview,
      isComponentPreviewEnabled: isComponentPreviewEnabled,
      getSpatialSnapshot: getSpatialSnapshot,
      buildLayoutProfile: function () {
        return cloneLayoutJson(buildLayoutProfile());
      },
      validateLayoutProfile: function (profile) {
        var target = profile ? normalizeLayoutProfile(profile) : buildLayoutProfile();
        var result = validateLayoutProfile(target);
        return {
          status: result.status,
          errors: result.errors.slice(),
          warnings: result.warnings.slice()
        };
      },
      testLayoutProfileReconstruction: function (profile) {
        var target = profile ? cloneLayoutJson(profile) : buildLayoutProfile();
        return testLayoutProfileReconstruction(target, getSpatialSnapshot());
      },
      copyLayoutProfile: copyLayoutProfile,
      downloadLayoutProfile: downloadLayoutProfile,
      getLayoutProfilePreview: function () {
        return getLayoutProfilePreview();
      },
      serializeLayoutProfile: function (profile) {
        return serializeLayoutProfile(profile || buildLayoutProfile());
      },
      importLayoutProfileFile: importLayoutProfileFile,
      previewImportedLayoutProfile: function (profile) {
        return previewImportedLayoutProfile(profile);
      },
      applyImportedLayoutProfile: function (profile) {
        return applyImportedLayoutProfile(profile);
      },
      clearImportedLayoutProfile: clearImportedLayoutProfile,
      restoreProjectCanonicalLayout: restoreProjectCanonicalLayout,
      getActiveLayoutBaseline: getActiveLayoutBaseline,
      getEffectiveWorldPosition: getEffectiveWorldPosition,
      getSpeechBubbleGeometryOverride: getSpeechBubbleGeometryOverride,
      selectComponentControlPoint: selectComponentControlPoint,
      getSelectedComponentControlPoint: getSelectedComponentControlPoint,
      moveSelectedComponentPoint: moveSelectedComponentPoint,
      getTemporaryComponentOverrides: getTemporaryComponentOverridesPublic,
      resetComponentOverrides: resetComponentOverrides
    };
  }

  /* ------------------------------------------------------------------------ */
  /* SceneRuntime — constructs scene from Scene → World → Layout profiles     */
  /* Must not initialize or call LayoutEditor (Task 031).                     */
  /* ------------------------------------------------------------------------ */

  function createSceneRuntime() {
    var state = {
      sceneId: null,
      sceneLoaded: false,
      worldLoaded: false,
      layoutLoaded: false,
      objectsBuilt: false,
      relationshipsBuilt: false,
      rendererPrepared: false,
      sceneReady: false
    };

    var currentScene = null;
    var currentWorldProfile = null;
    var currentLayoutProfile = null;

    function clonePlain(value) {
      return value == null ? value : JSON.parse(JSON.stringify(value));
    }

    function getSceneState() {
      return {
        sceneId: state.sceneId,
        sceneLoaded: !!state.sceneLoaded,
        worldLoaded: !!state.worldLoaded,
        layoutLoaded: !!state.layoutLoaded,
        objectsBuilt: !!state.objectsBuilt,
        relationshipsBuilt: !!state.relationshipsBuilt,
        rendererPrepared: !!state.rendererPrepared,
        sceneReady: !!state.sceneReady
      };
    }

    function resetStateFlags() {
      state.sceneLoaded = false;
      state.worldLoaded = false;
      state.layoutLoaded = false;
      state.objectsBuilt = false;
      state.relationshipsBuilt = false;
      state.rendererPrepared = false;
      state.sceneReady = false;
    }

    function loadWorld(worldProfileId) {
      var profile = WORLD_PROFILES[worldProfileId];
      if (!profile) {
        throw new Error("[SceneRuntime] unknown world profile: " + worldProfileId);
      }
      currentWorldProfile = clonePlain(profile);
      NAMORA_WORLD = buildWorldFromProfile(profile);
      state.worldLoaded = true;
      return NAMORA_WORLD;
    }

    function resolveUserInputFromLayout(layoutProfile, world) {
      var group = (layoutProfile && layoutProfile.userInputGroup) || {};
      var pearlSpec = group.pearl || {};
      var inputSpec = group.input || {};
      var pearlWorld;
      var inputWorld;

      if (pearlSpec.worldPosition) {
        pearlWorld = {
          x: pearlSpec.worldPosition.x,
          y: pearlSpec.worldPosition.y
        };
      } else if (pearlSpec.mode === "legacy-migrate-from-nana-local") {
        pearlWorld = computeLegacyPearlWorldPosition(
          world,
          pearlSpec.legacyLocal || LEGACY_PEARL_NANA_LOCAL
        );
      } else {
        pearlWorld = computeLegacyPearlWorldPosition(world, LEGACY_PEARL_NANA_LOCAL);
      }

      if (inputSpec.worldPosition) {
        inputWorld = {
          x: inputSpec.worldPosition.x,
          y: inputSpec.worldPosition.y
        };
      } else if (inputSpec.mode === "relative-to-pearl") {
        var offset = inputSpec.offset || { x: -90, y: -40 };
        inputWorld = {
          x: pearlWorld.x + offset.x,
          y: pearlWorld.y + offset.y
        };
      } else {
        inputWorld = { x: pearlWorld.x - 90, y: pearlWorld.y - 40 };
      }

      var bound = !!group.bound;
      var groupRoot = null;
      var pearlOffset = null;
      var inputOffset = null;

      if (bound && group.root) {
        groupRoot = { x: group.root.x, y: group.root.y };
        pearlOffset = group.pearlOffset
          ? { x: group.pearlOffset.x, y: group.pearlOffset.y }
          : group.pearl && group.pearl.localOffset
            ? { x: group.pearl.localOffset.x, y: group.pearl.localOffset.y }
            : {
                x: pearlWorld.x - groupRoot.x,
                y: pearlWorld.y - groupRoot.y
              };
        inputOffset = group.inputOffset
          ? { x: group.inputOffset.x, y: group.inputOffset.y }
          : group.input && group.input.localOffset
            ? { x: group.input.localOffset.x, y: group.input.localOffset.y }
            : {
                x: inputWorld.x - groupRoot.x,
                y: inputWorld.y - groupRoot.y
              };
        pearlWorld = {
          x: groupRoot.x + pearlOffset.x,
          y: groupRoot.y + pearlOffset.y
        };
        inputWorld = {
          x: groupRoot.x + inputOffset.x,
          y: groupRoot.y + inputOffset.y
        };
      }

      return {
        bound: bound,
        groupRoot: groupRoot,
        pearlWorld: pearlWorld,
        inputWorld: inputWorld,
        pearlOffset: pearlOffset,
        inputOffset: inputOffset,
        pearlStatus: pearlSpec.status || "migrated-draft",
        inputStatus: inputSpec.status || "draft",
        members: (group.members || ["pearl", "input-panel"]).slice()
      };
    }

    function applyLayoutProfileData(profile, source, fallbackReason, diagnostics) {
      if (!profile) {
        throw new Error("[SceneRuntime] applyLayoutProfileData requires profile");
      }
      diagnostics = diagnostics || {};

      // Work on an isolated mutable clone — never mutate caller / frozen constants.
      var workingProfile = deepCloneLayoutProfile(profile);
      var previousWorld = NAMORA_WORLD;
      var previousLayoutState = runtimeLayoutState;
      var previousUserInputDefaults = USER_INPUT_DEFAULTS;
      var previousSpeechBubbleDefaults = SPEECH_BUBBLE_DEFAULTS;
      var previousLoadInfo = {
        source: layoutLoadInfo.source,
        filePath: layoutLoadInfo.filePath,
        loadSuccess: layoutLoadInfo.loadSuccess,
        validationStatus: layoutLoadInfo.validationStatus,
        reconstructionStatus: layoutLoadInfo.reconstructionStatus,
        fallbackReason: layoutLoadInfo.fallbackReason,
        canonicalProfile: layoutLoadInfo.canonicalProfile,
        maxReconstructionDelta: layoutLoadInfo.maxReconstructionDelta,
        boundCoordinateAuthority: layoutLoadInfo.boundCoordinateAuthority,
        serializedWorldRole: layoutLoadInfo.serializedWorldRole
      };

      try {
        if (!previousWorld) {
          throw new Error(
            "[SceneRuntime] applyLayoutProfileData requires an existing world base"
          );
        }

        var newWorld = buildRuntimeWorldFromLayoutProfile(
          workingProfile,
          previousWorld
        );

        var standing = workingProfile.world.standingPoint;
        var userInputInternal = externalProfileToInternalUserInputGroup(
          workingProfile
        );
        var userInputGroup = resolveUserInputFromLayout(
          { userInputGroup: userInputInternal },
          newWorld
        );

        var nextLayoutState = {
          id: workingProfile.profileId,
          version: workingProfile.profileVersion,
          standingPoint: {
            x: standing.x,
            y: standing.y,
            status: standing.status || newWorld.standingPoint.status,
            purpose: newWorld.standingPoint.purpose || ""
          },
          nanaAnchors: null,
          userInputGroup: userInputGroup,
          relationships: (workingProfile.relationships || []).map(function (rel) {
            return clonePlain(rel);
          }),
          speechBubble: speechBubbleGeometryFromProfileObject(
            workingProfile.objects && workingProfile.objects["speech-bubble"]
          )
        };

        // Atomic commit — only after full construction succeeds.
        NAMORA_WORLD = newWorld;
        currentLayoutProfile = clonePlain(workingProfile);
        runtimeLayoutState = nextLayoutState;

        layoutLoadInfo.source = source;
        layoutLoadInfo.filePath = CANONICAL_LAYOUT_FILE_PATH;
        layoutLoadInfo.loadSuccess = source === "project-json";
        layoutLoadInfo.validationStatus = diagnostics.validationStatus || "PASS";
        layoutLoadInfo.reconstructionStatus =
          diagnostics.reconstructionStatus || "PASS";
        layoutLoadInfo.fallbackReason = fallbackReason || null;
        layoutLoadInfo.canonicalProfile = deepCloneLayoutProfile(workingProfile);
        layoutLoadInfo.maxReconstructionDelta = diagnostics.maxDelta
          ? {
              x: diagnostics.maxDelta.x,
              y: diagnostics.maxDelta.y
            }
          : null;
        layoutLoadInfo.boundCoordinateAuthority = "group-root-plus-local-offset";
        layoutLoadInfo.serializedWorldRole = "diagnostic";

        USER_INPUT_DEFAULTS = null;
        initUserInputDefaults(runtimeLayoutState);
        SPEECH_BUBBLE_DEFAULTS = null;
        initSpeechBubbleDefaults(runtimeLayoutState);
        state.layoutLoaded = true;
        return clonePlain(runtimeLayoutState);
      } catch (err) {
        // Roll back — do not leave a partially applied graph.
        NAMORA_WORLD = previousWorld;
        runtimeLayoutState = previousLayoutState;
        USER_INPUT_DEFAULTS = previousUserInputDefaults;
        SPEECH_BUBBLE_DEFAULTS = previousSpeechBubbleDefaults;
        layoutLoadInfo.source = previousLoadInfo.source;
        layoutLoadInfo.filePath = previousLoadInfo.filePath;
        layoutLoadInfo.loadSuccess = previousLoadInfo.loadSuccess;
        layoutLoadInfo.validationStatus = previousLoadInfo.validationStatus;
        layoutLoadInfo.reconstructionStatus = previousLoadInfo.reconstructionStatus;
        layoutLoadInfo.fallbackReason = previousLoadInfo.fallbackReason;
        layoutLoadInfo.canonicalProfile = previousLoadInfo.canonicalProfile;
        layoutLoadInfo.maxReconstructionDelta =
          previousLoadInfo.maxReconstructionDelta;
        layoutLoadInfo.boundCoordinateAuthority =
          previousLoadInfo.boundCoordinateAuthority;
        layoutLoadInfo.serializedWorldRole = previousLoadInfo.serializedWorldRole;
        console.error(
          "[SceneRuntime] layout profile application failed (atomic rollback):",
          {
            source: source,
            message: err && err.message ? err.message : String(err),
            frozenTarget: "NAMORA_WORLD rebuild (no in-place mutation)"
          }
        );
        throw err;
      }
    }

    function fetchAndApplyLayoutProfile(filePath, expectedProfileId) {
      filePath = filePath || CANONICAL_LAYOUT_FILE_PATH;
      expectedProfileId = expectedProfileId || EXPECTED_LAYOUT_PROFILE_ID;

      return fetch(filePath)
        .then(function (response) {
          if (!response.ok) {
            throw new Error("HTTP " + response.status + " " + response.statusText);
          }
          return response.json();
        })
        .then(function (rawProfile) {
          var prepared = validateLayoutProfileForRuntime(
            rawProfile,
            NAMORA_WORLD,
            expectedProfileId
          );
          if (!prepared.ok) {
            throw new Error(prepared.errors.join("；"));
          }
          console.info(
            "[SceneRuntime] layout profile loaded from project JSON:",
            filePath
          );
          return applyLayoutProfileData(prepared.profile, "project-json", null, {
            validationStatus: prepared.validation.status,
            reconstructionStatus: prepared.reconstruction.status,
            maxDelta: prepared.maxDelta
          });
        })
        .catch(function (err) {
          var reason = err && err.message ? err.message : String(err);
          var protocol =
            typeof window !== "undefined" && window.location
              ? window.location.protocol
              : "unknown";
          if (protocol === "file:") {
            reason =
              "file:// 协议无法 fetch 外部 JSON（浏览器安全限制）。" +
              "请通过本地开发服务器打开（例如 http://localhost:3000/namora.html）。" +
              " 原始错误：" +
              reason;
          }
          console.warn(
            "[SceneRuntime] layout profile load failed; using built-in fallback " +
              "(mirrors canonical User Input Group coordinates):",
            reason
          );
          var fallbackProfile = deepCloneLayoutProfile(buildFallbackLayoutProfile());
          var prepared = validateLayoutProfileForRuntime(
            fallbackProfile,
            NAMORA_WORLD,
            expectedProfileId
          );
          if (!prepared.ok) {
            throw new Error(
              "内置回退布局无效：" + prepared.errors.join("；")
            );
          }
          return applyLayoutProfileData(
            prepared.profile,
            "builtin-fallback",
            reason,
            {
              validationStatus: prepared.validation.status,
              reconstructionStatus: prepared.reconstruction.status,
              maxDelta: prepared.maxDelta
            }
          );
        });
    }

    function loadLayoutProfile(layoutProfileId) {
      if (!NAMORA_WORLD) {
        throw new Error("[SceneRuntime] loadLayoutProfile requires world");
      }
      void layoutProfileId;
      return fetchAndApplyLayoutProfile(
        CANONICAL_LAYOUT_FILE_PATH,
        EXPECTED_LAYOUT_PROFILE_ID
      );
    }

    function buildObjects() {
      if (!objectIndexById) {
        objectIndexById = buildObjectIndex();
      }

      var records = listObjects();
      var byId = Object.create(null);
      var active = [];
      var inactive = [];

      records.forEach(function (record) {
        var node = {
          id: record.id,
          type: record.type,
          coordinateSpace: record.coordinateSpace,
          coordinateOwner: record.coordinateOwner,
          structuralParentId: getStructuralParentId(record),
          transformParentId: getTransformParentId(record),
          parentId: getStructuralParentId(record),
          anchor: record.anchor,
          enabled: record.enabled,
          visible: record.visible,
          rendererBinding: record.rendererBinding,
          metadata: record.metadata ? Object.assign({}, record.metadata) : {},
          instantiated: !!(record.enabled && record.visible),
          children: []
        };
        byId[record.id] = node;
        if (node.instantiated) active.push(record.id);
        else inactive.push(record.id);
      });

      records.forEach(function (record) {
        var structuralParentId = getStructuralParentId(record);
        if (structuralParentId && byId[structuralParentId] && byId[record.id]) {
          byId[structuralParentId].children.push(record.id);
        }
      });

      runtimeObjectGraph = {
        byId: byId,
        activeIds: active,
        inactiveIds: inactive,
        roots: records
          .filter(function (record) {
            return !getStructuralParentId(record);
          })
          .map(function (record) {
            return record.id;
          })
      };

      state.objectsBuilt = true;
      return clonePlain({
        activeIds: runtimeObjectGraph.activeIds,
        inactiveIds: runtimeObjectGraph.inactiveIds,
        roots: runtimeObjectGraph.roots,
        byId: runtimeObjectGraph.byId
      });
    }

    function buildRelationships() {
      var defs =
        (runtimeLayoutState && runtimeLayoutState.relationships) ||
        (currentLayoutProfile && currentLayoutProfile.relationships) ||
        [];

      var nodes = Object.create(null);
      var edges = [];

      defs.forEach(function (rel) {
        var edge = {
          id: rel.id,
          type: rel.type,
          source: rel.source || null,
          target: rel.target || null,
          parent: rel.parent || null,
          members: rel.members ? rel.members.slice() : [],
          enabled: rel.enabled !== false
        };
        edges.push(edge);

        if (rel.type === "group" && rel.parent) {
          if (!nodes[rel.parent]) {
            nodes[rel.parent] = { id: rel.parent, type: "group", children: [] };
          }
          (rel.members || []).forEach(function (memberId) {
            if (nodes[rel.parent].children.indexOf(memberId) === -1) {
              nodes[rel.parent].children.push(memberId);
            }
            if (!nodes[memberId]) {
              nodes[memberId] = { id: memberId, type: "member", children: [] };
            }
          });
        }

        if (rel.type === "registration") {
          nodes[rel.id] = {
            id: rel.id,
            type: "registration",
            source: rel.source,
            target: rel.target,
            children: []
          };
        }

        if (rel.type === "attachment") {
          nodes[rel.id] = {
            id: rel.id,
            type: "attachment",
            source: rel.source,
            target: rel.target,
            children: []
          };
        }
      });

      runtimeRelationshipGraph = {
        edges: edges,
        nodes: nodes
      };

      state.relationshipsBuilt = true;
      return clonePlain(runtimeRelationshipGraph);
    }

    function prepareRenderer() {
      if (!NAMORA_WORLD) {
        throw new Error("[SceneRuntime] prepareRenderer requires world");
      }
      if (!objectIndexById) {
        objectIndexById = buildObjectIndex();
      }

      var activeRendererElements = getActiveRendererElements();
      if (activeRendererElements.worldBackground) {
        worldBgEl = activeRendererElements.worldBackground;
      }
      if (activeRendererElements.nana) {
        nanaEl = activeRendererElements.nana;
      }

      if (worldBgEl && NAMORA_WORLD.asset) {
        var expected = NAMORA_WORLD.asset;
        var current = worldBgEl.getAttribute("src") || "";
        if (current && current.indexOf(expected.replace(/^\.\//, "")) === -1) {
          // Keep existing DOM asset unless profile path differs meaningfully — do not swap
          // visually in Task 031 when HTML already points to the same file.
        }
      }

      state.rendererPrepared = true;
      return {
        worldBackground: !!worldBgEl,
        nana: !!nanaEl,
        viewport: !!viewportEl,
        world: !!worldEl
      };
    }

    function sceneReady() {
      if (!state.rendererPrepared) {
        prepareRenderer();
      }
      if (viewportEl && worldEl) {
        bindWorldLayout();
      }
      state.sceneReady = true;
      return getSceneState();
    }

    function loadScene(sceneId) {
      sceneId = sceneId || DEFAULT_SCENE_ID;
      var scene = SCENE_PROFILES[sceneId];
      if (!scene) {
        return Promise.reject(
          new Error("[SceneRuntime] unknown scene: " + sceneId)
        );
      }
      if (!scene.enabled) {
        return Promise.reject(
          new Error("[SceneRuntime] scene disabled: " + sceneId)
        );
      }

      resetStateFlags();
      state.sceneId = sceneId;
      currentScene = clonePlain(scene);
      state.sceneLoaded = true;

      loadWorld(scene.worldProfile);
      return loadLayoutProfile(scene.layoutProfile).then(function () {
        buildObjects();
        buildRelationships();
        return getSceneState();
      });
    }

    function reloadScene() {
      var sceneId = state.sceneId || DEFAULT_SCENE_ID;
      return loadScene(sceneId);
    }

    function reloadLayoutProfile() {
      if (!NAMORA_WORLD) {
        return Promise.reject(
          new Error("[SceneRuntime] reloadLayoutProfile requires world")
        );
      }
      state.layoutLoaded = false;
      return fetchAndApplyLayoutProfile(
        CANONICAL_LAYOUT_FILE_PATH,
        EXPECTED_LAYOUT_PROFILE_ID
      ).then(function () {
        buildObjects();
        buildRelationships();
        if (state.rendererPrepared || state.sceneReady) {
          prepareRenderer();
          if (viewportEl && worldEl) {
            bindWorldLayout();
          }
          refreshSceneComponents();
        }
        return getLayoutSource();
      });
    }

    function getLayoutSource() {
      return {
        source: layoutLoadInfo.source,
        filePath: layoutLoadInfo.filePath,
        loadSuccess: !!layoutLoadInfo.loadSuccess,
        validationStatus: layoutLoadInfo.validationStatus,
        reconstructionStatus: layoutLoadInfo.reconstructionStatus,
        fallbackReason: layoutLoadInfo.fallbackReason
          ? String(layoutLoadInfo.fallbackReason)
          : null,
        serializationTolerance: LAYOUT_SERIALIZATION_TOLERANCE,
        liveRegistrationTolerance: LIVE_REGISTRATION_TOLERANCE,
        boundCoordinateAuthority: layoutLoadInfo.boundCoordinateAuthority,
        serializedWorldRole: layoutLoadInfo.serializedWorldRole,
        maxReconstructionDelta: layoutLoadInfo.maxReconstructionDelta
          ? {
              x: layoutLoadInfo.maxReconstructionDelta.x,
              y: layoutLoadInfo.maxReconstructionDelta.y
            }
          : null
      };
    }

    function getCanonicalLayoutProfile() {
      return layoutLoadInfo.canonicalProfile
        ? cloneLayoutJson(layoutLoadInfo.canonicalProfile)
        : null;
    }

    function getScene() {
      return currentScene ? clonePlain(currentScene) : null;
    }

    function getWorld() {
      return NAMORA_WORLD
        ? {
            id: NAMORA_WORLD.id,
            asset: NAMORA_WORLD.asset,
            sourceWidth: NAMORA_WORLD.sourceWidth,
            sourceHeight: NAMORA_WORLD.sourceHeight,
            designWorldWidth: NAMORA_WORLD.designWorldWidth,
            designWorldHeight: NAMORA_WORLD.designWorldHeight,
            scalePolicy: NAMORA_WORLD.scalePolicy,
            origin: NAMORA_WORLD.origin,
            standingPoint: {
              x: NAMORA_WORLD.standingPoint.x,
              y: NAMORA_WORLD.standingPoint.y,
              status: NAMORA_WORLD.standingPoint.status
            }
          }
        : null;
    }

    function getLayout() {
      return runtimeLayoutState ? clonePlain(runtimeLayoutState) : null;
    }

    function getRelationships() {
      return runtimeRelationshipGraph ? clonePlain(runtimeRelationshipGraph) : null;
    }

    function getObjects() {
      return runtimeObjectGraph
        ? clonePlain({
            activeIds: runtimeObjectGraph.activeIds,
            inactiveIds: runtimeObjectGraph.inactiveIds,
            roots: runtimeObjectGraph.roots
          })
        : null;
    }

    function getComponents() {
      return listSceneComponents();
    }

    function getComponent(componentId) {
      return getSceneComponent(componentId);
    }

    function refreshComponents() {
      return refreshSceneComponents().map(function (position) {
        return {
          id: position.id,
          anchorId: position.anchorId,
          x: position.x,
          y: position.y
        };
      });
    }

    function getComponentLocalGeometry(componentId) {
      if (componentId !== SPEECH_BUBBLE_COMPONENT_ID) return null;
      return cloneSpeechBubbleGeometry(getEffectiveSpeechBubbleGeometry());
    }

    function getComponentWorldTransform(componentId) {
      if (componentId !== SPEECH_BUBBLE_COMPONENT_ID) return null;
      var transform = computeSpeechBubbleWorldTransform(NAMORA_WORLD);
      if (!transform) return null;
      return {
        worldOrigin: clonePlain(transform.worldOrigin),
        tailWorld: clonePlain(transform.tailWorld),
        rootWorld: clonePlain(transform.rootWorld),
        bodyCenterWorld: clonePlain(transform.bodyCenterWorld),
        textOriginWorld: clonePlain(transform.textOriginWorld),
        registrationErrorPx: transform.registrationErrorPx,
        localSize: clonePlain(transform.localSize)
      };
    }

    function getComponentControlPointWorldPosition(componentId, pointId) {
      if (componentId !== SPEECH_BUBBLE_COMPONENT_ID) return null;
      var transform = computeSpeechBubbleWorldTransform(NAMORA_WORLD);
      var geometry = getEffectiveSpeechBubbleGeometry();
      if (!transform || !geometry) return null;
      var local = null;
      if (pointId === BUBBLE_ROOT_ID) local = geometry.points.root;
      else if (pointId === BUBBLE_TAIL_ID) local = geometry.points.tail;
      else if (pointId === BUBBLE_BODY_CENTER_ID) local = geometry.points.bodyCenter;
      else if (pointId === BUBBLE_TEXT_ORIGIN_ID) local = geometry.points.textOrigin;
      if (!local) return null;
      return speechBubbleLocalToWorld(local, transform.worldOrigin);
    }

    function refreshComponent(componentId) {
      if (!SCENE_COMPONENTS[componentId]) return false;
      refreshSceneComponents();
      return true;
    }

    function isReady() {
      return !!state.sceneReady;
    }

    return {
      loadScene: loadScene,
      reloadScene: reloadScene,
      reloadLayoutProfile: reloadLayoutProfile,
      buildWorld: loadWorld,
      buildObjects: buildObjects,
      buildRelationships: buildRelationships,
      prepareRenderer: prepareRenderer,
      sceneReady: sceneReady,
      getScene: getScene,
      getSceneState: getSceneState,
      getWorld: getWorld,
      getLayout: getLayout,
      getLayoutSource: getLayoutSource,
      getCanonicalLayoutProfile: getCanonicalLayoutProfile,
      getRelationships: getRelationships,
      getObjects: getObjects,
      getSceneComponents: getComponents,
      getComponent: getComponent,
      refreshComponents: refreshComponents,
      getComponentLocalGeometry: getComponentLocalGeometry,
      getComponentWorldTransform: getComponentWorldTransform,
      getComponentControlPointWorldPosition: getComponentControlPointWorldPosition,
      refreshComponent: refreshComponent,
      isReady: isReady
    };
  }

  function showSceneBootError(err) {
    var message =
      err && err.message ? err.message : err ? String(err) : "未知错误";
    var existing = document.getElementById("namoraSceneBootError");
    if (existing) existing.remove();

    var banner = document.createElement("div");
    banner.id = "namoraSceneBootError";
    banner.className = "namora-scene-boot-error";
    banner.setAttribute("role", "alert");
    banner.innerHTML =
      "<strong>" +
      LAYOUT_EDITOR_UI.sceneBootErrorTitle +
      "</strong>" +
      "<pre>" +
      message.replace(/</g, "&lt;") +
      "</pre>";
    document.body.appendChild(banner);
  }

  /* ------------------------------------------------------------------------ */
  /* Boot — SceneRuntime first, LayoutEditor never initializes Runtime        */
  /* ------------------------------------------------------------------------ */

  objectIndexById = buildObjectIndex();

  document.body.classList.add("namora-scene-loading");

  sceneRuntimeInstance = createSceneRuntime();
  sceneRuntimeInstance
    .loadScene(DEFAULT_SCENE_ID)
    .then(function () {
      sceneRuntimeInstance.prepareRenderer();
      sceneRuntimeInstance.sceneReady();
      validateAnchorRegistry();
      validateObjectRegistry();
      initLegacyChat();
      initUserInputRuntime();
      initConversationRuntime();
      layoutEditorInstance = createLayoutEditor();
      if (isLayoutEditorQueryEnabled()) {
        layoutEditorInstance.enable();
      }
      document.body.classList.remove("namora-scene-loading");
      var bootError = document.getElementById("namoraSceneBootError");
      if (bootError) bootError.remove();
      if (NAMORA_BOOT_MODE.debug) {
        console.info("[Namora] Boot Mode:", {
          debug: NAMORA_BOOT_MODE.debug,
          layoutEdit: NAMORA_BOOT_MODE.layoutEdit
        });
      }
      // Re-measure Speech Bubble content once webfonts finish loading so the
      // adaptive geometry reflects final glyph metrics (Task 036).
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          try {
            refreshSceneComponents();
          } catch (e) {
            /* non-fatal */
          }
        });
      }
    })
    .catch(function (err) {
      console.error("[Namora] SceneRuntime boot failed:", err);
      document.body.classList.remove("namora-scene-loading");
      showSceneBootError(err);
    });

  window.SceneRuntime = {
    loadScene: function (sceneId) {
      return sceneRuntimeInstance.loadScene(sceneId).then(function (state) {
        sceneRuntimeInstance.prepareRenderer();
        sceneRuntimeInstance.sceneReady();
        return state;
      });
    },
    reloadScene: function () {
      return sceneRuntimeInstance.reloadScene().then(function (state) {
        sceneRuntimeInstance.prepareRenderer();
        sceneRuntimeInstance.sceneReady();
        return state;
      });
    },
    getScene: function () {
      return sceneRuntimeInstance.getScene();
    },
    getSceneState: function () {
      return sceneRuntimeInstance.getSceneState();
    },
    getWorld: function () {
      return sceneRuntimeInstance.getWorld();
    },
    getLayout: function () {
      return sceneRuntimeInstance.getLayout();
    },
    getRelationships: function () {
      return sceneRuntimeInstance.getRelationships();
    },
    getObjects: function () {
      return sceneRuntimeInstance.getObjects();
    },
    getSceneComponents: function () {
      return sceneRuntimeInstance.getSceneComponents();
    },
    getComponent: function (componentId) {
      return sceneRuntimeInstance.getComponent(componentId);
    },
    refreshComponents: function () {
      return sceneRuntimeInstance.refreshComponents();
    },
    getComponentLocalGeometry: function (componentId) {
      return sceneRuntimeInstance.getComponentLocalGeometry(componentId);
    },
    getComponentWorldTransform: function (componentId) {
      return sceneRuntimeInstance.getComponentWorldTransform(componentId);
    },
    getComponentControlPointWorldPosition: function (componentId, pointId) {
      return sceneRuntimeInstance.getComponentControlPointWorldPosition(
        componentId,
        pointId
      );
    },
    refreshComponent: function (componentId) {
      return sceneRuntimeInstance.refreshComponent(componentId);
    },
    isReady: function () {
      return sceneRuntimeInstance.isReady();
    },
    getLayoutSource: function () {
      return sceneRuntimeInstance.getLayoutSource();
    },
    getCanonicalLayoutProfile: function () {
      return sceneRuntimeInstance.getCanonicalLayoutProfile();
    },
    reloadLayoutProfile: function () {
      return sceneRuntimeInstance.reloadLayoutProfile();
    },
    validateLayoutProfileForRuntime: function (profile) {
      return validateLayoutProfileForRuntime(
        profile,
        NAMORA_WORLD,
        EXPECTED_LAYOUT_PROFILE_ID
      );
    },
    testLayoutProfileSelfReconstruction: function (profile) {
      return testLayoutProfileSelfReconstruction(profile);
    },
    testNormalizeDoesNotMutateInput: function (profile) {
      return testNormalizeDoesNotMutateInput(
        profile || layoutLoadInfo.canonicalProfile
      );
    },
    approximatelyEqual: approximatelyEqual,
    pointsApproximatelyEqual: pointsApproximatelyEqual,
    getSerializationTolerance: function () {
      return LAYOUT_SERIALIZATION_TOLERANCE;
    },
    getLiveRegistrationTolerance: function () {
      return LIVE_REGISTRATION_TOLERANCE;
    },
    prepareRenderer: function () {
      return sceneRuntimeInstance.prepareRenderer();
    },
    sceneReady: function () {
      return sceneRuntimeInstance.sceneReady();
    },
    getInputRuntime: function () {
      return inputRuntimeInstance;
    },
    getPearlRuntime: function () {
      return pearlRuntimeInstance;
    },
    getUserInputGroupRuntime: function () {
      return userInputGroupRuntimeInstance;
    },
    getConversationRuntime: function () {
      return conversationRuntimeInstance;
    },
    getSpeechBubbleRuntime: function () {
      return speechBubbleRuntimeInstance;
    }
  };
  Object.freeze(window.SceneRuntime);

  window.ConversationRuntime = {
    get: function () {
      return conversationRuntimeInstance;
    }
  };
  Object.freeze(window.ConversationRuntime);

  window.SpeechBubbleRuntime = {
    get: function () {
      return speechBubbleRuntimeInstance;
    }
  };
  Object.freeze(window.SpeechBubbleRuntime);

  window.LocalResponseProvider = {
    get: function () {
      return localResponseProviderInstance;
    },
    simulateFailureOnce: function () {
      if (
        localResponseProviderInstance &&
        typeof localResponseProviderInstance.simulateFailureOnce === "function"
      ) {
        localResponseProviderInstance.simulateFailureOnce();
      }
    }
  };
  Object.freeze(window.LocalResponseProvider);

  window.DeepSeekResponseProvider = {
    get: function () {
      return deepSeekResponseProviderInstance;
    },
    simulateFailureOnce: function () {
      if (
        deepSeekResponseProviderInstance &&
        typeof deepSeekResponseProviderInstance.simulateFailureOnce ===
          "function"
      ) {
        deepSeekResponseProviderInstance.simulateFailureOnce();
      }
    },
    simulateInvalidResponseOnce: function () {
      if (
        deepSeekResponseProviderInstance &&
        typeof deepSeekResponseProviderInstance.simulateInvalidResponseOnce ===
          "function"
      ) {
        deepSeekResponseProviderInstance.simulateInvalidResponseOnce();
      }
    },
    simulateTimeoutOnce: function () {
      if (
        deepSeekResponseProviderInstance &&
        typeof deepSeekResponseProviderInstance.simulateTimeoutOnce ===
          "function"
      ) {
        deepSeekResponseProviderInstance.simulateTimeoutOnce();
      }
    }
  };
  Object.freeze(window.DeepSeekResponseProvider);

  window.ResponseProviderRegistry = {
    getActiveProviderName: function () {
      return responseProviderRegistryInstance
        ? responseProviderRegistryInstance.getActiveProviderName()
        : null;
    },
    setActiveProvider: function (name) {
      return responseProviderRegistryInstance
        ? responseProviderRegistryInstance.setActiveProvider(name)
        : false;
    },
    getProvider: function (name) {
      return responseProviderRegistryInstance
        ? responseProviderRegistryInstance.getProvider(name)
        : null;
    },
    listProviders: function () {
      return responseProviderRegistryInstance
        ? responseProviderRegistryInstance.listProviders()
        : [];
    }
  };
  Object.freeze(window.ResponseProviderRegistry);

  window.InputRuntime = {
    get: function () {
      return inputRuntimeInstance;
    }
  };
  Object.freeze(window.InputRuntime);

  window.PearlRuntime = {
    get: function () {
      return pearlRuntimeInstance;
    }
  };
  Object.freeze(window.PearlRuntime);

  window.UserInputGroupRuntime = {
    get: function () {
      return userInputGroupRuntimeInstance;
    },
    submit: function () {
      return userInputGroupRuntimeInstance
        ? userInputGroupRuntimeInstance.submit()
        : false;
    }
  };
  Object.freeze(window.UserInputGroupRuntime);

  window.LayoutEditor = {
    enable: function () {
      layoutEditorInstance.enable();
    },
    disable: function () {
      layoutEditorInstance.disable();
    },
    selectObject: function (objectId) {
      return layoutEditorInstance.selectObject(objectId);
    },
    getSelectedObject: function () {
      return layoutEditorInstance.getSelectedObject();
    },
    selectControlPoint: function (anchorId) {
      return layoutEditorInstance.selectControlPoint(anchorId);
    },
    getSelectedControlPoint: function () {
      return layoutEditorInstance.getSelectedControlPoint();
    },
    setActiveTool: function (toolId) {
      return layoutEditorInstance.setActiveTool(toolId);
    },
    getActiveTool: function () {
      return layoutEditorInstance.getActiveTool();
    },
    moveSelectedPoint: function (dx, dy) {
      return layoutEditorInstance.moveSelectedPoint(dx, dy);
    },
    unlockControlPointTemporarily: function (anchorId) {
      return layoutEditorInstance.unlockControlPointTemporarily(anchorId);
    },
    lockControlPointTemporarily: function (anchorId) {
      return layoutEditorInstance.lockControlPointTemporarily(anchorId);
    },
    isControlPointTemporarilyUnlocked: function (anchorId) {
      return layoutEditorInstance.isControlPointTemporarilyUnlocked(anchorId);
    },
    isControlPointEditable: function (anchorId) {
      return layoutEditorInstance.isControlPointEditable(anchorId);
    },
    resetSelectedControlPoint: function () {
      return layoutEditorInstance.resetSelectedControlPoint();
    },
    resetAllTemporaryCoordinates: function () {
      return layoutEditorInstance.resetAllTemporaryCoordinates();
    },
    getTemporaryCoordinates: function () {
      return layoutEditorInstance.getTemporaryCoordinates();
    },
    hasUnsavedChanges: function () {
      return layoutEditorInstance.hasUnsavedChanges();
    },
    listObjects: function () {
      return layoutEditorInstance.listObjects();
    },
    getSpatialSnapshot: function () {
      return layoutEditorInstance.getSpatialSnapshot();
    },
    isUserInputGroupBound: function () {
      return layoutEditorInstance.isUserInputGroupBound();
    },
    toggleComponentPreview: function (forceEnabled) {
      return layoutEditorInstance.toggleComponentPreview(forceEnabled);
    },
    isComponentPreviewEnabled: function () {
      return layoutEditorInstance.isComponentPreviewEnabled();
    },
    bindUserInputGroup: function () {
      return layoutEditorInstance.bindUserInputGroup();
    },
    unbindUserInputGroup: function () {
      return layoutEditorInstance.unbindUserInputGroup();
    },
    buildLayoutProfile: function () {
      return layoutEditorInstance.buildLayoutProfile();
    },
    validateLayoutProfile: function (profile) {
      return layoutEditorInstance.validateLayoutProfile(profile);
    },
    normalizeLayoutProfile: function (profile) {
      return normalizeLayoutProfile(profile);
    },
    migrateLayoutProfileV1ToV1_1: function (profile) {
      return migrateLayoutProfileV1ToV1_1(profile);
    },
    testLayoutProfileReconstruction: function (profile) {
      return layoutEditorInstance.testLayoutProfileReconstruction(profile);
    },
    copyLayoutProfile: function () {
      return layoutEditorInstance.copyLayoutProfile();
    },
    downloadLayoutProfile: function () {
      return layoutEditorInstance.downloadLayoutProfile();
    },
    getLayoutProfilePreview: function () {
      return layoutEditorInstance.getLayoutProfilePreview();
    },
    serializeLayoutProfile: function (profile) {
      return layoutEditorInstance.serializeLayoutProfile(profile);
    },
    importLayoutProfileFile: function (file) {
      return layoutEditorInstance.importLayoutProfileFile(file);
    },
    previewImportedLayoutProfile: function (profile) {
      return layoutEditorInstance.previewImportedLayoutProfile(profile);
    },
    applyImportedLayoutProfile: function (profile) {
      return layoutEditorInstance.applyImportedLayoutProfile(profile);
    },
    clearImportedLayoutProfile: function () {
      return layoutEditorInstance.clearImportedLayoutProfile();
    },
    restoreProjectCanonicalLayout: function () {
      return layoutEditorInstance.restoreProjectCanonicalLayout();
    },
    getActiveLayoutBaseline: function () {
      return layoutEditorInstance.getActiveLayoutBaseline();
    },
    selectComponentControlPoint: function (componentId, pointId) {
      return layoutEditorInstance.selectComponentControlPoint(componentId, pointId);
    },
    getSelectedComponentControlPoint: function () {
      return layoutEditorInstance.getSelectedComponentControlPoint();
    },
    moveSelectedComponentPoint: function (dx, dy) {
      return layoutEditorInstance.moveSelectedComponentPoint(dx, dy);
    },
    getTemporaryComponentOverrides: function () {
      return layoutEditorInstance.getTemporaryComponentOverrides();
    },
    resetComponentOverrides: function (componentId) {
      return layoutEditorInstance.resetComponentOverrides(componentId);
    }
  };

  Object.freeze(window.LayoutEditor);

  window.NamoraWorld = {
    updateLayout: updateNamoraWorldLayout,
    getLastLayout: function () {
      return lastLayout;
    },
    computeWorldScale: computeWorldScale,
    computeNanaWorldPosition: computeNanaWorldPosition,
    getAnchor: getAnchor,
    getAnchorSourcePosition: getAnchorSourcePosition,
    getAnchorWorldPosition: getAnchorWorldPosition,
    getAnchorViewportPosition: getAnchorViewportPosition,
    listAnchors: listAnchors,
    validateAnchorRegistry: validateAnchorRegistry,
    getNanaWorldTransform: getNanaWorldTransform,
    getEffectiveStandingPoint: getEffectiveStandingPoint,
    viewportToWorldPoint: viewportToWorldPoint,
    worldToNanaLocalPoint: worldToNanaLocalPoint,
    viewportToNanaLocalPoint: viewportToNanaLocalPoint,
    worldToViewportPoint: worldToViewportPoint,
    nanaLocalToWorldPoint: nanaLocalToWorldPoint,
    clientToScenePoint: clientToScenePoint,
    isAnchorVisualizationEnabled: isAnchorVisualizationEnabled,
    getBootMode: function () {
      return {
        debug: !!NAMORA_BOOT_MODE.debug,
        layoutEdit: !!NAMORA_BOOT_MODE.layoutEdit
      };
    },
    getObject: getObject,
    listObjects: listObjects,
    getChildren: getChildren,
    getObjectChain: getObjectChain,
    validateObjectRegistry: validateObjectRegistry
  };

  Object.defineProperty(window.NamoraWorld, "world", {
    enumerable: true,
    get: function () {
      // Safe snapshot — never expose the live mutable binding for write-back.
      return NAMORA_WORLD ? deepCloneLayoutProfile(NAMORA_WORLD) : null;
    }
  });

  Object.defineProperty(window.NamoraWorld, "anchors", {
    enumerable: true,
    get: function () {
      return listAnchors();
    }
  });

  Object.defineProperty(window.NamoraWorld, "objects", {
    enumerable: true,
    get: function () {
      return listObjects();
    }
  });
})();
