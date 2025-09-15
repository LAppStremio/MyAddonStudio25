const fs = require('fs');
const path = require('path');

// --- Início do Script Corrigido e Mais Robusto ---
const getFinalViewScripts = (protocol, host) => {
    return `
        function copyManifestUrl() {
            const form = document.getElementById('configForm');
            if (!form) return;

            const formData = new FormData(form);
            const queryParams = new URLSearchParams(formData);
            queryParams.delete('access_code'); // Remove o código de acesso para o URL partilhável

            const manifestUrl = \`\${protocol}://\${host}/manifest.json?\${queryParams.toString()}\`;

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
            // SOLUÇÃO: Lê os dados diretamente do formulário no momento do clique.
            const form = document.getElementById('configForm');
            if (!form) {
                alert('Erro: Formulário de configuração não encontrado.');
                return;
            }

            // Pega nos dados atuais do formulário
            const formData = new FormData(form);
            const queryParams = new URLSearchParams(formData);

            // Remove o código de acesso antes de enviar para o Stremio
            queryParams.delete('access_code');

            // Verifica se o campo essencial (m3u) está preenchido
            if (!queryParams.has('m3u') || queryParams.get('m3u') === '') {
                 alert('Por favor, preencha o campo URL antes de instalar.');
                 cancelInstallation();
                 return;
            }

            const manifestUrl = \`\${protocol}://\${host}/manifest.json?\${queryParams.toString()}\`;
            
            // Redireciona para o Stremio com a configuração completa e correta
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
    `;
};
// --- Fim do Script Corrigido ---


const renderConfigPage = (protocol, host, query, manifest) => {
    const accessCodeCorrect = query.access_code === process.env.ACCESS_CODE;
    const contentVisible = accessCodeCorrect;
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
                :root { --bg-color: #202020; --panel-bg-color: #333333; --shadow-dark: #1a1a1a; --shadow-light: #444444; }
                body { background-color: var(--bg-color); margin: 0; padding: 0; height: 100vh; overflow-y: auto; font-family: Arial, sans-serif; color: #fff; }
                .content, .config-form, .advanced-settings, #confirmModal > div {
                    background-color: var(--panel-bg-color) !important;
                    box-shadow: 10px 10px 20px var(--shadow-dark), -10px -10px 20px var(--shadow-light);
                    border-radius: 12px !important;
                }
                .content { position: relative; z-index: 1; max-width: 800px; margin: 0 auto; text-align: center; padding: 50px 20px; background: rgba(0,0,0,0.6); min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-start; }
                .logo { width: 150px; margin: 0 auto 20px; display: block; }
                .manifest-url { background: rgba(255,255,255,0.1); padding: 10px; border-radius: 4px; word-break: break-all; margin: 20px 0; font-size: 12px; }
                .config-form { text-align: left; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 4px; margin-top: 30px; }
                .config-form label { display: block; margin: 10px 0 5px; color: #fff; }
                .config-form input[type="text"], .config-form input[type="url"], .config-form input[type="password"] { width: 100%; padding: 8px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #666; background: #333; color: white; }
                .buttons { margin: 30px 0; display: flex; justify-content: center; gap: 20px; }
                button, input[type="submit"] { background: #8A5AAB; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; }
                input[type="submit"] { width: 100%; margin-top: 20px; }
                .toast { position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px 30px; border-radius: 4px; display: none; }
                .advanced-settings { background: rgba(255,255,255,0.05); border: 1px solid #666; border-radius: 4px; padding: 10px; margin-top: 10px; }
                .advanced-settings-header { cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: #fff; }
                .advanced-settings-content { display: none; padding-top: 10px; }
                .advanced-settings-content.show { display: block; }
                #confirmModal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; justify-content: center; align-items: center; }
                #confirmModal > div { background: #333; padding: 30px; border-radius: 10px; text-align: center; color: white; }
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
                    <ul style="text-align: center; margin-top: 10px; list-style: none; padding: 0;">
                        <li>A utilização deste addon é da inteira responsabilidade do utilizador.</li>
                        <li>Respeita sempre a legislação aplicável.</li>
                    </ul>
                </div>
                
                ${contentVisible ? 
                `
                <div class="manifest-url">
                    <strong>URL Manifest (para partilhar):</strong><br>
                    <span>Clique em "Copiar URL" para obter o link com a configuração atual.</span>
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
                                <input type="text" name="id_suffix" value="${query.id_suffix || ''}" placeholder="Exemplo: it">
                            </div>
                        </div>
                        <input type="hidden" name="access_code" value="${query.access_code || ''}">
                        <input type="submit" value="Gerar Configuração (Recarregar Página)">
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
                    <p>Addon editado por LAppDesign.</p>
                    ` : ``}
                </div>
            
                <div id="confirmModal">
                    <div>
                        <h2>Confirmar Instalação</h2>
                        <p>Deseja instalar o addon no Stremio com a configuração atual do formulário?</p>
                        <div style="margin-top: 20px;">
                            <button onclick="cancelInstallation()" style="background: #666;">Voltar</button>
                            <button onclick="proceedInstallation()" style="background: #8A5AAB;">Prosseguir</button>
                        </div>
                    </div>
                </div>

                <div id="toast" class="toast">URL Copiado!</div>

                <script>
                    ${getFinalViewScripts(protocol, host)}
                </script>
            </div>
        </body>
        </html>
    `;
};

module.exports = {
    renderConfigPage
};

