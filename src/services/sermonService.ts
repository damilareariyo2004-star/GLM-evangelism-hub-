import { Sermon } from '../types';
import { formatWhatsAppNumber } from '../utils/phoneUtils';

/**
 * Genuine Gospel Labour Ministry (GLM) Telegram Message Library
 * Structured data model supporting title, series, minister, scripture, duration, description, channelUrl, and postUrl.
 */
export const GLM_SERMONS: Sermon[] = [
  {
    id: 'glm-sermon-1331',
    title: 'Knowing God',
    series: 'Knowing God Series',
    minister: 'Apostle Joseph Ibrahim',
    speaker: 'Apostle Joseph Ibrahim', // alias
    date: '2024-03-20',
    scripture: 'Daniel 11:32, Philippians 3:10, John 17:3',
    duration: '1:29:59',
    durationFormatted: '1:29:59',
    description: 'An anointed message on knowing God intimately in fellowship, truth, and power.',
    channelUrl: 'https://t.me/glmchannel',
    postUrl: 'https://t.me/glmchannel/1331',
    telegramPostUrl: 'https://t.me/glmchannel/1331',
    audioUrl: '/assets/aistudio/Knowing_God_2babf39d.mp3',
    audioFileName: 'Knowing_God_Apostle_Joseph_Ibrahim.mp3',
    audioSizeFormatted: '35.8 MB',
    tags: ['Knowing God', 'Apostle Joseph Ibrahim', 'Spiritual Growth', 'Word']
  }
];

export const SERMON_CATEGORIES = [
  'All',
  'Knowing God',
  'Spiritual Growth',
  'Word'
] as const;

export type SermonCategory = (typeof SERMON_CATEGORIES)[number];

/**
 * Searches and filters sermons in the library
 */
export function searchSermons(
  sermons: Sermon[],
  query: string,
  category: SermonCategory = 'All'
): Sermon[] {
  const q = query.trim().toLowerCase();

  return sermons.filter((sermon) => {
    // Category check
    if (category !== 'All') {
      const hasCategoryTag = sermon.tags.some(
        (t) => t.toLowerCase() === category.toLowerCase()
      );
      if (!hasCategoryTag) return false;
    }

    if (!q) return true;

    // Search query check
    const matchesTitle = sermon.title.toLowerCase().includes(q);
    const matchesMinister = (sermon.minister || sermon.speaker || '').toLowerCase().includes(q);
    const matchesSeries = sermon.series?.toLowerCase().includes(q) ?? false;
    const matchesScripture = sermon.scripture?.toLowerCase().includes(q) ?? false;
    const matchesDesc = sermon.description.toLowerCase().includes(q);
    const matchesTags = sermon.tags.some((t) => t.toLowerCase().includes(q));

    return (
      matchesTitle ||
      matchesMinister ||
      matchesSeries ||
      matchesScripture ||
      matchesDesc ||
      matchesTags
    );
  });
}

/**
 * Builds the exact prefilled WhatsApp sermon message text for the Telegram Message Library
 */
export function getSermonTelegramWhatsAppMessage(sermon: Sermon): string {
  const ministerName = sermon.minister || sermon.speaker || 'Apostle Joseph Ibrahim';
  const durationText = sermon.duration || sermon.durationFormatted || '1:29:59';
  const postUrl = sermon.postUrl || sermon.telegramPostUrl || 'https://t.me/glmchannel/1331';

  const parts: string[] = [
    '🎧 Gospel Labour Ministry (GLM) Sermon',
    '',
    `📖 Title: ${sermon.title}`
  ];

  if (sermon.series) {
    parts.push(`📚 Series: ${sermon.series}`);
  }
  parts.push(`👤 Minister: ${ministerName}`);
  if (sermon.scripture) {
    parts.push(`📜 Scripture: ${sermon.scripture}`);
  }
  parts.push(`⏱ Duration: ${durationText}`);
  parts.push('');
  parts.push(sermon.description);
  parts.push('');
  parts.push('🔗 Listen to the sermon on Telegram:');
  parts.push(postUrl);
  parts.push('');
  parts.push('May you be blessed and transformed as you listen!');

  return parts.join('\n');
}

