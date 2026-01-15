import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import type { VRMCVRM } from 'npm:@pixiv/types-vrmc-vrm-1.0@3.4.4';
import { logVerbose } from './logVerbose.ts';

export function appendKHRXmpJsonLd(gltf: GLTF.IGLTF): void {
  const vrm = gltf.extensions?.['VRMC_vrm'] as VRMCVRM | undefined;
  if (vrm == null) {
    return;
  }

  if (vrm.meta == null) {
    return;
  }

  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push('KHR_xmp_json_ld');

  const packet: Record<string, unknown> = {
    '@context': {
      'dc': 'http://purl.org/dc/elements/1.1/'
    },
    '@id': '',
    'dc:format': 'model/gltf-binary',
  };

  if (vrm.meta.name != null) {
    logVerbose(`KHR_xmp_json_ld: VRM meta name found, adding dc:title`);
    packet['dc:title'] = vrm.meta.name;
  }

  if (vrm.meta.authors != null) {
    logVerbose(`KHR_xmp_json_ld: VRM meta authors found, adding dc:creator`);
    packet['dc:creator'] = {
      '@list': vrm.meta.authors
    };
  }

  if (vrm.meta.licenseUrl != null) {
    logVerbose(`KHR_xmp_json_ld: VRM meta licenseUrl found, adding dc:license`);
    packet['dc:license'] = vrm.meta.licenseUrl;
  }

  gltf.extensions ||= {};
  gltf.extensions['KHR_xmp_json_ld'] = {
    packets: [packet],
  };

  gltf.asset.extensions ||= {};
  gltf.asset.extensions['KHR_xmp_json_ld'] = {
    packet: 0,
  };
}
