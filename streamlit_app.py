import streamlit as st
import google.generativeai as genai

# Config de la page
st.set_page_config(page_title="Roland Culé", page_icon="⚽")

# 1. Récupération sécurisée de la clé API
if "GOOGLE_API_KEY" not in st.secrets:
    st.error("⚠️ La clé 'GOOGLE_API_KEY' n'est pas configurée dans les Secrets de Streamlit.")
else:
    api_key = st.secrets["GOOGLE_API_KEY"]
    genai.configure(api_key=api_key)
    
    # Utilisation explicite du modèle stable 1.5-flash
    model = genai.GenerativeModel('gemini-1.5-flash')

    st.title("⚽ Roland Culé")
    st.write("Pose-moi tes questions, je suis ton assistant IA spécialisé.")

    # 2. Interface de discussion
    user_input = st.text_input("Ta question :", placeholder="Qui va gagner le prochain match ?")

    if st.button("Demander à Roland"):
        if user_input:
            with st.spinner('Roland réfléchit...'):
                try:
                    # Ajout d'une gestion d'erreur spécifique à la génération
                    response = model.generate_content(user_input)
                    st.markdown("### Réponse de Roland :")
                    st.write(response.text)
                except Exception as e:
                    st.error(f"Désolé, Roland a eu un problème technique : {e}")
        else:
            st.warning("Écris quelque chose avant de valider !")
