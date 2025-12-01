# Gemini API Documentation Summary

This document summarizes key features and functionalities of the Gemini API, based on the official Google AI for Developers documentation.

## Gemini 3

Gemini 3 is Google's most intelligent model family to date, built on state-of-the-art reasoning. It is designed for agentic workflows, autonomous coding, and complex multimodal tasks. Gemini 3 Pro is the first model in this series, best for complex tasks requiring broad world knowledge and advanced reasoning across modalities.

### New API features in Gemini 3
*   **Thinking level:** Controls the maximum depth of the model's internal reasoning process. Options include `low` (minimizes latency and cost), `medium` (coming soon), and `high` (default, maximizes reasoning depth).
*   **Media resolution:** Provides granular control over multimodal vision processing. Higher resolutions improve the model's ability to read fine text or identify small details but increase token usage and latency. Options are `media_resolution_low`, `media_resolution_medium`, or `media_resolution_high`.
*   **Temperature:** For Gemini 3, it is strongly recommended to keep the temperature parameter at its default value of 1.0.
*   **Thought signatures:** Encrypted representations of the model's internal thought process, used to maintain reasoning context across API calls. These must be returned to the model exactly as received, especially for Function Calling and Image generation/editing.
*   **Structured Outputs with tools:** Gemini 3 allows combining Structured Outputs with built-in tools like Google Search, URL Context, and Code Execution.
*   **Image generation:** Gemini 3 Pro Image allows generating and editing images from text prompts, with features like 4K & text rendering, grounded generation, and conversational editing.

### Migrating from Gemini 2.5
When migrating, consider adjusting thinking levels, temperature settings, PDF & document understanding (media resolution), and token consumption. Image segmentation capabilities are not supported in Gemini 3 Pro.

### Prompting best practices
Gemini 3 responds best to precise, concise instructions. It is less verbose by default, and for conversational personas, explicit steering in the prompt is needed. When working with large datasets, place specific instructions or questions at the end of the prompt, anchored with phrases like "Based on the information above...".

### FAQ
*   **Knowledge cutoff:** January 2025.
*   **Context window limits:** 1 million token input, up to 64k tokens output.

## Text Generation

The Gemini API enables text generation from various inputs, including text, images, video, and audio, using Gemini models.

**1. Basic Text Generation (Python)**
```python
from google import genai
client = genai.Client()
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="How does AI work?"
)
print(response.text)
```

**2. Disabling Thinking with Gemini 2.5 Flash (Python)**
```python
from google import genai
from google.genai import types
client = genai.Client()
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="How does AI work?",
    config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0) # Disables thinking
    ),
)
print(response.text)
```

**3. System Instructions (Python)**
```python
from google import genai
from google.genai import types
client = genai.Client()
response = client.models.generate_content(
    model="gemini-2.5-flash",
    config=types.GenerateContentConfig(
        system_instruction="You are a cat. Your name is Neko."),
    contents="Hello there"
)
print(response.text)
```

**4. Multi-turn Conversations (Chat) (Python)**
```python
from google import genai
client = genai.Client()
chat = client.chats.create(model="gemini-2.5-flash")
response = chat.send_message("I have 2 dogs in my house.")
print(response.text)
response = chat.send_message("How many paws are in my house?")
print(response.text)
```

<h2>Image Understanding</h2>

The Gemini API offers image understanding capabilities. Images can be provided as inline data or uploaded using the File API.

**Passing inline image data (Python):**
```python
from google import genai
from google.genai import types

with open('path/to/small-sample.jpg', 'rb') as f:
    image_bytes = f.read()

client = genai.Client()
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        types.Part.from_bytes(
            data=image_bytes,
            mime_type='image/jpeg',
        ),
        'Caption this image.'
    ]
)
print(response.text)
```

**Uploading images using the File API (Python):**
```python
from google import genai

client = genai.Client()
my_file = client.files.upload(file="path/to/sample.jpg")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[my_file, "Caption this image."],
)
print(response.text)
```
Supported image formats include PNG, JPEG, WEBP, HEIC, and HEIF.

## Video Understanding

The Gemini API allows models to process videos for various use cases.

**Upload a video file using the File API (Python):**
```python
from google import genai
client = genai.Client()
myfile = client.files.upload(file="path/to/sample.mp4")
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[myfile, "Summarize this video."]
)
print(response.text)
```
Supported video formats include `video/mp4`, `video/mpeg`, `video/mov`, `video/avi`, `video/x-flv`, `video/mpg`, `video/webm`, `video/wmv`, and `video/3gpp`.

## Document Processing

The Gemini API allows processing of PDF documents using native vision.

**Passing PDF data inline (Python):**
```python
from google import genai
from google.genai import types
import pathlib

client = genai.Client()
filepath = pathlib.Path('file.pdf')
prompt = "Summarize this document"
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[
        types.Part.from_bytes(
            data=filepath.read_bytes(),
            mime_type='application/pdf',
        ),
        prompt
    ]
)
print(response.text)
```

