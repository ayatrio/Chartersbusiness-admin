from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import spacy
import re
import json
from transformers import pipeline
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Profile Branding NLP Service",
    description="NLP microservice for resume parsing, skill extraction, and sentiment analysis",
    version="1.0.0"
)

# ─── CORS ────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load Models ─────────────────────────────────────────────────
print("⏳ Loading spaCy model...")
try:
    nlp = spacy.load("en_core_web_sm")
    print("✅ spaCy model loaded")
except OSError:
    print("❌ spaCy model not found. Run: python -m spacy download en_core_web_sm")
    nlp = None

print("⏳ Loading sentiment model...")
try:
    sentiment_analyzer = pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english",
        truncation=True,
        max_length=512
    )
    print("✅ Sentiment model loaded")
except Exception as e:
    print(f"❌ Sentiment model failed to load: {e}")
    sentiment_analyzer = None


# ─── Skill Keywords Database ─────────────────────────────────────
SKILLS_DATABASE = {
    "programming_languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "go",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
        "perl", "bash", "shell", "powershell", "dart", "elixir"
    ],
    "frontend": [
        "react", "vue", "angular", "next.js", "nuxt", "svelte", "html",
        "css", "sass", "tailwind", "bootstrap", "material-ui", "redux",
        "webpack", "vite", "jquery", "gatsby"
    ],
    "backend": [
        "node.js", "express", "django", "flask", "fastapi", "spring boot",
        "laravel", "rails", "asp.net", "graphql", "rest api", "microservices",
        "nestjs", "fastify", "hapi"
    ],
    "databases": [
        "mongodb", "postgresql", "mysql", "sqlite", "redis", "elasticsearch",
        "cassandra", "dynamodb", "firebase", "supabase", "oracle", "mssql",
        "neo4j", "influxdb"
    ],
    "cloud_devops": [
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
        "jenkins", "github actions", "circleci", "helm", "nginx", "linux",
        "ci/cd", "devops", "sre", "cloudformation", "vercel", "heroku"
    ],
    "data_ml": [
        "machine learning", "deep learning", "tensorflow", "pytorch",
        "scikit-learn", "pandas", "numpy", "opencv", "nlp", "computer vision",
        "data science", "data analysis", "tableau", "power bi", "spark",
        "hadoop", "airflow", "mlops", "llm", "generative ai"
    ],
    "soft_skills": [
        "leadership", "communication", "teamwork", "problem solving",
        "project management", "agile", "scrum", "kanban", "mentoring",
        "collaboration", "time management", "critical thinking",
        "presentation", "stakeholder management"
    ],
    "tools": [
        "git", "jira", "confluence", "figma", "postman", "vs code",
        "intellij", "xcode", "android studio", "slack", "notion",
        "trello", "asana", "linear", "datadog", "grafana", "sentry"
    ]
}

# Flatten all skills for quick lookup
ALL_SKILLS = {}
for category, skills in SKILLS_DATABASE.items():
    for skill in skills:
        ALL_SKILLS[skill.lower()] = category


# ─── Pydantic Models ─────────────────────────────────────────────
class ResumeText(BaseModel):
    text: str

class TextInput(BaseModel):
    text: str

class HeadlineInput(BaseModel):
    headline: str
    target_role: Optional[str] = None

class AboutInput(BaseModel):
    about: str
    target_role: Optional[str] = None


# ─── Helper Functions ─────────────────────────────────────────────
def extract_skills(text: str) -> dict:
    """Extract skills from text using keyword matching + spaCy NER."""
    text_lower = text.lower()
    found_skills = {}

    for skill, category in ALL_SKILLS.items():
        # Use word boundary matching to avoid false positives
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            if category not in found_skills:
                found_skills[category] = []
            # Preserve original casing from database
            original_skill = skill.title() if len(skill) > 3 else skill.upper()
            found_skills[category].append(original_skill)

    return found_skills


