import streamlit as st
import google.generativeai as genai

# Configuration de l'interface
st.set_page_config(page_title="Roland Culé", page_icon="⚽")
st.title("⚽ Roland Culé")
st.write("L'assistant IA qui ne fait pas de cadeaux.")

# Vérification de la clé
if "GOOGLE_API_KEY" not in st.secrets:
    st.error("⚠️ La clé API est manquante dans les Secrets Streamlit.")
else:
    # Configuration de l'IA
    genai.configure(api_key=st.secrets["GOOGLE_API_KEY"])
    
    # On utilise le nom technique complet pour éviter l'erreur 404
    model = genai.GenerativeModel('models/gemini-1.5-flash')

    # Champ de saisie
    user_input = st.text_input("Pose ta question :")

    if st.button("Demander à Roland"):
        if user_input:
            try:
                response = model.generate_content(user_input)
                st.markdown("### Réponse :")
                st.write(response.text)
            except Exception as e:
                st.error(f"Erreur technique : {e}")
        else:
            st.warning("Écris quelque chose !")
