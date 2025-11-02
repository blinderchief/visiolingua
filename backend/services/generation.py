from typing import Optional
import io
from PIL import Image
import google.generativeai as genai

def configure_gemini(api_key: str):
    genai.configure(api_key=api_key)

def generate_description(content, lang: str, style: str = "descriptive", user_query: Optional[str] = None) -> str:
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        if isinstance(content, (bytes, bytearray)):
            # Image path: analyze the actual image and answer the user's question
            image = Image.open(io.BytesIO(content)).convert('RGB')
            if user_query:
                prompt = f"Look at this image carefully and answer the following question in {lang}: {user_query}\n\nProvide a clear, direct answer based on what you see in the image."
            else:
                prompt = f"Describe what you see in this image in {lang}. Be specific and detailed about the objects, colors, composition, and any text or notable features."
            response = model.generate_content([prompt, image])
        else:
            # Text path
            if user_query:
                prompt = f"Based on this context, answer the question in {lang}: {user_query}\n\nContext: {content}"
            else:
                prompt = f"Summarize this text in {lang} with a {style} style:\n\n{content}"
            response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        print(f"Error generating description: {e}")
        return (
            f"Description not available due to API limits. Original content: {content[:100]}..."
            if isinstance(content, str)
            else "Image description not available due to API limits."
        )


def generate_story_from_image(image_bytes: bytes, lang: str, theme: Optional[str] = None, length_hint: str = "short") -> str:
    """
    Generate a narrative grounded strictly in the provided image. If a theme is supplied, weave it in without
    inventing objects not visible in the image.
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        theme_part = f" The theme is: {theme}." if theme else ""
        prompt = (
            f"You are a careful visual storyteller. Look closely at the image and write a {length_hint} story in {lang}.\n"
            f"Ground every detail in the image only—do not invent objects, colors, text, or scenes that aren't visible.{theme_part}\n"
            f"Focus on mood, setting, and narrative that emerge from what is actually present."
        )
        resp = model.generate_content([prompt, image])
        return resp.text
    except Exception as e:
        print(f"Error generating story from image: {e}")
        return "Story generation failed for this image due to API limits."


def generate_story_from_text(context: str, lang: str, theme: Optional[str] = None, length_hint: str = "short") -> str:
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        theme_part = f" The theme is: {theme}." if theme else ""
        prompt = (
            f"Write a {length_hint} story in {lang} grounded in the following context.\n"
            f"Do not add objects or details beyond what the context implies.\n{theme_part}\n\nContext:\n{context}"
        )
        resp = model.generate_content(prompt)
        return resp.text
    except Exception as e:
        print(f"Error generating story from text: {e}")
        return "Story generation failed due to API limits."
