import type { GLTF } from '@gltf-transform/core';
import type { VRMCVRM } from '@pixiv/types-vrmc-vrm-1.0';
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
      'dc': 'http://purl.org/dc/elements/1.1/',
      'dcterms': 'http://purl.org/dc/terms/',
      'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    },
    '@id': '',
    'dc:format': 'model/gltf-binary',
  };

  if (vrm.meta.name != null) {
    logVerbose(`KHR_xmp_json_ld: VRM meta name found, adding dc:title`);
    packet['dc:title'] = {
      '@type': 'rdf:Alt',
      'rdf:_1': { '@language': 'x-default', '@value': vrm.meta.name },
    };
  }

  if (vrm.meta.authors != null) {
    logVerbose(`KHR_xmp_json_ld: VRM meta authors found, adding dc:creator`);
    packet['dc:creator'] = {
      '@list': vrm.meta.authors,
    };
  }

  if (vrm.meta.licenseUrl != null) {
    logVerbose(`KHR_xmp_json_ld: VRM meta licenseUrl found, adding dcterms:license`);
    packet['dcterms:license'] = { '@list': [vrm.meta.licenseUrl] };
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
