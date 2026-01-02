import streamlit as st
import google.generativeai as genai

# Connexion sécurisée à ta clé API
try:
    api_key = st.secrets["GOOGLE_API_KEY"]
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    st.set_page_config(page_title="Mon App IA", page_icon="🤖")
    st.title("🤖 Mon Assistant IA Personnel")

    user_input = st.text_area("Posez votre question :", placeholder="Ecrivez ici...")

    if st.button("Envoyer"):
        if user_input:
            with st.spinner('L’IA réfléchit...'):
                response = model.generate_content(user_input)
                st.subheader("Réponse :")
                st.write(response.text)
        else:
            st.warning("Veuillez entrer un texte.")
            
except KeyError:
    st.error("Erreur : La clé GOOGLE_API_KEY est manquante dans les Secrets Streamlit.")
