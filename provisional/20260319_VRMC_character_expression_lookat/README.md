# VRMC_character_expression_lookat

## Status

Draft

The name of the extension is tentative and subject to change.

## Dependencies

Written against the glTF 2.0 specification.

Requires the extension: `KHR_character_expression`.

> This extension does not depend on `VRMC_vrm` extension.

## Overview

This extension defines how implementations and applications can use the expressions defined in `KHR_character_expression` for eye gaze movements.

This extension intends to define how a look-at direction can be converted into look-at expression inputs defined by `KHR_character_expression`, compatible with the look-at of `VRMC_vrm`.

This extension defines only how a look-at direction is converted into four expressions: `lookUp`, `lookDown`, `lookLeft`, and `lookRight`.
It does not define binocular parallax, independent per-eye targeting, or first-person camera placement.

This extension does not define the full look-at behavior of a character.
In particular, it does not define whether an implementation drives only the mapped expressions, rotates the head, combines these methods while tracking a target, or does not perform look-at at all.

### Behavior

To calculate the look-at expression values using this extension, the implementation needs to determine the look-at direction.
The look-at direction is calculated in the local coordinate system of a specified `referenceNode`.

> Authoring guidance: Unless there is a specific reason to do otherwise, `referenceNode` should be a node under the head bone of the character.
> It should be placed near the midpoint between the eyes.
> Its orientation should be authored without roll in the character's rest pose, so that `-Z` points to the character's forward direction, `+Y` points upward, and `+X` is horizontal to the ground.

The local axes of `referenceNode` define the look-at space: `-Z` is the forward direction that "lens" looks towards, `+X` is the right direction, and `+Y` is the up direction.
This definition matches the glTF camera definition.

By providing a target point from the application, the implementation calculates the direction from `referenceNode` to the target point in the local space of `referenceNode`, and then converts that direction into the four expression values.
The implementation then calculates the yaw and pitch angles from the look-at direction. The yaw angle is the angle between the -Z axis and the look-at direction projected onto the XZ plane where the sign is positive when the look-at direction is on the +X side. The pitch angle is the angle between the XZ plane and the look-at direction where the sign is positive when the look-at direction is on the +Y side.

The following formula describes the calculation of the look-at direction and the conversion to yaw and pitch angles, where `target` is the target position in the world space.

```js
// convert the target position to the local space of referenceNode
let (x, y, z) = referenceNode.worldMatrix.inverse * target

// calculate yaw and pitch from the look-at direction
let yaw = atan2(x, -z)
let pitch = atan2(y, sqrt(x * x + z * z))
```

If the target position is equal to the origin of `referenceNode`, the direction SHOULD be treated as `(0, 0, -1)` (i.e. looking forward).

The implementation converts these angles to four non-negative expression inputs as follows:

```js
let lookRightValue = saturate( yaw / (pi / 2))
let lookLeftValue  = saturate(-yaw / (pi / 2))
let lookUpValue    = saturate( pitch / (pi / 2))
let lookDownValue  = saturate(-pitch / (pi / 2))
```

Where `saturate(v)` limits `v` into the range `[0, 1]`.
In other words, the angular range `[0 deg, 90 deg]` maps linearly to the expression input range `[0, 1]`.

This extension defines how a look-at direction is converted into look-at expression inputs only for targets in the forward hemisphere of the reference space (i.e. `|yaw| <= 90 deg`).
How applications handle targets outside of this range is outside the scope of this extension, and applications can choose to clamp the expression values, ignore the target, or apply another policy.
When an application combines head rotation with this extension, the expression inputs are intended to represent the remaining yaw and pitch to be expressed by the eyes after head rotation.

If a corresponding expression mapping is not present in `expressions`, the implementation MUST ignore that output.

> Authoring guidance: Authors should design the referenced look-at expressions to make eye gaze work on their own, assuming no head rotation. At runtime, implementations may still combine these expressions with head rotation.

### Conversion from existing VRM look-at

This extension can serve as a compatibility layer for existing `VRMC_vrm.lookAt` assets that are expressed using `KHR_character_expression`.

This extension defines the look-at space using the local axes of a specified `referenceNode`, which differs from the look-at space defined in `VRMC_vrm.lookAt`, which uses a virtual transform under the head bone with an initial orientation looking forward along the global +Z axis.
When converting an existing VRM, the converter will need to insert a child node representing the `referenceNode` under the head bone, with a translation of `VRMC_vrm.lookAt.offsetFromHeadBone` and an orientation in which the transformed -Z axis points toward the global +Z axis.
Unlike `VRMC_vrm.lookAt.offsetFromHeadBone`, `referenceNode` in this extension is used only for look-at direction evaluation. First-person camera placement should be defined by `KHR_node_camera_hint` instead.

For an existing VRM asset using `"expression"` look-at, the existing look-at expressions can be reused as-is, and the converter can map them to the corresponding properties in this extension.
For an existing VRM asset using `"bone"` look-at, the asset can define `lookUp`, `lookDown`, `lookLeft`, and `lookRight` as expressions that drive eye-bone rotations using `KHR_character_expression_joint`, and then map them through this extension.

