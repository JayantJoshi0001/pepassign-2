from pathlib import Path
import base64
import logging
import sys
import types
from io import BytesIO
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


MODEL_URL = "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth"
MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_PATH = MODEL_DIR / "GFPGANv1.4.pth"
logger = logging.getLogger("python-service")

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
    logger.info("Checking enhancement model at %s", MODEL_PATH)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    if not MODEL_PATH.exists():
        try:
            logger.info("Downloading enhancement model from %s", MODEL_URL)
            urlretrieve(MODEL_URL, MODEL_PATH)
            logger.info("Enhancement model downloaded successfully")
        except Exception as exc:  # pragma: no cover - network dependent fallback
            logger.exception("Failed to download enhancement model")
            raise RuntimeError("Unable to download the enhancement model.") from exc

    return MODEL_PATH


def _load_image_from_data_url(data_url: str) -> Image.Image:
    logger.info("Loading enhancement input from data URL")
    if "," not in data_url:
        raise ValueError("Invalid image data URL.")

    _, encoded_image = data_url.split(",", 1)
    image_bytes = base64.b64decode(encoded_image)
    image = Image.open(BytesIO(image_bytes))
    logger.info("Loaded input image from data URL with size %sx%s", image.width, image.height)
    return image


def _to_data_url(image: Image.Image, format_name: str = "PNG") -> str:
    buffer = BytesIO()
    image.save(buffer, format=format_name)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    mime_type = "image/png" if format_name.upper() == "PNG" else "image/jpeg"
    return f"data:{mime_type};base64,{encoded}"


def _try_model_enhancement(source_image: Image.Image) -> Image.Image:
    try:
        logger.info(
            "Trying GFPGAN enhancement for %sx%s image",
            source_image.width,
            source_image.height,
        )
        import torch
        import torchvision.transforms.functional as torchvision_functional

        if "torchvision.transforms.functional_tensor" not in sys.modules:
            functional_tensor = types.ModuleType("torchvision.transforms.functional_tensor")
            functional_tensor.rgb_to_grayscale = torchvision_functional.rgb_to_grayscale
            sys.modules["torchvision.transforms.functional_tensor"] = functional_tensor

        from gfpgan.utils import GFPGANer

        model_path = _ensure_model()
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info("Using device %s for GFPGAN", device.type)
        restorer = GFPGANer(
            model_path=str(model_path),
            upscale=2,
            arch="clean",
            channel_multiplier=2,
            bg_upsampler=None,
            device=device,
        )

        input_array = cv2.cvtColor(np.array(source_image), cv2.COLOR_RGB2BGR)
        _, _, restored_array = restorer.enhance(
            input_array,
            has_aligned=False,
            only_center_face=False,
            paste_back=True,
        )
        logger.info("GFPGAN enhancement completed successfully")
        return Image.fromarray(cv2.cvtColor(restored_array, cv2.COLOR_BGR2RGB))
    except Exception as exc:  # pragma: no cover - model download/runtime fallback
        logger.exception("GFPGAN enhancement failed")
        raise RuntimeError("model_unavailable") from exc


def _enhance_image(source_image: Image.Image) -> Image.Image:
    source_image = source_image.convert("RGB")
    original_width, original_height = source_image.size
    logger.info("Enhancement pipeline started for %sx%s image", original_width, original_height)

    try:
        logger.info("Running GFPGAN enhancement for every uploaded image")
        enhanced_image = _try_model_enhancement(source_image)

        if enhanced_image.width < original_width:
            logger.info(
                "Model output width %s is smaller than original width %s, preserving output without resize",
                enhanced_image.width,
                original_width,
            )

        if enhanced_image.width < 200 and original_width < 200:
            target_width = max(200, original_width * 2)
            target_height = max(1, round(original_height * target_width / original_width))
            logger.info(
                "Small input image; resizing model output to %sx%s",
                target_width,
                target_height,
            )
            enhanced_image = enhanced_image.resize(
                (target_width, target_height),
                Image.Resampling.LANCZOS,
            )

        enhanced_image = enhanced_image.filter(
            ImageFilter.UnsharpMask(radius=1.2, percent=140),
        )
        logger.info("Applied unsharp mask after GFPGAN enhancement")
    except Exception:
        logger.exception("Model enhancement unavailable, falling back to sharpen-only path")
        enhanced_image = source_image.filter(
            ImageFilter.UnsharpMask(radius=1.0, percent=120),
        )

    logger.info(
        "Enhancement pipeline finished with output size %sx%s",
        enhanced_image.width,
        enhanced_image.height,
    )
    return enhanced_image


@app.post("/enhance-image", response_model=ImageEnhancementResponse)
def enhance_image(payload: ImageEnhancementRequest) -> ImageEnhancementResponse:
    try:
        if payload.image_data_url:
            logger.info("Received enhancement request with data URL input")
            with _load_image_from_data_url(payload.image_data_url) as source_image:
                source_image = source_image.convert("RGB")
                original_width, original_height = source_image.size
                enhanced_image = _enhance_image(source_image)
                enhanced_width, enhanced_height = enhanced_image.size
                logger.info(
                    "Returning enhanced data URL response: original=%sx%s enhanced=%sx%s upscaled=%s",
                    original_width,
                    original_height,
                    enhanced_width,
                    enhanced_height,
                    original_width < 200,
                )

                return ImageEnhancementResponse(
                    image_data_url=payload.image_data_url,
                    enhanced_image_data_url=_to_data_url(enhanced_image),
                    original_width=original_width,
                    original_height=original_height,
                    enhanced_width=enhanced_width,
                    enhanced_height=enhanced_height,
                    upscaled=original_width < 200,
                )

        if not payload.image_path:
            logger.warning("Enhancement request missing image_path and image_data_url")
            raise HTTPException(status_code=400, detail="Image path not found.")

        image_path = Path(payload.image_path)
        logger.info("Received enhancement request for file input: %s", image_path)

        if not image_path.exists() or not image_path.is_file():
            logger.warning("Input image not found at %s", image_path)
            raise HTTPException(status_code=404, detail="Image path not found.")

        with Image.open(image_path) as source_image:
            source_image = source_image.convert("RGB")
            original_width, original_height = source_image.size
            enhanced_image = _enhance_image(source_image)

            enhanced_image_path = image_path.with_name(
                f"{image_path.stem}_enhanced{image_path.suffix or '.png'}",
            )
            enhanced_image.save(enhanced_image_path)
            logger.info("Saved enhanced image to %s", enhanced_image_path)

            enhanced_width, enhanced_height = enhanced_image.size
            logger.info(
                "Returning enhanced file response: original=%sx%s enhanced=%sx%s upscaled=%s",
                original_width,
                original_height,
                enhanced_width,
                enhanced_height,
                original_width < 200,
            )

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
        logger.exception("Unable to enhance image")
        raise HTTPException(status_code=400, detail="Unable to enhance the image.") from exc
