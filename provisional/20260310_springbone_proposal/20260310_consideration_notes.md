# springbone consideration notes

> Pretty much a direct output from LLM translation; some nuances may be lost.

## Purpose and scope

This document aims to provide a discussion draft for designing how to describe secondary animation for 3D characters as a glTF extension associated with `KHR_character`.

Here, “secondary animation” refers to elements such as hair, clothing, and accessories that follow a bone hierarchy while exhibiting delayed motion and inertia.

The scope of this effort is to define a minimal and interoperable data representation of secondary animation for 3D characters.

More specifically, the goal is to define:

- A basic approach for realizing secondary animation without over-constraining implementation details.
  - We would provide an informative reference implementation to demonstrate the intended behavior, but the spec itself would not mandate specific algorithms or implementation techniques.
- A parameter set that is easy for artists to tune and easy for implementers to support.
  - The aiming role model is PBR material parameters, which are widely adopted and have relatively consistent interpretations across implementations.

## Background

Secondary animation for 3D characters refers to elements such as hair, clothing, and accessories that follow a bone hierarchy while exhibiting delayed motion and inertia.
I have to mention the fact that such mechanisms are also used for body parts such as breasts and legs in Japanese 3D character production. We might also want to consider such use cases.

While it is an important factor that greatly increases character appeal, it can be difficult to implement and to tune.

In many cases, secondary-animation systems are implemented separately for each platform, runtime, and format.
As a result, the same asset can look different across environments, and the meaning of tuning values can change.
Creators are often forced to re-tune per distribution target, and tool developers continue to bear ongoing costs to convert between formats.

Expected use cases include real-time rendering, streaming, games, DCC tool interoperability, and re-use on asset distribution platforms.
In these contexts, “high physical accuracy” is often less important than:

- Being lightweight to implement.
- Being portable without visual breakage.
- Being easy for creators to tune.

This discussion proceeds with that priority in mind.

## Previous cases

Among the cases below, both `VRMC_springBone` and `VRCPhysBone` can be organized as position-based approaches, where updates focus on positions rather than pure impulse-based simulation.
This commonality is an important clue when considering a KHR extension.

### VRMC_springBone

https://github.com/vrm-c/vrm-specification/tree/master/specification/VRMC_springBone-1.0

`VRMC_springBone` is an implementation example of SpringBone using a glTF extension, defined as part of the VRM 1.0 specification.

As a platform-independent standard for describing secondary animation for 3D characters, it has real-world adoption.

It largely reuses SpringBone as defined for VRM 0.x, and its spec and behavior were not necessarily designed with sufficient deliberation.

As of 2026, the spec is being operated while compensating for missing elements via related extensions such as `VRMC_springBone_extended_collider` and `VRMC_springBone_limit` (Draft).

List of parameters related to forces:

- Stiffness
- Gravity Power
- Gravity Dir
- Drag Force

### VRCPhysBone

https://creators.vrchat.com/common-components/physbones/

`VRCPhysBone` is a secondary-animation system used in VRChat, offering high expressive power including external forces and various constraints.
In particular, its normalized parameters are important, making it intuitive for artists to tune.

Because adopting too wide a set of features increases implementation load, careful selection of what to include is necessary.

Research results (ja) compiled independently by 0b5vr about VRCPhysBone behavior:

- https://scrapbox.io/0b5vr/VRCPhysBone
- https://scrapbox.io/0b5vr/VRCPhysBone:_Forces
- https://scrapbox.io/0b5vr/VRCPhysBone:_Limits

List of parameters related to forces:

- Pull
- Momentum
- Stiffness
- Gravity
- Gravity Falloff
- Immobile Type
- Immobile

### Magica Cloth 2

https://magicasoft.jp/en/mc2_boneclothstartguide/

Magica Cloth 2 is a cloth simulation asset for Unity and is widely used to represent secondary animation such as clothing on 3D characters.
It is popular in production settings and is also well-regarded for performance.

Although it is called “Cloth,” it also provides a type called “BoneCloth” that can be applied to secondary animation of hair and accessories using Transforms.

