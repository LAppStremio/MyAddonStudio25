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
       types: ['tv', 'movie'],
       idPrefixes: ['tt', 'tv'],
       behaviorHints: {
           // ALTERAÇÃO FINAL E CRUCIAL
           configurable: false,
           configurationURL: `http://localhost:${process.env.PORT || 10000}/?access_code=${process.env.ACCESS_CODE}`,
           reloadRequired: true
       },
       catalogs: [{
           id: 'omg-tv-catalog',
           name: 'OMGTV',
           type: 'tv',
           genres: [],
           extra: [
               {
                   name: 'genre',
                   isRequired: false,
                   options: []
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

function loadCustomConfig() {
   try {
       const configPath = path.join(__dirname, 'addon-config.json');
       if (fs.existsSync(configPath)) {
           console.log('Caricamento configurazione personalizzata...');
           const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

           const mergedConfig = {
               ...baseConfig,
               ...customConfig,
               manifest: {
                   ...baseConfig.manifest,
                   ...customConfig.manifest,
                   behaviorHints: {
                       ...baseConfig.manifest.behaviorHints,
                       ...customConfig.manifest.behaviorHints
                   },
                   catalogs: [{
                       ...baseConfig.manifest.catalogs[0],
                       ...customConfig.manifest.catalogs[0],
                       id: customConfig.catalogId || (customConfig.addonId ? customConfig.addonId + '_catalog' : baseConfig.manifest.catalogs[0].id),
                       name: customConfig.addonName || baseConfig.manifest.catalogs[0].name,
                       extra: [
                           {
                               name: 'genre',
                               isRequired: false,
                               options: []
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
