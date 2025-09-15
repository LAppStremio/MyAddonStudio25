const fs = require('fs');
const path = require('path');
// A referência a 'views-scripts' pode ser removida se o script estiver todo aqui.
// const { getViewScripts } = require('./views-scripts');

// --- Início do Script Corrigido (que estava em views-scripts.js) ---
const getSafeViewScripts = (protocol, host) => {
    // Colocamos o script aqui para garantir que ele tem as verificações de segurança.
    return `
        function getManifestUrl() {
            const urlElement = document.querySelector('.manifest-url');
            if (urlElement && urlElement.innerText) {
                // Extrai o URL a partir do texto, ignorando o cabeçalho
                const urlText = urlElement.innerText.replace('URL Manifest:', '').trim();
                return urlText;
            }
            // Fallback para construir o URL se o elemento não for encontrado
            const manifestQuery = new URLSearchParams(window.location.search);
            manifestQuery.delete('access_code');
            return \`\${protocol}://\${host}/manifest.json?\${manifestQuery}\`;
        }

        function copyManifestUrl() {
            const manifestUrl = getManifestUrl();
            navigator.clipboard.writeText(manifestUrl).then(() => {
                const toast = document.getElementById('toast');
                if (toast) {
                    toast.style.display = 'block';
                    setTimeout(() => { toast.style.display = 'none'; }, 2000);
                }
            }).catch(err => {
                console.error('Erro ao copiar URL: ', err);
                alert('Não foi possível copiar o URL.');
            });
        }

        function installAddon() {
            const modal = document.getElementById('confirmModal');
            if (modal) {
                // Usamos 'flex' porque o CSS do modal usa 'justify-content' e 'align-items'
                modal.style.display = 'flex';
            }
        }

        function cancelInstallation() {
            const modal = document.getElementById('confirmModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        function proceedInstallation() {
            const manifestUrl = getManifestUrl();
            window.location.href = \`stremio://\${manifestUrl}\`;
            cancelInstallation();
        }

        function updateConfig(event) {
            event.preventDefault();
            const form = document.getElementById('configForm');
            if (form) {
                const formData = new FormData(form);
                const query = new URLSearchParams(formData).toString();
                window.location.search = query;
            }
        }

        function toggleAdvancedSettings() {
            const content = document.getElementById('advanced-settings-content');
            const toggle = document.getElementById('advanced-settings-toggle');
            if (content && toggle) {
                content.classList.toggle('show');
                toggle.textContent = content.classList.contains('show') ? '▲' : '▼';
            }
        }

        // Adicione aqui as outras funções (togglePythonSection, etc.) com a mesma verificação de segurança
        // Exemplo:
        function togglePythonSection() {
            const content = document.getElementById('python-section-content');
            const toggle = document.getElementById('python-section-toggle');
            if (content && toggle) {
                content.classList.toggle('show');
                toggle.textContent = content.classList.contains('show') ? '▲' : '▼';
            }
        }

        function toggleResolverSection() {
            const content = document.getElementById('resolver-section-content');
            const toggle = document.getElementById('resolver-section-toggle');
            if (content && toggle) {
                content.classList.toggle('show');
                toggle.textContent = content.classList.contains('show') ? '▲' : '▼';
            }
        }

        // Restante das suas funções...
    `;
};
// --- Fim do Script Corrigido ---


