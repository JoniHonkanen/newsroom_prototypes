from openai import OpenAI
import base64

client = OpenAI()


def generate_image(prompt) -> str:

    print("Generating image...")

    if not prompt:
        prompt = "Bengal cat in mountains"

    result = client.images.generate(
        model="dall-e-2", prompt=prompt, size="256x256", response_format="b64_json"
    )

    image_base64 = result.data[0].b64_json

    return image_base64


if __name__ == "__main__":
    generate_image()
