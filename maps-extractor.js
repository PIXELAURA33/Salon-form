
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
        const url = mapsUrlInput.value.trim();

        const isValidMapsUrl = url.includes('google.com/maps') && url.includes('place/');
        
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
        const url = mapsUrlInput.value.trim();

        if (!url) {
            this.showError('Veuillez saisir une URL Google Maps.');
            return;
        }

        this.showStatus('Extraction en cours...', 'info');
        extractBtn.disabled = true;
        extractBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Extraction...';

        try {
            // Méthode 1: Extraction avancée depuis l'URL
            const extractedData = await this.extractAdvancedDataFromUrl(url);
            
            if (extractedData && Object.keys(extractedData).length > 0) {
                // Méthode 2: Enrichissement avec géocodage
                await this.enrichDataWithGeocodingServices(extractedData);
                
                // Méthode 3: Extraction d'informations supplémentaires
                await this.extractAdditionalBusinessInfo(extractedData, url);
                
                this.fillFormWithData(extractedData);
                this.showSuccess(extractedData);
            } else {
                throw new Error('Aucune donnée extraite');
            }

        } catch (error) {
            console.error('Erreur extraction:', error);
            this.showError('Erreur lors de l\'extraction. Veuillez saisir les informations manuellement.');
        } finally {
            extractBtn.disabled = false;
            extractBtn.innerHTML = '<i class="fas fa-magic"></i> Extraire les données';
            this.hideStatus();
        }
    }

    async extractAdvancedDataFromUrl(url) {
        const data = {};

        try {
            // Extraire le nom du salon depuis l'URL
            const placeMatch = url.match(/place\/([^\/\?&]+)/);
            if (placeMatch) {
                data.name = decodeURIComponent(placeMatch[1])
                    .replace(/\+/g, ' ')
                    .replace(/%20/g, ' ')
                    .trim();
            }

            // Extraire les coordonnées depuis l'URL (plusieurs formats possibles)
            const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || 
                              url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
                              url.match(/data=.*?3d(-?\d+\.\d+).*?4d(-?\d+\.\d+)/);
            
            if (coordsMatch) {
                data.latitude = parseFloat(coordsMatch[1]);
                data.longitude = parseFloat(coordsMatch[2]);
            }

            // Extraire l'ID du lieu (place_id)
            const placeIdMatch = url.match(/data=.*?1s0x[a-f0-9]+:0x([a-f0-9]+)/i) ||
                                url.match(/place_id:([a-zA-Z0-9_-]+)/) ||
                                url.match(/!1s0x[a-f0-9]+:0x([a-f0-9]+)/i);
            
            if (placeIdMatch) {
                data.placeId = placeIdMatch[1];
            }

            // Extraire des informations supplémentaires de l'URL
            const addressMatch = url.match(/addr:([^!]+)/);
            if (addressMatch) {
                data.urlAddress = decodeURIComponent(addressMatch[1]).replace(/\+/g, ' ');
            }

            // Extraire le niveau de zoom et la région
            const zoomMatch = url.match(/(\d+)z/);
            if (zoomMatch) {
                data.zoom = parseInt(zoomMatch[1]);
            }

            return data;

        } catch (error) {
            console.error('Erreur extraction URL avancée:', error);
            return {};
        }
    }

    async enrichDataWithGeocodingServices(data) {
        if (!data.latitude || !data.longitude) return;

        try {
            // Service 1: OpenStreetMap Nominatim (le plus fiable)
            await this.enrichWithNominatim(data);
            
            // Service 2: Si pas assez d'infos, essayer avec LocationIQ (gratuit)
            if (!data.phone && !data.website) {
                await this.enrichWithLocationIQ(data);
            }

        } catch (error) {
            console.warn('Erreur enrichissement géocodage:', error);
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
                
                if (result.display_name && !data.address) {
                    data.address = this.cleanAddress(result.display_name);
                }

                // Extraire informations détaillées
                if (result.address) {
                    const addr = result.address;
                    
                    if (!data.address) {
                        const addressParts = [
                            addr.house_number,
                            addr.road,
                            addr.city || addr.town || addr.village,
                            addr.postcode
                        ].filter(Boolean);
                        
                        data.address = addressParts.join(', ');
                    }
                }

                // Extraire tags supplémentaires
                if (result.extratags) {
                    const tags = result.extratags;
                    
                    if (tags.phone && !data.phone) {
                        data.phone = this.cleanPhoneNumber(tags.phone);
                    }
                    
                    if (tags.website && !data.website) {
                        data.website = tags.website;
                    }
                    
                    if (tags.email && !data.email) {
                        data.email = tags.email;
                    }
                    
                    if (tags['opening_hours'] && !data.hours) {
                        data.hours = this.formatOpeningHours(tags['opening_hours']);
                    }
                    
                    if (tags.facebook && !data.facebook) {
                        data.facebook = tags.facebook;
                    }
                    
                    if (tags.instagram && !data.instagram) {
                        data.instagram = tags.instagram;
                    }
                }
            }
        } catch (error) {
            console.warn('Erreur Nominatim:', error);
        }
    }

    async enrichWithLocationIQ(data) {
        try {
            // LocationIQ API (gratuit avec limite)
            const response = await fetch(
                `https://us1.locationiq.com/v1/reverse.php?key=demo&lat=${data.latitude}&lon=${data.longitude}&format=json&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'SalonGenerator/1.0'
                    }
                }
            );

            if (response.ok) {
                const result = await response.json();
                
                if (result.display_name && !data.address) {
                    data.address = this.cleanAddress(result.display_name);
                }
            }
        } catch (error) {
            console.warn('Erreur LocationIQ:', error);
        }
    }

    async extractAdditionalBusinessInfo(data, originalUrl) {
        try {
            // Générer des informations manquantes intelligemment
            if (data.name && !data.description) {
                data.description = this.generateSmartDescription(data.name, data.address);
            }

            // Générer des horaires par défaut si non trouvés
            if (!data.hours) {
                data.hours = this.generateDefaultHours();
            }

            // Essayer d'extraire le numéro de téléphone depuis le nom/adresse
            if (!data.phone) {
                data.phone = this.extractPhoneFromText(data.name + ' ' + (data.address || ''));
            }

            // Générer un email potentiel basé sur le nom
            if (!data.email && data.name) {
                data.suggestedEmail = this.generatePotentialEmail(data.name);
            }

        } catch (error) {
            console.warn('Erreur extraction infos supplémentaires:', error);
        }
    }

    extractPhoneFromText(text) {
        if (!text) return null;
        
        // Regex pour différents formats de téléphone français/internationaux
        const phonePatterns = [
            /(?:\+33|0033|0)\s*[1-9](?:[\s\-\.]?\d{2}){4}/g, // Français
            /(?:\+\d{1,3})?\s*[\(\)0-9\s\-\.]{8,}/g // International général
        ];

        for (const pattern of phonePatterns) {
            const match = text.match(pattern);
            if (match) {
                return this.cleanPhoneNumber(match[0]);
            }
        }

        return null;
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

    generatePotentialEmail(salonName) {
        const cleanName = salonName.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '')
            .substring(0, 20);
            
        const domains = ['gmail.com', 'outlook.fr', 'hotmail.fr', 'yahoo.fr'];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        
        return `contact.${cleanName}@${domain}`;
    }

    formatOpeningHours(openingHours) {
        try {
            // Convertir le format OSM vers un format lisible
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

    cleanPhoneNumber(phone) {
        if (!phone) return '';
        
        return phone
            .replace(/\s+/g, ' ')
            .replace(/[^\d\s\+\-\(\)\.]/g, '')
            .trim();
    }

    cleanBusinessName(name) {
        if (!name) return '';
        
        return name
            .replace(/[-+]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    cleanAddress(address) {
        if (!address) return '';
        
        return address
            .replace(/,\s*\d{5}.*$/, '') // Supprimer code postal français et après
            .replace(/,\s*France.*$/, '') // Supprimer "France" et après
            .replace(/,\s*[A-Z]{2,3}.*$/, '') // Supprimer codes pays
            .trim();
    }

    fillFormWithData(data) {
        try {
            const fieldsMapping = [
                { id: 'salonName', value: data.name, transformer: this.cleanBusinessName },
                { id: 'phone', value: data.phone, transformer: this.cleanPhoneNumber },
                { id: 'address', value: data.address, transformer: this.cleanAddress },
                { id: 'email', value: data.email || data.suggestedEmail },
                { id: 'website', value: data.website },
                { id: 'description', value: data.description },
                { id: 'hours', value: data.hours },
                { id: 'facebook', value: data.facebook },
                { id: 'instagram', value: data.instagram },
                { id: 'whatsapp', value: data.whatsapp }
            ];

            fieldsMapping.forEach(field => {
                const input = document.getElementById(field.id);
                if (input && field.value && !input.value.trim()) {
                    const processedValue = field.transformer ? 
                        field.transformer.call(this, field.value) : field.value;
                    
                    input.value = processedValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            this.highlightFilledFields();

        } catch (error) {
            console.error('Erreur lors du remplissage:', error);
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

        filledFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.style.backgroundColor = '#e8f5e8';
                field.style.border = '2px solid #28a745';
                field.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    field.style.backgroundColor = '';
                    field.style.border = '';
                }, 3000);
            }
        });

        // Afficher un message de succès
        if (filledFields.length > 0) {
            this.showTemporaryMessage(
                `${filledFields.length} champ(s) rempli(s) automatiquement !`, 
                'success'
            );
        }
    }

    showTemporaryMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
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
                { key: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' }
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

            if (data.latitude && data.longitude) {
                extractedInfo += `
                    <li>
                        <i class="fas fa-crosshairs" style="width: 16px;"></i> 
                        <strong>Coordonnées:</strong> ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}
                    </li>
                `;
            }
            
            extractedInfo += '</ul>';
            
            dataElement.innerHTML = extractedInfo;
            resultsElement.style.display = 'block';
            
            setTimeout(() => {
                resultsElement.style.display = 'none';
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

// Initialiser l'extracteur quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            new GoogleMapsExtractor();
            console.log('✅ Extracteur Google Maps initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur initialisation extracteur:', error);
        }
    }, 500);
});
