import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GLM_SERMONS,
  searchSermons,
  getSermonWhatsAppShareUrl
} from './sermonService';

test('GLM_SERMONS contains verified Knowing God sermon from t.me/glmchannel', () => {
  assert.equal(GLM_SERMONS.length, 1);
  const sermon = GLM_SERMONS[0];
  assert.equal(sermon.id, 'glm-sermon-1331');
  assert.equal(sermon.title, 'Knowing God');
  assert.equal(sermon.speaker, 'Apostle Joseph Ibrahim');
  assert.equal(sermon.telegramPostUrl, 'https://t.me/glmchannel/1331');
  assert.equal(sermon.audioUrl, '/assets/aistudio/Knowing_God_2babf39d.mp3');
  assert.equal(sermon.audioFileName, 'Knowing_God_Apostle_Joseph_Ibrahim.mp3');
});

test('searchSermons finds Knowing God by title, speaker, and tags', () => {
  const byTitle = searchSermons(GLM_SERMONS, 'Knowing God', 'All');
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0].title, 'Knowing God');

  const bySpeaker = searchSermons(GLM_SERMONS, 'Apostle Joseph', 'All');
  assert.equal(bySpeaker.length, 1);

  const nonMatching = searchSermons(GLM_SERMONS, 'NonExistentTitleXYZ', 'All');
  assert.equal(nonMatching.length, 0);
});

test('getSermonWhatsAppShareUrl formats valid WhatsApp share url with verified Telegram post', () => {
  const sermon = GLM_SERMONS[0];
  const url = getSermonWhatsAppShareUrl(sermon);
  assert.ok(url.startsWith('https://wa.me/?text='));
  assert.ok(url.includes(encodeURIComponent('Gospel Labour Ministry (GLM) Sermon')));
  assert.ok(url.includes(encodeURIComponent('https://t.me/glmchannel/1331')));
  assert.ok(url.includes(encodeURIComponent('May you be blessed and transformed as you listen!')));
});

test('GLM_CHANNEL_MESSAGES holds strictly 6 verified messages in requested order', async () => {
  const { GLM_CHANNEL_MESSAGES, getTelegramWhatsAppMessage, getTelegramPostUrl } = await import('./sermonService');
  assert.equal(GLM_CHANNEL_MESSAGES.length, 6);

  assert.deepEqual(
    GLM_CHANNEL_MESSAGES.map((m) => ({ title: m.title, postNumber: m.postNumber })),
    [
      { title: 'No Darkness at All', postNumber: 1737 },
      { title: 'Born Again', postNumber: 1426 },
      { title: "Sin and God's Love", postNumber: 294 },
      { title: 'New Foundation', postNumber: 956 },
      { title: 'Rebirth', postNumber: 1184 },
      { title: 'Knowing God', postNumber: 1331 }
    ]
  );

  const msgText = getTelegramWhatsAppMessage(1737);
  assert.equal(
    msgText,
    '🎧 Gospel Labour Ministry (GLM) Sermon\n\n🔗 Listen to the sermon on Telegram:\nhttps://t.me/glmchannel/1737\n\nMay you be blessed and transformed as you listen!'
  );
  assert.equal(getTelegramPostUrl(1737), 'https://t.me/glmchannel/1737');
});

test('GLM_MESSAGES_LIST in SermonSharing contains strictly 6 verified messages in requested order', async () => {
  const { GLM_MESSAGES_LIST } = await import('../components/SermonSharing');
  assert.equal(GLM_MESSAGES_LIST.length, 6);
  assert.deepEqual(GLM_MESSAGES_LIST, [
    { title: 'No Darkness at All', number: 1737 },
    { title: 'Born Again', number: 1426 },
    { title: "Sin and God's Love", number: 294 },
    { title: 'New Foundation', number: 956 },
    { title: 'Rebirth', number: 1184 },
    { title: 'Knowing God', number: 1331 }
  ]);
});

test('shareAudioFileDirect returns unsupported when navigator.share is absent', async () => {
  const { shareAudioFileDirect } = await import('./sermonService');
  const dummyFile = new File(['dummy audio content'], 'Knowing_God.mp3', { type: 'audio/mpeg' });
  const result = await shareAudioFileDirect(dummyFile);
  assert.equal(result.success, false);
  assert.equal(result.unsupported, true);
});

test('shareAudioFileDirect packages file as application/octet-stream document and handles user cancellation', async () => {
  const { shareAudioFileDirect } = await import('./sermonService');
  let capturedSharedFiles: File[] = [];

  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  try {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        canShare: (_data: { files?: File[] }) => true,
        share: async (data: { files?: File[] }) => {
          capturedSharedFiles = data.files || [];
          const err = new Error('The share operation was canceled');
          err.name = 'AbortError';
          throw err;
        }
      },
      configurable: true,
      writable: true
    });

    const dummyFile = new File(['audio content'], 'Knowing_God.mp3', { type: 'audio/mpeg' });
    const result = await shareAudioFileDirect(dummyFile);

    assert.equal(result.success, false);
    assert.equal(result.cancelled, true);
    assert.equal(capturedSharedFiles.length, 1);
    assert.equal(capturedSharedFiles[0].name, 'Knowing_God.mp3');
    assert.equal(capturedSharedFiles[0].type, 'application/octet-stream');
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'navigator', originalDescriptor);
    }
  }
});