Magica Cloth 2 is very feature-rich and definitely overkill for the purpose of defining a standard; careful selection of which features to adopt is necessary given implementation cost.

Compared to the other two cases, there are many force-related parameters for Magica Cloth 2.

See the following URL:
https://magicasoft.jp/en/mc2_magicaclothcomponent/

### General-purpose physics simulation (rigid bodies, joints, cloth, etc.)

Approaches using general-purpose physics simulation can reuse existing physics capabilities such as rigid bodies, joints, and cloth.

In theory, they offer very high generality and extensibility.

However, when limited to secondary animation for 3D characters, they often face challenges in terms of:

- Implementation cost
- Runtime load
- Reproducibility across runtimes
- Portability across formats

Rather than standardizing this approach directly as a KHR extension, it is more practical to extract the necessary insights and distill them into a lightweight specification tailored to 3D characters.

## Requirements

### Required

- ✨ Define secondary animation for glTF nodes.
- 🎛️ Parameterize secondary animation.
  - Stiffness, damping, and so on.
  - Select and define a parameter set based on intended use cases.
  - Parameters should allow artists to express intent, and results should not deviate significantly from that intent. Naming is also important.
  - Ideally, parameters should be normalized so that scales and meanings do not diverge significantly across implementations, similar to material parameters in PBR.
- ⬇️ Represent gravity.
  - Consider definitions like VRCPhysBone where gravity applies only when the pose tilts away from the rest pose.
- 💥 Collision handling using colliders.
  - Sphere, capsule, inner sphere, inner capsule, infinite plane.
- 🛠️ Ease of implementation and behavioral compatibility across runtimes.
  - Prioritize lightweight implementation and portability without visual breakage over strict physical accuracy.
  - Avoid ambiguous expressions so that interpretation does not diverge among implementers.
  - Must be implementable in major 3D runtimes such as Unity, Unreal Engine, Godot, Three.js, Babylon.js, Blender, etc.
  - Runtime performance must be practical.
  - Preferably assume implementations using Unity Job System, SIMD, Compute Shaders, and so on.
  - Do not require perfect numerical and behavioral matching across runtimes. Instead, prioritize reproducing the motion intended by the parameters.
- ⚙️ Data structures that can be extended in the future.
  - Likely achievable naturally by allowing use of extension and extras.
  - It is also important not to introduce overly complex structures in the initial specification.
- 🔄 Ensure a migration path from existing specifications.
  - Clarify conversion policies from existing, widely used specs such as VRMC_springBone and VRCPhysBone.

### Optional

- 🗜️ Angle limits.
  - Useful mainly to suppress overly unstable skirt behavior, and is already widely used in VRChat.
- ⏱️ Frame-rate independent behavior.
  - Must reproduce intended behavior across a wide range of frame rates, including not only typical 60 FPS, but also 30 FPS in production, 90+ FPS in VR, and 120+ FPS in games.
- ❄️ Mechanisms to suppress excessive “explosions” of motion.
  - Excessive secondary animation due to inertia when moving in VR space has been a long-standing issue in VRM SpringBone.
  - The design of the “Immobile” parameter in VRCPhysBone is a strong reference.
- 🔄 Conversion to existing specifications.
  - Because VRChat only supports specified components, considering conversion to VRCPhysBone is important for interoperability with VRChat avatars.
  - If needed, it may be useful to allow using Magica Cloth 2 as a backend for secondary animation.

### Won’t do

- 👗 Cloth simulation.
  - Based on prior art such as VRMC_springBone and VRCPhysBone, cloth simulation is out of scope.
- ➰ Stretching.
  - Based on prior art such as VRMC_springBone and VRCPhysBone, stretching is out of scope.
- 💥 Collisions between secondary-animation elements.
  - Out of scope for the initial spec due to concerns around implementation cost and reproducibility across runtimes.
- ✋ Interaction.
  - Interaction between secondary animation and users (for example, grabbing hair in VR) is out of scope for the initial spec because it would also require definitions of hands, props, and other interaction targets.
  - If definitions such as thickness and length could be introduced easily and be useful in the future, it may be worth considering introducing them even in the initial spec.