def extract_experience(text: str) -> list:
    """Extract work experience sections using regex + spaCy."""
    experiences = []

    # Common date patterns
    date_pattern = r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)\s+\d{4}'
    year_range_pattern = r'(\d{4})\s*[-–—]\s*(\d{4}|present|current|now)'

    # Split text into sections
    lines = text.split('\n')
    current_exp = {}
    in_experience_section = False

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        # Detect experience section headers
        if re.search(r'\b(experience|employment|work history|career)\b', line, re.I):
            in_experience_section = True
            continue

        # Detect next major section (stop parsing experience)
        if re.search(r'\b(education|skills|certifications|projects|publications)\b', line, re.I):
            if current_exp:
                experiences.append(current_exp)
                current_exp = {}
            in_experience_section = False
            continue

        if in_experience_section:
            # Try to detect job title and company
            date_match = re.search(year_range_pattern, line, re.I)
            if date_match:
                if current_exp:
                    experiences.append(current_exp)
                current_exp = {
                    "start_date": date_match.group(1),
                    "end_date": date_match.group(2),
                    "description": ""
                }
            elif current_exp and 'position' not in current_exp and len(line) < 80:
                current_exp['position'] = line
            elif current_exp and 'company' not in current_exp and len(line) < 80:
                current_exp['company'] = line
            elif current_exp:
                current_exp['description'] = current_exp.get('description', '') + ' ' + line

    if current_exp:
        experiences.append(current_exp)

    return experiences[:10]  # Return max 10 experiences


def extract_education(text: str) -> list:
    """Extract education information."""
    education = []

    degree_patterns = [
        r'\b(Bachelor|Master|PhD|Doctorate|B\.?S\.?|M\.?S\.?|B\.?E\.?|M\.?E\.?|B\.?Tech|M\.?Tech|MBA|B\.?A\.?|M\.?A\.?)\b',
    ]

    lines = text.split('\n')
    in_education_section = False
    current_edu = {}

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if re.search(r'\b(education|academic|qualification)\b', line, re.I):
            in_education_section = True
            continue

        if re.search(r'\b(experience|skills|certifications|projects)\b', line, re.I):
            if current_edu:
                education.append(current_edu)
                current_edu = {}
            in_education_section = False
            continue

        if in_education_section:
            for pattern in degree_patterns:
                degree_match = re.search(pattern, line, re.I)
                if degree_match:
                    if current_edu:
                        education.append(current_edu)
                    current_edu = {
                        "degree": degree_match.group(0),
                        "institution": "",
                        "field": "",
                        "year": ""
                    }

                    # Try to extract year
                    year_match = re.search(r'\b(19|20)\d{2}\b', line)
                    if year_match:
                        current_edu["year"] = year_match.group(0)

                    # Try to extract field of study
                    field_match = re.search(
                        r'(?:in|of)\s+([A-Za-z\s]+?)(?:\s*,|\s*\(|\s*\d|$)',
                        line, re.I
                    )
                    if field_match:
                        current_edu["field"] = field_match.group(1).strip()

                    break

            if current_edu and 'institution' in current_edu and not current_edu['institution']:
                if re.search(r'\b(university|college|institute|school|academy)\b', line, re.I):
                    current_edu['institution'] = line

    if current_edu:
        education.append(current_edu)

    return education[:5]


def extract_contact_info(text: str) -> dict:
    """Extract contact information using regex."""
    contact = {}

    # Email
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    if email_match:
        contact['email'] = email_match.group(0)

    # Phone
    phone_match = re.search(
        r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        text
    )
    if phone_match:
        contact['phone'] = phone_match.group(0)

    # LinkedIn
    linkedin_match = re.search(r'linkedin\.com/in/[\w-]+', text, re.I)
    if linkedin_match:
        contact['linkedin'] = 'https://' + linkedin_match.group(0)

    # GitHub
    github_match = re.search(r'github\.com/[\w-]+', text, re.I)
    if github_match:
        contact['github'] = 'https://' + github_match.group(0)

    # Website
    website_match = re.search(
        r'https?://(?!linkedin|github)[\w.-]+\.[a-z]{2,}(?:/[\w.-]*)*',
        text, re.I
    )
    if website_match:
        contact['website'] = website_match.group(0)

    return contact


