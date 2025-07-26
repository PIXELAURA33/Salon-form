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
            return urlParams.get('template') || 'barber';
        } catch (error) {
            console.warn('Erreur lors de la lecture des paramètres URL:', error);
            return 'barber';
        }
    }

    init() {
        try {
            console.log('Initialisation du générateur de salon...');

            const form = document.getElementById('salonForm');
            const downloadBtn = document.getElementById('downloadBtn');
            const downloadFromPreview = document.getElementById('downloadFromPreview');

            if (form) {
                // Supprimer tous les anciens gestionnaires d'événements
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);

                // Ajouter le nouveau gestionnaire
                newForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Événement submit déclenché');
                    return this.handleFormSubmit(e);
                });

                console.log('Gestionnaire de formulaire initialisé');
            } else {
                console.error('Formulaire #salonForm non trouvé');
            }

            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => this.downloadZip());
            }
            if (downloadFromPreview) {
                downloadFromPreview.addEventListener('click', () => this.downloadZip());
            }

            // Gestionnaire pour le bouton aperçu
            const previewBtn = document.getElementById('previewBtn');
            if (previewBtn) {
                previewBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Bouton aperçu cliqué');
                    this.generateAndPreview();
                });
            }

            this.initImageUploads();
            this.updateImageFormatInfo();
            this.initFormValidation();

            console.log('Initialisation terminée');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
        }
    }

    initFormValidation() {
        // Validation en temps réel des champs obligatoires
        const requiredFields = ['salonName', 'phone', 'address'];

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.validateRequiredField(field));
                field.addEventListener('blur', () => this.validateRequiredField(field));
            }
        });

        // Validation du téléphone
        const phoneField = document.getElementById('phone');
        if (phoneField) {
            phoneField.addEventListener('input', () => this.validatePhone(phoneField));
        }

        // Validation de l'email
        const emailField = document.getElementById('email');
        if (emailField) {
            emailField.addEventListener('input', () => this.validateEmail(emailField));
        }
    }

    validateRequiredField(field) {
        const value = field.value.trim();
        const isValid = value.length > 0;

        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
        }

        return isValid;
    }

    validatePhone(field) {
        const value = field.value.trim();
        const phoneRegex = /^[\d\s\-\+\(\)\.]{8,}$/;
        const isValid = value === '' || phoneRegex.test(value);

        if (isValid && value !== '') {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else if (value !== '') {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
        } else {
            field.classList.remove('is-valid', 'is-invalid');
        }

        return isValid;
    }

    validateEmail(field) {
        const value = field.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = value === '' || emailRegex.test(value);

        if (isValid && value !== '') {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else if (value !== '') {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
        } else {
            field.classList.remove('is-valid', 'is-invalid');
        }

        return isValid;
    }

    updateImageFormatInfo() {
        // Informations de format selon le template sélectionné
        const templateFormatInfo = {
            'barber': {
                'heroImageInfo': 'JPG, PNG uniquement | 1920x1080px | Max: 5MB',
                'logoImageInfo': 'PNG, SVG (style vintage) | 200x200px | Max: 2MB'
            },
            'alotan': {
                'heroImageInfo': 'JPG, PNG uniquement | 1920x1080px | Max: 5MB',
                'logoImageInfo': 'PNG, SVG (style moderne) | 150x150px | Max: 2MB'
            },
            'grafreez': {
                'heroImageInfo': 'JPG, PNG uniquement | 1920x1080px | Max: 5MB',
                'logoImageInfo': 'PNG, SVG (style professionnel) | 180x180px | Max: 2MB'
            }
        };

        const currentTemplateInfo = templateFormatInfo[this.selectedTemplate] || templateFormatInfo['barber'];

        // Mettre à jour les éléments si ils existent
        Object.keys(currentTemplateInfo).forEach(infoId => {
            const element = document.getElementById(infoId);
            if (element) {
                const parts = currentTemplateInfo[infoId].split(' | ');
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
            // Gestion des uploads d'images selon le template
            const templateImageInputs = this.getTemplateImageInputs();

            templateImageInputs.forEach(inputId => {
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

    getTemplateImageInputs() {
        const templateInputs = {
            'barber': ['heroImage', 'logoImage', 'team1Image', 'team2Image', 'team3Image'],
            'alotan': ['heroImage', 'logoImage'],
            'grafreez': ['heroImage', 'logoImage']
        };

        return templateInputs[this.selectedTemplate] || templateInputs['barber'];
    }

    async handleSingleImageUpload(e, inputId) {
        const file = e.target && e.target.files ? e.target.files[0] : null;
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
        const files = e.target && e.target.files ? Array.from(e.target.files) : [];
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

            for (const file of files) {
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
        if (!file) {
            return { isValid: false, error: 'Aucun fichier sélectionné.' };
        }

        if (!file.type) {
            return { isValid: false, error: 'Type de fichier non détecté.' };
        }

        // Vérifier que c'est bien une image
        if (!file.type.startsWith('image/')) {
            return { isValid: false, error: 'Le fichier doit être une image.' };
        }

        // Règles de validation selon le template sélectionné
        const templateValidationRules = {
            'barber': {
                'heroImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 5 * 1024 * 1024,
                    name: 'Image d\'en-tête (Barber X)'
                },
                'logoImage': {
                    formats: ['image/png', 'image/svg+xml'],
                    maxSize: 2 * 1024 * 1024,
                    name: 'Logo (Barber X)'
                },
                'team1Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 3 * 1024 * 1024,
                    name: 'Photo équipe 1 (Barber X)'
                },
                'team2Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 3 * 1024 * 1024,
                    name: 'Photo équipe 2 (Barber X)'
                },
                'team3Image': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 3 * 1024 * 1024,
                    name: 'Photo équipe 3 (Barber X)'
                },
                'portfolioImages': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 4 * 1024 * 1024,
                    name: 'Image portfolio (Barber X)'
                }
            },
            'alotan': {
                'heroImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 5 * 1024 * 1024,
                    name: 'Image d\'en-tête (Alotan)'
                },
                'logoImage': {
                    formats: ['image/png', 'image/svg+xml'],
                    maxSize: 2 * 1024 * 1024,
                    name: 'Logo (Alotan)'
                },
                'portfolioImages': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 4 * 1024 * 1024,
                    name: 'Image portfolio (Alotan)'
                }
            },
            'grafreez': {
                'heroImage': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 5 * 1024 * 1024,
                    name: 'Image d\'en-tête (Grafreez)'
                },
                'logoImage': {
                    formats: ['image/png', 'image/svg+xml'],
                    maxSize: 2 * 1024 * 1024,
                    name: 'Logo (Grafreez)'
                },
                'portfolioImages': {
                    formats: ['image/jpeg', 'image/jpg', 'image/png'],
                    maxSize: 4 * 1024 * 1024,
                    name: 'Image portfolio (Grafreez)'
                }
            }
        };

        // Obtenir les règles pour le template actuel
        const templateRules = templateValidationRules[this.selectedTemplate] || templateValidationRules['barber'];
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

    async generateAndPreview() {
        try {
            console.log('Génération et aperçu...');

            const salonName = document.getElementById('salonName')?.value?.trim() || '';
            const phone = document.getElementById('phone')?.value?.trim() || '';
            const address = document.getElementById('address')?.value?.trim() || '';

            if (!salonName || !phone || !address) {
                alert('Veuillez remplir tous les champs obligatoires (nom du salon, téléphone, adresse).');
                return;
            }

            const formData = this.getFormData();
            await this.generateSite(formData);
            this.showPreview();

            // Activer les boutons de téléchargement
            const downloadBtn = document.getElementById('downloadBtn');
            const downloadFromPreview = document.getElementById('downloadFromPreview');
            if (downloadBtn) downloadBtn.disabled = false;
            if (downloadFromPreview) downloadFromPreview.disabled = false;

        } catch (error) {
            console.error('Erreur lors de la génération:', error);
            alert('Une erreur est survenue lors de la génération du site.');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation();

        try {
            console.log('Début de la génération du site...');

            // Validation des champs obligatoires
            const salonName = document.getElementById('salonName')?.value?.trim() || '';
            const phone = document.getElementById('phone')?.value?.trim() || '';
            const address = document.getElementById('address')?.value?.trim() || '';

            if (!salonName || !phone || !address) {
                alert('Veuillez remplir tous les champs obligatoires (nom du salon, téléphone, adresse).');
                return false;
            }

            // Trouver le bouton de soumission
            const submitBtn = document.querySelector('button[type="submit"]');
            if (!submitBtn) {
                console.error('Bouton de soumission non trouvé');
                return this.generateAndPreview();
            }

            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération en cours...';
            submitBtn.disabled = true;

            console.log('Récupération des données du formulaire...');
            const formData = this.getFormData();

            console.log('Génération du site avec les données:', formData);
            await this.generateSite(formData);

            console.log('Affichage de l\'aperçu...');
            this.showPreview();

            const downloadBtn = document.getElementById('downloadBtn');
            const previewBtn = document.getElementById('previewBtn');

            if (downloadBtn) downloadBtn.disabled = false;
            if (previewBtn) previewBtn.disabled = false;

            // Succès
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Site généré !';
            console.log('Site généré avec succès !');

            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);

            return false; // Empêcher la soumission du formulaire

        } catch (error) {
            console.error('Erreur lors de la génération:', error);
            alert('Une erreur est survenue lors de la génération du site. Veuillez réessayer.');

            // Restaurer le bouton
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-magic"></i> Générer le site';
                submitBtn.disabled = false;
            }

            return false;
        }
    }

    getFormData() {
        const getValue = (id, defaultValue = '') => {
            const element = document.getElementById(id);
            return element ? element.value.trim() : defaultValue;
        };

        const data = {
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

        // Validation et nettoyage des données
        try {
            // Validation des URLs
            if (data.website && !data.website.startsWith('http')) {
                data.website = 'https://' + data.website;
            }
            if (data.facebook && !data.facebook.startsWith('http')) {
                data.facebook = 'https://' + data.facebook;
            }
            if (data.instagram && !data.instagram.startsWith('http')) {
                data.instagram = 'https://' + data.instagram;
            }

            // Validation de l'email
            if (data.email && !this.isValidEmail(data.email)) {
                console.warn('Email invalide fourni:', data.email);
                data.email = '';
            }

            // Validation des couleurs
            if (!this.isValidColor(data.primaryColor)) {
                data.primaryColor = '#667eea';
            }
            if (!this.isValidColor(data.secondaryColor)) {
                data.secondaryColor = '#764ba2';
            }

            // Échapper les données pour éviter les injections HTML
            data.salonName = this.escapeHtml(data.salonName);
            data.description = this.escapeHtml(data.description);
            data.address = this.escapeHtml(data.address);

        } catch (error) {
            console.error('Erreur lors de la validation des données:', error);
        }

        return data;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidColor(color) {
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return colorRegex.test(color);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadTemplate(templateType) {
        switch(templateType) {
            case 'alotan':
                return await this.getAlotanTemplate();
            case 'grafreez':
                return await this.getGrafreezTemplate();
            case 'barber':
            default:
                return await this.getBarberTemplate();
        }
    }

    async getBarberTemplate() {
        try {
            // Charger le template Barber X depuis .templates/
            const response = await fetch('.templates/index.html');
            if (response.ok) {
                const template = await response.text();
                console.log('Template Barber X chargé avec succès');
                return template;
            }
        } catch (error) {
            console.warn('Template Barber X non trouvé:', error.message);
            throw new Error('Template Barber X introuvable');
        }
    }

    async getAlotanTemplate() {
        try {
            // Charger le template Alotan depuis .templates/
            const response = await fetch('.templates/alotan-index.html');
            if (response.ok) {
                const template = await response.text();
                console.log('Template Alotan chargé avec succès');
                return template;
            }
        } catch (error) {
            console.warn('Template Alotan non trouvé:', error.message);
            throw new Error('Template Alotan introuvable');
        }
    }

    async getGrafreezTemplate() {
        try {
            // Charger le template Grafreez depuis .templates/
            const response = await fetch('.templates/grafreez-index.html');
            if (response.ok) {
                const template = await response.text();
                console.log('Template Grafreez chargé avec succès');
                return template;
            }
        } catch (error) {
            console.warn('Template Grafreez non trouvé:', error.message);
            throw new Error('Template Grafreez introuvable');
        }
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
            // Remplacements pour tous les templates
            html = html.replace(/url\(['"]?\.?\.?\/img\/header-background-1\.jpg['"]?\)/g, `url("${heroImg.data}")`);
            html = html.replace(/url\(['"]?\.?\.?\/img\/header-background-2\.jpg['"]?\)/g, `url("${heroImg.data}")`);
            html = html.replace(/src=['"]img\/header-background-1\.jpg['"]/g, `src="${heroImg.data}"`);
            html = html.replace(/src=['"]img\/header-background-2\.jpg['"]/g, `src="${heroImg.data}"`);
            html = html.replace(/header-background-1\.jpg/g, heroImg.data);
            html = html.replace(/header-background-2\.jpg/g, heroImg.data);

            // Pour template Alotan et Grafreez (autres noms possibles)
            html = html.replace(/url\(['"]?\.?\.?\/img\/hero\.jpg['"]?\)/g, `url("${heroImg.data}")`);
            html = html.replace(/url\(['"]?\.?\.?\/img\/banner\.jpg['"]?\)/g, `url("${heroImg.data}")`);
            html = html.replace(/src=['"]img\/hero\.jpg['"]/g, `src="${heroImg.data}"`);
            html = html.replace(/src=['"]img\/banner\.jpg['"]/g, `src="${heroImg.data}"`);
        }

        // Logo
        if (this.customImages.has('logoImage')) {
            const logoImg = this.customImages.get('logoImage');
            html = html.replace(/src=['"]img\/logo\.png['"]/g, `src="${logoImg.data}"`);
            html = html.replace(/src=['"]img\/beauty-salon_logo_96dp\.png['"]/g, `src="${logoImg.data}"`);
            html = html.replace(/src=['"]img\/logo\.svg['"]/g, `src="${logoImg.data}"`);
            html = html.replace(/logo\.png/g, logoImg.data);
            html = html.replace(/beauty-salon_logo_96dp\.png/g, logoImg.data);
            html = html.replace(/logo\.svg/g, logoImg.data);
        }

        // Images d'équipe (seulement pour template Barber)
        if (this.selectedTemplate === 'barber') {
            ['team1Image', 'team2Image', 'team3Image'].forEach((teamKey, index) => {
                const teamNumber = index + 1;
                if (this.customImages.has(teamKey)) {
                    const teamImg = this.customImages.get(teamKey);
                    html = html.replace(new RegExp(`src=['"]img/team/team-${teamNumber}\\.jpg['"]`, 'g'), `src="${teamImg.data}"`);
                    html = html.replace(new RegExp(`team-${teamNumber}\\.jpg`, 'g'), teamImg.data);
                }
            });
        }

        // Portfolio images (pour tous les templates)
        if (this.customImages.has('portfolioImages')) {
            const portfolioImages = this.customImages.get('portfolioImages');
            const maxImages = this.selectedTemplate === 'alotan' ? 4 : 6;

            portfolioImages.slice(0, maxImages).forEach((image, index) => {
                const portfolioIndex = index + 1;
                html = html.replace(
                    new RegExp(`src=['"]img/portfolio/portfolio-${portfolioIndex}\\.jpg['"]`, 'g'), 
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
        // Remplacements communs à tous les templates
        html = html.replace(/{{SALON_NAME}}/g, data.salonName || 'Mon Salon');
        html = html.replace(/{{PHONE}}/g, data.phone || '');
        html = html.replace(/{{ADDRESS}}/g, data.address || '');
        html = html.replace(/{{DESCRIPTION}}/g, data.description || `Bienvenue chez ${data.salonName || 'notre salon'}, votre salon de coiffure professionnel.`);
        html = html.replace(/{{HOURS}}/g, (data.hours || 'Nous contacter pour les horaires').replace(/\n/g, '<br>'));
        html = html.replace(/{{PRIMARY_COLOR}}/g, data.primaryColor || '#667eea');
        html = html.replace(/{{SECONDARY_COLOR}}/g, data.secondaryColor || '#764ba2');
        html = html.replace(/{{CURRENT_YEAR}}/g, new Date().getFullYear());

        // Horaires pour l'affichage dans la top bar
        const hoursDisplay = data.hours ? data.hours.split('\n')[0] || '9h-18h' : '9h-18h';
        html = html.replace(/{{HOURS_DISPLAY}}/g, hoursDisplay);

        // Remplacements spécifiques selon le template
        html = this.applyTemplateSpecificReplacements(html, data);

        // Sections conditionnelles
        const emailSection = data.email ? `<p><strong>Email :</strong> <a href="mailto:${data.email}">${data.email}</a></p>` : '';
        const websiteSection = data.website ? `<p><strong>Site web :</strong> <a href="${data.website}" target="_blank">${data.website}</a></p>` : '';

        // Email pour les sections contact et footer
        const emailContactSection = data.email ? `
            <div class="contact-item">
                <i class="fa fa-envelope"></i>
                <div>
                    <h4>Email</h4>
                    <p><a href="mailto:${data.email}">${data.email}</a></p>
                </div>
            </div>` : '';

        const emailFooterSection = data.email ? `<p><i class="fa fa-envelope"></i><a href="mailto:${data.email}">${data.email}</a></p>` : '';

        // Réseaux sociaux pour différentes sections
        let socialLinks = '';
        let socialContactSection = '';
        let socialFooterLinks = '';

        if (data.facebook || data.instagram || data.whatsapp) {
            // Pour la top bar
            if (data.facebook) socialLinks += `<a href="${data.facebook}" target="_blank"><i class="fab fa-facebook-f"></i></a>`;
            if (data.instagram) socialLinks += `<a href="${data.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>`;
            if (data.whatsapp) socialLinks += `<a href="https://wa.me/${data.whatsapp}" target="_blank"><i class="fab fa-whatsapp"></i></a>`;

            // Pour la section contact
            socialContactSection = `
                <div class="contact-item">
                    <i class="fa fa-share-alt"></i>
                    <div>
                        <h4>Réseaux sociaux</h4>
                        <div class="social-links">
                            ${socialLinks}
                        </div>
                    </div>
                </div>`;

            // Pour le footer
            if (data.facebook) socialFooterLinks += `<a href="${data.facebook}" target="_blank"><i class="fab fa-facebook-f"></i></a>`;
            if (data.instagram) socialFooterLinks += `<a href="${data.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>`;
            if (data.whatsapp) socialFooterLinks += `<a href="https://wa.me/${data.whatsapp}" target="_blank"><i class="fab fa-whatsapp"></i></a>`;
        }

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

        // Remplacer toutes les sections
        html = html.replace(/{{EMAIL_SECTION}}/g, emailSection);
        html = html.replace(/{{WEBSITE_SECTION}}/g, websiteSection);
        html = html.replace(/{{SOCIAL_SECTION}}/g, socialSection);
        html = html.replace(/{{SOCIAL_LINKS}}/g, socialLinks);
        html = html.replace(/{{EMAIL_CONTACT_SECTION}}/g, emailContactSection);
        html = html.replace(/{{EMAIL_FOOTER_SECTION}}/g, emailFooterSection);
        html = html.replace(/{{SOCIAL_CONTACT_SECTION}}/g, socialContactSection);
        html = html.replace(/{{SOCIAL_FOOTER_LINKS}}/g, socialFooterLinks);

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

        let copiedCount = 0;
        let errorCount = 0;

        // Copier toutes les images pour avoir des templates complets
        for (const imagePath of allRequiredImages) {
            try {
                const response = await fetch(`.templates/${imagePath}`);
                if (response.ok) {
                    const blob = await response.blob();
                    this.generatedFiles.set(imagePath, blob);
                    copiedCount++;
                } else {
                    console.warn(`Image non trouvée: ${imagePath} (${response.status})`);
                    errorCount++;
                }
            } catch (error) {
                console.warn(`Erreur lors du chargement de ${imagePath}:`, error.message);
                errorCount++;
            }
        }

        console.log(`Images copiées: ${copiedCount}/${allRequiredImages.length} fichiers copiés, ${errorCount} erreurs`);

        if (errorCount > 0) {
            console.warn(`Attention: ${errorCount} images n'ont pas pu être copiées. Le site pourrait avoir des images manquantes.`);
        }
    }

    applyTemplateSpecificReplacements(html, data) {
        switch(this.selectedTemplate) {
            case 'barber':
                return this.applyBarberReplacements(html, data);
            case 'alotan':
                return this.applyAlotanReplacements(html, data);
            case 'grafreez':
                return this.applyGrafreezReplacements(html, data);
            default:
                return this.applyBarberReplacements(html, data);
        }
    }

    applyBarberReplacements(html, data) {
        // Remplacements spécifiques au template Barber
        html = html.replace(/Beauty &amp; Salon - Free Bootstrap 4 Template/g, `${data.salonName || 'Mon Salon'} - Salon de Coiffure`);
        html = html.replace(/Beauty and Salon - Free Bootstrap 4 Template \| Boostraptheme/g, `${data.salonName || 'Mon Salon'} - Salon de Coiffure`);

        // Remplacer les informations de contact dans le header
        html = html.replace(/\(91\) 999 9999 99/g, data.phone || '');
        html = html.replace(/Dros Began, India 222312/g, data.address || '');

        // Remplacer le nom du salon dans le contenu
        html = html.replace(/Fascinating than any <br> fashion salon/g, `Bienvenue chez <br> ${data.salonName || 'notre salon'}`);
        html = html.replace(/your hair style <br> our passionate team/g, `${data.salonName || 'Notre salon'} <br> Votre style, notre passion`);

        return html;
    }

    applyAlotanReplacements(html, data) {
        // Remplacements spécifiques au template Alotan
        html = html.replace(/Alotan - Beauty Salon/g, `${data.salonName || 'Mon Salon'} - Salon de Beauté`);
        html = html.replace(/Professional Beauty Services/g, data.description || 'Services de beauté professionnels');

        // Remplacer les sections spécifiques à Alotan
        html = html.replace(/Welcome to Alotan/g, `Bienvenue chez ${data.salonName || 'notre salon'}`);
        html = html.replace(/Your Beauty is Our Priority/g, 'Votre beauté est notre priorité');

        return html;
    }

    applyGrafreezReplacements(html, data) {
        // Remplacements spécifiques au template Grafreez
        html = html.replace(/Grafreez - Hair Salon/g, `${data.salonName || 'Mon Salon'} - Salon de Coiffure`);
        html = html.replace(/Modern Hair Styling/g, data.description || 'Coiffure moderne et professionnelle');

        // Remplacer les sections spécifiques à Grafreez
        html = html.replace(/Expert Hair Stylists/g, 'Coiffeurs experts');
        html = html.replace(/Quality Hair Care/g, 'Soins capillaires de qualité');

        return html;
    }

    base64ToBinary(base64String) {
        try {
            // Supprimer le préfixe data:image/...;base64,
            const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
            if (!base64Data) {
                throw new Error('Données base64 invalides');
            }
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

        // Vérifier que le fichier HTML principal existe
        if (!this.generatedFiles.has('index.html')) {
            alert('Erreur: Fichier HTML principal manquant. Veuillez régénérer le site.');
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
        console.log('🚀 Initialisation du générateur de salon...');
        const generator = new SalonGenerator();
        console.log('✅ Générateur initialisé avec succès');
        
        // Test de fonctionnement
        setTimeout(() => {
            const form = document.getElementById('salonForm');
            const submitBtn = document.querySelector('button[type="submit"]');
            
            if (form && submitBtn) {
                console.log('✅ Formulaire et bouton de soumission détectés');
            } else {
                console.error('❌ Problème détecté:', { form: !!form, submitBtn: !!submitBtn });
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du générateur:', error);
        alert('Erreur lors du chargement du générateur. Veuillez recharger la page.');
    }
});