import { logVerbose } from './logVerbose.ts';
import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import type { KHRMeshAnnotation } from '../schematypes/KHRMeshAnnotation.ts';
import type { KHRMeshAnnotationRenderview } from '../schematypes/KHRMeshAnnotationRenderview.ts';
import type { KHRMeshAnnotationRenderviewRenderVisibility } from '../schematypes/KHRMeshAnnotationRenderviewRenderVisibility.ts';

const firstPersonKeywords = ['head', 'face', 'hair', 'eye'];

export function appendKHRMeshAnnotation(gltf: GLTF.IGLTF): void {
  console.warn(
    'First-person mesh annotations in VRM are associated with nodes, while KHR_mesh_annotation is associated with meshes. ' +
    'In addition, KHR_mesh_annotation does not support the "auto" type in VRM that automatically hides meshes attached to the head bone. ' +
    `In this implementation, we will try assuming meshes that should be thirdPersonOnly by simply checking the mesh name (${firstPersonKeywords.map(keyword => `"${keyword}"`).join(', ')}). `
  );

  let extensionUsed = false;

  for (const mesh of gltf.meshes ?? []) {
    let renderVisibility: KHRMeshAnnotationRenderviewRenderVisibility = 'always';

    for (const keyword of firstPersonKeywords) {
      if (mesh.name?.toLowerCase().includes(keyword)) {
        renderVisibility = 'thirdPersonOnly';
        logVerbose(`KHR_mesh_annotation_renderview: Mesh "${mesh.name}" has keyword "${keyword}"`);
        break;
      }
    }

    logVerbose(`KHR_mesh_annotation_renderview: Mesh "${mesh.name}" set to "${renderVisibility}"`);
    logVerbose(`KHR_mesh_annotation_renderview: Adding extension to ${mesh.primitives?.length ?? 0} primitive(s) of mesh "${mesh.name}"`);

    for (const primitive of mesh.primitives ?? []) {
      extensionUsed = true;
      primitive.extensions ||= {};
      primitive.extensions['KHR_mesh_annotation'] = {
        extensions: {
          'KHR_mesh_annotation_renderview': {
            renderVisibility,
          } satisfies KHRMeshAnnotationRenderview,
        },
      } satisfies KHRMeshAnnotation;
    }
  }

  if (extensionUsed) {
    gltf.extensionsUsed ||= [];
    gltf.extensionsUsed.push('KHR_mesh_annotation');
    gltf.extensionsUsed.push('KHR_mesh_annotation_renderview');
  }
}
