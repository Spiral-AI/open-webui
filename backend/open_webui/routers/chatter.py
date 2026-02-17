import logging
from typing import Any

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException

from open_webui.utils.auth import get_verified_user

from chatter import (
    TemplateRegistry,
    ContentSerializer,
    SystemPromptFormatter,
    Geppetto2Strategy,
    CharacterConfig,
    CharacterRegistry,
)

log = logging.getLogger(__name__)

router = APIRouter()


# ── Response / Request models ────────────────────────────────────────────


class TagInfo(BaseModel):
    name: str
    field_name: str | None = None
    pattern_type: str
    speaker_internal: bool = False
    scope: str = "turn"
    values: list[str] = []
    default: Any = None
    order: int = 0


class SchemaInfo(BaseModel):
    name: str
    version: str
    tags: list[TagInfo]


class SerializeRequest(BaseModel):
    schema_name: str
    text: str
    domain: str
    chara_id: str


class SystemPromptCharacter(BaseModel):
    id: str
    description: str = ""


class SystemPromptRequest(BaseModel):
    schema_name: str
    characters: list[SystemPromptCharacter]
    scenario: str = ""
    domain: str = "daily"


# ── Endpoints ────────────────────────────────────────────────────────────


@router.get("/schemas", response_model=list[SchemaInfo])
async def get_schemas(user=Depends(get_verified_user)):
    """List available schema presets with full tag metadata."""
    results: list[SchemaInfo] = []
    for preset_name in TemplateRegistry.list_presets():
        schema = TemplateRegistry.get(preset_name)
        if schema is None:
            continue
        tags = [
            TagInfo(
                name=tag.name,
                field_name=tag.field_name,
                pattern_type=tag.pattern_type.value
                if hasattr(tag.pattern_type, "value")
                else str(tag.pattern_type),
                speaker_internal=tag.speaker_internal,
                scope=tag.scope,
                values=tag.values,
                default=tag.default,
                order=tag.order,
            )
            for tag in schema.tags
        ]
        results.append(SchemaInfo(name=preset_name, version=schema.version, tags=tags))
    return results


@router.post("/serialize")
async def serialize_message(
    request: SerializeRequest,
    user=Depends(get_verified_user),
):
    """Serialize a user message into tagged format."""
    schema = TemplateRegistry.get(request.schema_name)
    if schema is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown schema: {request.schema_name}",
        )

    serializer = ContentSerializer(schema)

    # Build data dict with only the fields the user should provide
    # (emotion/attitude are speaker_internal, so skip them for user messages)
    data: dict[str, Any] = {
        "domain": request.domain,
        "chara": request.chara_id,
        "content": request.text,
    }

    try:
        result = serializer.serialize(data, skip_defaults=True)
    except Exception as e:
        log.exception("Serialization failed")
        raise HTTPException(status_code=500, detail=str(e))

    return {"result": result}


@router.post("/system-prompt")
async def build_system_prompt(
    request: SystemPromptRequest,
    user=Depends(get_verified_user),
):
    """Build a chatter system prompt ([cast] + [scenario])."""
    characters = []
    for c in request.characters:
        # CharacterConfig.id only allows lowercase letters, digits, and hyphens
        sanitized_id = c.id.replace("_", "-")
        characters.append(
            CharacterConfig(
                id=sanitized_id,
                name_ja=c.id,
                name_en=c.id,
                character_token=f"[chara:{c.id}]",  # keep original for tag matching
                domain_id=request.domain,
                description=c.description,
            )
        )

    registry = CharacterRegistry(characters=characters)
    formatter = SystemPromptFormatter(character_registry=registry)
    formatter.set_strategy(Geppetto2Strategy())

    try:
        result = formatter.format_with_characters(
            characters=characters,
            scenario=request.scenario if request.scenario else None,
        )
    except Exception as e:
        log.exception("System prompt generation failed")
        raise HTTPException(status_code=500, detail=str(e))

    return {"result": result.get("content", "")}
