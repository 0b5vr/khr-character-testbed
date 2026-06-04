# `vrmHumanoid` skeletal rig mapping

This document describes the conventional guidelines for the `vrmHumanoid` skeletal rig mapping defined for the `KHR_character_skeleton_mapping` extension.
The `vrmHumanoid` skeletal rig mapping maps humanoid character bones to a VRM-compatible skeletal structure, enabling consistent animation and interaction across different character models and platforms.

This document is not a specification. It documents conventional guidelines for the `vrmHumanoid` skeletal rig mapping and is intended as a reference for developers and artists working with `KHR_character` extensions.

## Purpose

The `KHR_character_skeleton_mapping` extension provides a way to define a mapping between the 3D model bones and a standardized skeletal structure, allowing for consistent animation and interaction across different character models and platforms. However, the extension does not define specific mapping standard or guidelines.
Because VRM already provides a specification for a standardized humanoid skeleton, this document defines guidelines for using it as a skeletal rig mapping for the `KHR_character_skeleton_mapping` extension. The goal is to provide compatibility between humanoid character models and platforms until an industry standard for humanoid skeletal structures is established.

## Overview

The `vrmHumanoid` skeletal rig mapping defines a set of bone names and a skeletal hierarchy that represents a humanoid character.
This document also describes the expected rest pose for the `vrmHumanoid` skeletal rig mapping, which is based on the T-pose commonly used in character modeling and animation.

The bone names, hierarchy, and rest pose are based on [the humanoid definition in VRM 1.0 (`VRMC_vrm`).](https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/humanoid.md)
This document adapts that definition as a convention for the `KHR_character_skeleton_mapping` extension.

A `vrmHumanoid` skeletal rig mapping SHOULD satisfy both the bone mapping requirements and the rest pose requirements defined in this document.
The bone mapping requirements define which model nodes are mapped to VRM humanoid bone names and how those mapped bones are expected to be arranged in the skeleton.
The rest pose requirements define the expected default pose of the mapped skeleton and skinned meshes.

Implementations MAY reject or ignore a `vrmHumanoid` mapping that does not satisfy these requirements, especially when the asset is intended for animation retargeting.

### Bone names and hierarchy

The `vrmHumanoid` skeletal rig mapping defines a set of bone names that represent the standard humanoid skeletal structure.
Each bone has a unique name and a defined ancestor relationship with other bones, forming a hierarchical structure that represents the humanoid skeleton.

The `vrmHumanoid` skeletal rig mapping SHOULD NOT use bone names other than the names listed in this document.

The skeletal hierarchy MAY include additional bones.
Such bones MAY be placed between bones that have an ancestor relationship defined by `vrmHumanoid`, as long as that ancestor relationship is preserved.
For example, additional spine bones may be placed between the `spine` and `chest` bones.

#### List of bones

The `vrmHumanoid` skeletal rig mapping includes the following bones.

Bones marked as required are required for this convention.
A `vrmHumanoid` skeletal rig mapping SHOULD include all required bones.
If a required bone is missing, implementations MAY treat the mapping as non-conforming.

