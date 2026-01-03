import streamlit as st
import google.generativeai as genai

st.set_page_config(page_title="Roland Culé", page_icon="⚽")

if "GOOGLE_API_KEY" not in st.secrets:
    st.error("⚠️ La clé 'GOOGLE_API_KEY' n'est pas configurée dans les Secrets.")
else:
    genai.configure(api_key=st.secrets["GOOGLE_API_KEY"])
    
    # On utilise le modèle le plus stable et compatible
    model = genai.GenerativeModel('gemini-pro')

    st.title("⚽ Roland Culé")
    st.write("Pose-moi tes questions !")

    user_input = st.text_input("Ta question :")

    if st.button("Demander à Roland"):
        if user_input:
            with st.spinner('Roland réfléchit...'):
                try:
                    response = model.generate_content(user_input)
                    st.markdown("### Réponse de Roland :")
                    st.write(response.text)
                except Exception as e:
                    st.error(f"Erreur : {e}")
        else:
            st.warning("Écris quelque chose !")
