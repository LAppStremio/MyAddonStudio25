const fs = require('fs');
const path = require('path');

const baseConfig = {
   port: process.env.PORT || 10000,
   defaultUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
   cacheSettings: {
       updateInterval: 2 * 60 * 60 * 1000,
       maxAge: 12 * 60 * 60 * 1000,
       retryAttempts: 3,
       retryDelay: 5000
   },
   epgSettings: {
       maxProgramsPerChannel: 50,
       updateInterval: 2 * 60 * 60 * 1000,
       cacheExpiry: 12 * 60 * 60 * 1000
   },
   manifest: {
       id: 'org.mccoy88f.omgtv',
       version: '2.2.0',
       name: 'MyAddonStudio25',
       description: 'Modalita provvisoria, installazione con errori, attivo mod. provvisoria',
       logo: 'https://github.com/LAppStremio/MyAddonStudio25/blob/main/tv.png?raw=true',
       resources: ['stream', 'catalog', 'meta'],
       types: ['tv'],
       idPrefixes: ['tv'],
       catalogs: [
           {
               type: 'tv',
               id: 'omg_tv',
               name: 'MyAddonStudio25', // ESTE SERÁ SOBRESCRITO PELA LÓGICA DE customConfig.addonName
               extra: [
                   {
                       name: 'genre',
                       isRequired: false,
                       options: []  // Verrà popolato dinamicamente dai generi della playlist
                   },
                   {
                       name: 'search',
                       isRequired: false
                   },
                   {
                       name: 'skip',
                       isRequired: false
                   }
               ]
           }
       ],
       behaviorHints: {
           // --- ALTERAÇÃO AQUI (PRIMEIRA OCORRÊNCIA) ---
           configurable: false, // Alterado de true para false para remover o ícone de definições
           // --- FIM DA ALTERAÇÃO ---
           configurationURL: null,  // Verrà impostato dinamicamente
           reloadRequired: true
       }
   }
};

function loadCustomConfig() {
   const configOverridePath = path.join(__dirname, 'addon-config.json');
   
   try {
       const addonConfigExists = fs.existsSync(configOverridePath);

       if (addonConfigExists) {
           const customConfig = JSON.parse(fs.readFileSync(configOverridePath, 'utf8'));
           
           const mergedConfig = {
               ...baseConfig,
               manifest: {
                   ...baseConfig.manifest,
                   id: customConfig.addonId || baseConfig.manifest.id,
                   name: customConfig.addonName || baseConfig.manifest.name,
                   description: customConfig.addonDescription || baseConfig.manifest.description,
                   version: customConfig.addonVersion || baseConfig.manifest.version,
                   logo: customConfig.addonLogo || baseConfig.manifest.logo,
                   behaviorHints: {
                       // --- ALTERAÇÃO AQUI (SEGUNDA OCORRÊNCIA) ---
                       ...baseConfig.manifest.behaviorHints, // Mantenha isso para herdar outras hints
                       configurable: false, // Definido explicitamente como false aqui também
                       // --- FIM DA ALTERAÇÃO ---
                       configurationURL: null,  // Verrà impostato dinamicamente
                       reloadRequired: true
                   },
                   catalogs: [{
                       ...baseConfig.manifest.catalogs[0],
                       id: customConfig.catalogId || (customConfig.addonId ? customConfig.addonId + '_catalog' : baseConfig.manifest.catalogs[0].id), // Se quiser ID diferente para o catálogo
                       name: customConfig.addonName || baseConfig.manifest.catalogs[0].name, // << AQUI ESTÁ A ALTERAÇÃO CRUCIAL
                       extra: [
                           {
                               name: 'genre',
                               isRequired: false,
                               options: []  // Verrà popolato dinamicamente dai generi della playlist
                           },
                           {
                               name: 'search',
                               isRequired: false
                           },
                           {
                               name: 'skip',
                               isRequired: false
                           }
                       ]
                   }]
               }
           };

           return mergedConfig;
       }
   } catch (error) {
       console.error('Errore nel caricare la configurazione personalizzata:', error);
   }

   return baseConfig;
}

const config = loadCustomConfig();
module.exports = config;
