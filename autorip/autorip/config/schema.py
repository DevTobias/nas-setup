config_schema = {
    "type": "object",
    "properties": {
        "logger": {
            "type": "object",
            "properties": {"debug": {"type": "boolean"}, "silent": {"type": "boolean"}},
            "required": ["debug", "silent"],
            "additionalProperties": False,
        },
        "input": {
            "type": "object",
            "properties": {
                "devices": {"type": "array", "items": {"type": "string"}},
                "read_from_log": {"type": "boolean"},
            },
            "required": ["devices", "read_from_log"],
            "additionalProperties": False,
        },
        "output": {
            "type": "object",
            "properties": {
                "languages": {"type": "array", "items": {"type": "string"}},
                "logging_dir": {"type": "string"},
                "temporary_rip_dir": {"type": "string"},
                "output_dir": {"type": "string"},
            },
            "required": ["languages", "logging_dir", "temporary_rip_dir", "output_dir"],
            "additionalProperties": False,
        },
        "metadata": {
            "type": "object",
            "properties": {"imdb_token": {"type": "string"}},
            "required": ["imdb_token"],
            "additionalProperties": False,
        },
    },
    "required": ["input", "output", "metadata"],
    "additionalProperties": False,
}
