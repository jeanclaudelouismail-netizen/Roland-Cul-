import streamlit as st
import google.generativeai as genai

# C'est ici que tu colles ton travail de Google Studio (Ton Prompt)
SYSTEM_PROMPT = """
COLLE ICI TON TEXTE DE GOOGLE STUDIO
"""

st.set_page_config(page_title="Roland Culé")
genai.configure(api_key=st.secrets["GOOGLE_API_KEY"])

# Initialisation du modèle avec TES réglages de Google Studio
model = genai.GenerativeModel(
    model_name='gemini-1.5-flash',
    system_instruction=SYSTEM_PROMPT
)

st.title("⚽ Roland Culé")

if prompt := st.chat_input("Pose ta question..."):
    with st.chat_message("user"):
        st.write(prompt)
    
    response = model.generate_content(prompt)
    
    with st.chat_message("assistant"):
        st.write(response.text)
