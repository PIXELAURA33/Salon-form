
class GoogleMapsExtractor {
    constructor() {
        this.corsProxyUrl = 'https://api.allorigins.win/raw?url=';
        this.alternativeProxies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        this.init();
    }

    init() {
        this.addExtractorUI();
        this.setupEventListeners();
    }

    addExtractorUI() {
        const sectionHeader = document.querySelector('.section-header');
        if (sectionHeader) {
            const extractorHTML = `
                <div class="card mb-4" id="mapsExtractor">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0"><i class="fab fa-google"></i> Extracteur Google Maps</h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">Remplissez automatiquement vos informations à partir d'une page Google Maps de votre salon.</p>
                        <div class="row">
                            <div class="col-md-8">
                                <div class="mb-3">
                                    <label for="mapsUrl" class="form-label">URL Google Maps</label>
                                    <input type="url" class="form-control" id="mapsUrl" 
                                           placeholder="https://www.google.com/maps/place/votre-salon...">
                                    <small class="form-text text-muted">
                                        Copiez l'URL complète de votre salon depuis Google Maps
                                    </small>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">&nbsp;</label>
                                <div class="d-grid">
                                    <button type="button" id="extractBtn" class="btn btn-info">
                                        <i class="fas fa-magic"></i> Extraire les données
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div id="extractionStatus" class="mt-3" style="display: none;"></div>
                        <div id="extractionResults" class="mt-3" style="display: none;">
                            <div class="alert alert-success">
                                <h6><i class="fas fa-check"></i> Données extraites avec succès !</h6>
                                <div id="extractedData"></div>
                            </div>
                        </div>
                        <div id="extractionError" class="mt-3" style="display: none;"></div>
                    </div>
                </div>
            `;
            sectionHeader.insertAdjacentHTML('beforebegin', extractorHTML);
        }
    }

    setupEventListeners() {
        const extractBtn = document.getElementById('extractBtn');
        const mapsUrlInput = document.getElementById('mapsUrl');

        if (extractBtn) {
            extractBtn.addEventListener('click', () => this.extractFromMaps());
        }

        if (mapsUrlInput) {
            mapsUrlInput.addEventListener('input', () => this.validateUrl());
            mapsUrlInput.addEventListener('paste', (e) => {
                setTimeout(() => this.validateUrl(), 100);
            });
        }
    }

    validateUrl() {
        const mapsUrlInput = document.getElementById('mapsUrl');
        const extractBtn = document.getElementById('extractBtn');
        const url = mapsUrlInput?.value?.trim() || '';

        const isValidMapsUrl = url.includes('google.com/maps') && (url.includes('place/') || url.includes('search/'));
        
        if (extractBtn) {
            extractBtn.disabled = !isValidMapsUrl;
        }

        if (url && !isValidMapsUrl) {
            this.showError('URL Google Maps invalide. Veuillez copier l\'URL complète depuis Google Maps.');
        } else {
            this.clearError();
        }
    }

    async extractFromMaps() {
        const mapsUrlInput = document.getElementById('mapsUrl');
        const extractBtn = document.getElementById('extractBtn');
        const url = mapsUrlInput?.value?.trim() || '';

        if (!url) {
            this.showError('Veuillez saisir une URL Google Maps.');
            return;
        }

        this.showStatus('Extraction en cours...', 'info');
        if (extractBtn) {
            extractBtn.disabled = true;
            extractBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Extraction...';
        }

        try {
            // Méthode 1: Extraction avancée depuis l'URL
            const extractedData = await this.extractAdvancedDataFromUrl(url);
            
            // Méthode 2: Enrichissement avec géocodage multiple
            if (extractedData.latitude && extractedData.longitude) {
                await this.enrichDataWithMultipleServices(extractedData);
            }
            
            // Méthode 3: Extraction depuis le contenu de la page
            await this.extractFromPageContent(url, extractedData);
            
            // Méthode 4: Recherche intelligente des réseaux sociaux
            if (extractedData.name) {
                await this.findSocialMediaLinks(extractedData);
            }
            
            if (extractedData && Object.keys(extractedData).length > 0) {
                this.fillFormWithData(extractedData);
                this.showSuccess(extractedData);
            } else {
                throw new Error('Aucune donnée extraite');
            }

        } catch (error) {
            console.error('Erreur extraction:', error);
            this.showError('Erreur lors de l\'extraction. Veuillez saisir les informations manuellement.');
        } finally {
            if (extractBtn) {
                extractBtn.disabled = false;
                extractBtn.innerHTML = '<i class="fas fa-magic"></i> Extraire les données';
            }
            this.hideStatus();
        }
    }

