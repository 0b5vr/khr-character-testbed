# lookat vrm supplement

This document is a consideration note for securing interoperability of VRM lookAt with character models described in KHR_character.

## Current VRM lookAt specification

In VRM 1.0, we have a property `VRMC_vrm.lookAt` that defines the lookAt behavior for VRM characters.

https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/lookAt.md
https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/schema/VRMC_vrm.lookAt.schema.json

The main purpose of this property is following:

### Gaze origin

`offsetFromHeadBone` defines the reference point representing the character's gaze origin.
It defines the position of the character's gaze origin relative to the head bone.

The specification defines the "LookAt space" as the coordinate system used for lookAt calculations.
The +Z axis of the local space of the head bone is considered the forward direction for lookAt calculations.

This is used for both first-person camera position in VR settings and for calculating the lookAt direction.
The parallax and IPD are not considered here. It's not able to do the cross-eyed expression using lookAt.

This portion of the specification will be covered by the currently proposed `KHR_camera_hint` specification.

https://github.com/KhronosGroup/glTF/commit/33521b9ca127b63afc3899e35d8b3c0a90443d92#diff-862236d7fd0786c32ee03f3c284c9a595c5a0dd3a46d1352b5c95f5b0339e387

### LookAt animation

All other properties define the lookAt animation behavior for the character.

There are two types of lookAt behavior: "bone" and "expression".

"bone" type uses the character's bones `leftEye` and `rightEye` to rotate the eyes bones towards the target.
Most VRM characters use this type of lookAt behavior, and it's widely supported by VRM implementations.

"expression" type uses expressions defined in `VRMC_vrm.expressions` to control the eye movement.
The expressions controlled by lookAt are following preset expressions: `lookLeft`, `lookRight`, `lookUp`, and `lookDown`.
It's not commonly used and some VRM implementations may not support this.

The properties below define how the character's eyes should move in response to lookAt targets, and they are used for both "bone" and "expression" types:

- `rangeMapHorizontalInner`
- `rangeMapHorizontalOuter`
- `rangeMapVerticalDown`
- `rangeMapVerticalUp`

## Expressions in KHR_character

In the current KHR_character proposal, we have an extension `KHR_character_expression` that is an equivalent of VRM's `VRMC_vrm.expressions` property.

https://github.com/KhronosGroup/glTF/pull/2512/changes#diff-d27968d7cb09d863014cff164000e4b8ec0720f162b4e9c9c9daacede4eb9a56

`KHR_character_expression` defines a set of expressions that can be controlled by parameters in the range of `[0, 1]`.
These expressions are driven by the glTF animation system, and the artist can create arbitrary response curves for each expression using the animation system.

Unlike VRM, it does not have "preset" or standard vocabulary of expressions, and it's up to the model creator to name and define the expressions.

## VRM's proposed solution for KHR_character

To ensure interoperability of VRM lookAt with character models described in KHR_character, we propose to have a compatibility layer that maps KHR_character expressions to VRM lookAt style control.

We propose `VRMC_character_expression_lookat` (tentative name) as an extension that references KHR_character expressions and defines how they should be used for lookAt control.

### Properties

The extension defines four properties: `lookUp`, `lookDown`, `lookLeft`, and `lookRight`.
Each property references an expression by its name defined in `KHR_character_expression`.

### Behavior

When an implementation is provided a lookAt target, the implementation calculates the lookAt direction and its rotation angle relative to the forward direction of the head bone.
Then, the implementation maps the rotation angle `[0deg, 90deg]` to the corresponding expression value `[0, 1]`.

### Proposed JSON schema

```json
{
  "extensions": {
    "KHR_character_expression": { // why is the extension name "expression" instead of "expressions" btw?
      "expressions": [
        {
          "expression": "vrmLookUp", // why is the property name "expression" and not "name" btw?
          // ...
        },
        {
          "expression": "vrmLookDown",
          // ...
        },
        {
          "expression": "vrmLookLeft",
          // ...
        },
        {
          "expression": "vrmLookRight",
          // ...
        }
      ]
    },
    "VRMC_character_expression_lookat": {
      "lookUp": "vrmLookUp",
      "lookDown": "vrmLookDown",
      "lookLeft": "vrmLookLeft",
      "lookRight": "vrmLookRight"
    }
  }
}
```

## Considerations

The spec must define the behavior carefully.
The keywords will be: lookAt space, direction, rotation angle, mapping range, etc.
