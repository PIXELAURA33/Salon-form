
class SalonGenerator {
    constructor() {
        this.generatedHTML = null;
        this.generatedFiles = new Map();
        this.selectedTemplate = this.getSelectedTemplate();
        this.customImages = new Map(); // Stocker les images personnalisées
        this.init();
    }

    getSelectedTemplate() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('template') || 'classic';
    }

    init() {
        document.getElementById('salonForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadZip());
        document.getElementById('downloadFromPreview').addEventListener('click', () => this.downloadZip());
        this.initImageUploads();
        this.updateImageFormatInfo();
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
        
        if (files.length > 0) {
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
                    input.files = files;
                    this.handleSingleImageUpload({ target: input }, inputId);
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
                container.appendChild(img);
            });
            
            previewElement.style.display = 'block';
        }
    }

    validateImageFile(file, inputId) {
        // Définir les règles de validation par template et par type d'image
        const templateValidationRules = {
            'classic': {
                'heroImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Image d\'en-tête (Classic)'
                },
                'aboutImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Image À propos (Classic)'
                },
                'logoImage': {
                    formats: ['image/png', 'image/svg+xml', 'image/webp'],
                    maxSize: 2 * 1024 * 1024, // 2MB
                    name: 'Logo (Classic)'
                },
                'footerImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Image de pied de page (Classic)'
                },
                'team1Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 3 * 1024 * 1024, // 3MB
                    name: 'Photo équipe 1 (Classic)'
                },
                'team2Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 3 * 1024 * 1024, // 3MB
                    name: 'Photo équipe 2 (Classic)'
                },
                'team3Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 3 * 1024 * 1024, // 3MB
                    name: 'Photo équipe 3 (Classic)'
                },
                'portfolioImages': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 4 * 1024 * 1024, // 4MB
                    name: 'Image portfolio (Classic)'
                }
            },
            'modern': {
                'heroImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 6 * 1024 * 1024, // 6MB - Plus grand pour les effets modernes
                    name: 'Image d\'en-tête (Modern)'
                },
                'aboutImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Image À propos (Modern)'
                },
                'logoImage': {
                    formats: ['image/png', 'image/svg+xml', 'image/webp'],
                    maxSize: 3 * 1024 * 1024, // 3MB - SVG préféré pour Modern
                    name: 'Logo (Modern - SVG recommandé)'
                },
                'footerImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Image de pied de page (Modern)'
                },
                'team1Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 4 * 1024 * 1024, // 4MB
                    name: 'Photo équipe 1 (Modern)'
                },
                'team2Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 4 * 1024 * 1024, // 4MB
                    name: 'Photo équipe 2 (Modern)'
                },
                'team3Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 4 * 1024 * 1024, // 4MB
                    name: 'Photo équipe 3 (Modern)'
                },
                'portfolioImages': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024, // 5MB - Plus grand pour Modern
                    name: 'Image portfolio (Modern)'
                }
            },
            'luxury': {
                'heroImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 8 * 1024 * 1024, // 8MB - Qualité premium
                    name: 'Image d\'en-tête (Luxury - Haute qualité)'
                },
                'aboutImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 6 * 1024 * 1024, // 6MB
                    name: 'Image À propos (Luxury)'
                },
                'logoImage': {
                    formats: ['image/png', 'image/svg+xml'],
                    maxSize: 3 * 1024 * 1024, // 3MB - PNG ou SVG uniquement
                    name: 'Logo (Luxury - PNG/SVG uniquement)'
                },
                'footerImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 6 * 1024 * 1024, // 6MB
                    name: 'Image de pied de page (Luxury)'
                },
                'team1Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Photo équipe 1 (Luxury)'
                },
                'team2Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Photo équipe 2 (Luxury)'
                },
                'team3Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Photo équipe 3 (Luxury)'
                },
                'portfolioImages': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 6 * 1024 * 1024, // 6MB - Qualité premium
                    name: 'Image portfolio (Luxury)'
                }
            },
            'minimal': {
                'heroImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/webp'],
                    maxSize: 3 * 1024 * 1024, // 3MB - Optimisé pour minimal
                    name: 'Image d\'en-tête (Minimal - WEBP recommandé)'
                },
                'aboutImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/webp'],
                    maxSize: 3 * 1024 * 1024, // 3MB
                    name: 'Image À propos (Minimal)'
                },
                'logoImage': {
                    formats: ['image/svg+xml', 'image/png'],
                    maxSize: 1 * 1024 * 1024, // 1MB - SVG préféré pour minimal
                    name: 'Logo (Minimal - SVG recommandé)'
                },
                'footerImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/webp'],
                    maxSize: 3 * 1024 * 1024, // 3MB
                    name: 'Image de pied de page (Minimal)'
                },
                'team1Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/webp'],
                    maxSize: 2 * 1024 * 1024, // 2MB
                    name: 'Photo équipe 1 (Minimal)'
                },
                'team2Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/webp'],
                    maxSize: 2 * 1024 * 1024, // 2MB
                    name: 'Photo équipe 2 (Minimal)'
                },
                'team3Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/webp'],
                    maxSize: 2 * 1024 * 1024, // 2MB
                    name: 'Photo équipe 3 (Minimal)'
                },
                'portfolioImages': {
                    formats: ['image/jpeg', 'image/jpg', 'image/webp'],
                    maxSize: 3 * 1024 * 1024, // 3MB
                    name: 'Image portfolio (Minimal)'
                }
            },
            'barber': {
                'heroImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Image d\'en-tête (Barber)'
                },
                'aboutImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 4 * 1024 * 1024, // 4MB
                    name: 'Image À propos (Barber)'
                },
                'logoImage': {
                    formats: ['image/png', 'image/svg+xml'],
                    maxSize: 2 * 1024 * 1024, // 2MB - PNG/SVG pour logos vintage
                    name: 'Logo (Barber - Style vintage)'
                },
                'footerImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 4 * 1024 * 1024, // 4MB
                    name: 'Image de pied de page (Barber)'
                },
                'team1Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 3 * 1024 * 1024, // 3MB
                    name: 'Photo équipe 1 (Barber)'
                },
                'team2Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 3 * 1024 * 1024, // 3MB
                    name: 'Photo équipe 2 (Barber)'
                },
                'team3Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 3 * 1024 * 1024, // 3MB
                    name: 'Photo équipe 3 (Barber)'
                },
                'portfolioImages': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 4 * 1024 * 1024, // 4MB
                    name: 'Image portfolio (Barber)'
                }
            },
            'creative': {
                'heroImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 7 * 1024 * 1024, // 7MB - Plus grand pour créatif
                    name: 'Image d\'en-tête (Creative)'
                },
                'aboutImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 6 * 1024 * 1024, // 6MB
                    name: 'Image À propos (Creative)'
                },
                'logoImage': {
                    formats: ['image/png', 'image/svg+xml', 'image/webp'],
                    maxSize: 4 * 1024 * 1024, // 4MB - Tous formats pour créativité
                    name: 'Logo (Creative - Tous formats)'
                },
                'footerImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 6 * 1024 * 1024, // 6MB
                    name: 'Image de pied de page (Creative)'
                },
                'team1Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Photo équipe 1 (Creative)'
                },
                'team2Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Photo équipe 2 (Creative)'
                },
                'team3Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    name: 'Photo équipe 3 (Creative)'
                },
                'portfolioImages': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    maxSize: 6 * 1024 * 1024, // 6MB - Plus grand pour créatif
                    name: 'Image portfolio (Creative)'
                }
            }
        };

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
        
        // Validation des champs obligatoires
        const salonName = document.getElementById('salonName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        
        if (!salonName || !phone || !address) {
            alert('Veuillez remplir tous les champs obligatoires (nom du salon, téléphone, adresse).');
            return;
        }
        
        // Afficher un indicateur de chargement
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération en cours...';
        submitBtn.disabled = true;
        
        try {
            const formData = this.getFormData();
            await this.generateSite(formData);
            this.showPreview();
            
            document.getElementById('downloadBtn').disabled = false;
            document.getElementById('previewBtn').disabled = false;
            
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
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    getFormData() {
        return {
            salonName: document.getElementById('salonName').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            email: document.getElementById('email').value || '',
            website: document.getElementById('website').value || '',
            description: document.getElementById('description').value || '',
            hours: document.getElementById('hours').value || 'Nous contacter pour les horaires',
            facebook: document.getElementById('facebook').value || '',
            instagram: document.getElementById('instagram').value || '',
            whatsapp: document.getElementById('whatsapp').value || '',
            primaryColor: document.getElementById('primaryColor').value || '#667eea',
            secondaryColor: document.getElementById('secondaryColor').value || '#764ba2'
        };
    }

    async loadTemplate(templateType) {
        const templates = {
            'classic': await this.getClassicTemplate(),
            'modern': await this.getModernTemplate(),
            'luxury': await this.getLuxuryTemplate(),
            'minimal': await this.getMinimalTemplate(),
            'barber': await this.getBarberTemplate(),
            'creative': await this.getCreativeTemplate()
        };
        return templates[templateType] || templates['classic'];
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
            htmlContent = this.integrateCustomImages(htmlContent);
            
            this.generatedHTML = htmlContent;
            
            // Préparer les fichiers pour le téléchargement
            await this.prepareFilesForDownload();
            
        } catch (error) {
            console.error('Erreur lors de la génération:', error);
            alert('Erreur lors de la génération du site. Veuillez réessayer.');
        }
    }

    integrateCustomImages(html) {
        // Remplacer les images par les versions personnalisées (en base64)
        // tout en préservant les styles CSS d'origine
        
        // Image hero/header - conserver les styles CSS background-image
        if (this.customImages.has('heroImage')) {
            const heroImg = this.customImages.get('heroImage');
            // Remplacer dans les styles CSS et attributs src
            html = html.replace(/url\("\.\.\/img\/header-background-1\.jpg"\)/g, `url("${heroImg.data}")`);
            html = html.replace(/url\("\.\.\/img\/header-background-2\.jpg"\)/g, `url("${heroImg.data}")`);
            html = html.replace(/header-background-1\.jpg/g, heroImg.data);
            html = html.replace(/header-background-2\.jpg/g, heroImg.data);
        }

        // Image "À propos" / Perfect Style - conserver les styles background-image
        if (this.customImages.has('aboutImage')) {
            const aboutImg = this.customImages.get('aboutImage');
            html = html.replace(/url\("\.\.\/img\/perfect-style\.jpg"\)/g, `url("${aboutImg.data}")`);
            html = html.replace(/perfect-style\.jpg/g, aboutImg.data);
        }

        // Footer background - conserver les styles background-image
        if (this.customImages.has('footerImage')) {
            const footerImg = this.customImages.get('footerImage');
            html = html.replace(/url\("\.\.\/img\/bg-footer1\.jpg"\)/g, `url("${footerImg.data}")`);
            html = html.replace(/bg-footer1\.jpg/g, footerImg.data);
        }

        // Logo - conserver les attributs src des balises img
        if (this.customImages.has('logoImage')) {
            const logoImg = this.customImages.get('logoImage');
            html = html.replace(/src="img\/logo\.png"/g, `src="${logoImg.data}"`);
            html = html.replace(/src="img\/beauty-salon_logo_96dp\.png"/g, `src="${logoImg.data}"`);
            html = html.replace(/logo\.png/g, logoImg.data);
            html = html.replace(/beauty-salon_logo_96dp\.png/g, logoImg.data);
        }

        // Images d'équipe - conserver les classes et styles des balises img
        if (this.customImages.has('team1Image')) {
            const teamImg = this.customImages.get('team1Image');
            html = html.replace(/src="img\/team\/team-1\.jpg"/g, `src="${teamImg.data}"`);
            html = html.replace(/team-1\.jpg/g, teamImg.data);
        }
        if (this.customImages.has('team2Image')) {
            const teamImg = this.customImages.get('team2Image');
            html = html.replace(/src="img\/team\/team-2\.jpg"/g, `src="${teamImg.data}"`);
            html = html.replace(/team-2\.jpg/g, teamImg.data);
        }
        if (this.customImages.has('team3Image')) {
            const teamImg = this.customImages.get('team3Image');
            html = html.replace(/src="img\/team\/team-3\.jpg"/g, `src="${teamImg.data}"`);
            html = html.replace(/team-3\.jpg/g, teamImg.data);
        }

        // Portfolio images - conserver les classes et effets hover
        if (this.customImages.has('portfolioImages')) {
            const portfolioImages = this.customImages.get('portfolioImages');
            portfolioImages.forEach((image, index) => {
                const portfolioIndex = index + 1;
                // Remplacer dans les attributs src tout en gardant les classes CSS
                html = html.replace(
                    new RegExp(`src="img/portfolio/portfolio-${portfolioIndex}\\.jpg"`, 'g'), 
                    `src="${image.data}"`
                );
                // Remplacer les références directes
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
        html = html.replace(/{{SALON_NAME}}/g, data.salonName);
        html = html.replace(/{{PHONE}}/g, data.phone);
        html = html.replace(/{{ADDRESS}}/g, data.address);
        html = html.replace(/{{DESCRIPTION}}/g, data.description || `Bienvenue chez ${data.salonName}, votre salon de coiffure professionnel.`);
        html = html.replace(/{{HOURS}}/g, data.hours.replace(/\n/g, '<br>'));
        html = html.replace(/{{PRIMARY_COLOR}}/g, data.primaryColor);
        html = html.replace(/{{SECONDARY_COLOR}}/g, data.secondaryColor);

        // Sections conditionnelles
        const emailSection = data.email ? `<p><strong>Email :</strong> <a href="mailto:${data.email}">${data.email}</a></p>` : '';
        const websiteSection = data.website ? `<p><strong>Site web :</strong> <a href="${data.website}" target="_blank">${data.website}</a></p>` : '';
        
        let socialSection = '';
        if (data.facebook || data.instagram || data.whatsapp) {
            socialSection = `<div class="mb-4">
                <i class="fas fa-share-alt fa-2x mb-3" style="color: ${data.primaryColor};"></i>
                <h5>Réseaux sociaux</h5>`;
            if (data.facebook) socialSection += `<a href="${data.facebook}" class="me-3"><i class="fab fa-facebook fa-2x"></i></a>`;
            if (data.instagram) socialSection += `<a href="${data.instagram}" class="me-3"><i class="fab fa-instagram fa-2x"></i></a>`;
            if (data.whatsapp) socialSection += `<a href="https://wa.me/${data.whatsapp}" class="me-3"><i class="fab fa-whatsapp fa-2x"></i></a>`;
            socialSection += '</div>';
        }

        html = html.replace(/{{EMAIL_SECTION}}/g, emailSection);
        html = html.replace(/{{WEBSITE_SECTION}}/g, websiteSection);
        html = html.replace(/{{SOCIAL_SECTION}}/g, socialSection);

        // Remplacements pour l'ancien template (rétrocompatibilité)
        html = html.replace(/Beauty &amp; Salon - Free Bootstrap 4 Template/g, `${data.salonName} - Salon de Coiffure`);
        html = html.replace(/Beauty and Salon - Free Bootstrap 4 Template \| Boostraptheme/g, `${data.salonName} - Salon de Coiffure`);
        
        // Remplacer les informations de contact dans le header
        html = html.replace(/\(91\) 999 9999 99/g, data.phone);
        html = html.replace(/Dros Began, India 222312/g, data.address);
        
        // Remplacer le nom du salon dans le contenu
        html = html.replace(/Fascinating than any <br> fashion salon/g, `Bienvenue chez <br> ${data.salonName}`);
        html = html.replace(/your hair style <br> our passionate team/g, `${data.salonName} <br> Votre style, notre passion`);
        
        // Remplacer le contenu "About Us"
        const aboutSection = `
            <h3>À propos de ${data.salonName}</h3>
            <div class="bord-bottom"></div>
            <p>Bienvenue chez ${data.salonName}, votre salon de coiffure de confiance situé à ${data.address}. Notre équipe passionnée vous offre des services de qualité dans une atmosphère chaleureuse et professionnelle.</p>
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
                text: `Excellent service chez ${data.salonName} ! L'équipe est très professionnelle et à l'écoute. Je recommande vivement !`
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
            `Copyright &copy; ${new Date().getFullYear()} ${data.salonName}`);

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
            if (key === 'portfolioImages') {
                // Pour le portfolio, ajouter chaque image
                imageData.forEach((image, index) => {
                    const extension = image.type.split('/')[1] || 'jpg';
                    const filename = `img/portfolio/custom-portfolio-${index + 1}.${extension}`;
                    const binaryData = this.base64ToBinary(image.data);
                    this.generatedFiles.set(filename, binaryData);
                });
            } else {
                // Pour les images individuelles
                const extension = imageData.type.split('/')[1] || 'jpg';
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
            }
        }
    }

    async copyOriginalImages() {
        // Copier les images originales qui n'ont pas été remplacées
        const imagePaths = [
            'img/client/client-1.jpg', 'img/client/client-2.jpg', 'img/client/client-3.jpg',
            'img/service/service-1.jpg', 'img/service/service-2.jpg', 'img/service/service-3.jpg', 'img/service/service-4.jpg',
            'img/loading.gif', 'img/treamer-small.png'
        ];

        // Ajouter les images originales non remplacées
        if (!this.customImages.has('heroImage')) {
            imagePaths.push('img/header-background-1.jpg', 'img/header-background-2.jpg');
        }
        if (!this.customImages.has('aboutImage')) {
            imagePaths.push('img/perfect-style.jpg');
        }
        if (!this.customImages.has('logoImage')) {
            imagePaths.push('img/logo.png', 'img/beauty-salon_logo_96dp.png');
        }
        if (!this.customImages.has('footerImage')) {
            imagePaths.push('img/bg-footer1.jpg');
        }
        if (!this.customImages.has('team1Image')) {
            imagePaths.push('img/team/team-1.jpg');
        }
        if (!this.customImages.has('team2Image')) {
            imagePaths.push('img/team/team-2.jpg');
        }
        if (!this.customImages.has('team3Image')) {
            imagePaths.push('img/team/team-3.jpg');
        }

        // Ajouter les images portfolio non remplacées
        if (!this.customImages.has('portfolioImages')) {
            for (let i = 1; i <= 10; i++) {
                imagePaths.push(`img/portfolio/portfolio-${i}.jpg`);
            }
        }

        for (const imagePath of imagePaths) {
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
    }

    base64ToBinary(base64String) {
        // Supprimer le préfixe data:image/...;base64,
        const base64Data = base64String.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    showPreview() {
        const previewFrame = document.getElementById('previewFrame');
        const blob = new Blob([this.generatedHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        previewFrame.src = url;
        
        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
        modal.show();
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
            alert('Erreur: Bibliothèque JSZip non chargée. Veuillez recharger la page.');
            return;
        }

        // Afficher indicateur de téléchargement
        const downloadBtn = document.getElementById('downloadBtn');
        const downloadFromPreview = document.getElementById('downloadFromPreview');
        const originalText = downloadBtn.innerHTML;
        const originalTextPreview = downloadFromPreview.innerHTML;
        
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Préparation...';
        downloadFromPreview.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Préparation...';
        downloadBtn.disabled = true;
        downloadFromPreview.disabled = true;

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
        
        try {
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
            downloadBtn.innerHTML = '<i class="fas fa-check"></i> Téléchargé !';
            downloadFromPreview.innerHTML = '<i class="fas fa-check"></i> Téléchargé !';
            
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadFromPreview.innerHTML = originalTextPreview;
                downloadBtn.disabled = false;
                downloadFromPreview.disabled = false;
            }, 2000);
            
            console.log(`Téléchargement terminé: salon-website-${this.selectedTemplate}.zip`);
            
        } catch (error) {
            console.error('Erreur lors de la création du zip:', error);
            alert('Erreur lors du téléchargement. Veuillez réessayer.');
            
            // Restaurer les boutons en cas d'erreur
            downloadBtn.innerHTML = originalText;
            downloadFromPreview.innerHTML = originalTextPreview;
            downloadBtn.disabled = false;
            downloadFromPreview.disabled = false;
        }
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    new SalonGenerator();
});
