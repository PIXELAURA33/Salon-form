
class GoogleMapsExtractor {
    constructor() {
        this.corsProxyUrl = 'https://api.allorigins.win/raw?url=';
        this.init();
    }

    init() {
        this.addExtractorUI();
        this.setupEventListeners();
    }

    addExtractorUI() {
        // Ajouter l'interface d'extraction avant les informations de base
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

        // Afficher le statut de chargement
        this.showStatus('Extraction en cours...', 'info');
        extractBtn.disabled = true;
        extractBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Extraction...';

        try {
            // Méthode 1: Extraction depuis l'URL directement
            const extractedData = await this.extractFromUrl(url);
            
            if (extractedData && (extractedData.name || extractedData.address)) {
                this.fillFormWithData(extractedData);
                this.showSuccess(extractedData);
            } else {
                // Méthode 2: Tentative avec proxy CORS
                await this.extractWithProxy(url);
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

    async extractFromUrl(url) {
        try {
            // Extraire les données depuis l'URL elle-même
            const data = {};

            // Extraire le nom du salon depuis l'URL
            const placeMatch = url.match(/place\/([^\/]+)/);
            if (placeMatch) {
                data.name = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
            }

            // Extraire les coordonnées depuis l'URL
            const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (coordsMatch) {
                data.latitude = parseFloat(coordsMatch[1]);
                data.longitude = parseFloat(coordsMatch[2]);
            }

            // Extraire l'ID du lieu
            const placeIdMatch = url.match(/data=.*?1s0x[a-f0-9]+:0x([a-f0-9]+)/i);
            if (placeIdMatch) {
                data.placeId = placeIdMatch[1];
            }

            return data;

        } catch (error) {
            console.error('Erreur extraction URL:', error);
            return null;
        }
    }

    async extractWithProxy(url) {
        try {
            // Utiliser un service de géocodage inverse pour obtenir l'adresse
            const extractedData = await this.extractFromUrl(url);
            
            if (extractedData && extractedData.latitude && extractedData.longitude) {
                // Utiliser les coordonnées pour obtenir plus d'informations
                const address = await this.reverseGeocode(extractedData.latitude, extractedData.longitude);
                if (address) {
                    extractedData.address = address;
                }
            }

            if (extractedData && (extractedData.name || extractedData.address)) {
                this.fillFormWithData(extractedData);
                this.showSuccess(extractedData);
            } else {
                throw new Error('Aucune donnée extraite');
            }

        } catch (error) {
            console.error('Erreur extraction avec proxy:', error);
            this.showError('Impossible d\'extraire les données automatiquement. Veuillez saisir les informations manuellement.');
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            // Utiliser OpenStreetMap Nominatim pour le géocodage inverse (gratuit, sans API)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: {
                    'User-Agent': 'SalonGenerator/1.0'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.display_name) {
                    return data.display_name;
                }
            }
        } catch (error) {
            console.warn('Erreur géocodage inverse:', error);
        }
        return null;
    }

    fillFormWithData(data) {
        try {
            // Remplir le nom du salon
            if (data.name) {
                const salonNameInput = document.getElementById('salonName');
                if (salonNameInput && !salonNameInput.value.trim()) {
                    salonNameInput.value = this.cleanBusinessName(data.name);
                    salonNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            // Remplir l'adresse
            if (data.address) {
                const addressInput = document.getElementById('address');
                if (addressInput && !addressInput.value.trim()) {
                    addressInput.value = this.cleanAddress(data.address);
                    addressInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            // Générer une description automatique
            if (data.name && !document.getElementById('description').value.trim()) {
                const description = this.generateDescription(data.name);
                document.getElementById('description').value = description;
            }

            // Marquer les champs comme remplis
            this.highlightFilledFields();

        } catch (error) {
            console.error('Erreur lors du remplissage:', error);
        }
    }

    cleanBusinessName(name) {
        // Nettoyer le nom du salon
        return name
            .replace(/[-+]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    cleanAddress(address) {
        // Nettoyer l'adresse
        return address
            .replace(/,\s*\d+.*$/, '') // Supprimer le code postal et après
            .trim();
    }

    generateDescription(salonName) {
        const descriptions = [
            `Bienvenue chez ${salonName}, votre salon de coiffure de confiance. Notre équipe de professionnels vous offre des services de qualité dans une atmosphère chaleureuse.`,
            `${salonName} vous accueille pour tous vos besoins capillaires. Coupe, coloration, soins - nous mettons notre expertise à votre service.`,
            `Découvrez ${salonName}, où style et professionnalisme se rencontrent. Laissez-nous sublimer votre beauté naturelle.`
        ];
        
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    highlightFilledFields() {
        // Animer les champs remplis
        const filledFields = ['salonName', 'address', 'description'].filter(id => {
            const field = document.getElementById(id);
            return field && field.value.trim();
        });

        filledFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.style.backgroundColor = '#e8f5e8';
                field.style.border = '2px solid #28a745';
                setTimeout(() => {
                    field.style.backgroundColor = '';
                    field.style.border = '';
                }, 3000);
            }
        });
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
            
            if (data.name) {
                extractedInfo += `<li><strong>Nom:</strong> ${data.name}</li>`;
            }
            if (data.address) {
                extractedInfo += `<li><strong>Adresse:</strong> ${data.address}</li>`;
            }
            if (data.latitude && data.longitude) {
                extractedInfo += `<li><strong>Coordonnées:</strong> ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}</li>`;
            }
            
            extractedInfo += '</ul>';
            
            dataElement.innerHTML = extractedInfo;
            resultsElement.style.display = 'block';
            
            // Masquer après 10 secondes
            setTimeout(() => {
                resultsElement.style.display = 'none';
            }, 10000);
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
        
        // Masquer les autres éléments
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
    // Attendre que le générateur principal soit initialisé
    setTimeout(() => {
        try {
            new GoogleMapsExtractor();
            console.log('Extracteur Google Maps initialisé');
        } catch (error) {
            console.error('Erreur initialisation extracteur:', error);
        }
    }, 500);
});