    async extractAdvancedDataFromUrl(url) {
        const data = {};

        try {
            // Extraire le nom du salon depuis l'URL (plusieurs formats)
            const placeMatch = url.match(/place\/([^\/\?&@]+)/) || 
                              url.match(/search\/([^\/\?&@]+)/) ||
                              url.match(/dir\/[^\/]*\/([^\/\?&@]+)/);
            
            if (placeMatch) {
                data.name = decodeURIComponent(placeMatch[1])
                    .replace(/\+/g, ' ')
                    .replace(/%20/g, ' ')
                    .replace(/[-_]/g, ' ')
                    .trim();
            }

            // Extraire les coordonnées (tous les formats possibles)
            const coordsPatterns = [
                /@(-?\d+\.\d+),(-?\d+\.\d+)/,
                /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
                /data=.*?3d(-?\d+\.\d+).*?4d(-?\d+\.\d+)/,
                /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
                /center=(-?\d+\.\d+),(-?\d+\.\d+)/
            ];
            
            for (const pattern of coordsPatterns) {
                const match = url.match(pattern);
                if (match) {
                    data.latitude = parseFloat(match[1]);
                    data.longitude = parseFloat(match[2]);
                    break;
                }
            }

            // Extraire numéro de téléphone directement de l'URL
            const phonePatterns = [
                /phone[=:]([+\d\s\-\(\)]+)/i,
                /tel[=:]([+\d\s\-\(\)]+)/i,
                /(\+33[1-9][\d\s\-\.]{8,})/,
                /(0[1-9][\d\s\-\.]{8,})/
            ];
            
            for (const pattern of phonePatterns) {
                const match = url.match(pattern);
                if (match) {
                    data.phone = this.cleanPhoneNumber(match[1]);
                    break;
                }
            }

            return data;

        } catch (error) {
            console.error('Erreur extraction URL:', error);
            return {};
        }
    }

    async enrichDataWithMultipleServices(data) {
        try {
            // Service 1: Nominatim OpenStreetMap
            await this.enrichWithNominatim(data);
            
            // Service 2: Places API alternatif
            await this.enrichWithAlternativePlacesAPI(data);

        } catch (error) {
            console.warn('Erreur enrichissement:', error);
        }
    }

