import sys
import asyncio
import edge_tts

def clean_param(val, default_suffix, default_val):
    if not val:
        return default_val
    v = str(val).strip()
    if not v.endswith(default_suffix):
        v += default_suffix
    if not (v.startswith('+') or v.startswith('-')):
        v = '+' + v
    return v

async def main():
    if len(sys.argv) < 3:
        sys.exit(1)

    voice = sys.argv[1].strip() if sys.argv[1] and sys.argv[1].strip() else "pt-BR-ThalitaMultilingualNeural"
    output_path = sys.argv[2]
    raw_rate = sys.argv[3] if len(sys.argv) > 3 else "+0%"
    raw_pitch = sys.argv[4] if len(sys.argv) > 4 else "+0Hz"

    rate = clean_param(raw_rate, '%', '+0%')
    pitch = clean_param(raw_pitch, 'Hz', '+0Hz')

    # Read text from stdin (UTF-8)
    text = sys.stdin.read().strip()
    if not text:
        sys.exit(1)

    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(output_path)

if __name__ == '__main__':
    asyncio.run(main())
