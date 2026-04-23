const axios = require('axios');
const vision = require('@google-cloud/vision');
const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const fs = require('fs');

const logControllerError = (label, error) => {
  console.error(`${label}:`, {
    message: error?.message || 'Unknown error',
    statusCode: error?.status || error?.response?.status || null,
    code: error?.code || null,
  });
};

const getGeminiApiKey = () => {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey || apiKey === 'your_gemini_api_key') {
    const error = new Error('Gemini API is not configured. Add GEMINI_API_KEY to backend/.env');
    error.status = 503;
    throw error;
  }

  return apiKey;
};

const extractGeminiText = (data) => data?.candidates?.[0]?.content?.parts
  ?.map((part) => part.text || '')
  .join('')
  .trim();

const generateGeminiText = async ({
  systemInstruction,
  userPrompt,
  temperature = 0.7,
  maxOutputTokens = 500
}) => {
  const apiKey = getGeminiApiKey();

  try {
    const { data } = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
      {
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature,
          maxOutputTokens,
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      },
      {
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const text = extractGeminiText(data);

    if (!text) {
      const error = new Error('Gemini returned an empty response');
      error.status = 502;
      throw error;
    }

    return text;
  } catch (error) {
    if (error.status) {
      throw error;
    }

    const message = error.response?.data?.error?.message || error.message || 'Gemini request failed';
    const providerError = new Error(`Gemini request failed: ${message}`);
    providerError.status = error.response?.status === 429 ? 429 : 502;
    throw providerError;
  }
};

const parseListResponse = (text, maxItems) => text
  .split('\n')
  .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
  .filter(Boolean)
  .slice(0, maxItems);

const normalizeCertificateText = (text = '') => text
  .replace(/\r/g, '\n')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{2,}/g, '\n')
  .trim();

const normalizeDateForInput = (value) => {
  if (!value) return null;

  const cleaned = value.replace(/(\d+)(st|nd|rd|th)/gi, '$1').trim();
  let parsedDate = null;

  const slashMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const [, monthOrDay, dayOrMonth, yearValue] = slashMatch;
    const year = yearValue.length === 2 ? `20${yearValue}` : yearValue;
    parsedDate = new Date(`${year}-${monthOrDay.padStart(2, '0')}-${dayOrMonth.padStart(2, '0')}`);
  } else {
    parsedDate = new Date(cleaned);
  }

  if (Number.isNaN(parsedDate?.getTime?.())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
};

const looksLikePersonName = (line) => /^[A-Z][a-z]+(?: [A-Z][a-z]+){1,3}$/.test(line);

