
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
                container.addEventListener('dragover', (e) => this.handleDragOver(e));
                container.addEventListener('drop', (e) => this.handleDrop(e, inputId));
                container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            }
        });

        // Gestion du portfolio (multiple images)
        const portfolioInput = document.getElementById('portfolioImages');
        if (portfolioInput) {
            portfolioInput.addEventListener('change', (e) => this.handlePortfolioImagesUpload(e));
            
            const container = portfolioInput.parentElement;
            container.addEventListener('dragover', (e) => this.handleDragOver(e));
            container.addEventListener('drop', (e) => this.handleDrop(e, 'portfolioImages'));
            container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
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
                const dt = new DataTransfer();
                dt.items.add(files[0]);
                input.files = dt.files;
                this.handleSingleImageUpload({ target: input }, inputId);
            }
        }
    }

    async handleSingleImageUpload(e, inputId) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Valider le type de fichier
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner un fichier image valide.');
                return;
            }

            // Valider la taille (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('L\'image est trop volumineuse. Taille maximum: 5MB.');
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
            alert('Erreur lors du traitement de l\'image.');
        }
    }

    async handlePortfolioImagesUpload(e) {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        // Limiter à 6 images
        if (files.length > 6) {
            alert('Maximum 6 images pour le portfolio.');
            return;
        }

        try {
            const portfolioImages = [];
            
            for (let file of files) {
                if (!file.type.startsWith('image/')) {
                    alert(`${file.name} n'est pas un fichier image valide.`);
                    continue;
                }

                if (file.size > 5 * 1024 * 1024) {
                    alert(`${file.name} est trop volumineux (max 5MB).`);
                    continue;
                }

                const base64 = await this.fileToBase64(file);
                portfolioImages.push({
                    data: base64,
                    name: file.name,
                    type: file.type
                });
            }

            this.customImages.set('portfolioImages', portfolioImages);
            this.showPortfolioPreview(portfolioImages);

        } catch (error) {
            console.error('Erreur lors du traitement des images:', error);
            alert('Erreur lors du traitement des images.');
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
            console.warn('Template original non trouvé, utilisation du template par défaut');
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
        
        // Image hero/header
        if (this.customImages.has('heroImage')) {
            const heroImg = this.customImages.get('heroImage');
            html = html.replace(/header-background-1\.jpg|header-background-2\.jpg/g, heroImg.data);
        }

        // Image "À propos" / Perfect Style
        if (this.customImages.has('aboutImage')) {
            const aboutImg = this.customImages.get('aboutImage');
            html = html.replace(/perfect-style\.jpg/g, aboutImg.data);
        }

        // Logo
        if (this.customImages.has('logoImage')) {
            const logoImg = this.customImages.get('logoImage');
            html = html.replace(/logo\.png|beauty-salon_logo_96dp\.png/g, logoImg.data);
        }

        // Footer background
        if (this.customImages.has('footerImage')) {
            const footerImg = this.customImages.get('footerImage');
            html = html.replace(/bg-footer1\.jpg/g, footerImg.data);
        }

        // Images d'équipe
        if (this.customImages.has('team1Image')) {
            const teamImg = this.customImages.get('team1Image');
            html = html.replace(/team-1\.jpg/g, teamImg.data);
        }
        if (this.customImages.has('team2Image')) {
            const teamImg = this.customImages.get('team2Image');
            html = html.replace(/team-2\.jpg/g, teamImg.data);
        }
        if (this.customImages.has('team3Image')) {
            const teamImg = this.customImages.get('team3Image');
            html = html.replace(/team-3\.jpg/g, teamImg.data);
        }

        // Portfolio images
        if (this.customImages.has('portfolioImages')) {
            const portfolioImages = this.customImages.get('portfolioImages');
            portfolioImages.forEach((image, index) => {
                const originalName = `portfolio-${index + 1}.jpg`;
                html = html.replace(new RegExp(originalName, 'g'), image.data);
            });
            
            // Remplacer également les références img/portfolio/
            portfolioImages.forEach((image, index) => {
                const originalPath = `img/portfolio/portfolio-${index + 1}.jpg`;
                html = html.replace(new RegExp(originalPath, 'g'), image.data);
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