const renderConfigPage = (protocol, host, query, manifest) => {
    const configPath = path.join(__dirname, 'addon-config.json');
    const m3uDefaultUrl = 'https://github.com/LAppDesign/MyTvAddon/blob/main/tv.png?raw=true';
    
    const accessCodeCorrect = query.access_code === process.env.ACCESS_CODE;
    
    const contentVisible = accessCodeCorrect;

    const showConfigFields = process.env.SHOW_CONFIG_FIELDS === 'true';
    const showSupportSection = process.env.SHOW_SUPPORT_SECTION === 'true';

    const manifestQuery = { ...query };
    delete manifestQuery.access_code;

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
                    margin: 0; padding: 0; height: 100vh; overflow-y: auto; font-family: Arial, sans-serif;
                    color: #fff; background: var(--bg-color);
                }
                .content {
                    position: relative; z-index: 1; max-width: 800px; margin: 0 auto;
                    text-align: center; padding: 50px 20px; background: rgba(0,0,0,0.6);
                    min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-start;
                    overflow-y: visible;
                }
                .logo { width: 150px; margin: 0 auto 20px; display: block; }
                .manifest-url {
                    background: rgba(255,255,255,0.1); padding: 10px; border-radius: 4px;
                    word-break: break-all; margin: 20px 0; font-size: 12px;
                }
                .loader-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.8); display: none; justify-content: center;
                    align-items: center; z-index: 2000; flex-direction: column;
                }
                .loader {
                    border: 6px solid #3d2a56; border-radius: 50%; border-top: 6px solid #8A5AAB;
                    width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;
                }
                .loader-message { color: white; font-size: 18px; text-align: center; max-width: 80%; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .config-form {
                    text-align: left; background: rgba(255,255,255,0.1); padding: 20px;
                    border-radius: 4px; margin-top: 30px;
                }
                .config-form label { display: block; margin: 10px 0 5px; color: #fff; }
                .config-form input[type="text"], .config-form input[type="url"],
                .config-form input[type="password"], .config-form input[type="file"] {
                    width: 100%; padding: 8px; margin-bottom: 10px; border-radius: 4px;
                    border: 1px solid #666; background: #333; color: white;
                }
                .buttons { margin: 30px 0; display: flex; justify-content: center; gap: 20px; }
                button {
                    background: #8A5AAB; color: white; border: none; padding: 12px 24px;
                    border-radius: 4px; cursor: pointer; font-size: 16px;
                }
                .hidden-section { display: none; }
                .toast {
                    position: fixed; top: 20px; right: 20px; background: #4CAF50;
                    color: white; padding: 15px 30px; border-radius: 4px; display: none;
                }
                input[type="submit"] {
                    background: #8A5AAB; color: white; border: none; padding: 12px 24px;
                    border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; margin-top: 20px;
                }
                .advanced-settings {
                    background: rgba(255,255,255,0.05); border: 1px solid #666; border-radius: 4px;
                    padding: 10px; margin-top: 10px;
                }
                .advanced-settings-header {
                    cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: #fff;
                }
                .advanced-settings-content { display: none; padding-top: 10px; }
                .advanced-settings-content.show { display: block; }
                #confirmModal {
                    display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.8); z-index: 1000; justify-content: center; align-items: center;
                }
                #confirmModal > div {
                    background: #333; padding: 30px; border-radius: 10px; text-align: center; color: white;
                }
                #confirmModal button { margin: 0 10px; }
                a { color: #8A5AAB; text-decoration: none; }
                a:hover { text-decoration: underline; }
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
                <div class="manifest-url">
                    <strong>URL Manifest:</strong><br>
                    ${protocol}://${host}/manifest.json?${new URLSearchParams(manifestQuery)}
                </div>

                <div class="buttons">
                    <button onclick="copyManifestUrl()">COPIAR URL DO MANIFESTO</button>
                    <button onclick="installAddon()">INSTALAR NO STREMIO</button>
                </div>

                <div class="config-form">
                    <h2>Gerar Configuração</h2>
                    <form id="configForm" onsubmit="updateConfig(event)">
                        <label>URL:(http://amis.lol:80/playlist/66666/88888/m3u_plus)</label>
                        <input type="url" name="m3u" value="${query.m3u || ''}" required>
                        <label>URL do EPG: (http://ami.lol:80/xmltv.php?username=6666&password=9999)</label>
                        <input type="url" name="epg" value="${query.epg || ''}">
                        <label>
                            <input type="checkbox" name="epg_enabled" ${query.epg_enabled === 'true' ? 'checked' : ''}>
                            Ativar EPG
                        </label>
                        <div class="advanced-settings">
                            <div class="advanced-settings-header" onclick="toggleAdvancedSettings()">
                                <strong>Definições Avançadas</strong>
                                <span id="advanced-settings-toggle">▼</span>
                            </div>
                            <div class="advanced-settings-content" id="advanced-settings-content">
                                <label>URL do Proxy:</label>
                                <input type="url" name="proxy" value="${query.proxy || ''}">
                                <label>Palavra-passe do Proxy:</label>
                                <input type="password" name="proxy_pwd" value="${query.proxy_pwd || ''}">
                                <label>
                                    <input type="checkbox" name="force_proxy" ${query.force_proxy === 'true' ? 'checked' : ''}>
                                    Forçar Proxy
                                </label>
                                <label>Sufixo do ID:</label>
                                <input type="text" name="id_suffix" value="${query.id_suffix || ''}" placeholder="Esempio: it">
                                <label>URL do ficheiro de remapeamento:</label>
                                <input type="text" name="remapper_path" value="${query.remapper_path || ''}" placeholder="Esempio: https://raw.githubusercontent.com/...">
                                <label>Intervalo de Atualização da Lista:</label>
                                <input type="text" name="update_interval" value="${query.update_interval || '12:00'}" placeholder="HH:MM (predefinito 12:00)">
                                <small style="color: #999;">Formato HH:MM (es. 1:00 o 01:00), predefinito 12:00</small>
                                <label>URL do Script Resolver em Python:</label>
                                <input type="url" name="resolver_script" value="${query.resolver_script || ''}">
                                <label>
                                    <input type="checkbox" name="resolver_enabled" ${query.resolver_enabled === 'true' ? 'checked' : ''}>
                                    Ativar Resolver Python
                                </label>
                            </div>
                        </div>
                        <input type="hidden" name="access_code" value="${query.access_code || ''}">
                        <input type="submit" value="Gerar Configuração">
                    </form>
                </div>
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
                
                <div style="margin-top: 30px; text-align: center; font-size: 14px; color: #ccc;">
                    ${showSupportSection ? `
                    <p>Addon criado com paixão por McCoy88f - <a href="https://github.com/mccoy88f/OMG-Premium-TV" target="_blank">GitHub Repository</a></p>
                    <p>Addon editado por LAppDesign.</p>
                    <h3 style="margin-top: 20px;">Apoia este projeto!</h3>
                    <div style="margin-top: 15px;">
                        <a href="https://www.buymeacoffee.com/mccoy88f" target="_blank">
                            <img src="https://img.buymeacoffee.com/button-api/?text=Oferece-me uma cerveja&emoji=🍺&slug=mccoy88f&button_colour=FFDD00&font_colour=000000&font_family=Bree&outline_colour=000000&coffee_colour=ffffff" alt="Buy Me a Coffee" style="max-width: 300px; margin: 0 auto;"/>
                        </a>
                    </div>
                    <p style="margin-top: 15px;">
                        <a href="https://paypal.me/mccoy88f?country.x=IT&locale.x=it_IT" target="_blank">Podes também oferecer-me uma cerveja via PayPal 🍻</a>
                    </p>
                    ` : ``}
                </div>
            
                <div id="confirmModal">
                    <div>
                        <h2>Confirmar Instalação</h2>
                        <p>Já geraste a configuração?</p>
                        <div style="margin-top: 20px;">
                            <button onclick="cancelInstallation()" style="background: #666;">Voltar</button>
                            <button onclick="proceedInstallation()" style="background: #8A5AAB;">Prosseguir</button>
                        </div>
                    </div>
                </div>

                <div id="toast" class="toast">URL Copiado!</div>

                <script>
                    ${getSafeViewScripts(protocol, host)}
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