const extractCertificateDateText = (text) => {
  const datePatterns = [
    /\b(?:issued on|date of issue|issue date|date)\s*[:\-]?\s*([A-Za-z]+ \d{1,2}, \d{4})/i,
    /\b(?:issued on|date of issue|issue date|date)\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /\b([A-Za-z]+ \d{1,2}, \d{4})\b/,
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
};

const extractCertificateCredentialId = (text) => {
  const match = text.match(
    /\b(?:credential|certificate|certification|license|registration)\s*(?:id|no\.?|number)?\s*[:#-]?\s*([A-Z0-9-]{5,})\b/i
  );

  return match ? match[1].trim() : null;
};

const extractCertificateUrl = (text) => {
  const match = text.match(/https?:\/\/[^\s<>"')]+/i);
  return match ? match[0].trim() : null;
};

const extractCertificateIssuer = (lines) => {
  const issuerPrefixes = [
    /^(?:issued by|provided by|offered by|awarded by|presented by|certified by|from)\s+/i
  ];

  for (const line of lines) {
    for (const prefix of issuerPrefixes) {
      if (prefix.test(line)) {
        return line.replace(prefix, '').trim();
      }
    }
  }

  return lines.find((line) => (
    /(academy|university|institute|school|coursera|udemy|edx|google|microsoft|amazon|aws|meta|linkedin|hubspot|oracle|ibm|cisco|charters)/i.test(line)
  )) || null;
};

const scoreCertificateTitleLine = (line) => {
  if (!line) return -1000;
  if (/https?:\/\//i.test(line)) return -1000;
  if (/\b(?:issued by|date|credential|certificate id|license|verify|expires?|awarded to|presented to)\b/i.test(line)) return -1000;
  if (/^(?:certificate|certificate of completion|certificate of achievement|this certifies that)$/i.test(line)) return -1000;

  let score = 0;
  const wordCount = line.split(/\s+/).filter(Boolean).length;

  if (wordCount >= 2 && wordCount <= 10) score += 4;
  if (line.length >= 10 && line.length <= 90) score += 3;
  if (looksLikePersonName(line)) score -= 5;
  if (/(professional|engineer|management|product|growth|architect|analyst|marketing|development|leadership|data|science|cloud|business|design|python|react|certificate|certification|course|program)/i.test(line)) {
    score += 5;
  }

  return score;
};

const extractCertificateTitle = (text, lines) => {
  const textPatterns = [
    /(?:has successfully completed|has completed|successfully completed|for completing|completion of|certified in|completed the course|completed the program)\s+([A-Za-z0-9&(),.+/' -]{4,120})/i,
    /(?:certificate of completion in|certificate in|certificate for)\s+([A-Za-z0-9&(),.+/' -]{4,120})/i
  ];

  for (const pattern of textPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  const candidates = lines
    .slice(0, 14)
    .map((line) => ({ line, score: scoreCertificateTitleLine(line) }))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.score > 0 ? candidates[0].line : null;
};

const buildCertificateInfo = (rawText) => {
  const fullText = normalizeCertificateText(rawText);
  const lines = fullText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const issueDateText = extractCertificateDateText(fullText);

  return {
    fullText,
    title: extractCertificateTitle(fullText, lines),
    issuer: extractCertificateIssuer(lines),
    issueDate: normalizeDateForInput(issueDateText),
    issueDateText: issueDateText || null,
    credentialId: extractCertificateCredentialId(fullText),
    credentialUrl: extractCertificateUrl(fullText)
  };
};

// @desc    Improve LinkedIn headline using AI
// @route   POST /api/ai-services/improve-headline
// @access  Private
exports.improveHeadline = async (req, res, next) => {
  try {
    const { currentHeadline, targetRole } = req.body;

    if (!currentHeadline) {
      return res.status(400).json({
        success: false,
        message: 'Current headline is required'
      });
    }

    const responseText = await generateGeminiText({
      systemInstruction: 'You are a professional career advisor. Improve LinkedIn headlines so they are impactful, professional, and under 120 characters.',
      userPrompt: `Current headline: "${currentHeadline}"\n${targetRole ? `Target role: ${targetRole}\n` : ''}Return exactly 3 improved headline options, one per line, with no numbering or extra commentary.`,
      temperature: 0.7,
      maxOutputTokens: 220
    });

    const suggestions = parseListResponse(responseText, 3);

    res.status(200).json({
      success: true,
      suggestions
    });
  } catch (error) {
    logControllerError('Gemini Error', error);
    next(error);
  }
};

// @desc    Improve LinkedIn about section using AI
// @route   POST /api/ai-services/improve-about
// @access  Private
exports.improveAboutSection = async (req, res, next) => {
  try {
    const { currentAbout, targetRole, skills } = req.body;

    if (!currentAbout) {
      return res.status(400).json({
        success: false,
        message: 'Current about section is required'
      });
    }

    const improvedAbout = await generateGeminiText({
      systemInstruction: 'You are a professional career advisor. Rewrite LinkedIn About sections so they sound compelling, professional, achievement-focused, and concise.',
      userPrompt: `Rewrite this LinkedIn About section.\n\nCurrent About:\n${currentAbout}\n\n${targetRole ? `Target role: ${targetRole}\n` : ''}${skills ? `Key skills: ${skills.join(', ')}\n` : ''}Return only the improved About section, under 300 words.`,
      temperature: 0.7,
      maxOutputTokens: 500
    });

    res.status(200).json({
      success: true,
      improvedAbout
    });
  } catch (error) {
    logControllerError('Gemini Error', error);
    next(error);
  }
};

// @desc    Analyze profile picture quality
// @route   POST /api/ai-services/analyze-profile-picture
// @access  Private
exports.analyzeProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture is required'
      });
    }

    // Use Google Vision API if available
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const client = new vision.ImageAnnotatorClient();
      
      const [result] = await client.faceDetection(req.file.path);
      const faces = result.faceAnnotations;

      if (!faces || faces.length === 0) {
        return res.status(200).json({
          success: true,
          analysis: {
            hasFace: false,
            isProfessional: false,
            qualityScore: 0,
            suggestions: ['No face detected. Please upload a clear profile picture with your face visible.']
          }
        });
      }

      const face = faces[0];

      // Analyze face attributes
      const analysis = {
        hasFace: true,
        isProfessional: face.detectionConfidence > 0.8,
        qualityScore: Math.round(face.detectionConfidence * 100),
        hasGoodLighting: face.underExposedLikelihood === 'VERY_UNLIKELY' && face.blurredLikelihood === 'VERY_UNLIKELY',
        isSmiling: face.joyLikelihood === 'LIKELY' || face.joyLikelihood === 'VERY_LIKELY',
        suggestions: []
      };

      // Generate suggestions
      if (face.blurredLikelihood !== 'VERY_UNLIKELY') {
        analysis.suggestions.push('Image appears blurry. Use a higher quality photo.');
      }
      if (face.underExposedLikelihood !== 'VERY_UNLIKELY') {
        analysis.suggestions.push('Improve lighting. Take photo in natural light or well-lit area.');
      }
      if (face.joyLikelihood === 'UNLIKELY' || face.joyLikelihood === 'VERY_UNLIKELY') {
        analysis.suggestions.push('A friendly smile makes your profile more approachable.');
      }
      if (analysis.qualityScore < 70) {
        analysis.suggestions.push('Consider taking a new professional photo.');
      }

      res.status(200).json({
        success: true,
        analysis
      });
    } else {
      // Fallback: Basic analysis without Google Vision
      res.status(200).json({
        success: true,
        analysis: {
          hasFace: true,
          isProfessional: true,
          qualityScore: 75,
          suggestions: ['Profile picture uploaded successfully. For detailed analysis, configure Google Vision API.']
        }
      });
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
  } catch (error) {
    logControllerError('Vision API Error', error);
    next(error);
  }
};

// @desc    Extract text from certificate using OCR
// @route   POST /api/ai-services/extract-certificate-text
// @access  Private
exports.extractCertificateText = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Certificate file is required'
      });
    }

    const isPdf = req.file.mimetype === 'application/pdf' || /\.pdf$/i.test(req.file.originalname);
    let text = '';

    if (isPdf) {
      try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const parsedPdf = await pdf(dataBuffer);
        text = parsedPdf.text || '';
      } catch (pdfError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to read the certificate PDF. Make sure it is a valid, text-based PDF.'
        });
      }
    } else {
      const result = await Tesseract.recognize(
        req.file.path,
        'eng',
        {
          logger: (message) => console.log(message)
        }
      );
      text = result?.data?.text || '';
    }

    if (!text.trim()) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract readable text from the uploaded certificate.'
      });
    }

    const extractedInfo = buildCertificateInfo(text);

    res.status(200).json({
      success: true,
      extractedInfo
    });
  } catch (error) {
    logControllerError('OCR Error', error);
    next(error);
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};

