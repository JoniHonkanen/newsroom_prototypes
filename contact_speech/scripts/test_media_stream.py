import asyncio
import pytest
from scripts.media_simulator import simulate_conversation

@pytest.mark.asyncio
async def test_simulate_stream_runs_without_error(tmp_path):
    # Luo lyhyt hiljainen näyte
    sample = tmp_path / "silence.ulaw"
    # 1s hiljaisuutta G.711 μ-law
    from pydub import AudioSegment
    silent = AudioSegment.silent(duration=1000).set_frame_rate(8000).set_channels(1).set_sample_width(1)
    silent.export(sample, format="mulaw")

    # Aja simulaattori FastAPI:n WS-osoitteeseen (esim. stubattu local)
    # Tässä oletetaan, että testi‐ympäristössä WS-kuuntelija toimii localhost:8000
    await simulate_conversation([str(sample)], "ws://localhost:8000/media-stream")
    # jos ei heitä poikkeusta, testi läpi