**Uploading PDFs using the Files API (Python):**
```python
from google import genai
import pathlib

client = genai.Client()
file_path = pathlib.Path('large_file.pdf')
sample_file = client.files.upload(
    file=file_path,
)
prompt="Summarize this document"
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[sample_file, "Summarize this document"]
)
print(response.text)
```

## Audio Understanding

The Gemini API allows for audio understanding.

**Upload an audio file using the Files API (Python):**
```python
from google import genai
client = genai.Client()
myfile = client.files.upload(file="path/to/sample.mp3")
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=["Describe this audio clip", myfile]
)
print(response.text)
```
Supported audio formats: WAV, MP3, AIFF, AAC, OGG Vorbis, and FLAC. Each second of audio is represented as 32 tokens, and the maximum supported length of audio data in a single prompt is 9.5 hours.

<h2>Gemini Thinking</h2>

The Gemini API's "thinking" feature enhances reasoning and multi-step planning in Gemini 3 and 2.5 series models.

**Controlling Thinking (Gemini 3 Pro):**
```python
from google import genai
from google.genai import types
client = genai.Client()
response = client.models.generate_content(
    model="gemini-3-pro-preview",
    contents="Provide a list of 3 famous physicists and their key contributions",
    config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_level="low")
    ),
)
print(response.text)
```

## Thought Signatures

Thought signatures are encrypted representations of a model's internal thought process, used to maintain reasoning context across multi-turn interactions in the Gemini API. When a thought signature is received in a model response, it should be passed back exactly as received in the subsequent conversation turn. For Gemini 3 Pro, returning thought signatures during function calling is mandatory to avoid validation errors.

## Structured Output

The Gemini API can be configured to produce output that is guaranteed to follow a specific JSON schema.

**Python Example:**
```python
import google.generativeai as genai
from google.generativeai.client import Client
from pydantic import BaseModel, Field
from typing import List

class Recipe(BaseModel):
    """A recipe for a dish."""
    recipe_name: str = Field(description="The name of the recipe.")
    ingredients: List[str] = Field(description="A list of ingredients for the recipe.")
    instructions: List[str] = Field(description="A list of instructions for the recipe.")

client = Client()
model = client.generative_models.gemini_2_5_flash

response = model.generate_content(
    "Can you give me a recipe for chocolate chip cookies?",
    tool_config=genai.types.ToolConfig(
        function_calling_config=genai.types.FunctionCallingConfig(
            mode=genai.types.FunctionCallingConfig.Mode.ANY,
            allowed_function_names=[Recipe],
        )
    ),
)

recipe = Recipe.from_function_call(response.candidates[0].content.parts[0].function_call)
print(recipe)
```

## Long Context

Many Gemini models come with large context windows of 1 million or more tokens.
The code you already use for cases like text generation or multimodal inputs will work without any changes with long context.

### Long context use cases
-   Summarizing large corpuses of text
-   Question and answering
-   Agentic workflows
-   Many-shot in-context learning
-   Video and audio processing

### Long context optimizations
The primary optimization when working with long context is to use context caching.

## Function Calling

Function calling allows the model to interact with external tools and APIs.

### How Function Calling Works
1.  **Define Function Declaration:** Define a function's name, parameters, and purpose in your application code using a JSON schema.
2.  **Call LLM with Function Declarations:** Send the user's prompt along with the function declaration(s) to the model.
3.  **Execute Function Code:** Your application processes the model's response and executes the corresponding function.
4.  **Create User-Friendly Response:** Send the result of the function execution back to the model.

### Example Function Declaration (Python)
```python
schedule_meeting_function = {
    "name": "schedule_meeting",
    "description": "Schedules a meeting with specified attendees at a given time and date.",
    "parameters": {
        "type": "object",
        "properties": {
            "attendees": { "type": "array", "items": {"type": "string"}},
            "date": { "type": "string" },
            "time": { "type": "string" },
            "topic": { "type": "string" },
        },
        "required": ["attendees", "date", "time", "topic"],
    },
}
```

## Batch API
The Gemini Batch API processes large volumes of requests asynchronously at a reduced cost. It supports both inline requests and input files (JSONL format) for submitting jobs.

## Files API

The Gemini API's Files API allows users to upload and manage various media files. Files are stored for 48 hours.

## Media Resolution

The `media_resolution` parameter controls how media inputs are processed, balancing quality with latency and cost. Available values include `LOW`, `MEDIUM`, and `HIGH`.

## Prompting Strategies

Effective prompting is key to getting accurate model responses. Core principles include:
-   Clear and specific instructions.
-   Providing examples (few-shot prompting).
-   Adding context and breaking down complex tasks.

## Tokens

The Gemini API uses tokens to process input and output. The cost of using the API is partly determined by the number of tokens used. The API provides methods to count tokens for text and multimodal inputs.

## Advanced Topics

### Parallel Calls
For applications requiring multiple calls to the Gemini API, making parallel requests can significantly improve efficiency and reduce overall latency. This can be implemented using asynchronous programming techniques, such as Python's `asyncio` library, to send multiple requests concurrently.