    async enrichWithNominatim(data) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.latitude}&lon=${data.longitude}&zoom=18&addressdetails=1&extratags=1&namedetails=1`,
                {
                    headers: {
                        'User-Agent': 'SalonGenerator/1.0 (Contact: support@salongenerator.com)'
                    }
                }
            );

            if (response.ok) {
                const result = await response.json();
                
                // Nom du lieu
                if (result.display_name && !data.name) {
                    const nameParts = result.display_name.split(',');
                    data.name = nameParts[0].trim();
                }

                // Adresse
                if (result.display_name && !data.address) {
                    data.address = this.cleanAddress(result.display_name);
                }

                // Tags détaillés
                if (result.extratags) {
                    const tags = result.extratags;
                    this.extractTagsData(tags, data);
                }

                // Adresse structurée
                if (result.address && !data.address) {
                    data.address = this.buildAddressFromComponents(result.address);
                }
            }
        } catch (error) {
            console.warn('Erreur Nominatim:', error);
        }
    }

    extractTagsData(tags, data) {
        // Téléphone
        const phoneFields = ['phone', 'contact:phone', 'mobile', 'contact:mobile'];
        for (const field of phoneFields) {
            if (tags[field] && !data.phone) {
                data.phone = this.cleanPhoneNumber(tags[field]);
                break;
            }
        }
        
        // Site web
        const websiteFields = ['website', 'contact:website', 'url'];
        for (const field of websiteFields) {
            if (tags[field] && !data.website) {
                data.website = this.cleanUrl(tags[field]);
                break;
            }
        }
        
        // Email
        const emailFields = ['email', 'contact:email'];
        for (const field of emailFields) {
            if (tags[field] && !data.email) {
                data.email = tags[field];
                break;
            }
        }
        
        // Horaires
        if (tags['opening_hours'] && !data.hours) {
            data.hours = this.formatOpeningHours(tags['opening_hours']);
        }
        
        // Réseaux sociaux
        const facebookFields = ['facebook', 'contact:facebook'];
        for (const field of facebookFields) {
            if (tags[field] && !data.facebook) {
                data.facebook = this.cleanSocialUrl(tags[field], 'facebook');
                break;
            }
        }
        
        const instagramFields = ['instagram', 'contact:instagram'];
        for (const field of instagramFields) {
            if (tags[field] && !data.instagram) {
                data.instagram = this.cleanSocialUrl(tags[field], 'instagram');
                break;
            }
        }
        
        // WhatsApp
        const whatsappFields = ['whatsapp', 'contact:whatsapp'];
        for (const field of whatsappFields) {
            if (tags[field] && !data.whatsapp) {
                data.whatsapp = this.extractWhatsAppNumber(tags[field]);
                break;
            }
        }
    }

    buildAddressFromComponents(address) {
        const components = [];
        
        if (address.house_number) components.push(address.house_number);
        if (address.road) components.push(address.road);
        if (address.postcode) components.push(address.postcode);
        if (address.city || address.town || address.village) {
            components.push(address.city || address.town || address.village);
        }
        
        return components.join(', ');
    }

    async enrichWithAlternativePlacesAPI(data) {
        try {
            // Utiliser Overpass API pour plus de détails
            const overpassQuery = `
                [out:json][timeout:25];
                (
                  node(around:100,${data.latitude},${data.longitude})["amenity"~"^(hairdresser|beauty_salon)$"];
                  way(around:100,${data.latitude},${data.longitude})["amenity"~"^(hairdresser|beauty_salon)$"];
                  relation(around:100,${data.latitude},${data.longitude})["amenity"~"^(hairdresser|beauty_salon)$"];
                );
                out tags;
            `;
            
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: overpassQuery,
                headers: {
                    'Content-Type': 'text/plain'
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.elements && result.elements.length > 0) {
                    const element = result.elements[0];
                    const tags = element.tags || {};
                    
                    this.extractTagsData(tags, data);
                }
            }
        } catch (error) {
            console.warn('Erreur Overpass API:', error);
        }
    }

    async extractFromPageContent(url, data) {
        try {
            // Essayer plusieurs proxies CORS
            const proxies = [
                this.corsProxyUrl,
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://cors-anywhere.herokuapp.com/'
            ];

            for (const proxy of proxies) {
                try {
                    const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
                    const response = await fetch(proxyUrl, {
                        timeout: 10000
                    });
                    
                    if (response.ok) {
                        const text = await response.text();
                        this.parsePageContent(text, data);
                        break; // Sortir si succès
                    }
                } catch (error) {
                    console.warn(`Proxy ${proxy} failed:`, error);
                    continue;
                }
            }
        } catch (error) {
            console.warn('Erreur extraction contenu page:', error);
        }
    }

    parsePageContent(html, data) {
        // Rechercher les numéros de téléphone français
        if (!data.phone) {
            const phonePatterns = [
                /(?:\+33|0)[1-9](?:[\s\-\.]?\d{2}){4}/g,
                /(?:\+33\s?|0)(?:[1-7]|8[0-9]|9[0-6])(?:[\s\-\.]?\d{2}){4}/g
            ];
            
            for (const pattern of phonePatterns) {
                const matches = html.match(pattern);
                if (matches && matches.length > 0) {
                    data.phone = this.cleanPhoneNumber(matches[0]);
                    break;
                }
            }
        }
        
        // Rechercher les emails
        if (!data.email) {
            const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
            if (emailMatches && emailMatches.length > 0) {
                data.email = emailMatches[0];
            }
        }
        
        // Rechercher Facebook
        if (!data.facebook) {
            const facebookMatches = html.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/g);
            if (facebookMatches && facebookMatches.length > 0) {
                data.facebook = this.cleanSocialUrl(facebookMatches[0], 'facebook');
            }
        }
        
        // Rechercher Instagram
        if (!data.instagram) {
            const instagramMatches = html.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/g);
            if (instagramMatches && instagramMatches.length > 0) {
                data.instagram = this.cleanSocialUrl(instagramMatches[0], 'instagram');
            }
        }
        
        // Rechercher WhatsApp
        if (!data.whatsapp) {
            const whatsappPatterns = [
                /(?:https?:\/\/)?(?:wa\.me|whatsapp\.com\/send)\?phone=(\d+)/g,
                /whatsapp:\/\/send\?phone=(\d+)/g
            ];
            
            for (const pattern of whatsappPatterns) {
                const matches = html.match(pattern);
                if (matches && matches.length > 0) {
                    const match = matches[0].match(/phone=(\d+)/);
                    if (match) {
                        data.whatsapp = match[1];
                        break;
                    }
                }
            }
        }
    }

    async findSocialMediaLinks(data) {
        if (!data.name) return;
        
        try {
            const normalizedName = this.normalizeName(data.name);
            
            // Générer des URLs probables pour Facebook
            if (!data.facebook) {
                const facebookUrls = [
                    normalizedName.replace(/\s+/g, ''),
                    normalizedName.replace(/\s+/g, '.'),
                    normalizedName.replace(/\s+/g, '-')
                ].map(name => `https://www.facebook.com/${name}`);
                
                for (const url of facebookUrls) {
                    if (await this.checkSocialUrlExists(url)) {
                        data.facebook = url;
                        break;
                    }
                }
            }
            
            // Générer des URLs probables pour Instagram
            if (!data.instagram) {
                const instagramUrls = [
                    normalizedName.replace(/\s+/g, ''),
                    normalizedName.replace(/\s+/g, '_'),
                    normalizedName.replace(/\s+/g, '.')
                ].map(name => `https://www.instagram.com/${name}`);
                
                for (const url of instagramUrls) {
                    if (await this.checkSocialUrlExists(url)) {
                        data.instagram = url;
                        break;
                    }
                }
            }
            
        } catch (error) {
            console.warn('Erreur recherche réseaux sociaux:', error);
        }
    }

    async checkSocialUrlExists(url) {
        try {
            // Utiliser un proxy pour vérifier l'existence
            const response = await fetch(`${this.corsProxyUrl}${encodeURIComponent(url)}`, { 
                method: 'HEAD',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    normalizeName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    cleanPhoneNumber(phone) {
        if (!phone) return '';
        
        // Nettoyer et formater le numéro
        let cleaned = phone
            .replace(/[^\d\+]/g, '')
            .trim();
        
        // Convertir au format international français si nécessaire
        if (cleaned.startsWith('0') && cleaned.length === 10) {
            cleaned = '+33' + cleaned.substring(1);
        }
        
        return cleaned;
    }

    extractWhatsAppNumber(whatsapp) {
        if (!whatsapp) return '';
        
        // Extraire le numéro de différents formats WhatsApp
        const patterns = [
            /(\+?\d{10,15})/,
            /phone=(\d+)/,
            /(\d{10,15})/
        ];
        
        for (const pattern of patterns) {
            const match = whatsapp.match(pattern);
            if (match) {
                let number = match[1];
                if (number.startsWith('+')) {
                    number = number.substring(1);
                }
                return number;
            }
        }
        
        return '';
    }

    cleanUrl(url) {
        if (!url) return '';
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        return url;
    }

    cleanSocialUrl(url, platform) {
        if (!url) return '';
        
        // Nettoyer et normaliser les URLs des réseaux sociaux
        url = url.replace(/^.*?\/\//g, 'https://');
        
        if (platform === 'facebook') {
            if (!url.includes('facebook.com')) {
                url = `https://www.facebook.com/${url.replace(/https?:\/\//, '')}`;
            }
        } else if (platform === 'instagram') {
            if (!url.includes('instagram.com')) {
                url = `https://www.instagram.com/${url.replace(/https?:\/\//, '')}`;
            }
        }
        
        return url;
    }

    generateSmartDescription(name, address) {
        const templates = [
            `Bienvenue chez ${name}, votre salon de coiffure professionnel${address ? ` situé ${address}` : ''}. Notre équipe passionnée vous offre des services de qualité dans une atmosphère chaleureuse et moderne.`,
            
            `${name} vous accueille pour tous vos besoins capillaires. Coupe, coloration, soins et styling - nous mettons notre expertise et notre créativité à votre service pour sublimer votre beauté naturelle.`,
            
            `Découvrez ${name}, où l'art de la coiffure rencontre l'excellence du service. Notre salon moderne vous propose une expérience unique alliant tendance, technicité et personnalisation.`,
            
            `Chez ${name}, nous croyons que chaque client mérite une attention particulière. Notre équipe de coiffeurs experts vous conseille et vous accompagne pour révéler votre style unique.`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }

    generateDefaultHours() {
        const defaultHours = [
            "Lundi - Vendredi: 9h00 - 18h00\nSamedi: 9h00 - 17h00\nDimanche: Fermé",
            "Mardi - Samedi: 9h00 - 19h00\nLundi: 14h00 - 19h00\nDimanche: Fermé",
            "Lundi - Vendredi: 8h30 - 18h30\nSamedi: 8h30 - 17h00\nDimanche: Sur rendez-vous"
        ];
        
        return defaultHours[Math.floor(Math.random() * defaultHours.length)];
    }

    formatOpeningHours(openingHours) {
        try {
            return openingHours
                .replace(/Mo/g, 'Lundi')
                .replace(/Tu/g, 'Mardi')
                .replace(/We/g, 'Mercredi')
                .replace(/Th/g, 'Jeudi')
                .replace(/Fr/g, 'Vendredi')
                .replace(/Sa/g, 'Samedi')
                .replace(/Su/g, 'Dimanche')
                .replace(/;/g, '\n')
                .replace(/-/g, ' - ');
        } catch (error) {
            return openingHours;
        }
    }

    cleanAddress(address) {
        if (!address) return '';
        
        return address
            .replace(/,\s*\d{5}.*$/, '')
            .replace(/,\s*France.*$/, '')
            .replace(/,\s*[A-Z]{2,3}.*$/, '')
            .trim();
    }

    fillFormWithData(data) {
        try {
            const fieldsMapping = [
                { id: 'salonName', value: data.name },
                { id: 'phone', value: data.phone },
                { id: 'address', value: data.address },
                { id: 'email', value: data.email },
                { id: 'website', value: data.website },
                { id: 'description', value: data.description || (data.name ? this.generateSmartDescription(data.name, data.address) : '') },
                { id: 'hours', value: data.hours || this.generateDefaultHours() },
                { id: 'facebook', value: data.facebook },
                { id: 'instagram', value: data.instagram },
                { id: 'whatsapp', value: data.whatsapp }
            ];

            fieldsMapping.forEach(field => {
                const input = document.getElementById(field.id);
                if (input && field.value && !input.value.trim()) {
                    input.value = field.value;
                    
                    // Déclencher les événements nécessaires
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            this.triggerPreviewUpdate();
            this.highlightFilledFields();

        } catch (error) {
            console.error('Erreur lors du remplissage:', error);
        }
    }

    triggerPreviewUpdate() {
        try {
            if (typeof window.siteGenerator !== 'undefined' && window.siteGenerator.updatePreview) {
                window.siteGenerator.updatePreview();
            }
            
            const updateEvent = new CustomEvent('formDataUpdated', {
                detail: { source: 'mapsExtractor' }
            });
            document.dispatchEvent(updateEvent);
            
        } catch (error) {
            console.warn('Erreur mise à jour preview:', error);
        }
    }

    highlightFilledFields() {
        const fieldsToHighlight = [
            'salonName', 'phone', 'address', 'email', 'website', 
            'description', 'hours', 'facebook', 'instagram', 'whatsapp'
        ];

        const filledFields = fieldsToHighlight.filter(id => {
            const field = document.getElementById(id);
            return field && field.value.trim();
        });

        filledFields.forEach((fieldId, index) => {
            const field = document.getElementById(fieldId);
            if (field) {
                setTimeout(() => {
                    field.style.backgroundColor = '#e8f5e8';
                    field.style.border = '2px solid #28a745';
                    field.style.transition = 'all 0.5s ease';
                    
                    setTimeout(() => {
                        field.style.backgroundColor = '';
                        field.style.border = '';
                        field.style.borderLeft = '4px solid #28a745';
                        
                        setTimeout(() => {
                            field.style.borderLeft = '';
                        }, 5000);
                    }, 2000);
                }, index * 150);
            }
        });

        if (filledFields.length > 0) {
            this.showTemporaryMessage(
                `✨ ${filledFields.length} champ(s) rempli(s) automatiquement !`, 
                'success'
            );
        }
    }

    showTemporaryMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed temp-message`;
        messageDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        messageDiv.innerHTML = `
            <i class="fas fa-check-circle"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('extractionStatus');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="alert alert-${type} mb-0">
                    <i class="fas fa-info-circle"></i> ${message}
                </div>
            `;
            statusElement.style.display = 'block';
        }
    }

    hideStatus() {
        const statusElement = document.getElementById('extractionStatus');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    }

    showSuccess(data) {
        const resultsElement = document.getElementById('extractionResults');
        const dataElement = document.getElementById('extractedData');
        
        if (resultsElement && dataElement) {
            let extractedInfo = '<ul class="mb-0">';
            
            const infoMapping = [
                { key: 'name', label: 'Nom', icon: 'fas fa-store' },
                { key: 'phone', label: 'Téléphone', icon: 'fas fa-phone' },
                { key: 'address', label: 'Adresse', icon: 'fas fa-map-marker-alt' },
                { key: 'email', label: 'Email', icon: 'fas fa-envelope' },
                { key: 'website', label: 'Site web', icon: 'fas fa-globe' },
                { key: 'hours', label: 'Horaires', icon: 'fas fa-clock' },
                { key: 'facebook', label: 'Facebook', icon: 'fab fa-facebook' },
                { key: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' },
                { key: 'whatsapp', label: 'WhatsApp', icon: 'fab fa-whatsapp' }
            ];

            infoMapping.forEach(info => {
                if (data[info.key]) {
                    const value = info.key === 'hours' ? 
                        data[info.key].replace(/\n/g, '<br>') : data[info.key];
                    extractedInfo += `
                        <li>
                            <i class="${info.icon}" style="width: 16px;"></i> 
                            <strong>${info.label}:</strong> ${value}
                        </li>
                    `;
                }
            });
            
            extractedInfo += '</ul>';
            
            dataElement.innerHTML = extractedInfo;
            resultsElement.style.display = 'block';
            resultsElement.classList.add('extraction-success-animation');
            
            setTimeout(() => {
                resultsElement.style.display = 'none';
                resultsElement.classList.remove('extraction-success-animation');
            }, 15000);
        }
        
        this.clearError();
    }

    showError(message) {
        const errorElement = document.getElementById('extractionError');
        if (errorElement) {
            errorElement.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> ${message}
                </div>
            `;
            errorElement.style.display = 'block';
        }
        
        this.hideStatus();
        const resultsElement = document.getElementById('extractionResults');
        if (resultsElement) {
            resultsElement.style.display = 'none';
        }
    }

    clearError() {
        const errorElement = document.getElementById('extractionError');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
}

// Initialiser l'extracteur
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            if (!window.mapsExtractor) {
                window.mapsExtractor = new GoogleMapsExtractor();
                console.log('✅ Extracteur Google Maps corrigé et initialisé');
            }
        } catch (error) {
            console.error('❌ Erreur initialisation extracteur:', error);
        }
    }, 1000);
});
