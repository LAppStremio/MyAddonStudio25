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
                
                ${(contentVisible || showConfigFields) ?
                `
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
                        <input type="hidden" name="python_script_url" id="hidden_python_script_url" value="${query.python_script_url || ''}">
                        <input type="hidden" name="python_update_interval" id="hidden_python_update_interval" value="${query.python_update_interval || ''}">
                        <input type="hidden" name="resolver_update_interval" id="hidden_resolver_update_interval" value="${query.resolver_update_interval || ''}">
                        <input type="submit" value="Gerar Configuração">
                    </form>
                </div>

                <div class="config-form hidden-section">
                    <div class="advanced-settings">
                        <div class="advanced-settings-header" onclick="togglePythonSection()">
                            <strong>Gerar Lista com Script Python</strong>
                            <span id="python-section-toggle">▼</span>
                        </div>
                        <div class="advanced-settings-content" id="python-section-content">
                            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 4px; margin-bottom: 20px; margin-top: 15px;">
                                <p><strong>Esta funcionalidade permite:</strong></p>
                                <ul style="text-align: left;">
                                    <li>Transferir um script Python de um URL</li>
                                    <li>Executá-lo dentro do contentor Docker</li>
                                    <li>Usar o ficheiro M3U gerado como fonte</li>
                                </ul>
                                <p><strong>Nota:</strong> L'URL deve puntare a uno script Python che genera um file M3U.</p>
                            </div>
                            <div id="pythonForm">
                                <label>URL do Script Python:</label>
                                <input type="url" id="pythonScriptUrl" placeholder="https://example.com/script.py">
                                <div style="display: flex; gap: 10px; margin-top: 15px;">
                                    <button onclick="downloadPythonScript()" style="flex: 1;">DESCARREGAR SCRIPT</button>
                                    <button onclick="executePythonScript()" style="flex: 1;">EXECUTAR SCRIPT</button>
                                    <button onclick="checkPythonStatus()" style="flex: 1;">VERIFICAR ESTADO</button>
                                </div>
                                <div style="margin-top: 15px;">
                                    <h4>Atualização Automática</h4>
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <input type="text" id="updateInterval" placeholder="HH:MM (es. 12:00)" style="flex: 2;">
                                        <button onclick="scheduleUpdates()" style="flex: 1;">AGENDAR</button>
                                        <button onclick="stopScheduledUpdates()" style="flex: 1;">PARAR</button>
                                    </div>
                                    <small style="color: #999; display: block; margin-top: 5px;">
                                        Formato: HH:MM (ex: 12:00 para 12 horas, 1:00 para 1 hora, 0:30 para 30 minutos)
                                    </small>
                                </div>
                                <div id="pythonStatus" style="margin-top: 15px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; display: none;">
                                    <h3>Estado do Script Python</h3>
                                    <div id="pythonStatusContent"></div>
                                </div>
                                <div id="generatedM3uUrl" style="margin-top: 15px; background: rgba(0,255,0,0.1); padding: 10px; border-radius: 4px; display: none;">
                                    <h3>URL da Lista Gerada</h3>
                                    <div id="m3uUrlContent"></div>
                                    <button onclick="useGeneratedM3u()" style="width: 100%; margin-top: 10px;">USAR ESTA LISTA</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="config-form hidden-section">
                        <div class="advanced-settings">
                            <div class="advanced-settings-header" onclick="toggleResolverSection()">
                                <strong>Resolver Python para Stream</strong>
                                <span id="resolver-section-toggle">▼</span>
                            </div>
                            <div class="advanced-settings-content" id="resolver-section-content">
                                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 4px; margin-bottom: 20px; margin-top: 15px;">
                                    <p><strong>O que é o Resolver Python?</strong></p>
                                    <p>O Resolver Python permite-te:</p>
                                    <ul style="text-align: left;">
                                        <li>Risolvere dinamicamente gli URL di streaming</li>
                                        <li>Aggiungere token de autenticação agli stream</li>
                                        <li>Gestire API protette per i provider de conteúdo</li>
                                        <li>Personalizar as requisições com header específicos</li>
                                    </ul>
                                    <p><strong>Nota: É necessário um script Python que implemente a função <code>resolve_link</code>.</strong></p>
                                </div>
                                <div id="resolverForm">
                                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                                        <button onclick="downloadResolverScript()" style="flex: 1;">DESCARREGAR SCRIPT</button>
                                        <button onclick="createResolverTemplate()" style="flex: 1;">CRIAR MODELO</button>
                                        <button onclick="checkResolverHealth()" style="flex: 1;">VERIFICAR SCRIPT</button>
                                    </div>
                                    <div style="margin-top: 15px;">
                                        <h4>Gestão de Cache e Atualizações</h4>
                                        <div style="display: flex; gap: 10px; align-items: center;">
                                            <input type="text" id="resolverUpdateInterval" placeholder="HH:MM (es. 12:00)" style="flex: 2;">
                                            <button onclick="scheduleResolverUpdates()" style="flex: 1;">AGENDAR</button>
                                            <button onclick="stopResolverUpdates()" style="flex: 1;">PARAR</button>
                                            <button onclick="clearResolverCache()" style="flex: 1;">LIMPAR CACHE</button>
                                        </div>
                                        <small style="color: #999; display: block; margin-top: 5px;">
                                            Formato: HH:MM (ex: 12:00 para 12 horas, 1:00 para 1 hora, 0:30 para 30 minutos)
                                        </small>
                                    </div>
                                    <div id="resolverStatus" style="margin-top: 15px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; display: none;">
                                        <h3>Estado do Resolver Python</h3>
                                        <div id="resolverStatusContent"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ``}
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

                <div style="margin-top: 30px; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 4px;">
                    <strong>ATENÇÃO!</strong>
                    <ul style="text-align: center; margin-top: 10px;">
                        <p>A utilização deste addon é da inteira responsabilidade do utilizador.</p>
                        <p>Respeita sempre a legislação aplicável.</p>
                    </ul>
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
                    ${getViewScripts(protocol, host)}
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
