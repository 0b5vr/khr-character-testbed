import * as THREE from 'three';

const RENDER_ORDER = 10000;

export class KHRNodeCameraHintHelper extends THREE.Group {
  public readonly sphereGeometry: THREE.SphereGeometry;
  public readonly arrowShaftGeometry: THREE.CylinderGeometry;
  public readonly arrowHeadGeometry: THREE.ConeGeometry;

  public readonly material: THREE.MeshBasicMaterial;

  public readonly sphere: THREE.Mesh;
  public readonly arrowShaft: THREE.Mesh;
  public readonly arrowHead: THREE.Mesh;

  public constructor() {
    super();

    this.sphereGeometry = new THREE.SphereGeometry(0.01, 16, 8);
    this.arrowShaftGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.2, 8);
    this.arrowHeadGeometry = new THREE.ConeGeometry(0.02, 0.04, 16);

    this.material = new THREE.MeshBasicMaterial({
      color: 0x7f00ff,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    this.sphere = new THREE.Mesh(this.sphereGeometry, this.material);
    this.sphere.renderOrder = RENDER_ORDER;
    this.add(this.sphere);

    this.arrowShaft = new THREE.Mesh(this.arrowShaftGeometry, this.material);
    this.arrowShaft.rotation.x = -Math.PI / 2.0;
    this.arrowShaft.position.z = -0.1;
    this.arrowShaft.renderOrder = RENDER_ORDER;
    this.add(this.arrowShaft);

    this.arrowHead = new THREE.Mesh(this.arrowHeadGeometry, this.material);
    this.arrowHead.rotation.x = -Math.PI / 2.0;
    this.arrowHead.position.z = -0.2;
    this.arrowHead.renderOrder = RENDER_ORDER;
    this.add(this.arrowHead);
  }

  public dispose(): void {
    this.sphereGeometry.dispose();
    this.arrowShaftGeometry.dispose();
    this.arrowHeadGeometry.dispose();
    this.material.dispose();
  }
}
