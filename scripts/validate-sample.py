"""Validate extension payloads of the bundled sample against the pinned schemas."""
import json
import struct
from pathlib import Path
import jsonschema
from referencing import Registry, Resource

root = Path(__file__).resolve().parents[1]
b = (root / 'viewer/src/assets/khr-character-example.glb').read_bytes()
doc = json.loads(b[20:20 + struct.unpack_from('<I', b, 12)[0]])
base = root / 'specification/glTF'
store = {}
for path in list((base / 'specification/2.0/schema').glob('*.json')) + list((base / 'extensions/2.0/Khronos').glob('*/schema/*.json')):
    schema = json.loads(path.read_text())
    store[path.name] = schema
    store[path.as_uri()] = schema
    if '$id' in schema:
        store[schema['$id']] = schema
schemas = {
    'KHR_character': 'glTF.KHR_character.schema.json',
    'KHR_character_expression': 'glTF.KHR_character_expression.schema.json',
    'KHR_character_expression_joint': 'expression.KHR_character_expression_joint.schema.json',
    'KHR_character_expression_morphtarget': 'expression.KHR_character_expression_morphtarget.schema.json',
    'KHR_character_expression_texture_transform': 'expression.KHR_character_expression_texture_transform.schema.json',
    'KHR_character_expression_suppression': 'expression.KHR_character_expression_suppression.schema.json',
    'KHR_character_expression_mapping': 'glTF.KHR_character_expression_mapping.schema.json',
    'KHR_character_skeleton_mapping': 'glTF.KHR_character_skeleton_mapping.schema.json',
    'KHR_node_camera_hint': 'node.KHR_node_camera_hint.schema.json',
    'KHR_node_visibility_hint': 'node.KHR_node_visibility_hint.schema.json',
    'KHR_mesh_primitive_visibility_hint': 'mesh.primitive.KHR_mesh_primitive_visibility_hint.schema.json',
}
registry = Registry().with_resources((uri, Resource.from_contents(schema)) for uri, schema in store.items())
count = 0
def visit(value):
    global count
    if isinstance(value, dict):
        for name, payload in value.get('extensions', {}).items():
            assert name not in ('KHR_character_expression_mask', 'KHR_character_expression_texture'), name
            if name in schemas:
                schema = store[schemas[name]]
                jsonschema.Draft202012Validator(schema, registry=registry).validate(payload)
                count += 1
        for child in value.values():
            visit(child)
    elif isinstance(value, list):
        for child in value:
            visit(child)
visit(doc)
assert doc['extensions']['KHR_character'] == {}
entries = doc['extensions']['KHR_character_expression']['expressions']
assert len({entry['name'] for entry in entries}) == len(entries)
for entry in entries:
    animation = doc['animations'][entry['animation']]
    for ext in entry.get('extensions', {}).values():
        for index in ext.get('channels', []):
            assert 0 <= index < len(animation['channels'])
        for suppression in ext.get('suppressions', []):
            assert 0 <= suppression['target'] < len(entries)
print(f'Validated {count} extension payloads and expression references against the pinned schemas')
