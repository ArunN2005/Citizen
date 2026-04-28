# Citizen

## Overview
Citizen is a comprehensive, AI-driven civic engagement platform built for the **Google Solutions Challenge 2026**. The platform addresses the critical communication and operational gaps between citizens and municipal administrators by transforming how urban infrastructure issues are reported, verified, and resolved.

## Background Research & Problem Statement
Worldwide, urban infrastructure systems suffer from inefficiencies in issue reporting and resolution. Citizens frequently encounter damaged roads, water leaks, and public hazards, but face friction in reporting these issues due to cumbersome government portals, language barriers, and a lack of transparency regarding action taken. As a result, critical issues remain unreported or unaddressed.

Simultaneously, municipal administrators face challenges in triaging and prioritizing incoming complaints. Without an automated way to discern the severity of an issue, verify its authenticity, or predict its broader impact, local governments often rely on slow, manual inspections. This reactive paradigm leads to misallocation of resources, delayed maintenance, and diminished citizen trust.

There is a critical need for a unified platform that autonomously verifies, contextualizes, and scores civic issues by analyzing multi-modal inputs, social signals, and external environmental variables.

## What is Citizen?
Citizen seamlessly processes multi-modal civilian inputs (text, voice, image, and video) through a robust AI processing layer to accurately assess, categorize, and prioritize urban issues. 

By integrating direct citizen reports with external signals, such as social media conversations and environmental severity data, Citizen shifts municipal operations from a reactive paradigm to a predictive, data-driven framework. The solution aims to accelerate resolution times, increase administrative accountability, and empower active citizen participation in urban maintenance.

## Core Mechanisms
1. **Intelligent Issue Triage:** Every incoming report is instantly analyzed using natural language processing to extract intent, and computer vision models to estimate structural severity directly from images. The system evaluates text urgency and cross-references reports with nearby verified complaints.
2. **Priority Scoring Engine:** Moving beyond chronological sorting, an advanced AI engine synthesizes a final urgency score factoring in visual defect severity (40%), spatial location context (20%), social intelligence signals (15%), text sentiment urgency (10%), external weather impact (10%), and historically verified temporal patterns (5%).
3. **Social Signal Intelligence:** The system processes public conversations from external networks (like X/Twitter and RSS public feeds) to validate the existence and urgency of an ongoing issue over a geographical radius, driving down fraudulent claims and verifying authentic reports.
4. **Gamification System:** To encourage continuous high-quality civic participation, users earn points, badges, and advance through leaderboard levels directly managed and tracked within the ecosystem.

## Architecture & Google Cloud Integrations
The Citizen platform extensively leverages Google Cloud Platform and Google's Machine Learning infrastructure to achieve multi-modal data processing and predictive insights at scale.

### Artificial Intelligence & Machine Learning
*   **Vertex AI Vision & Explainable AI (XAI):** Evaluates user-uploaded imagery or video frames to derive a severity confidence score, deployed alongside Vertex AI Explainable AI to transparently justify the structural validation decisions.
*   **Gemini API:** Powers the core conversational intelligence. Functions as the Citizen AI Chatbot guiding users iteratively in multiple languages, supports the Social Signal Intelligence processing engine (analyzing external feeds), and generates actionable insights for the municipal Admin Panel.
*   **Cloud Natural Language API:** Conducts issue extraction and context relevance validation to classify the urgency and intent from incoming text descriptions.
*   **Cloud Speech-to-Text & Cloud Translation API:** Facilitates complete multilingual processing by converting incoming audio complaints into text and ensuring localized engagement across vernacular inputs.
*   **BigQuery ML & Vertex AI Forecasting:** Deployed for long-term historical pattern analysis, trend prediction, and predictive resource planning logic.

### Core Cloud Infrastructure & Backend Services
*   **Google Cloud Run & Cloud Functions:** Handles scalable, stateless, and robust API deployments. Provides serverless executions for complex business logic, gamification rewards, notification webhooks, and the dynamic priority scoring engine.
*   **Google Maps Platform:** Actively leverages Places API, Geocoding API, and Roads API to accurately validate incident locations and assert public infrastructure proximity constraints.
*   **Cloud Endpoints, Pub/Sub, and Scheduler:** Manages external API routing, asynchronous event-driven message queuing across microservices, and chronological background validation jobs.
*   **Google Workspace API & Cloud Logging:** Synchronizes operational administrative actions and maintains comprehensive audit trails for transparency and system monitoring.

### Data Platform & Real-Time Synchronization
*   **Cloud Firestore & Firebase:** Sustains near-instantaneous state updates connecting the Flutter applications to backend logic, supporting live notifications via Firebase Cloud Messaging and authentication flows via Firebase Authentication.
*   **Cloud SQL (PostgreSQL):** Operates as the resilient relational datastore for core analytical entity constraints.
*   **Cloud Storage:** Functions as the primary blob warehouse for persisting unstructured multimedia logs, images, and videos.
*   **BigQuery & Looker Studio:** Powers the analytical backend for aggregating real-time heatmaps, generating reporting panels, and mapping the city's operational health metrics.

## Getting Started

### Prerequisites
*   Flutter SDK (v3.19.0+)
*   Node.js (v18.0.0+)
*   Python (3.9+ for ML Services)
*   Google Cloud Platform Account (with necessary APIs enabled)

### Local Setup

**1. Backend Services**
Navigate to the backend directory and install dependencies:
```bash
cd CIVIC-REZO-Backend
npm install
```
Start the Python ML services:
```bash
cd python_services
pip install -r requirements.txt
python distilbert_emotion_service.py &
cd ..
```
Run the Node.js server:
```bash
npm run dev
```

**2. Flutter Mobile Application**
Navigate to the Flutter project directory:
```bash
cd CIVIC-REZO-Flutter
flutter pub get
```
Run the application on an emulator or connected device:
```bash
flutter run
```
