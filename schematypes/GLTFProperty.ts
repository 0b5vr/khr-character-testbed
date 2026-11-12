export interface GLTFProperty {
  /**
   * JSON object with extension objects. Property names correspond to glTF extension names and property values are extension-specific objects.
   */
  extensions?: Record<string, any>;
  /**
   * Application-specific data.
   */
  extras?: any;
}