// @desc    Parse resume and extract skills
// @route   POST /api/ai-services/parse-resume
// @access  Private
exports.parseResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resume file is required' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF resumes are supported'
      });
    }

    const filePath = req.file.path;
    let resumeText = '';

    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      resumeText = data.text;
    } catch (pdfError) {
      console.error('PDF parse error:', pdfError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to read PDF. Make sure the file is a valid, text-based PDF.'
      });
    }

    try {
      const nlpResponse = await axios.post(
        `${process.env.PYTHON_NLP_SERVICE_URL || 'http://localhost:8000'}/parse-resume`,
        { text: resumeText },
        { timeout: 15000 }
      );
      const parsedData = nlpResponse.data?.parsed_data || nlpResponse.data?.parsedData || nlpResponse.data;

      return res.status(200).json({
        success: true,
        parsedData
      });
    } catch (nlpError) {
      console.warn('Python NLP service unavailable, using fallback parser');

      const commonSkills = [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Ruby', 'TypeScript',
        'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask',
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'AWS', 'Azure', 'GCP',
        'Docker', 'Kubernetes', 'Git', 'HTML', 'CSS', 'REST', 'GraphQL',
        'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch',
        'Leadership', 'Communication', 'Teamwork', 'Agile', 'Scrum'
      ];

      const foundSkills = commonSkills.filter((skill) =>
        resumeText.toLowerCase().includes(skill.toLowerCase())
      );
      const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i);
      const phoneMatch = resumeText.match(/(\+?\d[\d\s\-().]{7,}\d)/);
      const wordCount = resumeText.split(/\s+/).filter(Boolean).length;

      return res.status(200).json({
        success: true,
        parsedData: {
          skills: { general: foundSkills },
          contact_info: {
            email: emailMatch ? emailMatch[0] : null,
            phone: phoneMatch ? phoneMatch[0] : null
          },
          experience: [],
          education: [],
          total_skills_count: foundSkills.length,
          word_count: wordCount,
          named_entities: {},
          resume_score: {
            score: foundSkills.length >= 10 ? 75 : foundSkills.length >= 5 ? 55 : 35,
            grade: foundSkills.length >= 10 ? 'B' : foundSkills.length >= 5 ? 'C' : 'D',
            feedback: [
              ...(foundSkills.length < 10 ? ['Add more specific technical skills to your resume.'] : []),
              ...(!emailMatch ? ['Add your email address to your resume.'] : []),
              'Python NLP service is unavailable, so this is a basic fallback parse.'
            ]
          },
          raw_text: resumeText
        }
      });
    }
  } catch (error) {
    logControllerError('Resume parsing error', error);
    next(error);
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};

