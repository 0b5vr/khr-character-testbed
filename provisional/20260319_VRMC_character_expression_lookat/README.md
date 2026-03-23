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

The intent of this extension is to define how to reproduce the look-at behavior defined in `VRMC_vrm` extension using the expression control defined in `KHR_character_expression` extension.

This extension defines only how a look-at target is converted into four expressions: `lookUp`, `lookDown`, `lookLeft`, and `lookRight`.
It does not define binocular parallax, independent per-eye targeting, or first-person camera placement.

### Behavior

To calculate the look-at expression values using this extension, the implementation needs to determine the look-at direction.
The look-at direction is calculated in the local coordinate system of a specified `referenceNode`, which is typically a node under the head bone of the character.

The local axes of `referenceNode` define the look-at space: `-Z` is the forward direction that "lens" looks towards, `+X` is the right direction, and `+Y` is the up direction.
This definition matches the glTF camera definition.

By providing a target point `T` from the application, the implementation calculates the direction from `referenceNode` to `T` in the local space of `referenceNode`, and then converts that direction into the four expression values.

The implementation then calculates the yaw and pitch angles from the look-at direction using the following formulas:

```c
yaw = atan2(x, -z)
pitch = atan2(y, sqrt(x * x + z * z))
```

If the target position is equal to the origin of `referenceNode`, the direction SHOULD be treated as `(0, 0, -1)` (i.e. looking forward).

The implementation converts these angles to four non-negative expression inputs as follows:

```c
lookRightValue = saturate( yaw / (pi / 2))
lookLeftValue  = saturate(-yaw / (pi / 2))
lookUpValue    = saturate( pitch / (pi / 2))
lookDownValue  = saturate(-pitch / (pi / 2))
```

Where `saturate(v)` limits `v` into the range `[0, 1]`.
In other words, the angular range `[0 deg, 90 deg]` maps linearly to the expression input range `[0, 1]`.

If a corresponding expression mapping is not present in `expressions`, the implementation MUST ignore that output.

> Implementation note: When the target is behind the character (i.e. `|yaw| > 90 deg`), the behavior is not defined. Implementations can choose to clamp the expression value, ignore the target, or apply another policy.

> Implementation note: Implementations may combine head rotation with expression-based eye control while tracking a target, or may control only the expressions.

> Note to artists: Authors should design the referenced look-at expressions to make eye gaze work on their own, assuming no head rotation. At runtime, implementations may still combine these expressions with head rotation.

### Conversion from existing VRM look-at

This extension can serve as a compatibility layer for existing `VRMC_vrm.lookAt` assets that are expressed using `KHR_character_expression`.

This extension defines the look-at space using the local axes of a specified `referenceNode`, which differs from the look-at space defined in `VRMC_vrm.lookAt`, which uses a virtual transform under the head bone with an initial orientation looking forward along the global +Z axis.
When converting an existing VRM, the converter will need to insert a child node representing the `referenceNode` under the head bone, with a translation of `VRMC_vrm.lookAt.offsetFromHeadBone` and an orientation in which the transformed -Z axis points toward the global +Z axis.

For an existing VRM asset using `"expression"` look-at, the existing look-at expressions can be reused as-is, and the converter can map them to the corresponding properties in this extension.
For an existing VRM asset using `"bone"` look-at, the asset can define `lookUp`, `lookDown`, `lookLeft`, and `lookRight` as expressions that drive eye-bone rotations using `KHR_character_expression_joint`, and then map them through this extension.

Unlike `VRMC_vrm.lookAt`, this extension does not define per-direction range maps such as horizontal inner/outer or vertical up/down. Assets are expected to author the desired response curve in the referenced `KHR_character_expression` expressions.

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
