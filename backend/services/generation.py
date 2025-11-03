from typing import Optional
import io
from PIL import Image
import google.generativeai as genai
import time

def configure_gemini(api_key: str):
    genai.configure(api_key=api_key)


def _call_with_retry(func, max_retries=3, initial_delay=1.0):
    """
    Retry a function call with exponential backoff for rate limit errors (429).
    """
    last_error = None
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            last_error = e
            error_str = str(e)
            # Check if it's a rate limit error (429)
            if "429" in error_str or "Resource exhausted" in error_str:
                if attempt < max_retries - 1:
                    # Exponential backoff
                    delay = initial_delay * (2 ** attempt)
                    print(
                        f"Rate limit hit (429). Retrying in {delay:.1f}s... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                    continue
                else:
                    print(
                        f"Rate limit error after {max_retries} attempts: {e}")
                    raise
            else:
                # Not a rate limit error, raise immediately
                print(f"Error (not rate limit): {e}")
                raise

    # This should never be reached due to raise above, but for type safety
    if last_error:
        raise last_error
    raise Exception("Retry logic failed unexpectedly")

def generate_description(content, lang: str, style: str = "descriptive", user_query: Optional[str] = None) -> str:
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        def _generate():
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

        return _call_with_retry(_generate, max_retries=3, initial_delay=2.0)

    except Exception as e:
        print(f"Error generating description: {e}")
        return (
            f"Description not available due to API limits. Please try again in a few moments."
            if "429" in str(e) or "Resource exhausted" in str(e)
            else f"Description not available. Error: {str(e)[:100]}"
        )


def generate_story_from_image(image_bytes: bytes, lang: str, theme: Optional[str] = None, length_hint: str = "short") -> str:
    """
    Generate a narrative grounded strictly in the provided image. If a theme is supplied, weave it in without
    inventing objects not visible in the image.
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')

        def _generate():
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            theme_part = f" The theme is: {theme}." if theme else ""
            prompt = (
                f"You are a careful visual storyteller. Look closely at the image and write a {length_hint} story in {lang}.\n"
                f"Ground every detail in the image only—do not invent objects, colors, text, or scenes that aren't visible.{theme_part}\n"
                f"Focus on mood, setting, and narrative that emerge from what is actually present."
            )
            resp = model.generate_content([prompt, image])
            return resp.text

        return _call_with_retry(_generate, max_retries=3, initial_delay=2.0)

    except Exception as e:
        print(f"Error generating story from image: {e}")
        return (
            "Story generation temporarily unavailable due to API rate limits. Please try again in a few moments."
            if "429" in str(e) or "Resource exhausted" in str(e)
            else f"Story generation failed: {str(e)[:100]}"
        )


def generate_story_from_text(context: str, lang: str, theme: Optional[str] = None, length_hint: str = "short") -> str:
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')

        def _generate():
            theme_part = f" The theme is: {theme}." if theme else ""
            prompt = (
                f"Write a {length_hint} story in {lang} grounded in the following context.\n"
                f"Do not add objects or details beyond what the context implies.\n{theme_part}\n\nContext:\n{context}"
            )
            resp = model.generate_content(prompt)
            return resp.text

        return _call_with_retry(_generate, max_retries=3, initial_delay=2.0)

    except Exception as e:
        print(f"Error generating story from text: {e}")
        return (
            "Story generation temporarily unavailable due to API rate limits. Please try again in a few moments."
            if "429" in str(e) or "Resource exhausted" in str(e)
            else f"Story generation failed: {str(e)[:100]}"
        )