// @desc    Generate personalized suggestions
// @route   POST /api/ai-services/generate-suggestions
// @access  Private
exports.generatePersonalizedSuggestions = async (req, res, next) => {
  try {
    const { profileData, currentScore, targetScore, targetRole } = req.body;

    const responseText = await generateGeminiText({
      systemInstruction: 'You are a career development advisor. Generate specific, actionable suggestions that help candidates improve their profile branding score. Each suggestion should be concrete and achievable.',
      userPrompt: `Current profile score: ${currentScore}/100
Target score: ${targetScore || 'Not specified'}
Target role: ${targetRole || 'Not specified'}

Profile summary:
- Personal website: ${profileData.hasWebsite ? 'Yes' : 'No'}
- LinkedIn optimized: ${profileData.linkedInOptimized ? 'Yes' : 'No'}
- GitHub active: ${profileData.githubActive ? 'Yes' : 'No'}
- Certifications: ${profileData.certificationCount || 0}
- Publications: ${profileData.publicationCount || 0}

Generate exactly 5 prioritized suggestions, one per line, with no numbering or extra commentary.`,
      temperature: 0.7,
      maxOutputTokens: 400
    });

    const suggestions = parseListResponse(responseText, 5);

    res.status(200).json({
      success: true,
      suggestions
    });
  } catch (error) {
    logControllerError('Gemini Error', error);
    next(error);
  }
};

// @desc    Check grammar in text
// @route   POST /api/ai-services/check-grammar
// @access  Private
exports.checkGrammar = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    // Using LanguageTool API (free tier)
    const response = await axios.post('https://api.languagetoolplus.com/v2/check', null, {
      params: {
        text: text,
        language: 'en-US'
      }
    });

    const errors = response.data.matches.map(match => ({
      message: match.message,
      offset: match.offset,
      length: match.length,
      replacements: match.replacements.slice(0, 3).map(r => r.value),
      context: match.context.text
    }));

    res.status(200).json({
      success: true,
      errors,
      errorCount: errors.length
    });
  } catch (error) {
    logControllerError('Grammar check error', error);
    // Fallback: return no errors if service fails
    res.status(200).json({
      success: true,
      errors: [],
      errorCount: 0,
      message: 'Grammar check service temporarily unavailable'
    });
  }
};
