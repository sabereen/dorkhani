export const ayat = [
	['بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'به نام خداوند بخشنده مهربان'],
	['الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'همه ستایش‌ها ویژه خدا، پروردگار جهانیان است'],
	['الرَّحْمَٰنِ الرَّحِيمِ', 'بخشنده و مهربان است'],
].map(([text, translation], index) => ({
	index,
	textHafs: text,
	textQPC1: text,
	textQPC2: text,
	translation,
}))

// A local, deterministic PCM response exercises the real audio controls without a CDN.
export function silentAudio() {
	const rate = 8000
	const bytes = rate * 2 * 30
	const wav = Buffer.alloc(44 + bytes)
	wav.write('RIFF', 0)
	wav.writeUInt32LE(36 + bytes, 4)
	wav.write('WAVEfmt ', 8)
	wav.writeUInt32LE(16, 16)
	wav.writeUInt16LE(1, 20)
	wav.writeUInt16LE(1, 22)
	wav.writeUInt32LE(rate, 24)
	wav.writeUInt32LE(rate * 2, 28)
	wav.writeUInt16LE(2, 32)
	wav.writeUInt16LE(16, 34)
	wav.write('data', 36)
	wav.writeUInt32LE(bytes, 40)
	return wav
}
