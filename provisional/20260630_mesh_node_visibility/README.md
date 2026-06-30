# `KHR_character_node_visibility` and `KHR_character_mesh_visibility`

> The extension name and properties are provisional and subject to change.

These extensions define the visibility of nodes and mesh primitives in a KHR_character model. The intended use case is to hide head meshes in first-person view, while keeping them visible in third-person view. This is useful for VR applications where the user's own head should not obstruct their view of the virtual world.

`KHR_character_node_visibility` is applied to nodes, while `KHR_character_mesh_visibility` is applied to mesh primitives.
Having either extension on a node or mesh primitive will override the default visibility behavior. Setting to both extensions is not required.

> Consideration note: What if both extensions are defined and they have conflicting visibility values? For example, if a node has `KHR_character_node_visibility` set to `thirdPerson`, but one of its mesh primitives has `KHR_character_mesh_visibility` set to `always`. My suggestion is to ban using both extensions on a single glTF model. Each extension has different granularity and is not compatible with each other, making it difficult to decide which one should take precedence.

Both extensions have a `visibility` property that can take one of three values: `firstPerson`, `thirdPerson`, or `always`.

## glTF Schema Updates

### `KHR_character_node_visibility`

```json
{
  "nodes": [
    {
      "name": "Head",
      "extensions": {
        "KHR_character_node_visibility": {
          "visibility": "thirdPerson" // The head node is hidden in first-person view
        }
      }
    },
    {
      "name": "FirstPersonOnlyHead",
      "extensions": {
        "KHR_character_node_visibility": {
          "visibility": "firstPerson" // The head node is hidden in third-person view
        }
      }
    },
    {
      "name": "Body"
      // No visibility extension implies that the node is always visible
    }
  ]
}
```

### `KHR_character_mesh_visibility`

```json
{
  "meshes": [
    {
      "name": "HeadMesh",
      "primitives": [
        {
          // ...
          "extensions": {
            "KHR_character_mesh_visibility": {
              "visibility": "thirdPerson" // The head mesh is hidden in first-person view
            }
          }
        }
      ]
    },
    {
      "name": "FirstPersonOnlyHeadMesh",
      "primitives": [
        {
          // ...
          "extensions": {
            "KHR_character_mesh_visibility": {
              "visibility": "firstPerson" // The head mesh is hidden in third-person view
            }
          }
        }
      ]
    },
    {
      "name": "BodyMesh"
      // No visibility extension implies that the mesh is always visible
    }
  ]
}
```
