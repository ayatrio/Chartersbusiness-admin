#!/bin/bash

echo "Setting up Python NLP Service..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Pre-download HuggingFace model
python -c "
from transformers import pipeline
print('Downloading sentiment model...')
pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')
print('Done!')
"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the service run:"
echo "  source venv/bin/activate"
echo "  uvicorn app:app --reload --port 8000"