| Bone name               | Required | Ancestor bone candidates                | Required ancestor bone  |
|:------------------------|:---------|:----------------------------------------|:------------------------|
| hips                    | ✅ Yes   |                                         |                         |
| spine                   | ✅ Yes   | hips                                    |                         |
| chest                   | No       | spine                                   |                         |
| upperChest              | No       | chest, spine                            | chest                   |
| neck                    | No       | upperChest, chest, spine                |                         |
| head                    | ✅ Yes   | neck, upperChest, chest, spine          |                         |
| leftShoulder            | No       | upperChest, chest, spine                |                         |
| leftUpperArm            | ✅ Yes   | leftShoulder, upperChest, chest, spine  |                         |
| leftLowerArm            | ✅ Yes   | leftUpperArm                            |                         |
| leftHand                | ✅ Yes   | leftLowerArm                            |                         |
| rightShoulder           | No       | upperChest, chest, spine                |                         |
| rightUpperArm           | ✅ Yes   | rightShoulder, upperChest, chest, spine |                         |
| rightLowerArm           | ✅ Yes   | rightUpperArm                           |                         |
| rightHand               | ✅ Yes   | rightLowerArm                           |                         |
| leftUpperLeg            | ✅ Yes   | hips                                    |                         |
| leftLowerLeg            | ✅ Yes   | leftUpperLeg                            |                         |
| leftFoot                | ✅ Yes   | leftLowerLeg                            |                         |
| leftToes                | No       | leftFoot                                |                         |
| rightUpperLeg           | ✅ Yes   | hips                                    |                         |
| rightLowerLeg           | ✅ Yes   | rightUpperLeg                           |                         |
| rightFoot               | ✅ Yes   | rightLowerLeg                           |                         |
| rightToes               | No       | rightFoot                               |                         |
| leftThumbMetacarpal     | No       | leftHand                                |                         |
| leftThumbProximal       | No       | leftThumbMetacarpal                     | leftThumbMetacarpal     |
| leftThumbDistal         | No       | leftThumbProximal                       | leftThumbProximal       |
| leftIndexProximal       | No       | leftHand                                |                         |
| leftIndexIntermediate   | No       | leftIndexProximal                       | leftIndexProximal       |
| leftIndexDistal         | No       | leftIndexIntermediate                   | leftIndexIntermediate   |
| leftMiddleProximal      | No       | leftHand                                |                         |
| leftMiddleIntermediate  | No       | leftMiddleProximal                      | leftMiddleProximal      |
| leftMiddleDistal        | No       | leftMiddleIntermediate                  | leftMiddleIntermediate  |
| leftRingProximal        | No       | leftHand                                |                         |
| leftRingIntermediate    | No       | leftRingProximal                        | leftRingProximal        |
| leftRingDistal          | No       | leftRingIntermediate                    | leftRingIntermediate    |
| leftLittleProximal      | No       | leftHand                                |                         |
| leftLittleIntermediate  | No       | leftLittleProximal                      | leftLittleProximal      |
| leftLittleDistal        | No       | leftLittleIntermediate                  | leftLittleIntermediate  |
| rightThumbMetacarpal    | No       | rightHand                               |                         |
| rightThumbProximal      | No       | rightThumbMetacarpal                    | rightThumbMetacarpal    |
| rightThumbDistal        | No       | rightThumbProximal                      | rightThumbProximal      |
| rightIndexProximal      | No       | rightHand                               |                         |
| rightIndexIntermediate  | No       | rightIndexProximal                      | rightIndexProximal      |
| rightIndexDistal        | No       | rightIndexIntermediate                  | rightIndexIntermediate  |
| rightMiddleProximal     | No       | rightHand                               |                         |
| rightMiddleIntermediate | No       | rightMiddleProximal                     | rightMiddleProximal     |
| rightMiddleDistal       | No       | rightMiddleIntermediate                 | rightMiddleIntermediate |
| rightRingProximal       | No       | rightHand                               |                         |
| rightRingIntermediate   | No       | rightRingProximal                       | rightRingProximal       |
| rightRingDistal         | No       | rightRingIntermediate                   | rightRingIntermediate   |
| rightLittleProximal     | No       | rightHand                               |                         |
| rightLittleIntermediate | No       | rightLittleProximal                     | rightLittleProximal     |
| rightLittleDistal       | No       | rightLittleIntermediate                 | rightLittleIntermediate |

For bones that has two or more ancestor bone candidates, the bone defined as its ancestor is expected to be the closest ancestor among the candidates.
For example, the `neck` bone is expected to be a child of `upperChest` if it exists, otherwise a child of `chest` if it exists, otherwise a child of `spine`.

> Unlike VRM 1.0 humanoid, the `vrmHumanoid` skeletal rig mapping does not define `leftEye`, `rightEye`, and `jaw`. These bones are expected to be controlled by `KHR_character_expression` extension instead.

#### Non-conforming skeletal hierarchy

If the skeletal hierarchy is considered non-conforming, implementations MAY reject or ignore a `vrmHumanoid` skeletal rig mapping.
The skeletal hierarchy is considered non-conforming if any of the following conditions are met:

- A required bone is missing.
- A mapped bone name is not listed in this document.
- For any mapped bone, the closest mapped ancestor is not one of its ancestor bone candidates.
- For any mapped bone, the closest mapped ancestor is not the closest available ancestor among its ancestor bone candidates.
- For any mapped bone, its required ancestor bone is missing.

### Rest pose

The model with the `vrmHumanoid` skeletal rig mapping is expected to be in a specific rest pose described in this section.
This rest pose is called "VRM T-pose" [in the `VRMC_vrm` specification.](https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/tpose.md)

