# converter/converter

This directory contains the substantial part of the converter script that performs the actual conversion from VRM 1.0 to KHR_character.

This module must not include any runtime-specific code such as file system access or DOM manipulation, so that it can be used in various environments including Deno and browser build tools.
