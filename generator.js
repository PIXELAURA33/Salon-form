
class SalonGenerator {
    constructor() {
        this.generatedHTML = null;
        this.generatedFiles = new Map();
        this.selectedTemplate = this.getSelectedTemplate();
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
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = this.getFormData();
        await this.generateSite(formData);
        this.showPreview();
        
        document.getElementById('downloadBtn').disabled = false;
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
        // Utiliser le template par défaut pour l'instant car le template original n'est pas dans .templates/
        // TODO: Copier le template original du salon dans .templates/ si nécessaire
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
            
            this.generatedHTML = htmlContent;
            
            // Préparer les fichiers pour le téléchargement
            await this.prepareFilesForDownload();
            
        } catch (error) {
            console.error('Erreur lors de la génération:', error);
            alert('Erreur lors de la génération du site. Veuillez réessayer.');
        }
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
        const cssFiles = ['.templates/css/animate.min.css', '.templates/css/app.css', '.templates/css/bootstrap.css', '.templates/css/magnific-popup.css', '.templates/css/owl.carousel.min.css', '.templates/css/owl.theme.default.min.css'];
        
        for (const cssFile of cssFiles) {
            try {
                const response = await fetch(cssFile);
                if (response.ok) {
                    const content = await response.text();
                    // Garder le chemin relatif pour le zip
                    const relativePath = cssFile.replace('.templates/', '');
                    this.generatedFiles.set(relativePath, content);
                }
            } catch (error) {
                console.warn(`Impossible de charger ${cssFile}`);
            }
        }
        
        // Copier tous les fichiers JS depuis .templates/
        const jsFiles = [
            '.templates/js/app.js', '.templates/js/bootstrap.min.js', '.templates/js/contact_me.js', '.templates/js/contact_me.min.js',
            '.templates/js/jqBootstrapValidation.min.js', '.templates/js/jquery.easing.min.js', '.templates/js/jquery.magnific-popup.min.js',
            '.templates/js/jquery.min.js', '.templates/js/owl.carousel.min.js', '.templates/js/popper.min.js', '.templates/js/wow.min.js'
        ];
        
        for (const jsFile of jsFiles) {
            try {
                const response = await fetch(jsFile);
                if (response.ok) {
                    const content = await response.text();
                    // Garder le chemin relatif pour le zip
                    const relativePath = jsFile.replace('.templates/', '');
                    this.generatedFiles.set(relativePath, content);
                }
            } catch (error) {
                console.warn(`Impossible de charger ${jsFile}`);
            }
        }
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
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'salon-website.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Téléchargement terminé ! Extrayez le fichier zip et remplacez les images par les vôtres.');
        } catch (error) {
            console.error('Erreur lors de la création du zip:', error);
            alert('Erreur lors du téléchargement. Veuillez réessayer.');
        }
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    new SalonGenerator();
});
