import streamlit as st
import google.generativeai as genai

st.set_page_config(page_title="Roland Culé", page_icon="⚽")

if "GOOGLE_API_KEY" not in st.secrets:
    st.error("⚠️ Clé manquante dans les Secrets.")
else:
    genai.configure(api_key=st.secrets["GOOGLE_API_KEY"])
    
    # ÉTAPE DE DÉTECTION AUTOMATIQUE
    try:
        # On cherche un modèle qui supporte la génération de contenu
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        if available_models:
            # On prend le premier modèle disponible (souvent gemini-1.5-flash ou pro)
            model_name = available_models[0]
            model = genai.GenerativeModel(model_name)
        else:
            st.error("Aucun modèle n'est disponible pour cette clé API.")
    except Exception as e:
        st.error(f"Erreur lors de la récupération des modèles : {e}")

    st.title("⚽ Roland Culé")
    
    user_input = st.text_input("Ta question :")

    if st.button("Demander à Roland"):
        if user_input:
            with st.spinner('Roland réfléchit...'):
                try:
                    response = model.generate_content(user_input)
                    st.write(response.text)
                except Exception as e:
                    st.error(f"Erreur finale : {e}")
