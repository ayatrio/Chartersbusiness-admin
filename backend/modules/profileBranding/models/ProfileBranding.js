const mongoose = require('mongoose');

const profileBrandingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Personal Website
  personalWebsite: {
    url: {
      type: String,
      default: null
    },
    hasAboutPage: {
      type: Boolean,
      default: false
    },
    hasPortfolio: {
      type: Boolean,
      default: false
    },
    hasBlog: {
      type: Boolean,
      default: false
    },
    hasContactPage: {
      type: Boolean,
      default: false
    },
    blogPostCount: {
      type: Number,
      default: 0
    },
    lastVerified: {
      type: Date,
      default: null
    },
    lighthouseScore: {
      performance: { type: Number, default: 0 },
      accessibility: { type: Number, default: 0 },
      bestPractices: { type: Number, default: 0 },
      seo: { type: Number, default: 0 }
    },
    score: {
      type: Number,
      default: 0
    }
  },
  
  // LinkedIn Profile
  linkedIn: {
    name: {
      type: String,
      default: null
    },
    profileUrl: {
      type: String,
      default: null
    },
    location: {
      type: String,
      default: null
    },
    headline: {
      type: String,
      default: null
    },
    about: {
      type: String,
      default: null
    },
    profilePictureUrl: {
      type: String,
      default: null
    },
    
    // Structured data with source tracking
    skills: [{
      name: String,
      source: {
        type: String,
        enum: ['auto', 'user'],
        default: 'user'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    experiences: [{
      title: String,
      company: String,
      startDate: Date,
      endDate: Date,
      isCurrent: Boolean,
      description: String,
      source: {
        type: String,
        enum: ['auto', 'user'],
        default: 'user'
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    education: [{
      school: String,
      degree: String,
      source: {
        type: String,
        enum: ['auto', 'user'],
        default: 'user'
      }
    }],
    
    certifications: [{
      title: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      noExpiry: Boolean,
      credentialId: String,
      credentialUrl: String,
      source: {
        type: String,
        enum: ['auto', 'user'],
        default: 'user'
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Counts (derived from arrays)
    skillsCount: {
      type: Number,
      default: 0
    },
    experienceCount: {
      type: Number,
      default: 0
    },
    educationCount: {
      type: Number,
      default: 0
    },
    certificationsCount: {
      type: Number,
      default: 0
    },
    connectionsCount: {
      type: Number,
      default: 0
    },
    endorsementsCount: {
      type: Number,
      default: 0
    },
    recommendationsCount: {
      type: Number,
      default: 0
    },
    
    // Legacy fields (for backwards compatibility)
    topSkills: [{
      type: String
    }],
    hasProfilePicture: {
      type: Boolean,
      default: false
    },
    hasHeadline: {
      type: Boolean,
      default: false
    },
    aboutSection: {
      type: String,
      default: null
    },
    aboutSectionLength: {
      type: Number,
      default: 0
    },
    
    lastUpdated: {
      type: Date,
      default: null
    },
    score: {
      type: Number,
      default: 0
    }
  },
  
  // GitHub Profile
  github: {
    username: {
      type: String,
      default: null
    },
    profileUrl: {
      type: String,
      default: null
    },
    repositoriesCount: {
      type: Number,
      default: 0
    },
    publicRepos: {
      type: Number,
      default: 0
    },
    contributionsLastYear: {
      type: Number,
      default: 0
    },
    followers: {
      type: Number,
      default: 0
    },
    following: {
      type: Number,
      default: 0
    },
    hasReadme: {
      type: Boolean,
      default: false
    },
    topLanguages: [{
      language: String,
      percentage: Number
    }],
    lastFetched: {
      type: Date,
      default: null
    },
    score: {
      type: Number,
      default: 0
    }
  },
  
  // Other Professional Profiles
  otherProfiles: {
    twitter: {
      type: String,
      default: null
    },
    youtube: {
      type: String,
      default: null
    },
    medium: {
      type: String,
      default: null
    },
    devTo: {
      type: String,
      default: null
    },
    behance: {
      type: String,
      default: null
    },
    dribbble: {
      type: String,
      default: null
    }
  },

  // YouTube Channel Analysis
  youtube: {
    channelUrl: {
      type: String,
      default: null
    },
    videosPageUrl: {
      type: String,
      default: null
    },
    channelName: {
      type: String,
      default: null
    },
    selectedCourse: {
      type: String,
      default: null
    },
    totalVideos: {
      type: Number,
      default: 0
    },
    relevantVideoCount: {
      type: Number,
      default: 0
    },
    averageLengthSeconds: {
      type: Number,
      default: 0
    },
    averageRelevanceScore: {
      type: Number,
      default: 0
    },
    metrics: {
      titleRelevance: {
        type: Number,
        default: 0
      },
      videoLength: {
        type: Number,
        default: 0
      },
      videoCount: {
        type: Number,
        default: 0
      },
      overall: {
        type: Number,
        default: 0
      },
      thoughtLeadershipBonus: {
        type: Number,
        default: 0
      }
    },
    videos: [{
      title: String,
      url: String,
      lengthText: String,
      lengthSeconds: Number,
      relevanceScore: Number,
      relevanceLabel: String,
      matchedKeywords: [String]
    }],
    lastScraped: {
      type: Date,
      default: null
    },
    score: {
      type: Number,
      default: 0
    }
  },
  
  // Networking Metrics
  networking: {
    platform: {
      type: String,
      default: 'Twitter / X'
    },
    profileUrl: {
      type: String,
      default: null
    },
    followersCount: {
      type: Number,
      default: 0
    },
    groupsJoined: {
      type: Number,
      default: 0
    },
    postsLast60Days: {
      type: Number,
      default: 0
    },
    longFormArticles: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    },
    // Legacy aliases kept for backwards compatibility with older saved profiles.
    connectionsCount: {
      type: Number,
      default: 0
    },
    postsShared: {
      type: Number,
      default: 0
    },
    articlesPublished: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0
    }
  },
  
  // Certifications
  certifications: [{
    title: {
      type: String,
      required: true
    },
    issuer: {
      type: String,
      required: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      default: null
    },
    credentialId: {
      type: String,
      default: null
    },
    credentialUrl: {
      type: String,
      default: null
    },
    imageUrl: {
      type: String,
      default: null
    },
    verified: {
      type: Boolean,
      default: false
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Online Courses
  courses: [{
    title: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      required: true
    },
    instructor: {
      type: String,
      default: null
    },
    completionDate: {
      type: Date,
      required: true
    },
    certificateUrl: {
      type: String,
      default: null
    },
    skills: [{
      type: String
    }],
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Publications
  publications: [{
    title: {
      type: String,
      required: true
    },
    publicationType: {
      type: String,
      enum: ['article', 'research', 'blog', 'case-study'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publishDate: {
      type: Date,
      required: true
    },
    platform: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: null
    },
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Resume/CV Data
  resume: {
    fileUrl: {
      type: String,
      default: null
    },
    uploadedAt: {
      type: Date,
      default: null
    },
    extractedSkills: [{
      type: String
    }],
    extractedExperience: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      description: String
    }],
    extractedEducation: [{
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date
    }]
  },
  
  // Profile Picture Analysis
  profilePicture: {
    url: {
      type: String,
      default: null
    },
    isProfessional: {
      type: Boolean,
      default: false
    },
    qualityScore: {
      type: Number,
      default: 0
    },
    hasGoodLighting: {
      type: Boolean,
      default: false
    },
    hasFace: {
      type: Boolean,
      default: false
    },
    isSmiling: {
      type: Boolean,
      default: false
    },
    analyzedAt: {
      type: Date,
      default: null
    }
  },
  
  // Overall Scores
  scores: {
    personalPresence: {
      type: Number,
      default: 0,
      min: 0,
      max: 25
    },
    professionalProfiles: {
      type: Number,
      default: 0,
      min: 0,
      max: 25
    },
    networking: {
      type: Number,
      default: 0,
      min: 0,
      max: 20
    },
    credentials: {
      type: Number,
      default: 0,
      min: 0,
      max: 20
    },
    thoughtLeadership: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    percentile: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    level: {
      type: String,
      enum: ['Beginner', 'Growing', 'Strong', 'Expert'],
      default: 'Beginner'
    }
  },
  
  // Score History
  scoreHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    total: Number,
    breakdown: {
      personalPresence: Number,
      professionalProfiles: Number,
      networking: Number,
      credentials: Number,
      thoughtLeadership: Number
    }
  }],
  
  // AI-Generated Suggestions
  suggestions: [{
    category: {
      type: String,
      enum: ['Personal Presence', 'Professional Profile', 'Networking', 'Credentials', 'Thought Leadership'],
      required: true
    },
    tool: {
      type: String,
      enum: ['LinkedIn', 'GitHub', 'Website'],
      default: 'LinkedIn'
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    impact: {
      type: String,
      required: true
    },
    expectedScoreImpact: {
      type: Number,
      min: 0,
      max: 25,
      default: 1
    },
    exampleRewrite: {
      type: String,
      default: ''
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
profileBrandingSchema.index({ 'scores.total': -1 });
profileBrandingSchema.index({ lastCalculated: -1 });

// Method to calculate level based on score
profileBrandingSchema.methods.calculateLevel = function() {
  const score = this.scores.total;
  if (score >= 76) return 'Expert';
  if (score >= 51) return 'Strong';
  if (score >= 26) return 'Growing';
  return 'Beginner';
};

// Pre-save hook to update level
profileBrandingSchema.pre('save', function(next) {
  this.scores.level = this.calculateLevel();
  next();
});

module.exports = mongoose.model('ProfileBranding', profileBrandingSchema);
