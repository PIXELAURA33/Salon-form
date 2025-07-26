class SalonGenerator {
    constructor() {
        this.generatedHTML = null;
        this.generatedFiles = new Map();
        this.selectedTemplate = this.getSelectedTemplate();
        this.customImages = new Map(); // Stocker les images personnalisées
        this.init();
    }

    getSelectedTemplate() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('template') || 'classic';
        } catch (error) {
            console.warn('Erreur lors de la lecture des paramètres URL:', error);
            return 'classic';
        }
    }

    init() {
        try {
            const form = document.getElementById('salonForm');
            const downloadBtn = document.getElementById('downloadBtn');
            const downloadFromPreview = document.getElementById('downloadFromPreview');

            if (form) {
                form.addEventListener('submit', (e) => this.handleFormSubmit(e));
            }
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => this.downloadZip());
            }
            if (downloadFromPreview) {
                downloadFromPreview.addEventListener('click', () => this.downloadZip());
            }

            this.initImageUploads();
            this.updateImageFormatInfo();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
        }
    }

    updateImageFormatInfo() {
        // Mettre à jour les informations de format selon le template sélectionné
        const templateFormatInfo = {
            'classic': {
                'heroImageInfo': 'JPG, PNG, WEBP uniquement | 1920x1080px | Max: 5MB',
                'logoImageInfo': 'PNG, SVG, WEBP (transparent recommandé) | 200x200px | Max: 2MB'
            },
            'modern': {
                'heroImageInfo': 'JPG, PNG, WEBP uniquement | 1920x1080px | Max: 6MB (qualité moderne)',
                'logoImageInfo': 'PNG, SVG, WEBP (SVG recommandé) | 200x200px | Max: 3MB'
            },
            'luxury': {
                'heroImageInfo': 'JPG, PNG uniquement (haute qualité) | 1920x1080px | Max: 8MB',
                'logoImageInfo': 'PNG, SVG uniquement (premium) | 200x200px | Max: 3MB'
            },
            'minimal': {
                'heroImageInfo': 'JPG, WEBP uniquement (optimisé) | 1920x1080px | Max: 3MB',
                'logoImageInfo': 'SVG, PNG (SVG recommandé) | 200x200px | Max: 1MB'
            },
            'barber': {
                'heroImageInfo': 'JPG, PNG uniquement | 1920x1080px | Max: 5MB',
                'logoImageInfo': 'PNG, SVG (style vintage) | 200x200px | Max: 2MB'
            },
            'creative': {
                'heroImageInfo': 'JPG, PNG, WEBP (tous formats) | 1920x1080px | Max: 7MB',
                'logoImageInfo': 'PNG, SVG, WEBP (créativité maximale) | 200x200px | Max: 4MB'
            },
            'spa': {
                'heroImageInfo': 'JPG, PNG, WEBP (zen optimisé) | 1920x1080px | Max: 4MB',
                'logoImageInfo': 'PNG, SVG, WEBP (style zen) | 200x200px | Max: 2MB'
            },
            'futuristic': {
                'heroImageInfo': 'JPG, PNG, WEBP (haute qualité) | 1920x1080px | Max: 8MB',
                'logoImageInfo': 'PNG, SVG, WEBP (SVG pour animations) | 200x200px | Max: 4MB'
            },
            'vintage': {
                'heroImageInfo': 'JPG, PNG (style rétro) | 1920x1080px | Max: 6MB',
                'logoImageInfo': 'PNG, SVG (style vintage) | 200x200px | Max: 3MB'
            },
            'urban': {
                'heroImageInfo': 'JPG, PNG, WEBP (street style) | 1920x1080px | Max: 7MB',
                'logoImageInfo': 'PNG, SVG, WEBP (style urbain) | 200x200px | Max: 3MB'
            },
            'nature': {
                'heroImageInfo': 'JPG, PNG, WEBP (bio optimisé) | 1920x1080px | Max: 5MB',
                'logoImageInfo': 'PNG, SVG, WEBP (style nature) | 200x200px | Max: 2MB'
            },
            'bohemian': {
                'heroImageInfo': 'JPG, PNG, WEBP (style bohème) | 1920x1080px | Max: 6MB',
                'logoImageInfo': 'PNG, SVG, WEBP (artistique) | 200x200px | Max: 3MB'
            },
            'neon': {
                'heroImageInfo': 'JPG, PNG, WEBP (haute saturation) | 1920x1080px | Max: 7MB',
                'logoImageInfo': 'PNG, SVG, WEBP (effets néon) | 200x200px | Max: 4MB'
            },
            'industrial': {
                'heroImageInfo': 'JPG, PNG, WEBP (style industriel) | 1920x1080px | Max: 6MB',
                'logoImageInfo': 'PNG, SVG, WEBP (métallique) | 200x200px | Max: 3MB'
            },
            'romantic': {
                'heroImageInfo': 'JPG, PNG, WEBP (tons pastel) | 1920x1080px | Max: 5MB',
                'logoImageInfo': 'PNG, SVG, WEBP (romantique) | 200x200px | Max: 3MB'
            },
            'scandinavian': {
                'heroImageInfo': 'JPG, PNG, WEBP (lumière naturelle) | 1920x1080px | Max: 4MB',
                'logoImageInfo': 'PNG, SVG, WEBP (minimaliste) | 200x200px | Max: 2MB'
            },
            'tropical': {
                'heroImageInfo': 'JPG, PNG, WEBP (couleurs vives) | 1920x1080px | Max: 6MB',
                'logoImageInfo': 'PNG, SVG, WEBP (exotique) | 200x200px | Max: 3MB'
            },
            'artdeco': {
                'heroImageInfo': 'JPG, PNG (qualité premium) | 1920x1080px | Max: 8MB',
                'logoImageInfo': 'PNG, SVG (géométrique) | 200x200px | Max: 4MB'
            },
            'cyber': {
                'heroImageInfo': 'JPG, PNG, WEBP (high-tech) | 1920x1080px | Max: 8MB',
                'logoImageInfo': 'PNG, SVG, WEBP (futuriste) | 200x200px | Max: 4MB'
            }
        };

        const templateInfo = templateFormatInfo[this.selectedTemplate] || templateFormatInfo['classic'];

        // Mettre à jour les éléments si ils existent
        Object.keys(templateInfo).forEach(infoId => {
            const element = document.getElementById(infoId);
            if (element) {
                const parts = templateInfo[infoId].split(' | ');
                element.innerHTML = `
                    <strong>Format:</strong> ${parts[0]}<br>
                    <strong>Dimension recommandée:</strong> ${parts[1]}<br>
                    <strong>Taille max:</strong> ${parts[2]}
                `;
            }
        });
    }

    initImageUploads() {
        try {
            // Gestion des uploads d'images individuelles
            const singleImageInputs = ['heroImage', 'aboutImage', 'logoImage', 'footerImage', 'team1Image', 'team2Image', 'team3Image'];

            singleImageInputs.forEach(inputId => {
                const input = document.getElementById(inputId);
                if (input) {
                    input.addEventListener('change', (e) => this.handleSingleImageUpload(e, inputId));

                    // Drag & Drop
                    const container = input.parentElement;
                    if (container) {
                        container.addEventListener('dragover', (e) => this.handleDragOver(e));
                        container.addEventListener('drop', (e) => this.handleDrop(e, inputId));
                        container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                    }
                }
            });

            // Gestion du portfolio (multiple images)
            const portfolioInput = document.getElementById('portfolioImages');
            if (portfolioInput) {
                portfolioInput.addEventListener('change', (e) => this.handlePortfolioImagesUpload(e));

                const container = portfolioInput.parentElement;
                if (container) {
                    container.addEventListener('dragover', (e) => this.handleDragOver(e));
                    container.addEventListener('drop', (e) => this.handleDrop(e, 'portfolioImages'));
                    container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des uploads:', error);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e, inputId) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        const input = document.getElementById(inputId);

        if (files.length > 0 && input) {
            if (inputId === 'portfolioImages') {
                input.files = files;
                this.handlePortfolioImagesUpload({ target: input });
            } else {
                // Pour les images individuelles, prendre seulement la première
                try {
                    const dt = new DataTransfer();
                    dt.items.add(files[0]);
                    input.files = dt.files;
                    this.handleSingleImageUpload({ target: input }, inputId);
                } catch (error) {
                    // Fallback si DataTransfer n'est pas supporté
                    console.warn('DataTransfer non supporté, utilisation alternative');
                    this.handleSingleImageUpload({ target: { files: [files[0]] } }, inputId);
                }
            }
        }
    }

    async handleSingleImageUpload(e, inputId) {
        const file = e.target.files[0];
        if (!file) return;

        // Effacer les erreurs précédentes
        this.clearImageError(inputId);

        try {
            // Validation du format et de la taille selon le type d'image
            const validationResult = this.validateImageFile(file, inputId);
            if (!validationResult.isValid) {
                this.showImageError(inputId, validationResult.error);
                // Effacer l'input
                e.target.value = '';
                return;
            }

            // Convertir en base64 et stocker
            const base64 = await this.fileToBase64(file);
            this.customImages.set(inputId, {
                data: base64,
                name: file.name,
                type: file.type
            });

            // Afficher l'aperçu
            this.showImagePreview(inputId, base64);

        } catch (error) {
            console.error('Erreur lors du traitement de l\'image:', error);
            this.showImageError(inputId, 'Erreur lors du traitement de l\'image.');
            e.target.value = '';
        }
    }

    async handlePortfolioImagesUpload(e) {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        // Effacer les erreurs précédentes
        this.clearImageError('portfolioImages');

        // Limiter à 6 images
        if (files.length > 6) {
            this.showImageError('portfolioImages', 'Maximum 6 images autorisées pour le portfolio.');
            e.target.value = '';
            return;
        }

        try {
            const portfolioImages = [];
            const errors = [];

            for (let file of files) {
                const validationResult = this.validateImageFile(file, 'portfolioImages');
                if (!validationResult.isValid) {
                    errors.push(`${file.name}: ${validationResult.error}`);
                    continue;
                }

                const base64 = await this.fileToBase64(file);
                portfolioImages.push({
                    data: base64,
                    name: file.name,
                    type: file.type
                });
            }

            if (errors.length > 0) {
                this.showImageError('portfolioImages', errors.join('<br>'));
                e.target.value = '';
                return;
            }

            if (portfolioImages.length === 0) {
                this.showImageError('portfolioImages', 'Aucune image valide trouvée.');
                e.target.value = '';
                return;
            }

            this.customImages.set('portfolioImages', portfolioImages);
            this.showPortfolioPreview(portfolioImages);

        } catch (error) {
            console.error('Erreur lors du traitement des images:', error);
            this.showImageError('portfolioImages', 'Erreur lors du traitement des images.');
            e.target.value = '';
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    showImagePreview(inputId, base64) {
        const previewElement = document.getElementById(inputId + 'Preview');
        if (previewElement) {
            const img = previewElement.querySelector('img');
            if (img) {
                img.src = base64;
                previewElement.style.display = 'block';
            }
        }
    }

    showPortfolioPreview(images) {
        const previewElement = document.getElementById('portfolioImagesPreview');
        const container = document.getElementById('portfolioPreviewContainer');

        if (previewElement && container) {
            container.innerHTML = '';

            images.forEach((image, index) => {
                const img = document.createElement('img');
                img.src = image.data;
                img.alt = `Portfolio ${index + 1}`;
                img.style.cssText = 'width: 100px; height: 100px; object-fit: cover; margin: 5px; border-radius: 5px;';
                container.appendChild(img);
            });

            previewElement.style.display = 'block';
        }
    }

    validateImageFile(file, inputId) {
        // Vérification de base
        if (!file || !file.type) {
            return { isValid: false, error: 'Fichier invalide ou type non détecté.' };
        }

        // Définir les règles de validation par template et par type d'image
        const templateValidationRules = {
            'classic': {
                'heroImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024,
                    name: 'Image d\'en-tête (Classic)'
                },
                'aboutImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024,
                    name: 'Image À propos (Classic)'
                },
                'logoImage': {
                    formats: ['image/png', 'image/svg+xml', 'image/webp'],
                    maxSize: 2 * 1024 * 1024,
                    name: 'Logo (Classic)'
                },
                'footerImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024,
                    name: 'Image de pied de page (Classic)'
                },
                'team1Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 3 * 1024 * 1024,
                    name: 'Photo équipe 1 (Classic)'
                },
                'team2Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 3 * 1024 * 1024,
                    name: 'Photo équipe 2 (Classic)'
                },
                'team3Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 3 * 1024 * 1024,
                    name: 'Photo équipe 3 (Classic)'
                },
                'portfolioImages': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 4 * 1024 * 1024,
                    name: 'Image portfolio (Classic)'
                }
            }
        };

        // Ajouter les autres templates avec des règles similaires
        const baseRules = templateValidationRules.classic;
        ['modern', 'luxury', 'minimal', 'barber', 'creative', 'spa', 'futuristic', 'vintage', 'urban', 'nature', 'bohemian', 'neon', 'industrial', 'romantic', 'scandinavian', 'tropical', 'artdeco', 'cyber'].forEach(template => {
            templateValidationRules[template] = JSON.parse(JSON.stringify(baseRules));
        });

        // Personnaliser selon le template
        if (this.selectedTemplate === 'luxury') {
            Object.keys(templateValidationRules.luxury).forEach(key => {
                templateValidationRules.luxury[key].maxSize = Math.min(templateValidationRules.luxury[key].maxSize * 1.5, 8 * 1024 * 1024);
            });
        } else if (this.selectedTemplate === 'minimal') {
            Object.keys(templateValidationRules.minimal).forEach(key => {
                templateValidationRules.minimal[key].maxSize = Math.max(templateValidationRules.minimal[key].maxSize * 0.6, 1 * 1024 * 1024);
            });
        }

        // Obtenir les règles pour le template actuel
        const templateRules = templateValidationRules[this.selectedTemplate] || templateValidationRules['classic'];
        const rules = templateRules[inputId];

        if (!rules) {
            return { isValid: false, error: 'Type d\'image non reconnu.' };
        }

        // Vérifier le format
        if (!rules.formats.includes(file.type)) {
            const allowedFormats = rules.formats.map(format => format.split('/')[1].toUpperCase()).join(', ');
            return { 
                isValid: false, 
                error: `Format non autorisé pour ${rules.name}. Formats acceptés: ${allowedFormats}` 
            };
        }

        // Vérifier la taille
        if (file.size > rules.maxSize) {
            const maxSizeMB = (rules.maxSize / (1024 * 1024)).toFixed(1);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            return { 
                isValid: false, 
                error: `${rules.name} trop volumineuse: ${fileSizeMB}MB. Taille max: ${maxSizeMB}MB` 
            };
        }

        // Validation supplémentaire pour les noms de fichiers
        if (file.name.length > 100) {
            return { 
                isValid: false, 
                error: 'Le nom du fichier est trop long (max 100 caractères).' 
            };
        }

        return { isValid: true };
    }

    showImageError(inputId, errorMessage) {
        const errorElement = document.getElementById(inputId + 'Error');
        if (errorElement) {
            errorElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`;
            errorElement.style.display = 'block';
        } else {
            // Fallback: afficher une alerte si l'élément d'erreur n'existe pas
            console.error(`Erreur ${inputId}:`, errorMessage);
            alert(errorMessage);
        }
    }

    clearImageError(inputId) {
        const errorElement = document.getElementById(inputId + 'Error');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.innerHTML = '';
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        try {
            // Validation des champs obligatoires
            const salonName = document.getElementById('salonName')?.value?.trim() || '';
            const phone = document.getElementById('phone')?.value?.trim() || '';
            const address = document.getElementById('address')?.value?.trim() || '';

            if (!salonName || !phone || !address) {
                alert('Veuillez remplir tous les champs obligatoires (nom du salon, téléphone, adresse).');
                return;
            }

            // Afficher un indicateur de chargement
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (!submitBtn) {
                console.error('Bouton de soumission non trouvé');
                return;
            }

            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération en cours...';
            submitBtn.disabled = true;

            const formData = this.getFormData();
            await this.generateSite(formData);
            this.showPreview();

            const downloadBtn = document.getElementById('downloadBtn');
            const previewBtn = document.getElementById('previewBtn');

            if (downloadBtn) downloadBtn.disabled = false;
            if (previewBtn) previewBtn.disabled = false;

            // Succès
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Site généré !';
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Erreur lors de la génération:', error);
            alert('Une erreur est survenue lors de la génération du site. Veuillez réessayer.');

            // Restaurer le bouton
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = 'Générer le Site';
                submitBtn.disabled = false;
            }
        }
    }

    getFormData() {
        const getValue = (id, defaultValue = '') => {
            const element = document.getElementById(id);
            return element ? element.value : defaultValue;
        };

        return {
            salonName: getValue('salonName'),
            phone: getValue('phone'),
            address: getValue('address'),
            email: getValue('email'),
            website: getValue('website'),
            description: getValue('description'),
            hours: getValue('hours', 'Nous contacter pour les horaires'),
            facebook: getValue('facebook'),
            instagram: getValue('instagram'),
            whatsapp: getValue('whatsapp'),
            primaryColor: getValue('primaryColor', '#667eea'),
            secondaryColor: getValue('secondaryColor', '#764ba2')
        };
    }

    async loadTemplate(templateType) {
        const templates = {
            'classic': () => this.getClassicTemplate(),
            'modern': () => this.getModernTemplate(),
            'luxury': () => this.getLuxuryTemplate(),
            'minimal': () => this.getMinimalTemplate(),
            'barber': () => this.getBarberTemplate(),
            'creative': () => this.getCreativeTemplate(),
            'spa': () => this.getSpaTemplate(),
            'futuristic': () => this.getFuturisticTemplate(),
            'vintage': () => this.getVintageTemplate(),
            'urban': () => this.getUrbanTemplate(),
            'nature': () => this.getNatureTemplate(),
            'bohemian': () => this.getBohemianTemplate(),
            'neon': () => this.getNeonTemplate(),
            'industrial': () => this.getIndustrialTemplate(),
            'romantic': () => this.getRomanticTemplate(),
            'scandinavian': () => this.getScandinavianTemplate(),
            'tropical': () => this.getTropicalTemplate(),
            'artdeco': () => this.getArtDecoTemplate(),
            'cyber': () => this.getCyberTemplate()
        };

        const templateLoader = templates[templateType] || templates['classic'];
        return await templateLoader();
    }

    async getClassicTemplate() {
        try {
            // Essayer de charger le template original depuis .templates/
            const response = await fetch('.templates/index.html');
            if (response.ok) {
                const template = await response.text();
                console.log('Template original chargé avec succès');
                return template;
            }
        } catch (error) {
            console.warn('Template original non trouvé, utilisation du template par défaut:', error.message);
        }
        // Fallback vers le template par défaut
        console.log('Utilisation du template par défaut');
        return this.getDefaultTemplate();
    }

    async getModernTemplate() {
        return this.getTemplateVariation('modern');
    }

    async getLuxuryTemplate() {
        return this.getTemplateVariation('luxury');
    }

    async getMinimalTemplate() {
        return this.getTemplateVariation('minimal');
    }

    async getBarberTemplate() {
        return this.getTemplateVariation('barber');
    }

    async getCreativeTemplate() {
        return this.getTemplateVariation('creative');
    }

    async getSpaTemplate() {
        return this.getTemplateVariation('spa');
    }

    async getFuturisticTemplate() {
        return this.getTemplateVariation('futuristic');
    }

    async getVintageTemplate() {
        return this.getTemplateVariation('vintage');
    }

    async getUrbanTemplate() {
        return this.getTemplateVariation('urban');
    }

    async getNatureTemplate() {
        return this.getTemplateVariation('nature');
    }

    async getBohemianTemplate() {
        return this.getTemplateVariation('bohemian');
    }

    async getNeonTemplate() {
        return this.getTemplateVariation('neon');
    }

    async getIndustrialTemplate() {
        return this.getTemplateVariation('industrial');
    }

    async getRomanticTemplate() {
        return this.getTemplateVariation('romantic');
    }

    async getScandinavianTemplate() {
        return this.getTemplateVariation('scandinavian');
    }

    async getTropicalTemplate() {
        return this.getTemplateVariation('tropical');
    }

    async getArtDecoTemplate() {
        return this.getTemplateVariation('artdeco');
    }

    async getCyberTemplate() {
        return this.getTemplateVariation('cyber');
    }

    async getTemplateVariation(type) {
        const baseTemplate = await this.getDefaultTemplate();
        return this.applyTemplateStyle(baseTemplate, type);
    }

    applyTemplateStyle(html, type) {
        const styles = {
            'modern': {
                gradient: 'linear-gradient(45deg, #f093fb, #f5576c)',
                fontFamily: 'Montserrat, sans-serif',
                buttonStyle: 'border-radius: 25px; background: linear-gradient(45deg, #f093fb, #f5576c);'
            },
            'luxury': {
                gradient: 'linear-gradient(45deg, #ffecd2, #fcb69f)',
                fontFamily: 'Playfair Display, serif',
                buttonStyle: 'border-radius: 0; background: linear-gradient(45deg, #d4af37, #ffd700); color: #000;'
            },
            'minimal': {
                gradient: 'linear-gradient(45deg, #f8f9fa, #e9ecef)',
                fontFamily: 'Inter, sans-serif',
                buttonStyle: 'border-radius: 2px; background: #212529; border: none;'
            },
            'barber': {
                gradient: 'linear-gradient(45deg, #434343, #000000)',
                fontFamily: 'Oswald, sans-serif',
                buttonStyle: 'border-radius: 0; background: #dc3545; border: 2px solid #fff;'
            },
            'creative': {
                gradient: 'linear-gradient(45deg, #ff9a9e, #fecfef)',
                fontFamily: 'Fredoka One, cursive',
                buttonStyle: 'border-radius: 50px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4);'
            },
            'spa': {
                gradient: 'linear-gradient(45deg, #a8edea, #f5f7fa)',
                fontFamily: 'Nunito, sans-serif',
                buttonStyle: 'border-radius: 30px; background: linear-gradient(45deg, #56ab2f, #a8e6cf); box-shadow: 0 4px 15px rgba(86, 171, 47, 0.3);'
            },
            'futuristic': {
                gradient: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)',
                fontFamily: 'Orbitron, monospace',
                buttonStyle: 'border-radius: 0; background: linear-gradient(45deg, #00d4ff, #090979); border: 1px solid #00d4ff; text-transform: uppercase;'
            },
            'vintage': {
                gradient: 'linear-gradient(45deg, #d4af37, #ffd700)',
                fontFamily: 'Dancing Script, cursive',
                buttonStyle: 'border-radius: 15px; background: linear-gradient(45deg, #8b4513, #daa520); border: 2px solid #d4af37; font-weight: bold;'
            },
            'urban': {
                gradient: 'linear-gradient(45deg, #2c2c2c, #434343)',
                fontFamily: 'Roboto Condensed, sans-serif',
                buttonStyle: 'border-radius: 0; background: linear-gradient(45deg, #ff6b35, #f7931e); border: none; text-transform: uppercase; font-weight: bold;'
            },
            'nature': {
                gradient: 'linear-gradient(45deg, #56ab2f, #a8e6cf)',
                fontFamily: 'Merriweather, serif',
                buttonStyle: 'border-radius: 25px; background: linear-gradient(45deg, #2d5016, #56ab2f); border: 2px solid #7fcdcd;'
            },
            'bohemian': {
                gradient: 'linear-gradient(45deg, #b7937d, #f5deb3)',
                fontFamily: 'Libre Baskerville, serif',
                buttonStyle: 'border-radius: 20px; background: linear-gradient(45deg, #8b4513, #deb887); border: 2px solid #daa520;'
            },
            'neon': {
                gradient: 'linear-gradient(45deg, #ff0080, #00ff80)',
                fontFamily: 'Neon, monospace',
                buttonStyle: 'border-radius: 30px; background: linear-gradient(45deg, #ff0080, #00ff80); box-shadow: 0 0 20px rgba(255, 0, 128, 0.5);'
            },
            'industrial': {
                gradient: 'linear-gradient(45deg, #555555, #888888)',
                fontFamily: 'Industrial, sans-serif',
                buttonStyle: 'border-radius: 0; background: linear-gradient(45deg, #333, #666); border: 2px solid #ffa500;'
            },
            'romantic': {
                gradient: 'linear-gradient(45deg, #ffc0cb, #ffb6c1)',
                fontFamily: 'Parisienne, cursive',
                buttonStyle: 'border-radius: 25px; background: linear-gradient(45deg, #ff69b4, #ffb6c1); color: white;'
            },
            'scandinavian': {
                gradient: 'linear-gradient(45deg, #f0f8ff, #e6f3ff)',
                fontFamily: 'Source Sans Pro, sans-serif',
                buttonStyle: 'border-radius: 3px; background: linear-gradient(45deg, #4682b4, #87ceeb); color: white;'
            },
            'tropical': {
                gradient: 'linear-gradient(45deg, #ff7f50, #ffb347)',
                fontFamily: 'Kaushan Script, cursive',
                buttonStyle: 'border-radius: 30px; background: linear-gradient(45deg, #ff6347, #ffa500); color: white;'
            },
            'artdeco': {
                gradient: 'linear-gradient(45deg, #d4af37, #1a1a1a)',
                fontFamily: 'Cinzel, serif',
                buttonStyle: 'border-radius: 0; background: linear-gradient(45deg, #d4af37, #b8860b); color: #000; border: 2px solid #ffd700;'
            },
            'cyber': {
                gradient: 'linear-gradient(45deg, #00ffff, #ff00ff)',
                fontFamily: 'Orbitron, monospace',
                buttonStyle: 'border-radius: 0; background: linear-gradient(45deg, #00ffff, #ff00ff); color: #000; text-shadow: 0 0 10px #fff;'
            }
        };

        const style = styles[type];
        if (style) {
            // Appliquer les styles personnalisés
            html = html.replace(
                /<head>/,
                `<head>
                <style>
                    body { font-family: ${style.fontFamily} !important; }
                    .btn-custom { ${style.buttonStyle} }
                    .hero-section { background: ${style.gradient} !important; }
                </style>`
            );
        }

        return html;
    }

    getDefaultTemplate() {
        return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{SALON_NAME}} - Salon de Coiffure</title>
    <meta name="description" content="{{SALON_NAME}} - Salon de coiffure professionnel situé à {{ADDRESS}}. Services de coupe, coloration, soins et styling.">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .hero-section { 
            background: linear-gradient(135deg, {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}});
            color: white; 
            padding: 100px 0; 
            text-align: center; 
        }
        .service-card { 
            border: none; 
            border-radius: 15px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
            transition: transform 0.3s;
        }
        .service-card:hover { transform: translateY(-5px); }
        .btn-custom { 
            background: {{PRIMARY_COLOR}}; 
            border: none; 
            border-radius: 25px; 
            padding: 12px 30px; 
            color: white;
        }
        .contact-section { background: #f8f9fa; padding: 60px 0; }
        .footer { background: #333; color: white; padding: 40px 0; }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top">
        <div class="container">
            <a class="navbar-brand" href="#"><strong>{{SALON_NAME}}</strong></a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="#services">Services</a>
                <a class="nav-link" href="#about">À propos</a>
                <a class="nav-link" href="#contact">Contact</a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
        <div class="container">
            <h1 class="display-4 mb-4">{{SALON_NAME}}</h1>
            <p class="lead">{{DESCRIPTION}}</p>
            <a href="#contact" class="btn btn-custom btn-lg">Prendre Rendez-vous</a>
        </div>
    </section>

    <!-- Services -->
    <section id="services" class="py-5">
        <div class="container">
            <h2 class="text-center mb-5">Nos Services</h2>
            <div class="row">
                <div class="col-md-3 mb-4">
                    <div class="card service-card h-100">
                        <div class="card-body text-center">
                            <i class="fas fa-cut fa-3x mb-3" style="color: {{PRIMARY_COLOR}};"></i>
                            <h5>Coupe</h5>
                            <p>Coupe personnalisée selon votre style</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card service-card h-100">
                        <div class="card-body text-center">
                            <i class="fas fa-palette fa-3x mb-3" style="color: {{PRIMARY_COLOR}};"></i>
                            <h5>Coloration</h5>
                            <p>Couleurs tendance et naturelles</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card service-card h-100">
                        <div class="card-body text-center">
                            <i class="fas fa-magic fa-3x mb-3" style="color: {{PRIMARY_COLOR}};"></i>
                            <h5>Soins</h5>
                            <p>Traitements capillaires professionnels</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card service-card h-100">
                        <div class="card-body text-center">
                            <i class="fas fa-spa fa-3x mb-3" style="color: {{PRIMARY_COLOR}};"></i>
                            <h5>Styling</h5>
                            <p>Mise en forme et coiffage</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- About -->
    <section id="about" class="py-5 bg-light">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <h2>À propos de {{SALON_NAME}}</h2>
                    <p>{{DESCRIPTION}}</p>
                    <p><strong>Horaires :</strong><br>{{HOURS}}</p>
                    {{EMAIL_SECTION}}
                    {{WEBSITE_SECTION}}
                </div>
                <div class="col-md-6">
                    <div class="text-center">
                        <i class="fas fa-cut fa-10x" style="color: {{PRIMARY_COLOR}}; opacity: 0.1;"></i>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact -->
    <section id="contact" class="contact-section">
        <div class="container">
            <h2 class="text-center mb-5">Nous Contacter</h2>
            <div class="row">
                <div class="col-md-6">
                    <div class="contact-info">
                        <div class="mb-4">
                            <i class="fas fa-map-marker-alt fa-2x mb-3" style="color: {{PRIMARY_COLOR}};"></i>
                            <h5>Adresse</h5>
                            <p>{{ADDRESS}}</p>
                        </div>
                        <div class="mb-4">
                            <i class="fas fa-phone fa-2x mb-3" style="color: {{PRIMARY_COLOR}};"></i>
                            <h5>Téléphone</h5>
                            <p>{{PHONE}}</p>
                        </div>
                        {{SOCIAL_SECTION}}
                    </div>
                </div>
                <div class="col-md-6">
                    <form>
                        <div class="mb-3">
                            <input type="text" class="form-control" placeholder="Votre nom">
                        </div>
                        <div class="mb-3">
                            <input type="email" class="form-control" placeholder="Votre email">
                        </div>
                        <div class="mb-3">
                            <textarea class="form-control" rows="5" placeholder="Votre message"></textarea>
                        </div>
                        <button type="submit" class="btn btn-custom">Envoyer</button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container text-center">
            <p>&copy; 2024 {{SALON_NAME}}. Tous droits réservés.</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
    }

    async generateSite(data) {
        try {
            // Charger le template HTML selon le type sélectionné
            let htmlContent = await this.loadTemplate(this.selectedTemplate);

            // Remplacer les données dans le template
            htmlContent = this.replaceTemplateData(htmlContent, data);

            // Intégrer les images personnalisées dans le HTML
            htmlContent = await this.integrateCustomImages(htmlContent);

            this.generatedHTML = htmlContent;

            // Préparer les fichiers pour le téléchargement
            await this.prepareFilesForDownload();

        } catch (error) {
            console.error('Erreur lors de la génération:', error);
            throw new Error('Erreur lors de la génération du site. Veuillez réessayer.');
        }
    }

    async integrateCustomImages(html) {
        // Remplacer les images par les versions personnalisées (en base64)
        // ou conserver les images par défaut si aucune image personnalisée n'est fournie

        // Image hero/header - utiliser l'image personnalisée ou conserver la par défaut
        if (this.customImages.has('heroImage')) {
            const heroImg = this.customImages.get('heroImage');
            // Remplacer dans les styles CSS et attributs src
            html = html.replace(/url\("\.\.\/img\/header-background-1\.jpg"\)/g, `url("${heroImg.data}")`);
            html = html.replace(/url\("\.\.\/img\/header-background-2\.jpg"\)/g, `url("${heroImg.data}")`);
            html = html.replace(/header-background-1\.jpg/g, heroImg.data);
            html = html.replace(/header-background-2\.jpg/g, heroImg.data);
        }

        // Image "À propos" / Perfect Style
        if (this.customImages.has('aboutImage')) {
            const aboutImg = this.customImages.get('aboutImage');
            html = html.replace(/url\("\.\.\/img\/perfect-style\.jpg"\)/g, `url("${aboutImg.data}")`);
            html = html.replace(/perfect-style\.jpg/g, aboutImg.data);
        }

        // Footer background
        if (this.customImages.has('footerImage')) {
            const footerImg = this.customImages.get('footerImage');
            html = html.replace(/url\("\.\.\/img\/bg-footer1\.jpg"\)/g, `url("${footerImg.data}")`);
            html = html.replace(/bg-footer1\.jpg/g, footerImg.data);
        }

        // Logo
        if (this.customImages.has('logoImage')) {
            const logoImg = this.customImages.get('logoImage');
            html = html.replace(/src="img\/logo\.png"/g, `src="${logoImg.data}"`);
            html = html.replace(/src="img\/beauty-salon_logo_96dp\.png"/g, `src="${logoImg.data}"`);
            html = html.replace(/logo\.png/g, logoImg.data);
            html = html.replace(/beauty-salon_logo_96dp\.png/g, logoImg.data);
        }

        // Images d'équipe
        ['team1Image', 'team2Image', 'team3Image'].forEach((teamKey, index) => {
            const teamNumber = index + 1;
            if (this.customImages.has(teamKey)) {
                const teamImg = this.customImages.get(teamKey);
                html = html.replace(new RegExp(`src="img/team/team-${teamNumber}\\.jpg"`, 'g'), `src="${teamImg.data}"`);
                html = html.replace(new RegExp(`team-${teamNumber}\\.jpg`, 'g'), teamImg.data);
            }
        });

        // Portfolio images
        if (this.customImages.has('portfolioImages')) {
            const portfolioImages = this.customImages.get('portfolioImages');
            portfolioImages.forEach((image, index) => {
                const portfolioIndex = index + 1;
                html = html.replace(
                    new RegExp(`src="img/portfolio/portfolio-${portfolioIndex}\\.jpg"`, 'g'), 
                    `src="${image.data}"`
                );
                html = html.replace(
                    new RegExp(`img/portfolio/portfolio-${portfolioIndex}\\.jpg`, 'g'), 
                    image.data
                );
                html = html.replace(
                    new RegExp(`portfolio-${portfolioIndex}\\.jpg`, 'g'), 
                    image.data
                );
            });
        }

        return html;
    }

    replaceTemplateData(html, data) {
        // Remplacements pour les nouveaux templates
        html = html.replace(/{{SALON_NAME}}/g, data.salonName || 'Mon Salon');
        html = html.replace(/{{PHONE}}/g, data.phone || '');
        html = html.replace(/{{ADDRESS}}/g, data.address || '');
        html = html.replace(/{{DESCRIPTION}}/g, data.description || `Bienvenue chez ${data.salonName || 'notre salon'}, votre salon de coiffure professionnel.`);
        html = html.replace(/{{HOURS}}/g, (data.hours || 'Nous contacter pour les horaires').replace(/\n/g, '<br>'));
        html = html.replace(/{{PRIMARY_COLOR}}/g, data.primaryColor || '#667eea');
        html = html.replace(/{{SECONDARY_COLOR}}/g, data.secondaryColor || '#764ba2');

        // Sections conditionnelles
        const emailSection = data.email ? `<p><strong>Email :</strong> <a href="mailto:${data.email}">${data.email}</a></p>` : '';
        const websiteSection = data.website ? `<p><strong>Site web :</strong> <a href="${data.website}" target="_blank">${data.website}</a></p>` : '';

        let socialSection = '';
        if (data.facebook || data.instagram || data.whatsapp) {
            socialSection = `<div class="mb-4">
                <i class="fas fa-share-alt fa-2x mb-3" style="color: ${data.primaryColor || '#667eea'};"></i>
                <h5>Réseaux sociaux</h5>`;
            if (data.facebook) socialSection += `<a href="${data.facebook}" class="me-3" target="_blank"><i class="fab fa-facebook fa-2x"></i></a>`;
            if (data.instagram) socialSection += `<a href="${data.instagram}" class="me-3" target="_blank"><i class="fab fa-instagram fa-2x"></i></a>`;
            if (data.whatsapp) socialSection += `<a href="https://wa.me/${data.whatsapp}" class="me-3" target="_blank"><i class="fab fa-whatsapp fa-2x"></i></a>`;
            socialSection += '</div>';
        }

        html = html.replace(/{{EMAIL_SECTION}}/g, emailSection);
        html = html.replace(/{{WEBSITE_SECTION}}/g, websiteSection);
        html = html.replace(/{{SOCIAL_SECTION}}/g, socialSection);

        // Remplacements pour l'ancien template (rétrocompatibilité)
        html = html.replace(/Beauty &amp; Salon - Free Bootstrap 4 Template/g, `${data.salonName || 'Mon Salon'} - Salon de Coiffure`);
        html = html.replace(/Beauty and Salon - Free Bootstrap 4 Template \| Boostraptheme/g, `${data.salonName || 'Mon Salon'} - Salon de Coiffure`);

        // Remplacer les informations de contact dans le header
        html = html.replace(/\(91\) 999 9999 99/g, data.phone || '');
        html = html.replace(/Dros Began, India 222312/g, data.address || '');

        // Remplacer le nom du salon dans le contenu
        html = html.replace(/Fascinating than any <br> fashion salon/g, `Bienvenue chez <br> ${data.salonName || 'notre salon'}`);
        html = html.replace(/your hair style <br> our passionate team/g, `${data.salonName || 'Notre salon'} <br> Votre style, notre passion`);

        // Remplacer le contenu "About Us"
        const aboutSection = `
            <h3>À propos de ${data.salonName || 'notre salon'}</h3>
            <div class="bord-bottom"></div>
            <p>Bienvenue chez ${data.salonName || 'notre salon'}, votre salon de coiffure de confiance situé à ${data.address || 'votre adresse'}. Notre équipe passionnée vous offre des services de qualité dans une atmosphère chaleureuse et professionnelle.</p>
            ${data.hours ? `<p><strong>Horaires :</strong><br>${data.hours.replace(/\n/g, '<br>')}</p>` : ''}
            ${data.email ? `<p><strong>Email :</strong> <a href="mailto:${data.email}">${data.email}</a></p>` : ''}
            ${data.website ? `<p><strong>Site web :</strong> <a href="${data.website}" target="_blank">${data.website}</a></p>` : ''}
            <a href="#contact" class="img-fluid js-scroll-trigger"><button class="btn btn-general btn-white">CONTACTEZ-NOUS</button></a>
        `;

        html = html.replace(
            /<h3>Good Hair style Good Selfie<\/h3>[\s\S]*?<a href="#contact"[^>]*>[\s\S]*?<\/a>/,
            aboutSection
        );

        // Mettre à jour les liens des réseaux sociaux
        if (data.facebook) {
            html = html.replace(/href="#"/g, (match, offset, string) => {
                const beforeMatch = string.substring(Math.max(0, offset - 100), offset);
                if (beforeMatch.includes('fa-facebook')) {
                    return `href="${data.facebook}" target="_blank"`;
                }
                return match;
            });
        }

        // Remplacer les noms d'équipe par des noms français
        html = html.replace(/Taneswar khan/g, 'Marie Dubois');
        html = html.replace(/krish Modi/g, 'Sophie Martin');
        html = html.replace(/Trisca Ben/g, 'Léa Bernard');

        // Remplacer les témoignages
        const testimonials = [
            {
                name: 'Sophie L.',
                text: `Excellent service chez ${data.salonName || 'ce salon'} ! L'équipe est très professionnelle et à l'écoute. Je recommande vivement !`
            },
            {
                name: 'Marie P.',
            text: `Je suis cliente depuis plusieurs années et je ne suis jamais déçue. L'ambiance est chaleureuse et les résultats toujours parfaits.`
            },
            {
                name: 'Julie M.',
                text: `Un salon moderne avec des coiffeurs talentueux. Ils savent exactement ce qui nous convient. Merci à toute l'équipe !`
            }
        ];

        // Remplacer les anciens témoignages
        html = html.replace(/Rahul Singh/g, testimonials[0].name);
        html = html.replace(/Bhuvan Shah/g, testimonials[1].name);
        html = html.replace(/Pranav Mishra/g, testimonials[2].name);

        // Remplacer le texte des témoignages
        testimonials.forEach((testimonial, index) => {
            const oldTexts = [
                /If you are going to have a successful beauty salon[\s\S]*?rates\./,
                /style of a salon by the kind of furniture[\s\S]*?minds\./,
                /salon stock taking a crucial task[\s\S]*?online\./
            ];

            if (oldTexts[index]) {
                html = html.replace(oldTexts[index], testimonial.text);
            }
        });

        // Remplacer les informations de copyright
        html = html.replace(/Copyright &copy; 2018 Design By <a href="https:\/\/boostraptheme\.com\/">Boostraptheme<\/a>/, 
            `Copyright &copy; ${new Date().getFullYear()} ${data.salonName || 'Mon Salon'}`);

        return html;
    }

    async prepareFilesForDownload() {
        this.generatedFiles.clear();

        // Ajouter le fichier HTML généré
        this.generatedFiles.set('index.html', this.generatedHTML);

        // Copier tous les fichiers CSS depuis .templates/
        const cssFiles = [
            'css/animate.min.css', 'css/app.css', 'css/bootstrap.css', 
            'css/magnific-popup.css', 'css/owl.carousel.min.css', 'css/owl.theme.default.min.css'
        ];

        for (const cssFile of cssFiles) {
            try {
                const response = await fetch(`.templates/${cssFile}`);
                if (response.ok) {
                    const content = await response.text();
                    this.generatedFiles.set(cssFile, content);
                } else {
                    console.warn(`CSS non trouvé: ${cssFile} (${response.status})`);
                }
            } catch (error) {
                console.warn(`Erreur CSS ${cssFile}:`, error.message);
            }
        }

        // Copier tous les fichiers JS depuis .templates/
        const jsFiles = [
            'js/app.js', 'js/bootstrap.min.js', 'js/contact_me.js', 'js/contact_me.min.js',
            'js/jqBootstrapValidation.min.js', 'js/jquery.easing.min.js', 'js/jquery.magnific-popup.min.js',
            'js/jquery.min.js', 'js/owl.carousel.min.js', 'js/popper.min.js', 'js/wow.min.js'
        ];

        for (const jsFile of jsFiles) {
            try {
                const response = await fetch(`.templates/${jsFile}`);
                if (response.ok) {
                    const content = await response.text();
                    this.generatedFiles.set(jsFile, content);
                } else {
                    console.warn(`JS non trouvé: ${jsFile} (${response.status})`);
                }
            } catch (error) {
                console.warn(`Erreur JS ${jsFile}:`, error.message);
            }
        }

        // Ajouter les images personnalisées comme fichiers séparés (optionnel pour backup)
        await this.addCustomImagesToFiles();

        // Copier les images originales non remplacées
        await this.copyOriginalImages();
    }

    async addCustomImagesToFiles() {
        // Convertir les images base64 en fichiers binaires et les ajouter au zip
        for (const [key, imageData] of this.customImages.entries()) {
            if (key === 'portfolioImages' && Array.isArray(imageData)) {
                // Pour le portfolio, ajouter chaque image
                imageData.forEach((image, index) => {
                    try {
                        const extension = image.type ? image.type.split('/')[1] : 'jpg';
                        const filename = `img/portfolio/custom-portfolio-${index + 1}.${extension}`;
                        const binaryData = this.base64ToBinary(image.data);
                        this.generatedFiles.set(filename, binaryData);
                    } catch (error) {
                        console.warn(`Erreur lors de l'ajout de l'image portfolio ${index + 1}:`, error);
                    }
                });
            } else if (imageData && imageData.data) {
                // Pour les images individuelles
                try {
                    const extension = imageData.type ? imageData.type.split('/')[1] : 'jpg';
                    let filename;

                    switch (key) {
                        case 'heroImage':
                            filename = `img/custom-header-background.${extension}`;
                            break;
                        case 'aboutImage':
                            filename = `img/custom-perfect-style.${extension}`;
                            break;
                        case 'logoImage':
                            filename = `img/custom-logo.${extension}`;
                            break;
                        case 'footerImage':
                            filename = `img/custom-bg-footer.${extension}`;
                            break;
                        case 'team1Image':
                            filename = `img/team/custom-team-1.${extension}`;
                            break;
                        case 'team2Image':
                            filename = `img/team/custom-team-2.${extension}`;
                            break;
                        case 'team3Image':
                            filename = `img/team/custom-team-3.${extension}`;
                            break;
                        default:
                            filename = `img/custom-${key}.${extension}`;
                    }

                    const binaryData = this.base64ToBinary(imageData.data);
                    this.generatedFiles.set(filename, binaryData);
                } catch (error) {
                    console.warn(`Erreur lors de l'ajout de l'image ${key}:`, error);
                }
            }
        }
    }

    async copyOriginalImages() {
        // Copier TOUTES les images nécessaires pour que chaque template soit complet
        const allRequiredImages = [
            // Images communes à tous les templates
            'img/client/client-1.jpg', 'img/client/client-2.jpg', 'img/client/client-3.jpg',
            'img/service/service-1.jpg', 'img/service/service-2.jpg', 'img/service/service-3.jpg', 'img/service/service-4.jpg',
            'img/loading.gif', 'img/treamer-small.png',

            // Images principales (toujours inclure pour templates complets)
            'img/header-background-1.jpg', 'img/header-background-2.jpg',
            'img/perfect-style.jpg',
            'img/logo.png', 'img/beauty-salon_logo_96dp.png',
            'img/bg-footer1.jpg',
            'img/team/team-1.jpg', 'img/team/team-2.jpg', 'img/team/team-3.jpg'
        ];

        // Ajouter toutes les images portfolio (1 à 10)
        for (let i = 1; i <= 10; i++) {
            allRequiredImages.push(`img/portfolio/portfolio-${i}.jpg`);
        }

        // Copier toutes les images pour avoir des templates complets
        for (const imagePath of allRequiredImages) {
            try {
                const response = await fetch(`.templates/${imagePath}`);
                if (response.ok) {
                    const blob = await response.blob();
                    this.generatedFiles.set(imagePath, blob);
                } else {
                    console.warn(`Image non trouvée: ${imagePath} (${response.status})`);
                }
            } catch (error) {
                console.warn(`Erreur lors du chargement de ${imagePath}:`, error.message);
            }
        }

        console.log(`Images copiées: ${allRequiredImages.length} fichiers inclus pour template complet`);
    }

    base64ToBinary(base64String) {
        try {
            // Supprimer le préfixe data:image/...;base64,
            const base64Data = base64String.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        } catch (error) {
            console.error('Erreur lors de la conversion base64:', error);
            return new Uint8Array(0);
        }
    }

    showPreview() {
        try {
            const previewFrame = document.getElementById('previewFrame');
            if (previewFrame && this.generatedHTML) {
                const blob = new Blob([this.generatedHTML], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                previewFrame.src = url;

                // Nettoyer l'URL après un délai
                setTimeout(() => URL.revokeObjectURL(url), 10000);

                // Afficher le modal si Bootstrap est disponible
                if (typeof bootstrap !== 'undefined') {
                    const modal = new bootstrap.Modal(document.getElementById('previewModal'));
                    modal.show();
                } else {
                    console.warn('Bootstrap Modal non disponible');
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'affichage de l\'aperçu:', error);
            alert('Erreur lors de l\'affichage de l\'aperçu.');
        }
    }

    async downloadZip() {
        if (!this.generatedHTML) {
            alert('Veuillez d\'abord générer le site');
            return;
        }

        if (this.generatedFiles.size === 0) {
            alert('Erreur: Aucun fichier à télécharger. Veuillez régénérer le site.');
            return;
        }

        if (typeof JSZip === 'undefined') {
            console.error('JSZip non disponible');
            alert('Erreur: Bibliothèque JSZip non chargée. Veuillez recharger la page.');
            return;
        }

        // Afficher indicateur de téléchargement
        const downloadBtn = document.getElementById('downloadBtn');
        const downloadFromPreview = document.getElementById('downloadFromPreview');

        let originalText = 'Télécharger le Site';
        let originalTextPreview = 'Télécharger';

        if (downloadBtn) {
            originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Préparation...';
            downloadBtn.disabled = true;
        }

        if (downloadFromPreview) {
            originalTextPreview = downloadFromPreview.innerHTML;
            downloadFromPreview.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Préparation...';
            downloadFromPreview.disabled = true;
        }

        try {
            const zip = new JSZip();

            // Ajouter tous les fichiers au zip
            this.generatedFiles.forEach((content, filepath) => {
                zip.file(filepath, content);
            });

            // Ajouter un dossier pour les images (vide, mais structure préservée)
            zip.folder('img/client');
            zip.folder('img/portfolio');
            zip.folder('img/service');
            zip.folder('img/team');

            // Ajouter un fichier README
            const readmeContent = `# Site Salon Généré

Ce site a été généré automatiquement avec le Générateur de Site Salon.

## Structure du projet :
- index.html : Page principale
- css/ : Fichiers de style
- js/ : Fichiers JavaScript
- img/ : Dossier pour les images (à remplir avec vos propres images)

## Instructions :
1. Remplacez les images dans le dossier img/ par vos propres photos
2. Modifiez le fichier index.html si nécessaire
3. Uploadez tous les fichiers sur votre serveur web

Bonne chance avec votre nouveau site !
`;

            zip.file('README.md', readmeContent);

            const content = await zip.generateAsync({ 
                type: 'blob',
                compression: "DEFLATE",
                compressionOptions: {
                    level: 6
                }
            });

            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `salon-website-${this.selectedTemplate}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Restaurer les boutons
            if (downloadBtn) {
                downloadBtn.innerHTML = '<i class="fas fa-check"></i> Téléchargé !';
                setTimeout(() => {
                    downloadBtn.innerHTML = originalText;
                    downloadBtn.disabled = false;
                }, 2000);
            }

            if (downloadFromPreview) {
                downloadFromPreview.innerHTML = '<i class="fas fa-check"></i> Téléchargé !';
                setTimeout(() => {
                    downloadFromPreview.innerHTML = originalTextPreview;
                    downloadFromPreview.disabled = false;
                }, 2000);
            }

            console.log(`Téléchargement terminé: salon-website-${this.selectedTemplate}.zip`);

        } catch (error) {
            console.error('Erreur lors de la création du zip:', error);
            alert('Erreur lors du téléchargement. Veuillez réessayer.');

            // Restaurer les boutons en cas d'erreur
            if (downloadBtn) {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }
            if (downloadFromPreview) {
                downloadFromPreview.innerHTML = originalTextPreview;
                downloadFromPreview.disabled = false;
            }
        }
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    try {
        new SalonGenerator();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du générateur:', error);
        alert('Erreur lors du chargement du générateur. Veuillez recharger la page.');
    }
});