# 20260303_expression_masks_proposal

> This document somewhat conforms to the format of a glTF extension proposal, but it is not an official proposal and may not be complete or accurate. It is intended to provide a clear and concise explanation of the proposed extension for discussion purposes.

## Motivation
- For example, when the user wants to apply emotional expressions such as "happy" or "angry" while lipsync is active, the avatar's expression may collapse depending on the implementation of the avatar by "opening the mouth twice". However, certain avatars may want to express the both expressions at the same time. This is not deterministic by the application side, and it is better to be defined by the asset side.
- Compatibility with VRM expressions: VRM has a similar mechanism called "overrides", which tries to resolve the issue above.

## Overview
The `KHR_character_expression_masks` extension is designed to enhance the control over character expressions in glTF animations. It allows artists to define masks that can blend or block the influence of one expression on another, preventing unwanted interactions between different expressions.

## Behavior
The expression that influences another expression have a mask object that defines how the influence is applied.
It is allowed to have multiple masks targeting the same expression, and the total influence is the product of all the mask influences.

The mask can be of two types: "blend" or "block".

### "blend" masks
Given two expressions "aa" and "happy", "happy" has a "blend" mask targeting "aa" with an amount of `x`.
When "happy" is active, the influence of "aa" is reduced.

```
aa_out = aa_in * (1 - x * happy_in)
happy_out = happy_in
```

### "block" masks
Given two expressions "aa" and "angry", "angry" has a "block" mask targeting "aa" with an amount of `x` and a threshold of `y`.
When "angry" is active, the influence of "aa" is blocked if "angry" is greater than the threshold `y`.
For example, when the threshold is 0, the influence of "aa" is blocked unless "angry" is completely inactive.

```
aa_out = aa_in * (1 - (angry_in > y ? x : 0))
angry_out = angry_in
```

### Execution order
I believe the execution order of expressions is not a matter by given reasons:

- The influence only evaluates the input of the expression values.
- The total influence is the product of all the masks targeting the same expression, which applies the commutative property.

## JSON example
Not exhaustive, just to show the structure of the extension.

```json
{
  "extensions": {
    "KHR_character_expression": {
      "expressions": [
        {
          "expression": "aa",
          "animation": 0,
          "extensions": {
            "KHR_character_expression_morphtarget": {
              "channels": [
                0
              ]
            }
          }
        },
        {
          "expression": "happy",
          "animation": 1,
          "extensions": {
            "KHR_character_expression_morphtarget": {
              "channels": [
                0
              ]
            },
            "KHR_character_expression_mask": {
              "masks": [
                {
                  "target": "aa",
                  "type": "blend",
                  "amount": 0.5
                }
              ]
            }
          }
        },
        {
          "expression": "angry",
          "animation": 1,
          "extensions": {
            "KHR_character_expression_morphtarget": {
              "channels": [
                0
              ]
            },
            "KHR_character_expression_mask": {
              "masks": [
                {
                  "target": "aa",
                  "type": "block",
                  "threshold": 0.2
                }
              ]
            }
          }
        },
        // ...
      ]
    }
  }
}
```

## glTF Schema
### KHR_character_expression_mask
The root object of the extension, which contains an array of masks.

| | Type | Description | Required |
|-|-|-|-|
| `masks` | `array` | An array of a mask object. | ✅ Yes |

#### KHR_character_expression_mask.masks ✅
An array of mask objects.

- Type: `array`
- Required: Yes

### Mask
The mask object defines the target expression, the type of mask, and the parameters for the mask.

| | Type | Description | Required |
|-|-|-|-|
| `target` | `string` | The name of the target expression. | ✅ Yes |
| `type` | `string` | The type of the mask, either "blend" or "block". | No |
| `amount` | `number` | The amount of the blend mask, between 0 and 1. | No |
| `threshold` | `number` | The threshold of the block mask, between 0 and 1. | No |

#### Mask.target ✅
The name of the target expression that this mask will affect.

- Type: `string`
- Required: Yes

#### Mask.type
The type of the mask, which can be either "blend" or "block". If not specified, it defaults to "blend".

- Type: `string`
- Required: No

#### Mask.amount
The amount of the blend mask, which determines how much the target expression is blended.
It MUST be a number between 0 and 1.
When not specified, it defaults to 1.

- Type: `number`
- Required: No

#### Mask.threshold
The threshold of the block mask, which determines when the target expression is blocked.
When the input of the expression is greater than this threshold, the target expression is blocked.
It MUST be a number between 0 and 1.
When not specified, it defaults to 0.

- Type: `number`
- Required: No

## Design considerations
I'm not fully confident about the proposal!

- Have no confidence about the naming at all.
- The "amount" parameter is a new idea that didn't exist in the VRM expressions. I simply thought it would be nice to have.
- The "threshold" parameter compensates for the lack of the "isBinary" mechanism in VRM expressions.

## Implementation Demo
See [demo.html](demo.html) for a simple implementation of the interaction between expressions with masks.
