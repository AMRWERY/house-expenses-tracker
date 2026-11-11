// A random Ayah from the public Al Quran Cloud API (https://api.alquran.cloud/v1, no key needed).
const API = 'https://api.alquran.cloud/v1'
const TOTAL_AYAHS = 6236
const ARABIC = 'quran-simple'
const ENGLISH = 'en.sahih'
const RECITER = 'ar.abdulbasitmurattal' // عبد الباسط عبد الصمد (مرتل), verse-by-verse audio

interface ApiAyah {
  text: string
  audio?: string
  edition: { identifier: string }
  numberInSurah: number
  surah: { name: string, englishName: string }
}

export interface RandomAyah {
  arabic: string
  /** MP3 recitation of this Ayah */
  audio?: string
  translation?: string
  numberInSurah: number
  surahName: string
  surahEnglishName: string
}

/** One random Ayah in Arabic, plus the English translation when `withTranslation` is set. */
export async function fetchRandomAyah(withTranslation: boolean): Promise<RandomAyah> {
  const number = Math.floor(Math.random() * TOTAL_AYAHS) + 1
  const editions = withTranslation ? `${ARABIC},${RECITER},${ENGLISH}` : `${ARABIC},${RECITER}`
  const res = await $fetch<{ data: ApiAyah[] }>(`${API}/ayah/${number}/editions/${editions}`, {
    timeout: 5000,
  })
  const arabic = res.data.find(e => e.edition.identifier === ARABIC)
  if (!arabic) throw createError({ statusCode: 502, statusMessage: 'ayah_unavailable' })
  return {
    arabic: arabic.text,
    audio: res.data.find(e => e.edition.identifier === RECITER)?.audio,
    translation: res.data.find(e => e.edition.identifier === ENGLISH)?.text,
    numberInSurah: arabic.numberInSurah,
    surahName: arabic.surah.name,
    surahEnglishName: arabic.surah.englishName,
  }
}