def calculate_resume_score(parsed_data: dict) -> dict:
    """Score the resume quality based on completeness."""
    score = 0
    feedback = []

    # Contact info (20 points)
    contact = parsed_data.get('contact_info', {})
    if contact.get('email'):       score += 5
    if contact.get('phone'):       score += 5
    if contact.get('linkedin'):    score += 5
    if contact.get('github'):      score += 5
    else:
        feedback.append("Add your GitHub profile URL to your resume.")

    # Skills (30 points)
    skills = parsed_data.get('skills', {})
    total_skills = sum(len(v) for v in skills.values())
    if total_skills >= 15:         score += 30
    elif total_skills >= 10:       score += 20
    elif total_skills >= 5:        score += 10
    else:
        feedback.append("Add more specific technical and soft skills to your resume.")

    # Experience (30 points)
    experience = parsed_data.get('experience', [])
    if len(experience) >= 3:       score += 30
    elif len(experience) >= 2:     score += 20
    elif len(experience) >= 1:     score += 10
    else:
        feedback.append("Add your work experience with dates, company name, and responsibilities.")

    # Education (20 points)
    education = parsed_data.get('education', [])
    if len(education) >= 1:        score += 20
    else:
        feedback.append("Add your educational qualifications.")

    return {
        "score": score,
        "grade": "A" if score >= 85 else "B" if score >= 70 else "C" if score >= 50 else "D",
        "feedback": feedback
    }


# ─── API Endpoints ────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "Profile Branding NLP Service",
        "status": "running",
        "version": "1.0.0",
        "endpoints": [
            "/parse-resume",
            "/extract-skills",
            "/analyze-sentiment",
            "/analyze-headline",
            "/analyze-about",
            "/health"
        ]
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "spacy_loaded": nlp is not None,
        "sentiment_model_loaded": sentiment_analyzer is not None
    }


