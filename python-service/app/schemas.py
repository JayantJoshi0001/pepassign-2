from pydantic import BaseModel


class MessageRequest(BaseModel):
    text: str


class MessageResponse(BaseModel):
    response: str


class ImageEnhancementRequest(BaseModel):
    image_path: str


class ImageEnhancementResponse(BaseModel):
    image_path: str
    enhanced_image_path: str
    original_width: int
    original_height: int
    enhanced_width: int
    enhanced_height: int
    upscaled: bool