Unlike `VRMC_vrm.lookAt`, this extension does not define per-direction range maps such as horizontal inner/outer or vertical up/down. Assets are expected to author the desired response curve in the referenced `KHR_character_expression` expressions.

> TODO: Clarify how existing VRM range maps are converted. They are probably expected to be baked into the authored `KHR_character_expression_joint` expressions

## glTF Schema Updates

`VRMC_character_expression_lookat` extension is defined as a root extension.

The following example shows how to use the `VRMC_character_expression_lookat` extension in a glTF asset. It specifies a reference node for look-at direction calculation and maps the look-at expressions to the expressions defined in `KHR_character_expression`.

```json
{
  "nodes": [
    {
      "name": "Head",
      "children": [1]
    },
    {
      "name": "LookAtReference",
      "rotation": [0, 1, 0, 0]
    },
    // ...
  ],
  "extensionsUsed": [
    "KHR_character_expression",
    "VRMC_character_expression_lookat"
  ],
  "extensions": {
    "KHR_character_expression": {
      "expressions": [
        {
          "expression": "myLookUp",
          // ...
        },
        {
          "expression": "myLookDown",
          // ...
        },
        {
          "expression": "myLookLeft",
          // ...
        },
        {
          "expression": "myLookRight",
          // ...
        }
      ]
    },
    "VRMC_character_expression_lookat": {
      "referenceNode": 1,
      "expressions": {
        "lookUp": "myLookUp",
        "lookDown": "myLookDown",
        "lookLeft": "myLookLeft",
        "lookRight": "myLookRight"
      }
    }
  }
}
```

### VRMC_character_expression_lookat

The root object of the extension.

| | Type | Description | Required |
|:-|:-|:-|:-|
| `referenceNode` | integer | The index of the node used as the reference for look-at direction calculation | ✅ Yes |
| `expressions` | object | The mapping of look-at expressions to the expressions defined in `KHR_character_expression` | No |

#### VRMC_character_expression_lookat.referenceNode ✅

The index of the node used as the reference for look-at direction calculation.
The index MUST be a valid index of a node.

- Type: `integer`
- Required: Yes
- Minimum: `0`

#### VRMC_character_expression_lookat.expressions

The mapping of look-at expressions to the expressions defined in `KHR_character_expression`.
Each mapped value MUST match an `expression` name defined in `KHR_character_expression.expressions`.
The values of `lookUp`, `lookDown`, `lookLeft`, and `lookRight` MUST be distinct from each other.

- Type: `object`
- Required: No

### expressions

The mapping of look-at expressions to the expressions defined in `KHR_character_expression`.

| | Type | Description | Required |
|:-|:-|:-|:-|
| `lookUp` | string | The name of the expression used for looking up | No |
| `lookDown` | string | The name of the expression used for looking down | No |
| `lookLeft` | string | The name of the expression used for looking left | No |
| `lookRight` | string | The name of the expression used for looking right | No |

#### expressions.lookUp

The name of the expression used for looking up.
If present, it MUST match an `expression` name defined in `KHR_character_expression.expressions`.

- Type: `string`
- Required: No

#### expressions.lookDown

The name of the expression used for looking down.
If present, it MUST match an `expression` name defined in `KHR_character_expression.expressions`.

- Type: `string`
- Required: No

#### expressions.lookLeft

The name of the expression used for looking left.
If present, it MUST match an `expression` name defined in `KHR_character_expression.expressions`.

- Type: `string`
- Required: No

#### expressions.lookRight

The name of the expression used for looking right.
If present, it MUST match an `expression` name defined in `KHR_character_expression.expressions`.

- Type: `string`
- Required: No

## Design considerations

- Low confidence namings:
  - `VRMC_character_expression_lookat`
  - `referenceNode`. Other candidates: `originNode`, `anchorNode`
- Unlike `VRMC_vrm.lookAt`, this proposal does not include range map parameters such as horizontal inner/outer or vertical up/down. Non-linear response should be authored in the referenced expressions. If it brings significant confusion to artists and implementers, we should consider adding them.
- Compared to `VRMC_vrm.lookAt`, this proposal aligns the look-at space with the glTF camera convention, where -Z is forward. I believe this is a good idea.
- Should `expressions` be allowed to be empty or omitted?
  - Allowing it would permit a no-op extension object containing only `referenceNode`, which effectively becomes a no-op extension.
  - Requiring at least one mapped expression would help catch authoring mistakes such as accidentally exporting an empty `VRMC_character_expression_lookat`.
  - However, such design decisions are not common in glTF and its extensions, and it may be better to follow the general convention unless there is a strong reason to do otherwise.
- Should additional properties be allowed?
  - Disallowing them would help catch authoring mistakes such as typos in property names
  - The decision should preferably be aligned with the schema design of `KHR_character_expression` and with glTF conventions
  - glTF explicitly state that additional properties are allowed in most objects
