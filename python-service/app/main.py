from pathlib import Path
from urllib.request import urlretrieve

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from PIL import Image, ImageFilter

from app.schemas import (
    ImageEnhancementRequest,
    ImageEnhancementResponse,
    MessageRequest,
    MessageResponse,
)


MODEL_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5/realesrgan-x4plus.pth"
MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_PATH = MODEL_DIR / "realesrgan-x4plus.pth"

app = FastAPI(title="Python Message Service", version="1.0.0")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/message", response_model=MessageResponse)
def message(payload: MessageRequest) -> MessageResponse:
    response_text = (
        "Thanks for your message I will get back to you at the earliest. "
        f"Your received message: {payload.text}"
    )
    return MessageResponse(response=response_text)


def _ensure_model() -> Path:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    if not MODEL_PATH.exists():
        try:
            urlretrieve(MODEL_URL, MODEL_PATH)
        except Exception as exc:  # pragma: no cover - network dependent fallback
            raise RuntimeError("Unable to download the enhancement model.") from exc

    return MODEL_PATH


def _try_model_enhancement(source_image: Image.Image) -> Image.Image:
    try:
        import torch
        from basicsr.archs.rrdbnet_arch import RRDBNet
        from realesrgan import RealESRGANer

        model_path = _ensure_model()
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = RRDBNet(
            num_in_ch=3,
            num_out_ch=3,
            num_feat=64,
            num_block=23,
            num_grow_ch=32,
            scale=4,
        )
        upsampler = RealESRGANer(
            scale=4,
            model_path=str(model_path),
            model=model,
            tile=0,
            tile_pad=10,
            pre_pad=0,
            half=device.type == "cuda",
            device=device,
        )

        input_array = cv2.cvtColor(np.array(source_image), cv2.COLOR_RGB2BGR)
        upscaled_array, _ = upsampler.enhance(input_array, outscale=4)
        return Image.fromarray(cv2.cvtColor(upscaled_array, cv2.COLOR_BGR2RGB))
    except Exception as exc:  # pragma: no cover - model download/runtime fallback
        raise RuntimeError("model_unavailable") from exc


@app.post("/enhance-image", response_model=ImageEnhancementResponse)
def enhance_image(payload: ImageEnhancementRequest) -> ImageEnhancementResponse:
    image_path = Path(payload.image_path)

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Image path not found.")

    try:
        with Image.open(image_path) as source_image:
            source_image = source_image.convert("RGB")
            original_width, original_height = source_image.size

            if original_width < 200:
                target_width = max(200, original_width * 2)
                target_height = max(1, round(original_height * target_width / original_width))

                try:
                    enhanced_image = _try_model_enhancement(source_image)
                    if enhanced_image.width < 200:
                        enhanced_image = enhanced_image.resize(
                            (target_width, target_height),
                            Image.Resampling.LANCZOS,
                        )
                except Exception:
                    enhanced_image = source_image.resize(
                        (target_width, target_height),
                        Image.Resampling.LANCZOS,
                    )

                enhanced_image = enhanced_image.filter(ImageFilter.UnsharpMask(radius=1.2, percent=140))
            else:
                enhanced_image = source_image.filter(ImageFilter.UnsharpMask(radius=1.0, percent=120))

            enhanced_image_path = image_path.with_name(
                f"{image_path.stem}_enhanced{image_path.suffix or '.png'}",
            )
            enhanced_image.save(enhanced_image_path)

            enhanced_width, enhanced_height = enhanced_image.size

            return ImageEnhancementResponse(
                image_path=str(image_path),
                enhanced_image_path=str(enhanced_image_path),
                original_width=original_width,
                original_height=original_height,
                enhanced_width=enhanced_width,
                enhanced_height=enhanced_height,
                upscaled=original_width < 200,
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to enhance the image.") from exc
