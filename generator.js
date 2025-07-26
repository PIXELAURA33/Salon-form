
class SalonGenerator {
    constructor() {
        this.generatedHTML = null;
        this.generatedFiles = new Map();
        this.init();
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
            hours: document.getElementById('hours').value || 'Nous contacter pour les horaires',
            facebook: document.getElementById('facebook').value || '',
            instagram: document.getElementById('instagram').value || '',
            whatsapp: document.getElementById('whatsapp').value || ''
        };
    }

    async generateSite(data) {
        try {
            // Charger le template HTML original
            const response = await fetch('index.html');
            let htmlContent = await response.text();

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
        // Remplacer le titre et les métadonnées
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
        
        // Copier tous les fichiers CSS
        const cssFiles = ['css/animate.min.css', 'css/app.css', 'css/bootstrap.css', 'css/magnific-popup.css', 'css/owl.carousel.min.css', 'css/owl.theme.default.min.css'];
        
        for (const cssFile of cssFiles) {
            try {
                const response = await fetch(cssFile);
                if (response.ok) {
                    const content = await response.text();
                    this.generatedFiles.set(cssFile, content);
                }
            } catch (error) {
                console.warn(`Impossible de charger ${cssFile}`);
            }
        }
        
        // Copier tous les fichiers JS
        const jsFiles = [
            'js/app.js', 'js/bootstrap.min.js', 'js/contact_me.js', 'js/contact_me.min.js',
            'js/jqBootstrapValidation.min.js', 'js/jquery.easing.min.js', 'js/jquery.magnific-popup.min.js',
            'js/jquery.min.js', 'js/owl.carousel.min.js', 'js/popper.min.js', 'js/wow.min.js'
        ];
        
        for (const jsFile of jsFiles) {
            try {
                const response = await fetch(jsFile);
                if (response.ok) {
                    const content = await response.text();
                    this.generatedFiles.set(jsFile, content);
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
