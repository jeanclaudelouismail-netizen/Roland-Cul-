import streamlit as st
import google.generativeai as genai

st.set_page_config(page_title="Roland Culé", page_icon="⚽")

if "GOOGLE_API_KEY" not in st.secrets:
    st.error("⚠️ La clé 'GOOGLE_API_KEY' n'est pas configurée dans les Secrets.")
else:
    genai.configure(api_key=st.secrets["GOOGLE_API_KEY"])
    
    # On essaie le nom le plus compatible
    # Si 'gemini-1.5-flash' ne marche pas, 'gemini-pro' est le fallback universel
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
    except:
        model = genai.GenerativeModel('gemini-pro')

    st.title("⚽ Roland Culé")
    st.write("Pose-moi tes questions !")

    user_input = st.text_input("Ta question :", key="user_q")

    if st.button("Demander à Roland"):
        if user_input:
            with st.spinner('Roland réfléchit...'):
                try:
                    # On force la génération simple
                    response = model.generate_content(user_input)
                    st.markdown("### Réponse de Roland :")
                    st.write(response.text)
                except Exception as e:
                    # Affichage de l'erreur propre pour débugger
                    st.error(f"Erreur de modèle : {e}")
                    st.info("Astuce : Vérifie si ta clé API est bien une clé 'Gemini' et non une clé 'Legacy'.")
        else:
            st.warning("Écris quelque chose !")
            