@app.post("/parse-resume")
async def parse_resume(data: ResumeText):
    """
    Full resume parsing — extracts skills, experience,
    education, contact info, and scores the resume.
    """
    if not data.text or len(data.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text is too short or empty.")

    text = data.text

    # Run spaCy NER if available
    entities = {}
    if nlp:
        doc = nlp(text[:100000])  # spaCy limit guard
        for ent in doc.ents:
            label = ent.label_
            if label not in entities:
                entities[label] = []
            if ent.text not in entities[label]:
                entities[label].append(ent.text)

    # Extract all sections
    skills      = extract_skills(text)
    experience  = extract_experience(text)
    education   = extract_education(text)
    contact     = extract_contact_info(text)

    parsed_data = {
        "contact_info": contact,
        "skills": skills,
        "experience": experience,
        "education": education,
        "named_entities": entities,
        "total_skills_count": sum(len(v) for v in skills.values()),
        "word_count": len(text.split())
    }

    # Score the resume
    parsed_data["resume_score"] = calculate_resume_score(parsed_data)

    return {
        "success": True,
        "parsed_data": parsed_data
    }


@app.post("/extract-skills")
async def extract_skills_endpoint(data: TextInput):
    """Extract and categorize skills from any text."""
    if not data.text:
        raise HTTPException(status_code=400, detail="Text is required.")

    skills = extract_skills(data.text)
    total  = sum(len(v) for v in skills.values())

    return {
        "success": True,
        "skills": skills,
        "total_count": total,
        "categories_found": list(skills.keys())
    }


@app.post("/analyze-sentiment")
async def analyze_sentiment(data: TextInput):
    """
    Analyze sentiment of LinkedIn About section or
    any professional text.
    """
    if not data.text:
        raise HTTPException(status_code=400, detail="Text is required.")

    result = {
        "success": True,
        "text_length": len(data.text),
        "word_count": len(data.text.split()),
        "sentiment": None,
        "confidence": None,
        "tone_analysis": {},
        "suggestions": []
    }

    # Run sentiment model if available
    if sentiment_analyzer:
        try:
            sentiment = sentiment_analyzer(data.text[:512])[0]
            result["sentiment"] = sentiment["label"].lower()
            result["confidence"] = round(sentiment["score"], 3)
        except Exception as e:
            result["sentiment"] = "neutral"
            result["confidence"] = 0.5

    # Tone analysis using keyword matching
    positive_words = [
        "passionate", "driven", "innovative", "experienced", "expert",
        "accomplished", "dedicated", "creative", "collaborative", "proven",
        "successful", "impact", "deliver", "achieve", "lead"
    ]
    negative_words = [
        "struggled", "failed", "difficult", "problem", "issue",
        "unfortunately", "lack", "unable", "limited"
    ]
    power_words = [
        "transformed", "spearheaded", "pioneered", "architected",
        "scaled", "optimized", "generated", "saved", "increased",
        "reduced", "launched", "built", "created", "managed", "led"
    ]

    text_lower = data.text.lower()
    result["tone_analysis"] = {
        "positive_words_found": [w for w in positive_words if w in text_lower],
        "power_words_found":    [w for w in power_words    if w in text_lower],
        "negative_words_found": [w for w in negative_words if w in text_lower]
    }

    # Suggestions based on analysis
    if len(result["tone_analysis"]["power_words_found"]) < 3:
        result["suggestions"].append(
            "Use more power words like 'spearheaded', 'architected', or 'scaled' to make your profile more impactful."
        )
    if len(result["tone_analysis"]["negative_words_found"]) > 0:
        result["suggestions"].append(
            "Reframe negative language. Replace problem-focused wording with solution-focused language."
        )
    if result["word_count"] < 100:
        result["suggestions"].append(
            "Your About section is short. Aim for 150–300 words for better LinkedIn visibility."
        )
    if result["word_count"] > 400:
        result["suggestions"].append(
            "Your About section may be too long. Keep it under 350 words for maximum engagement."
        )

    return result


@app.post("/analyze-headline")
async def analyze_headline(data: HeadlineInput):
    """
    Analyze a LinkedIn headline for quality,
    keyword density, and professionalism.
    """
    if not data.headline:
        raise HTTPException(status_code=400, detail="Headline is required.")

    headline = data.headline.strip()
    analysis = {
        "success": True,
        "headline": headline,
        "character_count": len(headline),
        "word_count": len(headline.split()),
        "score": 0,
        "issues": [],
        "strengths": [],
        "suggestions": []
    }

    score = 0

    # Length check (LinkedIn max is 220 chars)
    if len(headline) > 220:
        analysis["issues"].append("Headline exceeds LinkedIn's 220 character limit.")
    elif len(headline) >= 100:
        score += 20
        analysis["strengths"].append("Good headline length — uses available space well.")
    elif len(headline) >= 60:
        score += 10
    else:
        analysis["issues"].append("Headline is too short. Expand it to at least 60 characters.")

    # Contains role/title
    role_keywords = [
        "engineer", "developer", "manager", "designer", "analyst",
        "scientist", "architect", "consultant", "director", "lead",
        "specialist", "founder", "cto", "ceo", "vp", "head of"
    ]
    has_role = any(kw in headline.lower() for kw in role_keywords)
    if has_role:
        score += 20
        analysis["strengths"].append("Contains a clear job title or role.")
    else:
        analysis["suggestions"].append("Include your current job title or target role.")

    # Contains skills or technologies
    skill_count = sum(1 for skill in ALL_SKILLS if skill in headline.lower())
    if skill_count >= 3:
        score += 25
        analysis["strengths"].append(f"Good skill density — {skill_count} skills detected.")
    elif skill_count >= 1:
        score += 10
        analysis["suggestions"].append("Add 2–3 more specific technical skills or tools.")
    else:
        analysis["suggestions"].append("Add relevant technical skills to improve searchability.")

    # Contains value proposition or impact words
    value_words = [
        "helping", "building", "creating", "transforming", "scaling",
        "driving", "passionate", "specializing", "focused on"
    ]
    has_value = any(w in headline.lower() for w in value_words)
    if has_value:
        score += 20
        analysis["strengths"].append("Includes a value proposition — great for engagement.")
    else:
        analysis["suggestions"].append(
            "Add a value statement (e.g., 'Helping startups scale' or 'Building user-centric products')."
        )

    # Separator usage (| or · are common)
    if '|' in headline or '·' in headline or '•' in headline:
        score += 15
        analysis["strengths"].append("Good use of separators for visual clarity.")
    else:
        analysis["suggestions"].append("Use ' | ' or ' · ' to separate different parts of your headline.")

    analysis["score"] = min(100, score)
    analysis["grade"] = (
        "A" if score >= 80
        else "B" if score >= 60
        else "C" if score >= 40
        else "D"
    )

    return analysis


@app.post("/analyze-about")
async def analyze_about_section(data: AboutInput):
    """
    Analyze a LinkedIn About section for completeness,
    tone, and keyword optimization.
    """
    if not data.about:
        raise HTTPException(status_code=400, detail="About section text is required.")

    about = data.about.strip()
    word_count = len(about.split())

    analysis = {
        "success": True,
        "word_count": word_count,
        "character_count": len(about),
        "score": 0,
        "issues": [],
        "strengths": [],
        "suggestions": [],
        "keywords_found": [],
        "missing_sections": []
    }

    score = 0

    # Length scoring
    if word_count >= 200:
        score += 25
        analysis["strengths"].append("Excellent length — detailed and comprehensive.")
    elif word_count >= 100:
        score += 15
        analysis["suggestions"].append("Expand to 200+ words for better LinkedIn SEO.")
    else:
        score += 5
        analysis["issues"].append("About section is too short. Aim for at least 150 words.")

    # Check for key sections
    has_intro   = bool(re.search(r'\b(i am|i\'m|my name|currently|i work)\b', about, re.I))
    has_skills  = len(extract_skills(about)) > 0
    has_cta     = bool(re.search(
        r'\b(contact|reach out|connect|email|message|let\'s talk|feel free)\b',
        about, re.I
    ))
    has_achieve = bool(re.search(
        r'\b(\d+\s*(years?|%|million|thousand|x|times|projects?|clients?))\b',
        about, re.I
    ))

    if has_intro:
        score += 15
        analysis["strengths"].append("Has a clear personal introduction.")
    else:
        analysis["missing_sections"].append("Introduction")
        analysis["suggestions"].append("Start with a compelling introduction about who you are.")

    if has_skills:
        score += 20
        analysis["strengths"].append("Mentions technical skills — good for searchability.")
        analysis["keywords_found"] = list(extract_skills(about).keys())
    else:
        analysis["missing_sections"].append("Skills / Technologies")
        analysis["suggestions"].append("Mention your top skills and technologies.")

    if has_achieve:
        score += 25
        analysis["strengths"].append("Includes quantified achievements — very impactful.")
    else:
        analysis["missing_sections"].append("Quantified Achievements")
        analysis["suggestions"].append(
            "Add measurable achievements (e.g., 'Reduced load time by 40%' or 'Led a team of 8')."
        )

    if has_cta:
        score += 15
        analysis["strengths"].append("Has a call-to-action — encourages recruiters to connect.")
    else:
        analysis["missing_sections"].append("Call to Action")
        analysis["suggestions"].append(
            "End with a call-to-action like 'Feel free to reach out at your@email.com'."
        )

    analysis["score"] = min(100, score)
    analysis["grade"] = (
        "A" if score >= 80
        else "B" if score >= 60
        else "C" if score >= 40
        else "D"
    )

    return analysis


# ─── Run Server ───────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "development") == "development"
    )