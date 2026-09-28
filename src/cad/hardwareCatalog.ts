import type { CabinetParameters, HardwareCategory, HardwareDefinition } from './types';

export const HARDWARE_CATALOG_VERSION = 2;

export const HARDWARE_CATALOG: HardwareDefinition[] = [
  {
    "id": "generic_side_mount_12_7_450",
    "category": "drawer_slide",
    "manufacturer": "Generic",
    "family": "Side-mount ball-bearing",
    "model": "450 mm / 12.7 mm clearance",
    "label": "Generic side-mount 450 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "reference",
      "verified": false,
      "notes": "Project reference profile; verify actual hardware before machining."
    },
    "source": {
      "type": "project_reference",
      "title": "Modular Storage generic side-mount baseline"
    },
    "geometrySupport": {
      "status": "native",
      "notes": "Project reference profile; all apply keys map directly to current V35 geometry."
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 3
    },
    "dimensions": {
      "length": 450,
      "height": 45
    },
    "drilling": {
      "enabled": true,
      "cabinetHolesX": [
        37,
        133,
        229,
        325
      ],
      "drawerHolesX": [
        37,
        133,
        229,
        325
      ],
      "cabinetHoleDiameter": 5,
      "drawerHoleDiameter": 5,
      "cabinetHoleZFromDrawerBottom": 22.5,
      "drawerHoleZFromDrawerBottom": 22.5
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "generic_side_mount_12_7_450",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 450,
      "metalSlideFrontSetback": 3,
      "metalSlideEnvelopeHeight": 45,
      "includeMetalSlideHoles": true,
      "hardwareDrillingMode": "recommended",
      "metalSlideCabinetHolesX": [
        37,
        133,
        229,
        325
      ],
      "metalSlideDrawerHolesX": [
        37,
        133,
        229,
        325
      ],
      "metalSlideCabinetHoleDiameter": 5,
      "metalSlideDrawerHoleDiameter": 5,
      "metalSlideCabinetHoleZFromDrawerBottom": 22.5,
      "metalSlideDrawerHoleZFromDrawerBottom": 22.5
    }
  },
  {
    "id": "generic_side_mount_12_7_500",
    "category": "drawer_slide",
    "manufacturer": "Generic",
    "family": "Side-mount ball-bearing",
    "model": "500 mm / 12.7 mm clearance",
    "label": "Generic side-mount 500 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "reference",
      "verified": false,
      "notes": "Project reference profile; verify actual hardware before machining."
    },
    "source": {
      "type": "project_reference",
      "title": "Modular Storage generic side-mount baseline"
    },
    "geometrySupport": {
      "status": "native",
      "notes": "Project reference profile; all apply keys map directly to current V35 geometry."
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 3
    },
    "dimensions": {
      "length": 500,
      "height": 45
    },
    "drilling": {
      "enabled": true,
      "cabinetHolesX": [
        37,
        133,
        229,
        325,
        421
      ],
      "drawerHolesX": [
        37,
        133,
        229,
        325,
        421
      ],
      "cabinetHoleDiameter": 5,
      "drawerHoleDiameter": 5,
      "cabinetHoleZFromDrawerBottom": 22.5,
      "drawerHoleZFromDrawerBottom": 22.5
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "generic_side_mount_12_7_500",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 500,
      "metalSlideFrontSetback": 3,
      "metalSlideEnvelopeHeight": 45,
      "includeMetalSlideHoles": true,
      "hardwareDrillingMode": "recommended",
      "metalSlideCabinetHolesX": [
        37,
        133,
        229,
        325,
        421
      ],
      "metalSlideDrawerHolesX": [
        37,
        133,
        229,
        325,
        421
      ],
      "metalSlideCabinetHoleDiameter": 5,
      "metalSlideDrawerHoleDiameter": 5,
      "metalSlideCabinetHoleZFromDrawerBottom": 22.5,
      "metalSlideDrawerHoleZFromDrawerBottom": 22.5
    }
  },
  {
    "id": "accuride_3832e_450",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E18",
    "label": "Accuride 3832E 450 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Manufacturer-verified length, 12.7 mm side space and 45.7 mm height. Automatic drilling is intentionally disabled because the rail offers multiple mounting-hole/slot choices."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "manufacturer_length_range_in": [
        6,
        28
      ],
      "load_rating_lb": 100,
      "drilling_note": "Multiple slots/holes are provided; automatic drilling is intentionally disabled."
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 450,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_450",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 450,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_500",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E20",
    "label": "Accuride 3832E 500 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Manufacturer-verified length, 12.7 mm side space and 45.7 mm height. Automatic drilling is intentionally disabled because the rail offers multiple mounting-hole/slot choices."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "manufacturer_length_range_in": [
        6,
        28
      ],
      "load_rating_lb": 100,
      "drilling_note": "Multiple slots/holes are provided; automatic drilling is intentionally disabled.",
      "nominal_length_mm": 500,
      "note": "Legacy metric convenience preset; manufacturer family is sold in inch lengths."
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 500,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_500",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 500,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8400_18in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8400",
    "model": "8400 18 in",
    "label": "KV 8400 18 in (457.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Manufacturer documents verify 12.7 mm minimum side clearance, 45.5 mm slide height, 32 mm system compatibility and 18 in length. Drilling remains disabled because the slide exposes multiple direct-access mounting choices."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Knape & Vogt",
      "title": "8400 Full Extension Box or File Drawer Slide / installation instructions",
      "url": "https://knapeandvogt.com/sites/default/files/300834-0708-8400Installation%20sheet.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "available_lengths_in": [
        8,
        10,
        12,
        14,
        16,
        18,
        20,
        22,
        24,
        26,
        28
      ],
      "load_class_lb": 100,
      "hole_pattern": "traditional_and_32mm"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 2
    },
    "dimensions": {
      "length": 457.2,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8400_18in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 457.2,
      "metalSlideFrontSetback": 2,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8400_20in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8400",
    "model": "8400 20 in",
    "label": "KV 8400 20 in (508 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Manufacturer documents verify 12.7 mm minimum side clearance, 45.5 mm slide height, 32 mm system compatibility and 18 in length. Drilling remains disabled because the slide exposes multiple direct-access mounting choices."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Knape & Vogt",
      "title": "8400 Full Extension Box or File Drawer Slide / installation instructions",
      "url": "https://knapeandvogt.com/sites/default/files/300834-0708-8400Installation%20sheet.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "available_lengths_in": [
        8,
        10,
        12,
        14,
        16,
        18,
        20,
        22,
        24,
        26,
        28
      ],
      "load_class_lb": 100,
      "hole_pattern": "traditional_and_32mm",
      "nominal_length_in": 20,
      "nominal_length_mm": 508
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 2
    },
    "dimensions": {
      "length": 508,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8400_20in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 508,
      "metalSlideFrontSetback": 2,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "hettich_ka5632_450",
    "category": "drawer_slide",
    "manufacturer": "Hettich",
    "family": "KA 5632",
    "model": "1073724",
    "label": "Hettich KA 5632 450 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Manufacturer product data verifies 450 mm length and 46 x 12.7 mm section. Drilling is disabled until a specific mounting-hole choice is encoded."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "KA 5632 ball bearing runner 450 mm",
      "url": "https://shop.hettich.com/us_EN/Runner-systems/Ball-bearing-runners/Side-installation/KA-5632-ball-bearing-runner%2C-side-installation%2C-dimensions-%28H-x-W%29-46-x-12-7-mm%2C-450-mm%2C-black/p/1073724",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "cross_section_h_mm": 46,
      "cross_section_w_mm": 12.7,
      "load_capacity_kg": 45,
      "available_lengths_mm": [
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
        650,
        700
      ]
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 450,
      "height": 46
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "hettich_ka5632_450",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 450,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 46,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "hettich_ka5632_500",
    "category": "drawer_slide",
    "manufacturer": "Hettich",
    "family": "KA 5632",
    "model": "1073725",
    "label": "Hettich KA 5632 500 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Manufacturer product data verifies 450 mm length and 46 x 12.7 mm section. Drilling is disabled until a specific mounting-hole choice is encoded."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "KA 5632 ball bearing runner 500 mm",
      "url": "https://shop.hettich.com/us_EN/Runner-systems/Ball-bearing-runners/Side-installation/KA-5632-ball-bearing-runner%2C-side-installation%2C-dimensions-%28H-x-W%29-46-x-12-7-mm%2C-500-mm%2C-black/p/1073725",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "cross_section_h_mm": 46,
      "cross_section_w_mm": 12.7,
      "load_capacity_kg": 45,
      "available_lengths_mm": [
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
        650,
        700
      ],
      "nominal_length_mm": 500
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 500,
      "height": 46
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "hettich_ka5632_500",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 500,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 46,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "generic_euro_35_110_overlay",
    "category": "hinge",
    "manufacturer": "Generic",
    "family": "35 mm concealed hinge",
    "model": "110 degree overlay",
    "label": "Generic Euro 35 mm / overlay",
    "targets": [
      "utility",
      "shop_cart",
      "stackable",
      "kitchen"
    ],
    "verification": {
      "status": "reference",
      "verified": false,
      "notes": "Generic baseline; verify exact hinge and plate."
    },
    "source": {
      "type": "project_reference",
      "title": "Modular Storage generic Euro-hinge baseline"
    },
    "geometrySupport": {
      "status": "native",
      "notes": "Project reference profile; all apply keys map directly to current V35 geometry."
    },
    "requiredClearances": {},
    "dimensions": {
      "cupDiameter": 35,
      "cupDepth": 12,
      "cupCenterFromDoorEdge": 22.5
    },
    "drilling": {
      "enabled": true,
      "doorFixingEnabled": true,
      "doorFixingHoleDiameter": 3,
      "doorFixingHoleSpacing": 45,
      "plateHolesEnabled": true,
      "plateHoleDiameter": 5,
      "plateCenterFromFront": 37,
      "plateHoleSpacing": 32
    },
    "frontMountStyle": "overlay",
    "parameterPatch": {
      "hingeStyle": "euro_35mm",
      "hingeId": "generic_euro_35_110_overlay",
      "frontMountStyle": "overlay",
      "hingeCupDiameter": 35,
      "hingeCupDepth": 12,
      "hingeCupCenterFromDoorEdge": 22.5,
      "hingeDoorFixingEnabled": true,
      "hingeDoorFixingHoleDiameter": 3,
      "hingeDoorFixingHoleSpacing": 45,
      "hingePlateHolesEnabled": true,
      "hingePlateHoleDiameter": 5,
      "hingePlateCenterFromFront": 37,
      "hingePlateHoleSpacing": 32
    }
  },
  {
    "id": "generic_euro_35_110_inset",
    "category": "hinge",
    "manufacturer": "Generic",
    "family": "35 mm concealed hinge",
    "model": "110 degree inset",
    "label": "Generic Euro 35 mm / inset",
    "targets": [
      "utility",
      "shop_cart",
      "stackable",
      "kitchen"
    ],
    "verification": {
      "status": "reference",
      "verified": false,
      "notes": "Generic baseline; verify exact hinge and plate."
    },
    "source": {
      "type": "project_reference",
      "title": "Modular Storage generic Euro-hinge baseline"
    },
    "geometrySupport": {
      "status": "native",
      "notes": "Project reference profile; all apply keys map directly to current V35 geometry."
    },
    "requiredClearances": {},
    "dimensions": {
      "cupDiameter": 35,
      "cupDepth": 12,
      "cupCenterFromDoorEdge": 22.5
    },
    "drilling": {
      "enabled": true,
      "doorFixingEnabled": true,
      "doorFixingHoleDiameter": 3,
      "doorFixingHoleSpacing": 45,
      "plateHolesEnabled": true,
      "plateHoleDiameter": 5,
      "plateCenterFromFront": 37,
      "plateHoleSpacing": 32
    },
    "frontMountStyle": "inset_flush",
    "parameterPatch": {
      "hingeStyle": "euro_35mm",
      "hingeId": "generic_euro_35_110_inset",
      "frontMountStyle": "inset_flush",
      "hingeCupDiameter": 35,
      "hingeCupDepth": 12,
      "hingeCupCenterFromDoorEdge": 22.5,
      "hingeDoorFixingEnabled": true,
      "hingeDoorFixingHoleDiameter": 3,
      "hingeDoorFixingHoleSpacing": 45,
      "hingePlateHolesEnabled": true,
      "hingePlateHoleDiameter": 5,
      "hingePlateCenterFromFront": 37,
      "hingePlateHoleSpacing": 32
    }
  },
  {
    "id": "blum_clip_top_blumotion_110_overlay_reference",
    "category": "hinge",
    "manufacturer": "Blum",
    "family": "CLIP top BLUMOTION",
    "model": "71B3550",
    "label": "Blum CLIP top BLUMOTION 110° / overlay screw-on",
    "targets": [
      "utility",
      "shop_cart",
      "stackable",
      "kitchen"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "35 mm cup, 13 mm boring depth and 37/32 mounting-plate reference are manufacturer-based. Door fixing is disabled because attachment variants differ; cup center uses a 5 mm K reference and should be checked for the chosen application."
    },
    "source": {
      "type": "manufacturer_catalog",
      "manufacturer": "Blum",
      "title": "Catalogue 2027/2028 — CLIP top BLUMOTION 110° standard application",
      "url": "https://publications.blum.com/2026/catalogue/en/70/",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "application": "overlay",
      "opening_angle_deg": 110,
      "cup_diameter_mm": 35,
      "cup_depth_mm": 13,
      "attachment": "screw_on",
      "part_number": "71B3550",
      "plate_system_line_mm": 37,
      "plate_hole_pitch_mm": 32,
      "note": "Cup edge distance K/application setup varies; V35 uses K=5 mm as a neutral reference and does not auto-drill cup fixing wings."
    },
    "requiredClearances": {},
    "dimensions": {
      "cupDiameter": 35,
      "cupDepth": 13,
      "cupCenterFromDoorEdge": 22.5
    },
    "drilling": {
      "enabled": true,
      "doorFixingEnabled": false,
      "plateHolesEnabled": true,
      "plateHoleDiameter": 5,
      "plateCenterFromFront": 37,
      "plateHoleSpacing": 32
    },
    "frontMountStyle": "overlay",
    "parameterPatch": {
      "hingeStyle": "euro_35mm",
      "hingeId": "blum_clip_top_blumotion_110_overlay_reference",
      "frontMountStyle": "overlay",
      "hingeCupDiameter": 35,
      "hingeCupDepth": 13,
      "hingeCupCenterFromDoorEdge": 22.5,
      "hingeDoorFixingEnabled": false,
      "hingePlateHolesEnabled": true,
      "hingePlateHoleDiameter": 5,
      "hingePlateCenterFromFront": 37,
      "hingePlateHoleSpacing": 32
    }
  },
  {
    "id": "blum_clip_top_blumotion_110_inset_reference",
    "category": "hinge",
    "manufacturer": "Blum",
    "family": "CLIP top BLUMOTION",
    "model": "71B3750",
    "label": "Blum CLIP top BLUMOTION 110° / inset screw-on",
    "targets": [
      "utility",
      "shop_cart",
      "stackable",
      "kitchen"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "35 mm cup, 13 mm boring depth and 37/32 mounting-plate reference are manufacturer-based. Door fixing is disabled because attachment variants differ; cup center uses a 5 mm K reference and should be checked for the chosen application."
    },
    "source": {
      "type": "manufacturer_catalog",
      "manufacturer": "Blum",
      "title": "Catalogue 2027/2028 — CLIP top BLUMOTION 110° standard application",
      "url": "https://publications.blum.com/2026/catalogue/en/70/",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "application": "inset",
      "opening_angle_deg": 110,
      "cup_diameter_mm": 35,
      "cup_depth_mm": 13,
      "attachment": "screw_on",
      "part_number": "71B3750",
      "plate_system_line_mm": 37,
      "plate_hole_pitch_mm": 32,
      "note": "Cup edge distance K/application setup varies; V35 uses K=5 mm as a neutral reference and does not auto-drill cup fixing wings."
    },
    "requiredClearances": {},
    "dimensions": {
      "cupDiameter": 35,
      "cupDepth": 13,
      "cupCenterFromDoorEdge": 22.5
    },
    "drilling": {
      "enabled": true,
      "doorFixingEnabled": false,
      "plateHolesEnabled": true,
      "plateHoleDiameter": 5,
      "plateCenterFromFront": 37,
      "plateHoleSpacing": 32
    },
    "frontMountStyle": "inset_flush",
    "parameterPatch": {
      "hingeStyle": "euro_35mm",
      "hingeId": "blum_clip_top_blumotion_110_inset_reference",
      "frontMountStyle": "inset_flush",
      "hingeCupDiameter": 35,
      "hingeCupDepth": 13,
      "hingeCupCenterFromDoorEdge": 22.5,
      "hingeDoorFixingEnabled": false,
      "hingePlateHolesEnabled": true,
      "hingePlateHoleDiameter": 5,
      "hingePlateCenterFromFront": 37,
      "hingePlateHoleSpacing": 32
    }
  },
  {
    "id": "hettich_sensys_8645i_overlay_screw",
    "category": "hinge",
    "manufacturer": "Hettich",
    "family": "Sensys 8645i",
    "model": "9073605",
    "label": "Hettich Sensys 8645i 110° / overlay screw-on",
    "targets": [
      "utility",
      "shop_cart",
      "stackable",
      "kitchen"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Product data verifies 35 mm cup, 12.8 mm cup depth, overlay application and TH 52 x 5.5 drilling family. Door fixing and mounting-plate through drilling are disabled because the current engine does not yet model the product's blind screw/dowel operations."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "Sensys 8645i overlay 9073605",
      "url": "https://shop.hettich.com/hn_EN/Hinges/Sensys-hinge-series/Hinges/Sensys-110%C2%B0-hinge-with-integrated-silent-system-%28Sensys-8645i%29%2C-nickel-plated%2C-overlay%2C-Opening-angle-110%C2%B0%2C-TH-drilling-pattern-52-x-5-5-mm%2C-for-screwing-on-%28-%29/p/9073605",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "application": "overlay",
      "opening_angle_deg": 110,
      "door_thickness_mm": [
        15,
        24
      ],
      "cup_diameter_mm": 35,
      "cup_depth_mm": 12.8,
      "drilling_pattern": "TH 52 x 5.5 mm",
      "fixing_hole_spacing_mm": 52,
      "fixing_hole_offset_from_cup_centerline_mm": 5.5,
      "base_mm": 12.5,
      "part_number": "9073605"
    },
    "requiredClearances": {},
    "dimensions": {
      "cupDiameter": 35,
      "cupDepth": 12.8,
      "cupCenterFromDoorEdge": 23
    },
    "drilling": {
      "enabled": true,
      "doorFixingEnabled": false,
      "doorFixingHoleSpacing": 52,
      "plateHolesEnabled": false
    },
    "frontMountStyle": "overlay",
    "parameterPatch": {
      "hingeStyle": "euro_35mm",
      "hingeId": "hettich_sensys_8645i_overlay_screw",
      "frontMountStyle": "overlay",
      "hingeCupDiameter": 35,
      "hingeCupDepth": 12.8,
      "hingeCupCenterFromDoorEdge": 23,
      "hingeDoorFixingEnabled": false,
      "hingeDoorFixingHoleSpacing": 52,
      "hingePlateHolesEnabled": false
    }
  },
  {
    "id": "hettich_sensys_8645i_inset_screw",
    "category": "hinge",
    "manufacturer": "Hettich",
    "family": "Sensys 8645i",
    "model": "9073607",
    "label": "Hettich Sensys 8645i 110° / inset screw-on",
    "targets": [
      "utility",
      "shop_cart",
      "stackable",
      "kitchen"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Product data verifies 35 mm cup, 12.8 mm cup depth, overlay application and TH 52 x 5.5 drilling family. Door fixing and mounting-plate through drilling are disabled because the current engine does not yet model the product's blind screw/dowel operations."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "Sensys 8645i inset 9073607",
      "url": "https://shop.hettich.com/us_EN/Hinges/Sensys-hinge-series/Hinges/Sensys-110%C2%B0-hinge-with-integrated-silent-system-%28Sensys-8645i%29%2C-nickel-plated%2C-inset%2C-Opening-angle-110%C2%B0%2C-TH-drilling-pattern-52-x-5-5-mm%2C-for-screwing-on-%28-%29/p/9073607",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "application": "inset",
      "opening_angle_deg": 110,
      "door_thickness_mm": [
        15,
        24
      ],
      "cup_diameter_mm": 35,
      "cup_depth_mm": 12.8,
      "drilling_pattern": "TH 52 x 5.5 mm",
      "fixing_hole_spacing_mm": 52,
      "fixing_hole_offset_from_cup_centerline_mm": 5.5,
      "base_mm": -4,
      "part_number": "9073607"
    },
    "requiredClearances": {},
    "dimensions": {
      "cupDiameter": 35,
      "cupDepth": 12.8,
      "cupCenterFromDoorEdge": 23
    },
    "drilling": {
      "enabled": true,
      "doorFixingEnabled": false,
      "doorFixingHoleSpacing": 52,
      "plateHolesEnabled": false
    },
    "frontMountStyle": "inset_flush",
    "parameterPatch": {
      "hingeStyle": "euro_35mm",
      "hingeId": "hettich_sensys_8645i_inset_screw",
      "frontMountStyle": "inset_flush",
      "hingeCupDiameter": 35,
      "hingeCupDepth": 12.8,
      "hingeCupCenterFromDoorEdge": 23,
      "hingeDoorFixingEnabled": false,
      "hingeDoorFixingHoleSpacing": 52,
      "hingePlateHolesEnabled": false
    }
  },
  {
    "id": "salice_silentia_plus_105_overlay",
    "category": "hinge",
    "manufacturer": "Salice",
    "family": "Silentia+ Series 100",
    "model": "C1_6AE_",
    "label": "Salice Silentia+ Series 100 105° / full overlay",
    "targets": [
      "utility",
      "shop_cart",
      "stackable",
      "kitchen"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Manufacturer data verifies 35 mm cup, 12 mm cup depth and K range 3-6 mm. This patch uses K=5 mm as a neutral reference and disables door/plate through drilling."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Salice",
      "title": "Silentia+ Series 100 - 105° opening - Standard application",
      "url": "https://www.salice.com/us/en/products/hinges/integrated-soft-close-mechanism/silentia-plus-series-100-105-opening-standard-application",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "application": "full_overlay",
      "opening_angle_deg": 105,
      "cup_diameter_mm": 35,
      "cup_depth_mm": 12,
      "cup_edge_distance_k_mm": [
        3,
        6
      ],
      "arm_crank_mm": 0,
      "model_pattern": "C1_6AE_"
    },
    "requiredClearances": {},
    "dimensions": {
      "cupDiameter": 35,
      "cupDepth": 12,
      "cupCenterFromDoorEdge": 22.5
    },
    "drilling": {
      "enabled": true,
      "doorFixingEnabled": false,
      "plateHolesEnabled": false
    },
    "frontMountStyle": "overlay",
    "parameterPatch": {
      "hingeStyle": "euro_35mm",
      "hingeId": "salice_silentia_plus_105_overlay",
      "frontMountStyle": "overlay",
      "hingeCupDiameter": 35,
      "hingeCupDepth": 12,
      "hingeCupCenterFromDoorEdge": 22.5,
      "hingeDoorFixingEnabled": false,
      "hingePlateHolesEnabled": false
    }
  },
  {
    "id": "grass_tiomos_110_overlay_reference",
    "category": "hinge",
    "manufacturer": "GRASS",
    "family": "Tiomos",
    "model": "Tiomos 110",
    "label": "GRASS Tiomos 110° / overlay reference",
    "targets": [
      "utility",
      "shop_cart",
      "stackable",
      "kitchen"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "GRASS technical information verifies 35 mm cup, minimum 12.6 mm cup depth and 45/9.5 drilling family. This patch uses the GRASS 22 mm drilling edge-distance reference (K=4.5) and disables door/plate through drilling."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "GRASS",
      "title": "Tiomos 110 technical information / drilling patterns",
      "url": "https://mediacenter.grass.eu/Produktkataloge/Hinges/EN/",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Safe mounting-envelope/cup parameters map to V35; automatic drilling is only enabled where represented safely."
    },
    "mountingSpecs": {
      "application": "overlay_reference",
      "opening_angle_deg": 110,
      "cup_diameter_mm": 35,
      "cup_depth_min_mm": 12.6,
      "cup_edge_distance_k_mm": [
        3,
        7
      ],
      "drilling_pattern": "45 x 9.5 mm",
      "fixing_hole_spacing_mm": 45,
      "fixing_hole_offset_from_cup_centerline_mm": 9.5,
      "planning_application": "Overlay K3"
    },
    "requiredClearances": {},
    "dimensions": {
      "cupDiameter": 35,
      "cupDepth": 12.6,
      "cupCenterFromDoorEdge": 22
    },
    "drilling": {
      "enabled": true,
      "doorFixingEnabled": false,
      "doorFixingHoleSpacing": 45,
      "plateHolesEnabled": false
    },
    "frontMountStyle": "overlay",
    "parameterPatch": {
      "hingeStyle": "euro_35mm",
      "hingeId": "grass_tiomos_110_overlay_reference",
      "frontMountStyle": "overlay",
      "hingeCupDiameter": 35,
      "hingeCupDepth": 12.6,
      "hingeCupCenterFromDoorEdge": 22,
      "hingeDoorFixingEnabled": false,
      "hingeDoorFixingHoleSpacing": 45,
      "hingePlateHolesEnabled": false
    }
  },
  {
    "id": "accuride_3832e_6in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E6",
    "label": "Accuride 3832E 6 in (152.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 6,
      "nominal_length_mm": 152.4,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 152.4,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_6in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 152.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_8in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E8",
    "label": "Accuride 3832E 8 in (203.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 8,
      "nominal_length_mm": 203.2,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 203.2,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_8in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 203.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_10in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E10",
    "label": "Accuride 3832E 10 in (254.0 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 10,
      "nominal_length_mm": 254,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 254,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_10in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 254,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_12in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E12",
    "label": "Accuride 3832E 12 in (304.8 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 12,
      "nominal_length_mm": 304.8,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 304.8,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_12in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 304.8,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_14in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E14",
    "label": "Accuride 3832E 14 in (355.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 14,
      "nominal_length_mm": 355.6,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 355.6,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_14in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 355.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_16in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E16",
    "label": "Accuride 3832E 16 in (406.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 16,
      "nominal_length_mm": 406.4,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 406.4,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_16in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 406.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_18in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E18",
    "label": "Accuride 3832E 18 in (457.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 18,
      "nominal_length_mm": 457.2,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 457.2,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_18in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 457.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_20in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E20",
    "label": "Accuride 3832E 20 in (508.0 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 20,
      "nominal_length_mm": 508,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 508,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_20in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 508,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_22in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E22",
    "label": "Accuride 3832E 22 in (558.8 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 22,
      "nominal_length_mm": 558.8,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 558.8,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_22in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 558.8,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_24in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E24",
    "label": "Accuride 3832E 24 in (609.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 24,
      "nominal_length_mm": 609.6,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 609.6,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_24in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 609.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_26in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E26",
    "label": "Accuride 3832E 26 in (660.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 26,
      "nominal_length_mm": 660.4,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 660.4,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_26in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 660.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3832e_28in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3832E",
    "model": "3832-E28",
    "label": "Accuride 3832E 28 in (711.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 3832E, 3834E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/516dd0135bf3d6a5f7d76cafd3f74da0.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 28,
      "nominal_length_mm": 711.2,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.7,
      "load_rating_lb": 100
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 711.2,
      "height": 45.7
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3832e_28in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 711.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.7,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8400_8in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8400",
    "model": "8400 8 in",
    "label": "KV 8400 8 in (203.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8400 Full Extension Box or File Drawer Slide",
      "url": "https://knapeandvogt.com/products/8400-full-extension-box-or-file-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 8,
      "nominal_length_mm": 203.2,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "traditional_and_32mm"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 203.2,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8400_8in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 203.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8400_10in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8400",
    "model": "8400 10 in",
    "label": "KV 8400 10 in (254.0 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8400 Full Extension Box or File Drawer Slide",
      "url": "https://knapeandvogt.com/products/8400-full-extension-box-or-file-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 10,
      "nominal_length_mm": 254,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "traditional_and_32mm"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 254,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8400_10in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 254,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8400_12in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8400",
    "model": "8400 12 in",
    "label": "KV 8400 12 in (304.8 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8400 Full Extension Box or File Drawer Slide",
      "url": "https://knapeandvogt.com/products/8400-full-extension-box-or-file-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 12,
      "nominal_length_mm": 304.8,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "traditional_and_32mm"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 304.8,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8400_12in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 304.8,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8400_14in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8400",
    "model": "8400 14 in",
    "label": "KV 8400 14 in (355.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8400 Full Extension Box or File Drawer Slide",
      "url": "https://knapeandvogt.com/products/8400-full-extension-box-or-file-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 14,
      "nominal_length_mm": 355.6,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "traditional_and_32mm"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 355.6,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8400_14in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 355.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8400_16in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8400",
    "model": "8400 16 in",
    "label": "KV 8400 16 in (406.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8400 Full Extension Box or File Drawer Slide",
      "url": "https://knapeandvogt.com/products/8400-full-extension-box-or-file-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 16,
      "nominal_length_mm": 406.4,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "traditional_and_32mm"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 406.4,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8400_16in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 406.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8400_22in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8400",
    "model": "8400 22 in",
    "label": "KV 8400 22 in (558.8 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8400 Full Extension Box or File Drawer Slide",
      "url": "https://knapeandvogt.com/products/8400-full-extension-box-or-file-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 22,
      "nominal_length_mm": 558.8,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "traditional_and_32mm"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 558.8,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8400_22in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 558.8,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8400_24in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8400",
    "model": "8400 24 in",
    "label": "KV 8400 24 in (609.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8400 Full Extension Box or File Drawer Slide",
      "url": "https://knapeandvogt.com/products/8400-full-extension-box-or-file-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 24,
      "nominal_length_mm": 609.6,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "traditional_and_32mm"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 609.6,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8400_24in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 609.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8400_26in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8400",
    "model": "8400 26 in",
    "label": "KV 8400 26 in (660.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8400 Full Extension Box or File Drawer Slide",
      "url": "https://knapeandvogt.com/products/8400-full-extension-box-or-file-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 26,
      "nominal_length_mm": 660.4,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "traditional_and_32mm"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 660.4,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8400_26in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 660.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8400_28in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8400",
    "model": "8400 28 in",
    "label": "KV 8400 28 in (711.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8400 Full Extension Box or File Drawer Slide",
      "url": "https://knapeandvogt.com/products/8400-full-extension-box-or-file-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_in": 28,
      "nominal_length_mm": 711.2,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "traditional_and_32mm"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 711.2,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8400_28in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 711.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "hettich_ka5632_250",
    "category": "drawer_slide",
    "manufacturer": "Hettich",
    "family": "KA 5632",
    "model": "KA 5632 250 mm",
    "label": "Hettich KA 5632 250 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "KA 5632 ball bearing runner, side installation",
      "url": "https://shop.hettich.com/us_EN/Runner-systems/Ball-bearing-runners/Side-installation/KA-5632-ball-bearing-runner%2C-side-installation%2C-dimensions-%28H-x-W%29-46-x-12-7-mm%2C-500-mm%2C-blue-passivated%2C-galvanised/p/73281",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_mm": 250,
      "cross_section_h_mm": 46,
      "cross_section_w_mm": 12.7,
      "load_capacity_kg": 45,
      "available_lengths_mm": [
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
        650,
        700
      ]
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 250,
      "height": 46
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "hettich_ka5632_250",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 250,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 46,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "hettich_ka5632_300",
    "category": "drawer_slide",
    "manufacturer": "Hettich",
    "family": "KA 5632",
    "model": "KA 5632 300 mm",
    "label": "Hettich KA 5632 300 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "KA 5632 ball bearing runner, side installation",
      "url": "https://shop.hettich.com/us_EN/Runner-systems/Ball-bearing-runners/Side-installation/KA-5632-ball-bearing-runner%2C-side-installation%2C-dimensions-%28H-x-W%29-46-x-12-7-mm%2C-500-mm%2C-blue-passivated%2C-galvanised/p/73281",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_mm": 300,
      "cross_section_h_mm": 46,
      "cross_section_w_mm": 12.7,
      "load_capacity_kg": 45,
      "available_lengths_mm": [
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
        650,
        700
      ]
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 300,
      "height": 46
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "hettich_ka5632_300",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 300,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 46,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "hettich_ka5632_350",
    "category": "drawer_slide",
    "manufacturer": "Hettich",
    "family": "KA 5632",
    "model": "KA 5632 350 mm",
    "label": "Hettich KA 5632 350 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "KA 5632 ball bearing runner, side installation",
      "url": "https://shop.hettich.com/us_EN/Runner-systems/Ball-bearing-runners/Side-installation/KA-5632-ball-bearing-runner%2C-side-installation%2C-dimensions-%28H-x-W%29-46-x-12-7-mm%2C-500-mm%2C-blue-passivated%2C-galvanised/p/73281",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_mm": 350,
      "cross_section_h_mm": 46,
      "cross_section_w_mm": 12.7,
      "load_capacity_kg": 45,
      "available_lengths_mm": [
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
        650,
        700
      ]
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 350,
      "height": 46
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "hettich_ka5632_350",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 350,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 46,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "hettich_ka5632_400",
    "category": "drawer_slide",
    "manufacturer": "Hettich",
    "family": "KA 5632",
    "model": "KA 5632 400 mm",
    "label": "Hettich KA 5632 400 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "KA 5632 ball bearing runner, side installation",
      "url": "https://shop.hettich.com/us_EN/Runner-systems/Ball-bearing-runners/Side-installation/KA-5632-ball-bearing-runner%2C-side-installation%2C-dimensions-%28H-x-W%29-46-x-12-7-mm%2C-500-mm%2C-blue-passivated%2C-galvanised/p/73281",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_mm": 400,
      "cross_section_h_mm": 46,
      "cross_section_w_mm": 12.7,
      "load_capacity_kg": 45,
      "available_lengths_mm": [
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
        650,
        700
      ]
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 400,
      "height": 46
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "hettich_ka5632_400",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 400,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 46,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "hettich_ka5632_550",
    "category": "drawer_slide",
    "manufacturer": "Hettich",
    "family": "KA 5632",
    "model": "KA 5632 550 mm",
    "label": "Hettich KA 5632 550 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "KA 5632 ball bearing runner, side installation",
      "url": "https://shop.hettich.com/us_EN/Runner-systems/Ball-bearing-runners/Side-installation/KA-5632-ball-bearing-runner%2C-side-installation%2C-dimensions-%28H-x-W%29-46-x-12-7-mm%2C-500-mm%2C-blue-passivated%2C-galvanised/p/73281",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_mm": 550,
      "cross_section_h_mm": 46,
      "cross_section_w_mm": 12.7,
      "load_capacity_kg": 45,
      "available_lengths_mm": [
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
        650,
        700
      ]
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 550,
      "height": 46
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "hettich_ka5632_550",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 550,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 46,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "hettich_ka5632_600",
    "category": "drawer_slide",
    "manufacturer": "Hettich",
    "family": "KA 5632",
    "model": "KA 5632 600 mm",
    "label": "Hettich KA 5632 600 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "KA 5632 ball bearing runner, side installation",
      "url": "https://shop.hettich.com/us_EN/Runner-systems/Ball-bearing-runners/Side-installation/KA-5632-ball-bearing-runner%2C-side-installation%2C-dimensions-%28H-x-W%29-46-x-12-7-mm%2C-500-mm%2C-blue-passivated%2C-galvanised/p/73281",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_mm": 600,
      "cross_section_h_mm": 46,
      "cross_section_w_mm": 12.7,
      "load_capacity_kg": 45,
      "available_lengths_mm": [
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
        650,
        700
      ]
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 600,
      "height": 46
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "hettich_ka5632_600",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 600,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 46,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "hettich_ka5632_650",
    "category": "drawer_slide",
    "manufacturer": "Hettich",
    "family": "KA 5632",
    "model": "KA 5632 650 mm",
    "label": "Hettich KA 5632 650 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "KA 5632 ball bearing runner, side installation",
      "url": "https://shop.hettich.com/us_EN/Runner-systems/Ball-bearing-runners/Side-installation/KA-5632-ball-bearing-runner%2C-side-installation%2C-dimensions-%28H-x-W%29-46-x-12-7-mm%2C-500-mm%2C-blue-passivated%2C-galvanised/p/73281",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_mm": 650,
      "cross_section_h_mm": 46,
      "cross_section_w_mm": 12.7,
      "load_capacity_kg": 45,
      "available_lengths_mm": [
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
        650,
        700
      ]
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 650,
      "height": 46
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "hettich_ka5632_650",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 650,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 46,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "hettich_ka5632_700",
    "category": "drawer_slide",
    "manufacturer": "Hettich",
    "family": "KA 5632",
    "model": "KA 5632 700 mm",
    "label": "Hettich KA 5632 700 mm",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Hettich",
      "title": "KA 5632 ball bearing runner, side installation",
      "url": "https://shop.hettich.com/us_EN/Runner-systems/Ball-bearing-runners/Side-installation/KA-5632-ball-bearing-runner%2C-side-installation%2C-dimensions-%28H-x-W%29-46-x-12-7-mm%2C-500-mm%2C-blue-passivated%2C-galvanised/p/73281",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "nominal_length_mm": 700,
      "cross_section_h_mm": 46,
      "cross_section_w_mm": 12.7,
      "load_capacity_kg": 45,
      "available_lengths_mm": [
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
        650,
        700
      ]
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 700,
      "height": 46
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "hettich_ka5632_700",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 700,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 46,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8450fm_12in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8450FM",
    "model": "8450FM 12 in",
    "label": "KV 8450FM 12 in (304.8 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8450FM Full Extension Soft-Close Force Management Drawer Slide",
      "url": "https://knapeandvogt.com/products/8450fm-full-extension-soft-close-force-management-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "close_action": "soft_close",
      "nominal_length_in": 12,
      "nominal_length_mm": 304.8,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "32mm_with_direct_access"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 304.8,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8450fm_12in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 304.8,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8450fm_14in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8450FM",
    "model": "8450FM 14 in",
    "label": "KV 8450FM 14 in (355.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8450FM Full Extension Soft-Close Force Management Drawer Slide",
      "url": "https://knapeandvogt.com/products/8450fm-full-extension-soft-close-force-management-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "close_action": "soft_close",
      "nominal_length_in": 14,
      "nominal_length_mm": 355.6,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "32mm_with_direct_access"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 355.6,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8450fm_14in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 355.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8450fm_16in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8450FM",
    "model": "8450FM 16 in",
    "label": "KV 8450FM 16 in (406.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8450FM Full Extension Soft-Close Force Management Drawer Slide",
      "url": "https://knapeandvogt.com/products/8450fm-full-extension-soft-close-force-management-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "close_action": "soft_close",
      "nominal_length_in": 16,
      "nominal_length_mm": 406.4,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "32mm_with_direct_access"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 406.4,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8450fm_16in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 406.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8450fm_18in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8450FM",
    "model": "8450FM 18 in",
    "label": "KV 8450FM 18 in (457.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8450FM Full Extension Soft-Close Force Management Drawer Slide",
      "url": "https://knapeandvogt.com/products/8450fm-full-extension-soft-close-force-management-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "close_action": "soft_close",
      "nominal_length_in": 18,
      "nominal_length_mm": 457.2,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "32mm_with_direct_access"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 457.2,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8450fm_18in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 457.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8450fm_20in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8450FM",
    "model": "8450FM 20 in",
    "label": "KV 8450FM 20 in (508.0 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8450FM Full Extension Soft-Close Force Management Drawer Slide",
      "url": "https://knapeandvogt.com/products/8450fm-full-extension-soft-close-force-management-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "close_action": "soft_close",
      "nominal_length_in": 20,
      "nominal_length_mm": 508,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "32mm_with_direct_access"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 508,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8450fm_20in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 508,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8450fm_22in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8450FM",
    "model": "8450FM 22 in",
    "label": "KV 8450FM 22 in (558.8 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8450FM Full Extension Soft-Close Force Management Drawer Slide",
      "url": "https://knapeandvogt.com/products/8450fm-full-extension-soft-close-force-management-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "close_action": "soft_close",
      "nominal_length_in": 22,
      "nominal_length_mm": 558.8,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "32mm_with_direct_access"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 558.8,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8450fm_22in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 558.8,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8450fm_24in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8450FM",
    "model": "8450FM 24 in",
    "label": "KV 8450FM 24 in (609.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8450FM Full Extension Soft-Close Force Management Drawer Slide",
      "url": "https://knapeandvogt.com/products/8450fm-full-extension-soft-close-force-management-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "close_action": "soft_close",
      "nominal_length_in": 24,
      "nominal_length_mm": 609.6,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "32mm_with_direct_access"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 609.6,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8450fm_24in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 609.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8450fm_26in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8450FM",
    "model": "8450FM 26 in",
    "label": "KV 8450FM 26 in (660.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8450FM Full Extension Soft-Close Force Management Drawer Slide",
      "url": "https://knapeandvogt.com/products/8450fm-full-extension-soft-close-force-management-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "close_action": "soft_close",
      "nominal_length_in": 26,
      "nominal_length_mm": 660.4,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "32mm_with_direct_access"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 660.4,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8450fm_26in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 660.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "kv_8450fm_28in",
    "category": "drawer_slide",
    "manufacturer": "Knape & Vogt",
    "family": "8450FM",
    "model": "8450FM 28 in",
    "label": "KV 8450FM 28 in (711.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Knape & Vogt",
      "title": "8450FM Full Extension Soft-Close Force Management Drawer Slide",
      "url": "https://knapeandvogt.com/products/8450fm-full-extension-soft-close-force-management-drawer-slide",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side",
      "travel": "full_extension",
      "close_action": "soft_close",
      "nominal_length_in": 28,
      "nominal_length_mm": 711.2,
      "side_space_per_side_mm": 12.7,
      "side_space_tolerance_plus_mm": 0.8,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 45.5,
      "load_class_lb": 100,
      "hole_pattern": "32mm_with_direct_access"
    },
    "requiredClearances": {
      "sidePerSide": 12.7,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 711.2,
      "height": 45.5
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "kv_8450fm_28in",
      "metalSlideClearancePerSide": 12.7,
      "metalSlideLength": 711.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 45.5,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3634ec_14in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3634EC",
    "model": "3634EC-14",
    "label": "Accuride 3634EC 14 in (355.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "3634 & 3634EC Tech Sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/eb56617574c60ac8f96ef125ffd073c2.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_only",
      "travel": "over_travel_25_4mm",
      "close_action": "easy_close",
      "nominal_length_in": 14,
      "nominal_length_mm": 355.6,
      "side_space_per_side_mm": 19.8,
      "side_space_tolerance_plus_mm": 0,
      "side_space_tolerance_minus_mm": 0.5,
      "slide_height_mm": 53.1,
      "load_rating_lb": 175,
      "recommended_drawer_width_less_than_opening_mm": 39.69
    },
    "requiredClearances": {
      "sidePerSide": 19.8,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 355.6,
      "height": 53.1
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3634ec_14in",
      "metalSlideClearancePerSide": 19.8,
      "metalSlideLength": 355.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 53.1,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3634ec_16in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3634EC",
    "model": "3634EC-16",
    "label": "Accuride 3634EC 16 in (406.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "3634 & 3634EC Tech Sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/eb56617574c60ac8f96ef125ffd073c2.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_only",
      "travel": "over_travel_25_4mm",
      "close_action": "easy_close",
      "nominal_length_in": 16,
      "nominal_length_mm": 406.4,
      "side_space_per_side_mm": 19.8,
      "side_space_tolerance_plus_mm": 0,
      "side_space_tolerance_minus_mm": 0.5,
      "slide_height_mm": 53.1,
      "load_rating_lb": 175,
      "recommended_drawer_width_less_than_opening_mm": 39.69
    },
    "requiredClearances": {
      "sidePerSide": 19.8,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 406.4,
      "height": 53.1
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3634ec_16in",
      "metalSlideClearancePerSide": 19.8,
      "metalSlideLength": 406.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 53.1,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3634ec_18in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3634EC",
    "model": "3634EC-18",
    "label": "Accuride 3634EC 18 in (457.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "3634 & 3634EC Tech Sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/eb56617574c60ac8f96ef125ffd073c2.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_only",
      "travel": "over_travel_25_4mm",
      "close_action": "easy_close",
      "nominal_length_in": 18,
      "nominal_length_mm": 457.2,
      "side_space_per_side_mm": 19.8,
      "side_space_tolerance_plus_mm": 0,
      "side_space_tolerance_minus_mm": 0.5,
      "slide_height_mm": 53.1,
      "load_rating_lb": 175,
      "recommended_drawer_width_less_than_opening_mm": 39.69
    },
    "requiredClearances": {
      "sidePerSide": 19.8,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 457.2,
      "height": 53.1
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3634ec_18in",
      "metalSlideClearancePerSide": 19.8,
      "metalSlideLength": 457.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 53.1,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3634ec_20in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3634EC",
    "model": "3634EC-20",
    "label": "Accuride 3634EC 20 in (508.0 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "3634 & 3634EC Tech Sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/eb56617574c60ac8f96ef125ffd073c2.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_only",
      "travel": "over_travel_25_4mm",
      "close_action": "easy_close",
      "nominal_length_in": 20,
      "nominal_length_mm": 508,
      "side_space_per_side_mm": 19.8,
      "side_space_tolerance_plus_mm": 0,
      "side_space_tolerance_minus_mm": 0.5,
      "slide_height_mm": 53.1,
      "load_rating_lb": 175,
      "recommended_drawer_width_less_than_opening_mm": 39.69
    },
    "requiredClearances": {
      "sidePerSide": 19.8,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 508,
      "height": 53.1
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3634ec_20in",
      "metalSlideClearancePerSide": 19.8,
      "metalSlideLength": 508,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 53.1,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3634ec_22in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3634EC",
    "model": "3634EC-22",
    "label": "Accuride 3634EC 22 in (558.8 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "3634 & 3634EC Tech Sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/eb56617574c60ac8f96ef125ffd073c2.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_only",
      "travel": "over_travel_25_4mm",
      "close_action": "easy_close",
      "nominal_length_in": 22,
      "nominal_length_mm": 558.8,
      "side_space_per_side_mm": 19.8,
      "side_space_tolerance_plus_mm": 0,
      "side_space_tolerance_minus_mm": 0.5,
      "slide_height_mm": 53.1,
      "load_rating_lb": 175,
      "recommended_drawer_width_less_than_opening_mm": 39.69
    },
    "requiredClearances": {
      "sidePerSide": 19.8,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 558.8,
      "height": 53.1
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3634ec_22in",
      "metalSlideClearancePerSide": 19.8,
      "metalSlideLength": 558.8,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 53.1,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3634ec_24in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3634EC",
    "model": "3634EC-24",
    "label": "Accuride 3634EC 24 in (609.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "3634 & 3634EC Tech Sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/eb56617574c60ac8f96ef125ffd073c2.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_only",
      "travel": "over_travel_25_4mm",
      "close_action": "easy_close",
      "nominal_length_in": 24,
      "nominal_length_mm": 609.6,
      "side_space_per_side_mm": 19.8,
      "side_space_tolerance_plus_mm": 0,
      "side_space_tolerance_minus_mm": 0.5,
      "slide_height_mm": 53.1,
      "load_rating_lb": 175,
      "recommended_drawer_width_less_than_opening_mm": 39.69
    },
    "requiredClearances": {
      "sidePerSide": 19.8,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 609.6,
      "height": 53.1
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3634ec_24in",
      "metalSlideClearancePerSide": 19.8,
      "metalSlideLength": 609.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 53.1,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3634ec_26in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3634EC",
    "model": "3634EC-26",
    "label": "Accuride 3634EC 26 in (660.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "3634 & 3634EC Tech Sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/eb56617574c60ac8f96ef125ffd073c2.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_only",
      "travel": "over_travel_25_4mm",
      "close_action": "easy_close",
      "nominal_length_in": 26,
      "nominal_length_mm": 660.4,
      "side_space_per_side_mm": 19.8,
      "side_space_tolerance_plus_mm": 0,
      "side_space_tolerance_minus_mm": 0.5,
      "slide_height_mm": 53.1,
      "load_rating_lb": 175,
      "recommended_drawer_width_less_than_opening_mm": 39.69
    },
    "requiredClearances": {
      "sidePerSide": 19.8,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 660.4,
      "height": 53.1
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3634ec_26in",
      "metalSlideClearancePerSide": 19.8,
      "metalSlideLength": 660.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 53.1,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_3634ec_28in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "3634EC",
    "model": "3634EC-28",
    "label": "Accuride 3634EC 28 in (711.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "3634 & 3634EC Tech Sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/eb56617574c60ac8f96ef125ffd073c2.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_only",
      "travel": "over_travel_25_4mm",
      "close_action": "easy_close",
      "nominal_length_in": 28,
      "nominal_length_mm": 711.2,
      "side_space_per_side_mm": 19.8,
      "side_space_tolerance_plus_mm": 0,
      "side_space_tolerance_minus_mm": 0.5,
      "slide_height_mm": 53.1,
      "load_rating_lb": 175,
      "recommended_drawer_width_less_than_opening_mm": 39.69
    },
    "requiredClearances": {
      "sidePerSide": 19.8,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 711.2,
      "height": 53.1
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_3634ec_28in",
      "metalSlideClearancePerSide": 19.8,
      "metalSlideLength": 711.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 53.1,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_10in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-10",
    "label": "Accuride 9301E 10 in (254.0 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 10,
      "nominal_length_mm": 254,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 254,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_10in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 254,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_12in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-12",
    "label": "Accuride 9301E 12 in (304.8 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 12,
      "nominal_length_mm": 304.8,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 304.8,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_12in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 304.8,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_14in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-14",
    "label": "Accuride 9301E 14 in (355.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 14,
      "nominal_length_mm": 355.6,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 355.6,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_14in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 355.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_16in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-16",
    "label": "Accuride 9301E 16 in (406.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 16,
      "nominal_length_mm": 406.4,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 406.4,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_16in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 406.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_18in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-18",
    "label": "Accuride 9301E 18 in (457.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 18,
      "nominal_length_mm": 457.2,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 457.2,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_18in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 457.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_20in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-20",
    "label": "Accuride 9301E 20 in (508.0 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 20,
      "nominal_length_mm": 508,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 508,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_20in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 508,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_22in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-22",
    "label": "Accuride 9301E 22 in (558.8 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 22,
      "nominal_length_mm": 558.8,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 558.8,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_22in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 558.8,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_24in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-24",
    "label": "Accuride 9301E 24 in (609.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 24,
      "nominal_length_mm": 609.6,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 609.6,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_24in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 609.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_26in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-26",
    "label": "Accuride 9301E 26 in (660.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 26,
      "nominal_length_mm": 660.4,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 660.4,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_26in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 660.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_28in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-28",
    "label": "Accuride 9301E 28 in (711.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 28,
      "nominal_length_mm": 711.2,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 711.2,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_28in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 711.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_30in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-30",
    "label": "Accuride 9301E 30 in (762.0 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 30,
      "nominal_length_mm": 762,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 762,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_30in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 762,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_32in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-32",
    "label": "Accuride 9301E 32 in (812.8 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 32,
      "nominal_length_mm": 812.8,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 812.8,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_32in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 812.8,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_34in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-34",
    "label": "Accuride 9301E 34 in (863.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 34,
      "nominal_length_mm": 863.6,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 863.6,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_34in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 863.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_36in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-36",
    "label": "Accuride 9301E 36 in (914.4 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 36,
      "nominal_length_mm": 914.4,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 914.4,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_36in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 914.4,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_40in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-40",
    "label": "Accuride 9301E 40 in (1016.0 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 40,
      "nominal_length_mm": 1016,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 1016,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_40in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 1016,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_42in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-42",
    "label": "Accuride 9301E 42 in (1066.8 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 42,
      "nominal_length_mm": 1066.8,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 1066.8,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_42in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 1066.8,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_44in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-44",
    "label": "Accuride 9301E 44 in (1117.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 44,
      "nominal_length_mm": 1117.6,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 1117.6,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_44in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 1117.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_48in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-48",
    "label": "Accuride 9301E 48 in (1219.2 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 48,
      "nominal_length_mm": 1219.2,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 1219.2,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_48in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 1219.2,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_54in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-54",
    "label": "Accuride 9301E 54 in (1371.6 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 54,
      "nominal_length_mm": 1371.6,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 1371.6,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_54in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 1371.6,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "accuride_9301e_60in",
    "category": "drawer_slide",
    "manufacturer": "Accuride",
    "family": "9301E",
    "model": "9301E-60",
    "label": "Accuride 9301E 60 in (1524.0 mm)",
    "targets": [
      "utility",
      "shop_cart",
      "benchtop",
      "stackable",
      "kitchen",
      "drawer"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Dimensions are manufacturer-sourced. Automatic drilling is disabled rather than selecting one of several valid rail holes."
    },
    "source": {
      "type": "manufacturer_pdf",
      "manufacturer": "Accuride",
      "title": "MODEL 9301E technical sheet",
      "url": "https://www.accuride.com/media/amasty/amfile/attach/e9e9a5ce17cb74d4e4f1616a4aa32c9b.pdf",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "V35 safely maps slide length, side clearance and envelope height. Manufacturer rails provide multiple mounting-hole choices, so automatic drilling is disabled."
    },
    "mountingSpecs": {
      "mounting": "side_or_flat",
      "travel": "full_extension",
      "nominal_length_in": 60,
      "nominal_length_mm": 1524,
      "side_space_per_side_mm": 19.1,
      "side_space_tolerance_plus_mm": 0.79,
      "side_space_tolerance_minus_mm": 0,
      "slide_height_mm": 76.2,
      "load_rating_lb": {
        "moderate_use": 600,
        "frequent_use": 480,
        "mobile": 360,
        "flat_mount": 180
      }
    },
    "requiredClearances": {
      "sidePerSide": 19.1,
      "frontSetback": 0
    },
    "dimensions": {
      "length": 1524,
      "height": 76.2
    },
    "drilling": {
      "enabled": false
    },
    "parameterPatch": {
      "drawerMount": "metal_slides",
      "drawerSlideId": "accuride_9301e_60in",
      "metalSlideClearancePerSide": 19.1,
      "metalSlideLength": 1524,
      "metalSlideFrontSetback": 0,
      "metalSlideEnvelopeHeight": 76.2,
      "includeMetalSlideHoles": false,
      "hardwareDrillingMode": "off"
    }
  },
  {
    "id": "salice_silentia_plus_105_inset",
    "category": "hinge",
    "manufacturer": "Salice",
    "family": "Silentia+ Series 100",
    "model": "C1_6PE_",
    "label": "Salice Silentia+ Series 100 105° / inset",
    "targets": [
      "utility",
      "shop_cart",
      "stackable",
      "kitchen"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "Manufacturer data verifies 35 mm cup, 12 mm cup depth and K range 3-6 mm. This patch uses K=5 mm as a neutral reference and disables door/plate through drilling."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "Salice",
      "title": "Silentia+ Series 100 - 105° opening - Standard application",
      "url": "https://www.salice.com/us/en/products/hinges/integrated-soft-close-mechanism/silentia-plus-series-100-105-opening-standard-application",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Inset front geometry and cup bore map safely; hinge fixing/plate drilling remains disabled."
    },
    "mountingSpecs": {
      "application": "inset",
      "opening_angle_deg": 105,
      "cup_diameter_mm": 35,
      "cup_depth_mm": 12,
      "cup_edge_distance_k_mm": [
        3,
        6
      ],
      "arm_crank_mm": 17,
      "model_pattern": "C1_6PE_"
    },
    "requiredClearances": {},
    "dimensions": {
      "cupDiameter": 35,
      "cupDepth": 12,
      "cupCenterFromDoorEdge": 22.5
    },
    "drilling": {
      "enabled": true,
      "doorFixingEnabled": false,
      "plateHolesEnabled": false
    },
    "frontMountStyle": "inset_flush",
    "parameterPatch": {
      "hingeStyle": "euro_35mm",
      "hingeId": "salice_silentia_plus_105_inset",
      "frontMountStyle": "inset_flush",
      "hingeCupDiameter": 35,
      "hingeCupDepth": 12,
      "hingeCupCenterFromDoorEdge": 22.5,
      "hingeDoorFixingEnabled": false,
      "hingePlateHolesEnabled": false
    }
  },
  {
    "id": "grass_tiomos_110_inset_reference",
    "category": "hinge",
    "manufacturer": "GRASS",
    "family": "Tiomos",
    "model": "Tiomos 110",
    "label": "GRASS Tiomos 110° / inset reference",
    "targets": [
      "utility",
      "shop_cart",
      "stackable",
      "kitchen"
    ],
    "verification": {
      "status": "manufacturer_partial",
      "verified": true,
      "notes": "GRASS technical information verifies 35 mm cup, minimum 12.6 mm cup depth and 45/9.5 drilling family. This patch uses the GRASS 22 mm drilling edge-distance reference (K=4.5) and disables door/plate through drilling."
    },
    "source": {
      "type": "manufacturer_web",
      "manufacturer": "GRASS",
      "title": "Tiomos 110 technical information / drilling patterns",
      "url": "https://mediacenter.grass.eu/Produktkataloge/Hinges/EN/",
      "retrieved": "2026-09-15"
    },
    "geometrySupport": {
      "status": "partial",
      "notes": "Inset front geometry and cup bore map safely; fixing/plate drilling remains disabled."
    },
    "mountingSpecs": {
      "application": "inset",
      "opening_angle_deg": 110,
      "cup_diameter_mm": 35,
      "cup_depth_min_mm": 12.6,
      "cup_edge_distance_k_mm": [
        3,
        7
      ],
      "drilling_pattern": "45 x 9.5 mm",
      "fixing_hole_spacing_mm": 45,
      "fixing_hole_offset_from_cup_centerline_mm": 9.5,
      "planning_application": "Inset K19"
    },
    "requiredClearances": {},
    "dimensions": {
      "cupDiameter": 35,
      "cupDepth": 12.6,
      "cupCenterFromDoorEdge": 22
    },
    "drilling": {
      "enabled": true,
      "doorFixingEnabled": false,
      "doorFixingHoleSpacing": 45,
      "plateHolesEnabled": false
    },
    "frontMountStyle": "inset_flush",
    "parameterPatch": {
      "hingeStyle": "euro_35mm",
      "hingeId": "grass_tiomos_110_inset_reference",
      "frontMountStyle": "inset_flush",
      "hingeCupDiameter": 35,
      "hingeCupDepth": 12.6,
      "hingeCupCenterFromDoorEdge": 22,
      "hingeDoorFixingEnabled": false,
      "hingeDoorFixingHoleSpacing": 45,
      "hingePlateHolesEnabled": false
    }
  }
];

