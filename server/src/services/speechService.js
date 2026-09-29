import { v2 } from '@google-cloud/speech';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let client;

const speechCodes = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Tamil: 'ta-IN',
  Bengali: 'bn-IN',
  Marathi: 'mr-IN',
  Telugu: 'te-IN'
};

function getClient() {
  if (!client) {
    client = new v2.SpeechClient({
      projectId: config.googleCloudProjectId || undefined
    });
  }
  return client;
}

function buildRecognitionConfig(language = 'auto') {
  if (language === 'auto') {
    return {
      autoDecodingConfig: {},
      languageCodes: ['auto'],
      model: 'chirp_3',
      features: {
        enableAutomaticPunctuation: true
      }
    };
  }

  return {
    autoDecodingConfig: {},
    languageCodes: [speechCodes[language] || 'en-IN'],
    model: 'short',
    features: {
      enableAutomaticPunctuation: true
    }
  };
}

export async function transcribeAudio(
  buffer,
  { mimeType = '', language = 'auto' } = {}
) {
  if (!config.googleCloudProjectId) {
    throw new Error(
      'Google Cloud Speech-to-Text V2 is not configured. Set GOOGLE_CLOUD_PROJECT_ID and Google Application Default Credentials.'
    );
  }

  const location =
    language === 'auto'
      ? (process.env.GOOGLE_SPEECH_AUTO_LOCATION || 'us')
      : (process.env.GOOGLE_SPEECH_LOCATION || 'global');

  const recognizer =
    `projects/${config.googleCloudProjectId}/locations/${location}/recognizers/_`;

  try {
    const [response] = await getClient().recognize(
      {
        recognizer,
        config: buildRecognitionConfig(language),
        content: buffer
      },
      {
        otherArgs: {
          headers: {
            'x-goog-request-params': `recognizer=${encodeURIComponent(recognizer)}`
          }
        }
      }
    );

    const transcript = (response.results || [])
      .map(result => result.alternatives?.[0]?.transcript || '')
      .join(' ')
      .trim();

    if (!transcript) {
      throw new Error('No speech could be recognized in the recording.');
    }

    const detectedLanguage =
      response.results?.find(result => result.languageCode)?.languageCode || null;

    logger.info('Speech-to-Text V2 transcription complete', {
      mimeType,
      requestedLanguage: language,
      detectedLanguage,
      location
    });

    return transcript;
  } catch (error) {
    logger.error('Speech-to-Text V2 failed', {
      message: error.message,
      mimeType,
      language,
      location
    });

    throw new Error(`Speech transcription failed: ${error.message}`);
  }
}
