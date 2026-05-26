from pydantic import BaseModel


class MessageRequest(BaseModel):
    text: str


class MessageResponse(BaseModel):
    response: str


class ImageEnhancementRequest(BaseModel):
    image_path: str | None = None
    image_data_url: str | None = None


class ImageEnhancementResponse(BaseModel):
    image_path: str | None = None
    image_data_url: str | None = None
    enhanced_image_path: str | None = None
    enhanced_image_data_url: str | None = None
    original_width: int
    original_height: int
    enhanced_width: int
    enhanced_height: int
    upscaled: bool
