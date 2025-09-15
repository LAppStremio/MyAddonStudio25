const fs = require('fs');
const path = require('path');
const { getViewScripts } = require('./views-scripts');

const renderConfigPage = (protocol, host, query, manifest) => {
    const configPath = path.join(__dirname, 'addon-config.json');
    const m3uDefaultUrl = 'https://github.com/LAppDesign/MyTvAddon/blob/main/tv.png?raw=true';
    
    // Verifica se o código de acesso na query corresponde ao da variável de ambiente
    const accessCodeCorrect = query.access_code === process.env.ACCESS_CODE;
    
    // A visibilidade do conteúdo agora depende apenas do código de acesso
    const contentVisible = accessCodeCorrect;

    // Controla a visibilidade das secções de forma independente
    const showConfigFields = process.env.SHOW_CONFIG_FIELDS === 'true';
    const showSupportSection = process.env.SHOW_SUPPORT_SECTION === 'true';

    // Cria um novo objeto de query para o manifesto, sem o código de acesso
    const manifestQuery = { ...query };
    delete manifestQuery.access_code;

    // 🔹 Corrigido: só inclui os scripts se existirem, e com verificação de erro
    let scriptsToInclude = '';
    if (contentVisible) {
        scriptsToInclude = `
        try {
            ${getViewScripts(protocol, host)}
        } catch (e) {
            console.warn("Erro nos scripts da página:", e.message);
        }
        `;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${manifest.name}</title>
            <style>
                :root {
                    --bg-color: #202020;
                    --panel-bg-color: #333333;
                    --shadow-dark: #1a1a1a;
                    --shadow-light: #444444;
                }
                body {
                    background-color: var(--bg-color);
                }
                .content, .config-form, .advanced-settings, #confirmModal > div, #pythonStatus, #generatedM3uUrl, #resolverStatus {
                    background-color: var(--panel-bg-color) !important;
                    box-shadow: 10px 10px 20px var(--shadow-dark), -10px -10px 20px var(--shadow-light);
                    border-radius: 12px !important;
                }
                body {
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    overflow-y: auto;
                    font-family: Arial, sans-serif;
                    color: #fff;
                    background: var(--bg-color);
                }
                #background-video {
                    position: fixed;
                    right: 0;
                    bottom: 0;
                    min-width: 100%;
                    min-height: 100%;
                    width: auto;
                    height: auto;
                    z-index: -1000;
                    background: black;
                    object-fit: cover;
                    filter: blur(5px) brightness(0.5);
                }
                .content {
                    position: relative;
                    z-index: 1;
                    max-width: 800px;
                    margin: 0 auto;
                    text-align: center;
                    padding: 50px 20px;
                    background: rgba(0,0,0,0.6);
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    overflow-y: visible;
                }
                .logo {
                    width: 150px;
                    margin: 0 auto 20px;
                    display: block;
                }
                .manifest-url {
                    background: rgba(255,255,255,0.1);
                    padding: 10px;
                    border-radius: 4px;
                    word-break: break-all;
                    margin: 20px 0;
                    font-size: 12px;
                }
                .loader-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                    flex-direction: column;
                }
                .loader {
                    border: 6px solid #3d2a56;
                    border-radius: 50%;
                    border-top: 6px solid #8A5AAB;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }
                .loader-message {
                    color: white;
                    font-size: 18px;
                    text-align: center;
                    max-width: 80%;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .config-form {
                    text-align: left;
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 4px;
                    margin-top: 30px;
                }
                .config-form label {
                    display: block;
                    margin: 10px 0 5px;
                    color: #fff;
                }
                .config-form input[type="text"],
                .config-form input[type="url"],
                .config-form input[type="password"],
                .config-form input[type="file"] {
                    width: 100%;
                    padding: 8px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                    border: 1px solid #666;
                    background: #333;
                    color: white;
                }
                .buttons {
                    margin: 30px 0;
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                }
                button {
                    background: #8A5AAB;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }
                .hidden-section {
                    display: none;
                }
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #4CAF50;
                    color: white;
                    padding: 15px 30px;
                    border-radius: 4px;
                    display: none;
                }
                input[type="submit"] {
                    background: #8A5AAB;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    width: 100%;
                    margin-top: 20px;
                }
                .advanced-settings {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid #666;
                    border-radius: 4px;
                    padding: 10px;
                    margin-top: 10px;
                }
                .advanced-settings-header {
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #fff;
                }
                .advanced-settings-content {
                    display: none;
                    padding-top: 10px;
                }
                .advanced-settings-content.show {
                    display: block;
                }
                #confirmModal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    z-index: 1000;
                    justify-content: center;
                    align-items: center;
                }
                #confirmModal > div {
                    background: #333;
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    color: white;
                }
                #confirmModal button {
                    margin: 0 10px;
                }
                a {
                    color: #8A5AAB;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="content">
                <img class="logo" src="${manifest.logo}" alt="logo">
                <h1>${manifest.name} <span style="font-size: 16px; color: #aaa;">v${manifest.version}</span></h1>

                <div style="margin-top: 30px; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 4px;">
                    <strong>ATENÇÃO!</strong>
                    <ul style="text-align: center; margin-top: 10px;">
                        <p>A utilização deste addon é da inteira responsabilidade do utilizador.</p>
                        <p>Respeita sempre a legislação aplicável.</p>
                    </ul>
                </div>
                
                ${contentVisible ? 
                `
                ... (resto do teu HTML igual) ...
                ` :
                `
                <div class="config-form">
                    <h2>Introduza o código de acesso</h2>
                    <form id="accessForm" action="/" method="GET">
                        <label>Código:</label>
                        <input type="password" name="access_code" required>
                        <button type="submit">DESBLOQUEAR</button>
                    </form>
                </div>
                `
                }
                
                ... (resto do código igual) ...

                <script>
                    ${scriptsToInclude}
                </script>
            </div>
            <div id="loaderOverlay" class="loader-overlay">
                <div class="loader"></div>
                <div id="loaderMessage" class="loader-message">Operazione in corso...</div>
            </div>
        </body>
        </html>
    `;
};

module.exports = {
    renderConfigPage
};
