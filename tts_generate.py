import sys
import asyncio
import edge_tts

async def main():
    if len(sys.argv) < 3:
        sys.exit(1)
    voice = sys.argv[1]
    output_path = sys.argv[2]
    rate = sys.argv[3] if len(sys.argv) > 3 else "+2%"
    pitch = sys.argv[4] if len(sys.argv) > 4 else "-2Hz"

    # Read text from stdin (UTF-8)
    text = sys.stdin.read().strip()
    if not text:
        sys.exit(1)

    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(output_path)

if __name__ == '__main__':
    asyncio.run(main())