/**
 * Creates pre-formatted WhatsApp share link for a sermon from the Telegram Library
 */
export function getSermonWhatsAppShareUrl(
  sermon: Sermon,
  targetPhone?: string
): string {
  const text = getSermonTelegramWhatsAppMessage(sermon);
  const encodedText = encodeURIComponent(text);

  if (targetPhone) {
    const formatted = formatWhatsAppNumber(targetPhone);
    return `https://wa.me/${formatted}?text=${encodedText}`;
  }

  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Downloads audio file to user's device
 */
export async function downloadSermonAudio(sermon: Sermon): Promise<void> {
  if (!sermon.audioUrl) {
    throw new Error('No audio URL available for this sermon.');
  }

  const filename = sermon.audioFileName || `${sermon.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;

  // Direct element trigger - works without buffering entire 36MB in memory
  const a = document.createElement('a');
  a.href = sermon.audioUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Shares an MP3 file directly via the Web Share API configured specifically
 * as a DOCUMENT attachment (application/octet-stream) so that mobile operating systems
 * and WhatsApp permit files up to WhatsApp's 2 GB document limit, bypassing
 * WhatsApp's strict 16 MB cap on ordinary audio/media.
 * 
 * CRITICAL: This is invoked directly inside a user button-click handler
 * without an intervening network fetch, guaranteeing the browser's transient user
 * gesture activation is fresh and valid.
 */
export async function shareAudioFileDirect(
  file: File,
  title = 'Knowing God - Apostle Joseph Ibrahim',
  text = 'Gospel Labour Ministry Sermon: Knowing God by Apostle Joseph Ibrahim\nTelegram: https://t.me/glmchannel/1331'
): Promise<{ success: boolean; cancelled?: boolean; error?: string; unsupported?: boolean }> {
  if (typeof navigator === 'undefined' || !('share' in navigator)) {
    return { success: false, unsupported: true };
  }

  // To ensure WhatsApp and mobile OS route this 35.8 MB MP3 as a DOCUMENT attachment
  // (which allows up to 2 GB) rather than ordinary audio/media (which WhatsApp strictly blocks at 16 MB),
  // we prepare a document-typed File object (application/octet-stream) while preserving the .mp3 filename.
  let fileToShare = file;
  try {
    const safeName = file.name.endsWith('.mp3') ? file.name : `${file.name}.mp3`;
    const docFile = new File([file], safeName, {
      type: 'application/octet-stream',
      lastModified: file.lastModified || Date.now()
    });
    if ('canShare' in navigator && navigator.canShare({ files: [docFile] })) {
      fileToShare = docFile;
    }
  } catch {
    // Proceed with the original file if File constructor fails
  }

  // Check if browser can share files
  if ('canShare' in navigator && !navigator.canShare({ files: [fileToShare] })) {
    return { success: false, unsupported: true };
  }

  try {
    await navigator.share({
      title,
      text,
      files: [fileToShare]
    });
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorName = err instanceof Error ? err.name : '';
    if (
      errorName === 'AbortError' ||
      errorMsg.includes('AbortError') ||
      errorMsg.toLowerCase().includes('cancel')
    ) {
      // User closed the share sheet without completing the send - do NOT claim success
      return { success: false, cancelled: true };
    }
    if (
      errorName === 'NotAllowedError' ||
      errorName === 'SecurityError' ||
      errorMsg.toLowerCase().includes('permission') ||
      errorMsg.toLowerCase().includes('not allowed')
    ) {
      return {
        success: false,
        error:
          'Device or browser permission was not granted for direct file sharing. Please use the WhatsApp Attach → Document fallback.'
      };
    }
    return { success: false, error: errorMsg };
  }
}