Basically, the rest pose is a T-pose with the character standing upright, arms extended horizontally to the sides, and legs straight down.

All axes mentioned in the following definitions are in global space unless specified otherwise.

#### Definition based on the appearance of skinned meshes

This section defines the rest pose by the appearance of the skinned meshes.

##### Definition 1.1. Standing straight toward the +Z axis, symmetrical on the X axis in appearance

The legs, torso, head SHOULD be oriented along the +Z axis, symmetrical on the X axis, and standing straight.

"Standing straight" means a relaxed, and neutral posture for the model.
It is symmetrical at X = 0.0, gazing straight ahead.
Seeing from the side, It should be as straight as possible from feet to head near Z = 0.0.

##### Definition 1.2. Feet parallel to the Z axis in appearance

The feet SHOULD be pointing straight and parallel to the Z axis i.e. the feet should not be rotated V-shaped inward or outward.
The toes SHOULD be directed along the +Z axis.

##### Definition 1.3. The foot is grounded at Y = 0.0 in appearance

The grounded surface of the model, such as sole surfaces, SHOULD be at Y = 0.0.
For example, it can be achieved by adjusting the transform of the Hips bone up and down.
To achieving this definition, the foot bone nodes MAY be placed above the ground plane.

Users of the model can consider the model's Y = 0.0 as the ground plane.
For example, the relative position of the ground plane from the foot bone can be pre-calculated to calculate the ground plane in realtime.

##### Definition 1.4. The arms are extended along the X axis and are parallel to the ground in appearance

The arms SHOULD be extended in parallel to the X axis, which is also parallel to the ground.

Because the arms are extended horizontally, it forms the T letter by seeing from the front, and is referred to as a "T-pose".

##### Definition 1.5. Shoulders are relaxed and lowest in appearance

If shoulder bones are present, the shoulders SHOULD be relaxed and lowermost in appearance.

This is to ensure that there is no difference between models without shoulder bones and with shoulder bones.
This also makes it easier to calculate how the shoulders look when the arms are down.

Combining with the Definition 1.4, this would result in a pose where the shoulders are lowered and the arms are raised, which is not possible for a real person, but it is the definition.

##### Definition 1.6. The hands are extended along the X axis and are parallel to the ground in appearance

The hands SHOULD be extended in parallel to the X axis, which is also parallel to the ground.

The palm plane SHOULD face toward the -Y axis.

##### Definition 1.7. The four fingers are extended along the X axis and are parallel to the ground in appearance

The four fingers, index, middle, ring, and little, of each hand SHOULD be in parallel to the X axis, which is also parallel to the ground.

The nail surface SHOULD face toward the +Y axis.

##### Definition 1.8. The thumb of each hand is extended between the X axis and +Z axis and is parallel to the ground in appearance

The thumb of each hand SHOULD be in parallel to the sum of X axis and +Z axis, which is 45 degrees from each axes, and it is also parallel to the ground.

The nail surface of the thumb SHOULD be oriented with a 90 degrees outward roll, unlike the other four fingers.

The thumb of the left hand SHOULD be directed between the +X axis and +Z axis, and the nail SHOULD face between the -X axis and the +Z axis.
The thumb of the right hand SHOULD be directed between the -X axis and +Z axis, and the nail SHOULD face between the +X axis and the +Z axis.

#### Definition based on numerical values of node transforms

This section defines the rest pose by the numerical values of node transforms.

##### Definition 2.1. All node transforms are on a positive uniform scale

All node transforms SHOULD be in a positive uniform scale.
A positive uniform scale means that each value of the scale is the same non-zero positive value.

## JSON Example

The following JSON snippet shows an example of how to define the `vrmHumanoid` skeletal rig mapping using the `KHR_character_skeleton_mapping` extension in a glTF asset.

```jsonc
{
  "extensions": {
    "KHR_character_skeleton_mapping": {
      "skeletalRigMappings": {
        "vrmHumanoid": {
          "J_Bip_C_Hips": "hips",
          "J_Bip_C_Spine": "spine",
          "J_Bip_C_Chest": "chest",
          "J_Bip_C_UpperChest": "upperChest",
          "J_Bip_C_Neck": "neck",
          "J_Bip_C_Head": "head",
          "J_Bip_L_UpperLeg": "leftUpperLeg",
          "J_Bip_L_LowerLeg": "leftLowerLeg",
          // ...
        }
      }
    }
  }
}
```