export function hardwareDefinition(id: string) {
  return HARDWARE_CATALOG.find(profile => profile.id === id) ?? null;
}

export function hardwareProfiles(category: HardwareCategory, query = '') {
  const needle = query.trim().toLowerCase();
  return HARDWARE_CATALOG
    .filter(profile => profile.category === category)
    .filter(profile => !needle || [
      profile.label,
      profile.manufacturer,
      profile.family,
      profile.model,
      profile.verification.status,
      profile.verification.status.replaceAll('_', ' '),
    ].join(' ').toLowerCase().includes(needle))
    .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.label.localeCompare(b.label));
}

export function applyHardwareProfile(parameters: CabinetParameters, id: string): CabinetParameters {
  const profile = hardwareDefinition(id);
  if (!profile) return parameters;
  return { ...parameters, ...profile.parameterPatch };
}

export function bestHardwareMatch(category: HardwareCategory, parameters: Partial<CabinetParameters>) {
  const candidates = HARDWARE_CATALOG.filter(profile => profile.category === category);
  let best: { profile: HardwareDefinition; score: number } | null = null;

  for (const profile of candidates) {
    const patch = profile.parameterPatch;
    const keys = category === 'drawer_slide'
      ? ['metalSlideClearancePerSide', 'metalSlideLength', 'metalSlideFrontSetback', 'metalSlideEnvelopeHeight', 'includeMetalSlideHoles'] as const
      : ['frontMountStyle', 'hingeCupDiameter', 'hingeCupDepth', 'hingeCupCenterFromDoorEdge', 'hingeDoorFixingEnabled', 'hingePlateHolesEnabled'] as const;
    let compared = 0;
    let score = 0;

    for (const key of keys) {
      const requested = parameters[key];
      const expected = patch[key];
      if (requested === undefined || expected === undefined) continue;
      compared += 1;
      if (typeof requested === 'number' && typeof expected === 'number') {
        const tolerance = Math.max(0.05, Math.abs(expected) * 0.002);
        if (Math.abs(requested - expected) <= tolerance) score += 2;
        else score -= 2;
      } else if (requested === expected) {
        score += 2;
      } else {
        score -= 2;
      }
    }

    if (compared >= 2 && (!best || score > best.score)) best = { profile, score };
  }

  return best && best.score > 0 ? best.profile : null;
}
